const { EventEmitter } = require('events');
const { Client, Intents } = require('discord.js');
const Accessory = require('./accessory');

class DiscordObserver extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.client = new Client({
      intents: [
        'GUILDS',
        'GUILD_MEMBERS',
        'PRESENCE_UPDATE'
      ]
    });
    this.client.once('ready', this.onReady.bind(this));
    this.client.on('presenceUpdate', this.onPresenceUpdate.bind(this));
    this.accessories = [];
  }

  onReady() {
    this.log('Discord client is ready');
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
          (id && id.toLowerCase() === newPresence.userID) ||
          (name && newPresence.member?.displayName?.toLowerCase() === name.toLowerCase());
        if (isMatchedDevice) {
          accessory.updateOccupancy(newStatus !== 'offline');
        }
      }
    }
  }
}

module.exports = DiscordObserver;