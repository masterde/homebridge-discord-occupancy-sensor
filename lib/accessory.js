let Service, Characteristic;

class DiscordOccupancySensor {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;
    this.discordUserId = config.discordUserId;
    this.discordBotToken = config.discordBotToken;
    this.interval = config.interval || 60; // default interval is 60 seconds

    this.detected = false;

    Service = this.api.hap.Service;
    Characteristic = this.api.hap.Characteristic;

    // create the accessory information service
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "Custom")
      .setCharacteristic(Characteristic.Model, "DiscordOccupancySensor")
      .setCharacteristic(Characteristic.SerialNumber, "DEMO");

    // create the occupancy sensor service
    this.occupancySensorService = new Service.OccupancySensor(this.name);
    this.occupancySensorService
      .getCharacteristic(Characteristic.OccupancyDetected)
      .on("get", this.getOccupancyDetected.bind(this));

    // set up the Discord client
    const Discord = require("discord.js");
    this.client = new Discord.Client();
    this.client.login(this.discordBotToken);
    this.client.on("ready", this.onClientReady.bind(this));
    this.client.on("presenceUpdate", this.onPresenceUpdate.bind(this));
  }

  onClientReady() {
    this.log(`Logged in as ${this.client.user.tag}`);
    this.updateOccupancyDetected();
    setInterval(this.updateOccupancyDetected.bind(this), this.interval * 1000);
  }

  onPresenceUpdate(oldPresence, newPresence) {
    if (newPresence.userID === this.discordUserId) {
      this.updateOccupancyDetected();
    }
  }

  updateOccupancyDetected() {
    const user = this.client.users.cache.get(this.discordUserId);
    if (user) {
      this.detected = user.presence.status === "online";
    } else {
      this.log(`Couldn't find user with ID ${this.discordUserId}`);
      this.detected = false;
    }
    this.occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected).updateValue(this.detected);
  }

  getOccupancyDetected(callback) {
    callback(null, this.detected);
  }

  getServices() {
    return [this.occupancySensorService];
  }
}

module.exports = DiscordOccupancySensor;