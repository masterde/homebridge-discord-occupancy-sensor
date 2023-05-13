const { Service, Characteristic } = require('homebridge');
const { Client, Intents } = require('discord.js');

class DiscordOccupancySensor {
  constructor(log, config) {
    this.log = log;
    this.name = config.name || 'Discord Occupancy Sensor';
    this.token = config.token;
    this.guildId = config.guildId;
    this.debug = config.debug || false;
    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.PRESENCE_UPDATE
      ]
    });
    this.sensorService = new Service.OccupancySensor(this.name);
    this.anyoneService = null;
    this.devices = [];
    this.deviceStatus = {};
    this.lastUpdate = null;

    // Configure the sensor service
    this.sensorService
      .getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', this.getOccupancyDetected.bind(this));

    // Configure the anyone service if enabled
    if (config.anyoneSensor) {
      this.anyoneService = new Service.OccupancySensor(`${this.name} - Anyone`);
      this.anyoneService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .on('get', this.getAnyoneOccupancyDetected.bind(this));
    }

    // Load the devices from the configuration
    config.devices.forEach(device => {
      this.devices.push({
        name: device.name,
        mac: device.mac,
        ip: device.ip,
        hostname: device.hostname,
        threshold: device.threshold || config.threshold || 15 // Use the device threshold if provided, otherwise use the global threshold
      });
    });

    this.client.on('ready', () => {
      this.log('Discord client is ready');
      this.updateOccupancy();
      setInterval(() => this.updateOccupancy(), config.interval * 1000);
    });

    this.client.login(this.token).catch(error => {
      this.log(`Failed to log in to Discord: ${error}`);
    });
  }

  getServices() {
    const services = [this.sensorService];
    if (this.anyoneService) {
      services.push(this.anyoneService);
    }
    return services;
  }

  async updateOccupancy() {
    if (this.debug) {
      this.log('Updating device occupancy status');
    }
    for (const device of this.devices) {
      let status = false;
      if (device.mac) {
        status = await this.pingDevice(device.mac);
      } else if (device.ip) {
        status = await this.pingDevice(device.ip);
      } else if (device.hostname) {
        status = await this.resolveHostname(device.hostname);
      }
      this.deviceStatus[device.name] = status;
    }
    if (this.debug) {
      this.log(`Device occupancy status: ${JSON.stringify(this.deviceStatus)}`);
    }
    const anyoneDetected = Object.values(this.deviceStatus).includes(true);
    this.sensorService
      .getCharacteristic(Characteristic.OccupancyDetected)
      .updateValue(anyoneDetected ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
    if (this.anyoneService) {
      this.anyoneService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(anyoneDetected ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
    }
    this.lastUpdate = new Date();
  }

  async pingDevice(address) {
    const ping = require('ping');
    const result = await ping.promise.probe(address);
    return result.alive && result.time <= this.getThreshold() ? true : false;
  }

  async resolveHostname(hostname) {
    try {
      const addresses = await this.client.shard.broadcastEval(`require('dns').lookup('${hostname}')`);
      return addresses.some(address => address !== null);
    } catch (error) {
      this.log(`Failed to resolve hostname ${hostname}: ${error}`);
      return false;
    }
  }

  getThreshold() {
    const deviceThresholds = this.devices.map(device => device.threshold);
    return Math.min(...deviceThresholds);
  }

  getOccupancyDetected(callback) {
    const anyoneDetected = Object.values(this.deviceStatus).includes(true);
    callback(null, anyoneDetected ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
  }

  getAnyoneOccupancyDetected(callback) {
    const anyoneDetected = Object.values(this.deviceStatus).includes(true);
    callback(null, anyoneDetected ? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
  }
}

module.exports = DiscordOccupancySensor;