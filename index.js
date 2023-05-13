const PLUGIN_NAME = 'homebridge-discord-occupancy-sensor';
const PLATFORM_NAME = 'DiscordOccupancySensor';
const { DiscordObserver, init } = require('./lib/discord');

module.exports = api => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, DiscordOccupancySensor);
};
// module.exports = api => {
//   api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, (log, config, api) => {
//     return new DiscordOccupancySensor(log, config, api);
//   });
// };

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
    this.discordObserver = new DiscordObserver(config, this);
    this.api = api;

    // define debug method to output debug logs when enabled in the config
    this.log.easyDebug = (...content) => {
      if (this.debug) {
        this.log(content.reduce((previous, current) => {
          return previous + ' ' + current;
        }));
      } else {
        this.log.debug(content.reduce((previous, current) => {
          return previous + ' ' + current;
        }));
      }
    };

    this.api.on('didFinishLaunching', this.discordObserver.bind(this));
  }

  configureAccessory(accessory) {
    this.log.easyDebug(`Found cached accessory: ${accessory.displayName} (${accessory.context.serial})`);
    this.accessories.push(accessory);
  }
}
