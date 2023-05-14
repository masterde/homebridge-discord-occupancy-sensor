const { EventEmitter } = require('events');
const { Client, IntentsBitField } = require('discord.js');
const Accessory = require('./accessory');

class DiscordObserver extends EventEmitter {
  constructor(config, platform) {
    super();
    this.config = config;
    this.platform = platform;
    this.client = new Client({ intents: [IntentsBitField.FLAGS.GUILD_PRESENCES, IntentsBitField.FLAGS.GUILD_MEMBERS] });
    this.accessories = [];
  }

  start() {
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('presenceUpdate', this.onPresenceUpdate.bind(this));
    this.client.login(this.config.token);
  }

  onReady() {
    this.platform.log.easyDebug('Discord client is ready');
    this.config.devicesConfig.forEach(device => {
      this.accessories.push(new Accessory(device, this.platform.api.hap, this.platform));
    });
    this.emit('ready');
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
          (id && id === newPresence.userId) ||
          (name && newPresence.member?.displayName?.toLowerCase() === name.toLowerCase());
        if (isMatchedDevice) {
          accessory.setDetected(newStatus !== 'offline');
        }
      }
    }
  }
}

module.exports = DiscordObserver;
