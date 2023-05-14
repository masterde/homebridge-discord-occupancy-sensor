const PLUGIN_NAME = 'homebridge-discord-occupancy-sensor';
const PLATFORM_NAME = 'DiscordOccupancySensor';
const { DiscordObserver } = require('./lib/discord');
const Accessory = require('./lib/accessory');

class DiscordOccupancySensor {
  constructor(log, config, api) {
    this.log = log;
    this.devicesConfig = config.devices || [];
    this.name = config.name || PLATFORM_NAME;
    this.interval = config.interval ? config.interval * 1000 : 10000;
    this.threshold = !config.threshold && config.threshold !== 0 ? 15 : config.threshold;
    this.PLUGIN_NAME = PLUGIN_NAME;
    this.PLATFORM_NAME = PLATFORM_NAME;
    this.accessories = [];
    this.debug = config.debug || false;
    this.discordObserver = new DiscordObserver(config);
    this.api = api;

    // Define debug method to output debug logs when enabled in the config
    this.log.easyDebug = (...content) => {
      if (this.debug) {
        this.log(content.reduce((previous, current) => previous + ' ' + current));
      } else {
        this.log.debug(content.reduce((previous, current) => previous + ' ' + current));
      }
    };

    this.api.on('didFinishLaunching', () => {
      this.log.easyDebug('Initializing DiscordObserver');
      this.discordObserver.on('ready', () => {
        this.log.easyDebug('DiscordObserver is ready');
        this.createAccessories();
      });
    });
  }

  createAccessories() {
    this.devicesConfig.forEach(device => {
      this.accessories.push(new Accessory(device, this));
    });
  }

  configureAccessory(accessory) {
    this.log.easyDebug(`Found cached accessory: ${ accessory.displayName }(${ accessory.context.serial })`);
    this.accessories.push(accessory);
  }

  accessories(callback) {
    callback(this.accessories);
  }
}

module.exports = api => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, DiscordOccupancySensor);
};
