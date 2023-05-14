const { EventEmitter } = require('events');
const { Client, IntentsBitField } = require('discord.js');
const Accessory = require('./accessory');

class DiscordObserver extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    const intents = new IntentsBitField();
    intents.add(IntentsBitField.FLAGS.GUILDS);
    intents.add(IntentsBitField.FLAGS.GUILD_PRESENCES);
    intents.add(IntentsBitField.FLAGS.GUILD_MEMBERS);
    this.client = new Client({ intents });
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
          (id && id === newPresence.userID);
        if (isMatchedDevice) {
          accessory.setDetected(newStatus !== 'offline');
        }
      }
    }
  }
}

module.exports = DiscordObserver;
