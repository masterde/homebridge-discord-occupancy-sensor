const Discord = require('discord.js');
const DiscordOccupancySensor = require('./lib/discord.js');
const PLUGIN_NAME = 'homebridge-discord-presence';
const PLATFORM_NAME = 'DiscordPresence';

module.exports = (api) => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, DiscordPresence);
};

class DiscordPresence {
  constructor(log, config, api) {
    this.api = api;
    this.log = log;

    this.accessories = [];
    this.PLUGIN_NAME = PLUGIN_NAME;
    this.PLATFORM_NAME = PLATFORM_NAME;
    this.name = config.name || PLATFORM_NAME;
    this.token = config.token;
    this.guildId = config.guildId;
    this.debug = config.debug || false;

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

    // Create a new Discord client with the proper intents
    this.client = new Discord.Client({
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.PRESENCE_UPDATE
      ]
    });
    // this.client = new Discord.Client();
    this.client.on('ready', this.onReady.bind(this));
    
    this.client.login('your-bot-token').then(() => {
      this.log('Discord bot is ready');
    }).catch(error => {
      this.log.error(`Failed to log in to Discord: ${error}`);
    });

    this.api.on('didFinishLaunching', () => {
      this.client.login(this.token);
    });
  }

  onReady() {
    this.log(`Logged in as ${this.client.user.tag}`);
    const guild = this.client.guilds.cache.get(this.guildId);
    if (!guild) {
      this.log.error(`Failed to find guild with ID ${this.guildId}`);
      return;
    }

    // Remove any cached accessories that are no longer in the guild
    this.accessories.forEach((accessory) => {
      const serial = accessory.context.serial;
      if (!guild.members.cache.has(serial)) {
        this.log(`Removing cached accessory ${accessory.displayName} (${serial})`);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });

    guild.members.fetch()
      .then((members) => {
        members.each((member) => {
          if (this.accessories.some((accessory) => accessory.context.serial === member.id)) {
            // Accessory already exists for this member, skip
            return;
          }

          this.log(`Adding accessory for ${member.displayName} (${member.id})`);
          const accessory = new DiscordOccupancySensor(guild, {
            name: member.displayName,
          }, this);
          this.accessories.push(accessory.accessory);
        });
      })
      .catch((error) => {
        this.log.error(`Failed to fetch guild members: ${error}`);
      });
  }

  configureAccessory(accessory) {
    this.log.easyDebug(`Found Cached Accessory: ${accessory.displayName} (${accessory.context.serial}) `);
    this.accessories.push(accessory);
  }
}