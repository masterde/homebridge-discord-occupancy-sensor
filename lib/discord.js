const { EventEmitter } = require('events');
const { Client, Intents } = require('discord.js');
const Accessory = require('./accessory');

class DiscordObserver extends EventEmitter {
  constructor(config, platform) {
    super();
    this.config = config;
    this.platform = platform;
    this.client = new Client({ intents: [Intents.GUILD_PRESENCES, Intents.GUILD_MEMBERS] });
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('presenceUpdate', this.onPresenceUpdate.bind(this));
    this.accessories = [];
  }

  onReady() {
    this.platform.log('Discord client is ready');
    this.config.devicesConfig.forEach(device => {
      this.accessories.push(new Accessory(device, this));
    });
  }

  onPresenceUpdate(oldPresence, newPresence) {
    const { devicesConfig, accessories } = this.config;
    const oldStatus = oldPresence?.status ?? 'offline';
    const newStatus = newPresence?.status ?? 'offline';
    const oldActivity = oldPresence?.activities[0]?.name ?? '';
    const newActivity = newPresence?.activities[0]?.name ?? '';
    if (oldStatus !== newStatus || oldActivity !== newActivity) {
      for (const accessory of accessories) {
        const { id, name } = accessory.device;
        const isMatchedDevice =
          (id && id === newPresence.userID);
        if (isMatchedDevice) {
          accessory.setDetected(newStatus !== 'offline');
        }
      }
    }
  }

  start() {
    this.client.login(this.config.token);
  }
}

module.exports = DiscordObserver;
