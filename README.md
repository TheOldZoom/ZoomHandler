# ZoomHandler Documentation

## How To Get Support

You can join my [Discord Server Support](https://discord.gg/NYXwbBQMzJ)

OR

You can add me in discord: TheOldZoom

## Overview

ZoomHandler is a event & command handler related to discord.js v14

## Installation

You can install ZoomHandler via npm:

```bash
npm install zoomhandler
```

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
    messageCommandsPath: path.join(__dirname, "commands"),
    eventsPath: path.join(__dirname, "events"),
    });
   ```

   - `client`: Your Zoom client instance.
   - `messageCommandsPath`: The path to the directory containing your command files. (will be added soon.)
   - `eventsPath`: The path to the directory containing your event files.

3. **Define Message Commands**: Define your commands in separate files within the specified `messageCommandsPath`. Each command file should export a function containing the command logic. Make sure to define your prefix 
```js
client.prefix = "prefix"
```

4. **Define Events**: Define your events in separate files within the specified `eventsPath`. Each event file should export a function containing the discord.js event logicé

5. **Execute Commands**: Execute commands using the methods provided by ZoomHandler.

## Example

Here's an example demonstrating how to use ZoomHandler:

```javascript
const { ZoomHandler } = require("zoomhandler");

new ZoomHandler({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
});
```

Here's how you should use ZoomHandler with discord.js
```js
const { Client, GatewayIntentBits } = require("discord.js");
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
  messageCommandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
});

client.login(
    "yourbottoken"
);
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
//commands/ping.js
module.exports = {
    name: 'ping',
    description: 'Ping! Pong!',
    execute(message, args) {
        message.channel.send('Pong!');
    }
};
```


## Developer To-Do

- interactionCreate command handler.
- validations (Before executing the code).
- better documentation.
