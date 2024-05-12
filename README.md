# ZoomHandler Documentation

## How To Get Support

You can join my [Discord Server Support](https://discord.gg/NYXwbBQMzJ)

OR

You can add me in discord: TheOldZoom

## Overview

ZoomHandler is a event & slashCommand & messageCommand handler related to Discord.js v14

## Installation

You can install ZoomHandler via npm:

```bash
npm install zoomhandler
```
or you can use npx:
```bash
npx zoomhandler
```

Make sure to have Zoom-Logger & Discord.js installed

## Usage

To use ZoomHandler in your project, follow these steps:

1. **Import ZoomHandler**: Import the ZoomHandler module into your project.

   ```javascript
   const { ZoomHandler } = require("zoomhandler");
   ```

2. **Create an Instance**: Create an instance of the ZoomHandler class, providing necessary configuration options.

   ```javascript
   new ZoomHandler({
     client,
     messageCommandsPath: path.join(__dirname, "messageCommands"),
     interactionCommandsPath: path.join(__dirname, "interactionCommands"),
     eventsPath: path.join(__dirname, "events"),
   });
   ```

   - `client`: Your Zoom client instance.
   - `messageCommandsPath`: The path to the directory containing your message command files.
   - `interactionCommandsPath`: The path to the directory containing your interaction command files.
   - `eventsPath`: The path to the directory containing your event files.

3. **Define Message Commands**: Define your commands in separate files within the specified `messageCommandsPath`. Each command file should export a function containing the command logic.

```js
module.exports = {
  data: {
    name: "ping",
    description: "Ping! Pong!",
  },
  run: async ({ message, args, client }) => {
    message.channel.send("Pong!");
  },
};
```

Make sure to define your prefix in your main file or where your client is handled.

```js
client.prefix = "prefix";
```

4. **Define Events**: Define your events in separate files within the specified `eventsPath`. Each event file should export a function containing the discord.js event logic.

5. **Execute Commands**: Execute commands using the methods provided by ZoomHandler.

## Example

Here's an example demonstrating how to use ZoomHandler:

```javascript
const { ZoomHandler } = require("zoomhandler");

client.prefix = ".";
new ZoomHandler({
  client,
  messageCommandsPath: path.join(__dirname, "messageCommands"),
  interactionCommandsPath: path.join(__dirname, "interactionCommands"),
  eventsPath: path.join(__dirname, "events"),
});
```

Here's how you should use ZoomHandler with discord.js

```js
const { Client, GatewayIntentBits } = require("discord.js");
const { Logger } = require("zoom-logger");
const path = require("path");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});
const { ZoomHandler } = require("zoomhandler");

client.prefix = ".";
new ZoomHandler({
  client,
  messageCommandsPath: path.join(__dirname, "messageCommands"),
  interactionCommandsPath: path.join(__dirname, "interactionCommands"),
  eventsPath: path.join(__dirname, "events"),
});

client.login("Your bot token");
```

## Example Event File

Here's an example of how to use an event file:

```javascript
// events/ready.js

module.exports = (client) => {
  console.log(`${client.user.tag} is ready !`);
};
```

```javascript
// events/messageCreate.js

module.exports = (client, message) => {
  console.log(message.content);
};
```

## Example MessageCreate Command File

Here's an example of how to use an MessageCreate command File

```js
// messageCommands/ping.js
module.exports = {
  name: "ping",
  description: "Ping! Pong!",
  execute(message, args) {
    message.channel.send("Pong!");
  },
};
```

## Example interactionCreate Command File

Here's an example of how to use an interactionCreate command File

```js
// interactionCommands/ping.js
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping Pong!"),
  run: async ({ interaction, client }) => {
    await interaction.reply("Pong!");
  },
};
```

## Developer To-Do

- validations (Before executing the code).
- better documentation.
