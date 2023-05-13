const Discord = require('discord.js');

class DiscordPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.accessories = [];

    this.api.on('didFinishLaunching', () => {
      const client = new Discord.Client();
      client.on('ready', () => {
        const guild = client.guilds.cache.get(this.config.guildId);
        if (!guild) {
          this.log.error(`Failed to find guild with ID ${this.config.guildId}`);
          return;
        }

        const accessory = new DiscordAccessory(this.log, guild);
        this.accessories.push(accessory);
      });

      client.login(this.config.token);
    });
  }

  configureAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

class DiscordAccessory {
  constructor(log, guild) {
    this.log = log;
    this.guild = guild;

    this.service = new Service.OccupancySensor(this.config.name);

    this.service
      .getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', this.getOccupancyStatus.bind(this));

    this.guild.members.fetch()
      .then((members) => {
        members.each((member) => {
          if (member.presence.status === 'online') {
            this.setOccupancyStatus(1);
          }
        });

        this.guild.client.on('presenceUpdate', this.onPresenceUpdate.bind(this));
      })
      .catch((error) => {
        this.log.error(`Failed to fetch guild members: ${error}`);
      });
  }

  getServices() {
    return [this.service];
  }

  onPresenceUpdate(oldPresence, newPresence) {
    if (newPresence.user.bot) {
      // Ignore bot presence updates
      return;
    }

    if (newPresence.status === 'online') {
      this.setOccupancyStatus(1);
    } else {
      this.setOccupancyStatus(0);
    }
  }

  setOccupancyStatus(status) {
    this.service
      .getCharacteristic(Characteristic.OccupancyDetected)
      .updateValue(status);
  }

  getOccupancyStatus(callback) {
    const isOnline = this.service
      .getCharacteristic(Characteristic.OccupancyDetected)
      .value;

    callback(null, isOnline);
  }
}

module.exports = {
  DiscordPlatform,
  DiscordAccessory,
};