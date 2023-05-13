const { EventEmitter } = require("events");
const { Client } = require("discord.js");

class DiscordObserver extends EventEmitter {
  constructor(botToken, users) {
    super();
    this.users = users;
    this.cachedStatuses = {};
    this.client = new Client();
    this.client.on("ready", () => {
      console.log(`Discord client ready`);
    });
    this.client.on("presenceUpdate", (oldPresence, newPresence) => {
      const { user } = newPresence;
      if (this.users.includes(user.id)) {
        const previousStatus = this.cachedStatuses[user.id];
        const newStatus = newPresence.status;
        this.cachedStatuses[user.id] = newStatus;
        if (previousStatus !== newStatus) {
          const eventPrefix = `discord-user:${user.id}`;
          this.emit(`${eventPrefix}:status:${newStatus}`, user);
          if (previousStatus) {
            this.emit(
              `${eventPrefix}:status:${previousStatus}:to:${newStatus}`,
              user
            );
          }
        }
      }
    });
    this.client.login(botToken);
  }

  getStatus(userId) {
    return this.cachedStatuses[userId];
  }
}

module.exports = DiscordObserver;