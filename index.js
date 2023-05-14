const PLUGIN_NAME = 'homebridge-discord-occupancy-sensor';
const PLATFORM_NAME = 'DiscordOccupancySensor';
const DiscordObserver = require('./lib/discord');

class DiscordOccupancySensor {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessories = [];
    this.discordObserver = new DiscordObserver(config, this);

    this.api.on('didFinishLaunching', () => {
      this.discordObserver.start();
    });
  }

  configureAccessory(accessory) {
    this.log.easyDebug(`Found cached accessory: ${accessory.displayName} (${accessory.context.serial})`);
    this.accessories.push(accessory);
  }
}

module.exports = api => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, DiscordOccupancySensor);
};
