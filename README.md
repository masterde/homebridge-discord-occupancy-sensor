# homebridge-discord-occupancy-sensor

[![Downloads](https://img.shields.io/npm/dt/homebridge-discord-occupancy-sensor.svg?color=critical)](https://www.npmjs.com/package/homebridge-discord-occupancy-sensor)
[![Version](https://img.shields.io/npm/v/homebridge-discord-occupancy-sensor)](https://www.npmjs.com/package/homebridge-discord-occupancy-sensor)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Homebridge Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/7DyabQ6)

[Homebridge](https://github.com/nfarina/homebridge) plugin that provides occupancy sensors based on Discord user presence.

## Requirements

- Node.js version 14 or higher
- Homebridge version 1.3.0 or higher

Check your Node.js and Homebridge versions with `node -v` and `homebridge -V` respectively, and update as needed.

## Installation

This plugin can be installed and configured through the Homebridge UI or the command line.

### Install via Homebridge UI

1. Open the Homebridge UI
2. Navigate to the Plugins tab
3. Search for "discord occupancy sensor"
4. Click Install

### Install via Command Line

1. Install Homebridge: `sudo npm install -g homebridge --unsafe-perm`
2. Install this plugin: `sudo npm install -g homebridge-discord-occupancy-sensor`
3. Update your Homebridge configuration file. See `config-sample.json` in this repository for a sample.

## Configuration

This plugin requires a Discord bot token to access your Discord server. You can obtain a bot token by following the instructions in the [Discord Developer Portal](https://discord.com/developers/docs/intro).

### Configuration File Example

```json
{
  "platforms": [
    {
      "platform": "DiscordOccupancySensor",
      "name": "My Server",
      "token": "your-bot-token",
      "channelIDs": ["123456789012345678", "234567890123456789"],
      "debug": false
    }
  ]
}
```

### Configurations Table

| Parameter   | Description                                                                                                               | Default | Type          |
|-------------|---------------------------------------------------------------------------------------------------------------------------|---------|---------------|
| `platform`  | Always `"DiscordOccupancySensor"`.                                                                                        | -       | String        |
| `name`      | Name of the platform, displayed in the Homebridge logs.                                                                   | -       | String        |
| `token`     | Discord bot token to access your Discord server.                                                                          | -       | String        |
| `channelIDs` | Array of Discord channel IDs to monitor for user activity.                                                                | -       | Array of IDs  |
| `debug`     | Whether to enable debug logging. If enabled, the plugin will log more information to the console.                          | `false` | Boolean       |

## Troubleshooting

If you encounter any issues with this plugin, check the Homebridge logs first for error messages.

If you need further assistance, feel free to [open an issue](https://github.com/xyzrepo/homebridge-discord-occupancy-sensor/issues) or ask for help in the [Homebridge Discord server](https://discord.gg/7DyabQ6).

## Contributing

Contributions are welcome! Please refer to the [contributing guidelines](CONTRIBUTING.md) for more information.

## License

[MIT](LICENSE)