const DiscordObserver = require("./lib/discord");

const PLUGIN_NAME = "homebridge-discord-occupancy-sensor";
const PLATFORM_NAME = "DiscordOccupancySensor";

class DiscordOccupancySensorPlatform {
  constructor(log, config, api) {
    this.log = log;
    this.api = api;
    this.accessories = [];
    this.devicesConfig = config.devices || [];
    this.users = config.users || [];
    this.botToken = config.botToken || "";

    this.discordObserver = new DiscordObserver(this.botToken, this.users);
    this.discordObserver.on("discord-user:<user-id>:status:<status>", (user) => {
      const userId = user.id;
      const status = this.discordObserver.getStatus(userId);
      this.accessories.forEach((accessory) => {
        if (accessory.context.serial === userId) {
          const occupancyDetected = status === "online";
          accessory
            .getService(this.api.hap.Service.OccupancySensor)
            .updateCharacteristic(
              this.api.hap.Characteristic.OccupancyDetected,
              occupancyDetected
            );
        }
      });
    });

    this.api.on("didFinishLaunching", () => {
      removeCachedDevices.bind(this)();
      init.bind(this)();
    });
  }

  configureAccessory(accessory) {
    this.log(`Found Cached Accessory: ${accessory.displayName} (${accessory.context.serial}) `);
    this.accessories.push(accessory);
  }
}

function removeCachedDevices() {
  this.accessories.forEach((accessory) => {
    if (
      accessory.context.serial === "12:34:56:78:9a:bc" &&
      accessory.displayName === "Anyone"
    ) {
      // If it's the 'Anyone' sensor
      return;
    }

    const deviceInConfig = this.devicesConfig.find(
      (device) =>
        (device.mac &&
          device.mac.toLowerCase() === accessory.context.serial) ||
        device.ip === accessory.context.serial ||
        (device.hostname &&
          device.hostname.toLowerCase() === accessory.context.serial)
    );
    if (!deviceInConfig) {
      // Unregister accessory if it is no longer in the config
      this.log(
        `Unregistering disconnected device: "${accessory.displayName}" (${accessory.context.serial})`
      );
      this.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        [accessory]
      );
    }
  });
}

function init() {
  this.log(`Initiating Discord Observer...`);
  this.devicesConfig.forEach((device) => {
    if (this.users.includes(device.id)) {
      const userId = device.id;
      const displayName = device.name || userId;
      const accessory = new this.api.platformAccessory(displayName, userId);
      accessory.addService(this.api.hap.Service.OccupancySensor, displayName);
      this.accessories.push(accessory);
    }
  });

  if (config.anyoneSensor) {
    const displayName = "Anyone";
    const accessory = new this.api.platformAccessory(displayName, "12:34:56:78:9a:bc");
    accessory.addService(this.api.hap.Service.OccupancySensor, displayName);
    this.accessories.push(accessory);
  }
}

module.exports = (api) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, DiscordOccupancySensorPlatform);
};