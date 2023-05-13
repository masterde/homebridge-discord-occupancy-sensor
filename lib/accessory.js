let Service, Characteristic;

class OccupancySensor {
  constructor(config, api, platform) {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;
    this.log = platform.log;
    this.devicesConfig = platform.devicesConfig;
    this.threshold = config.threshold || platform.threshold;
    this.id = config.id;
    this.name = config.name;
    this.serial = this.id;
    this.displayName = this.name;
    this.model = 'Discord occupancy sensor';
    this.manufacturer = '@xyz';
    this.UUID = api.hap.uuid.generate(this.serial);
    this.accessory = platform.accessories.find(accessory => accessory.UUID === this.UUID);

    if (!this.accessory) {
      this.log(`Creating new ${platform.PLATFORM_NAME} accessory for ${this.name}`);
      this.accessory = new api.platformAccessory(this.name, this.UUID);
      platform.accessories.push(this.accessory);
      api.registerPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [this.accessory]);
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
    this.log(`Adding "${this.name}" occupancy sensor service`);

    this.OccupancySensorService = this.accessory.getService(Service.OccupancySensor);

    if (!this.OccupancySensorService) {
      this.OccupancySensorService = this.accessory.addService(Service.OccupancySensor, this.name, 'discord-sensor');
    }

    this.OccupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
      .on('get', callback => {
        callback(null, this.isDetected);
      })
      .updateValue(this.isDetected);

    const device = this.devicesConfig.find(device => device.id === this.id);

    if (!device) {
      this.log(`Can't find device with ID ${this.id} in devicesConfig`);
      return;
    }

    this.log(`[${this.name}] - Listening to user ID ${device.id}`);

    const onPresenceUpdate = newPresence => {
      if (newPresence.userID === device.id) {
        if (newPresence.status === 'online') {
          this.setDetected(1);
        } else {
          this.setDetected(0);
        }
      }
    };

    this.platform.onPresenceUpdate(onPresenceUpdate);
  }

  setDetected(isDetected) {
    clearTimeout(this.thresholdTimer);

    if (isDetected && !this.isDetected) {
      this.log(`[${this.name}] - User is online`);
      this.isDetected = 1;
      this.OccupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(1);
    } else if (!isDetected && this.isDetected) {
      this.log(`[${this.name}] - User is offline`);
      this.isDetected = 0;
      this.OccupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(0);
    }

    this.thresholdTimer = setTimeout(() => {
      this.log(`[${this.name}] - Threshold timer expired`);
      this.isDetected = 0;
      this.OccupancySensorService.getCharacteristic(Characteristic.OccupancyDetected)
        .updateValue(0);
    }, this.threshold * 60 * 1000);
  }
}

module.exports = OccupancySensor;