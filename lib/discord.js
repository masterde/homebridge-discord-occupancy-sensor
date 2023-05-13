const { EventEmitter } = require('events');
const { Client, Intents } = require('discord.js');
const Accessory = require('./accessory');

class DiscordObserver extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    // Enable the GUILDS and GUILD_MEMBERS and PRESENCE_UPDATE intents
    
    // Create a new instance of Intents
    const intents = new IntentsBitField();
    
    // Enable the intents you need
    intents.add(IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMembers);
    


    
    // Create a new bot client with the specified intents
    const client = new Client({ intents });

    // Login to Discord with your client's token from config.json
    client.login(this.config.token);

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