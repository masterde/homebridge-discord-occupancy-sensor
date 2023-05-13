let Characteristic, Service;

class DiscordOccupancySensor {
  constructor(guild, config, platform) {
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;

    this.guild = guild;
    this.log = platform.log;
    this.api = platform.api;
    this.threshold = !config.threshold && config.threshold !== 0 ? platform.threshold : config.threshold;
    this.name = config.name;
    this.serial = this.guild.id;
    this.model = 'Homebridge-Discord';
    this.manufacturer = 'Your Name Here';
    this.displayName = this.name;

    this.thresholdTimer = null;

    this.UUID = this.api.hap.uuid.generate(this.serial);
    this.accessory = platform.accessories.find((accessory) => accessory.UUID === this.UUID);

    if (!this.accessory) {
      this.log(`Creating new ${platform.PLATFORM_NAME} accessory for ${this.name}`);
      this.accessory = new this.api.platformAccessory(this.name, this.UUID);
      this.accessory.context.serial = this.serial;

      platform.accessories.push(this.accessory);
      // register the accessory
      this.api.registerPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [this.accessory]);
    }

    this.isDetected = 0;

    let informationService = this.accessory.getService(Service.AccessoryInformation);

    if (!informationService) {
      informationService = this.accessory.addService(Service.AccessoryInformation);
    }

    informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial);

    this.addOccupancySensor();
  }

  addOccupancySensor() {
    this.log.easyDebug(`Adding "${this.name}" occupancy sensor service`);
    this.occupancySensorService = this.accessory.getService(Service.OccupancySensor);
    if (!this.occupancySensorService) {
      this.occupancySensorService = this.accessory.addService(Service.OccupancySensor, this.name, 'discordSensor');
    }

    this.occupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', (callback) => callback(null, this.isDetected))
      .updateValue(this.isDetected);

    this.guild.members.fetch()
      .then((members) => {
        members.each((member) => {
          if (member.presence.status === 'online') {
            this.setDetected(1);
          }
        });

        this.guild.client.on('presenceUpdate', this.onPresenceUpdate.bind(this));
      })
      .catch((error) => {
        this.log.error(`Failed to fetch guild members: ${error}`);
      });
  }

  onPresenceUpdate(oldPresence, newPresence) {
    if (newPresence.user.bot) {
      // Ignore bot presence updates
      return;
    }

    if (newPresence.status === 'online') {
      this.setDetected(1);
    } else {
      this.setDetected(0);
    }
  }

  setDetected(isDetected) {
    clearTimeout(this.thresholdTimer);
    if (isDetected && !this.isDetected) {
      this.log(`[${this.name}] - Someone is online`);
      this.isDetected = 1;
      this.occupancySensorService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(1);
      return;
    }

    this.thresholdTimer = setTimeout(() => {
      this.log(`[${this.name}] - No one is online`);
      this.isDetected = 0;
      this.occupancySensorService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(0);
    }, this.threshold * 60 * 1000);
  }

  getServices() {
    return [this.occupancySensorService];
  }
}

module.exports = DiscordOccupancySensor;