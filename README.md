# ZoomHandler Documentation

## Overview

ZoomHandler is a event & command handler related to discord.js

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
   const handler = new ZoomHandler({
     client,
     commandsPath: path.join(__dirname, "commands"),
     eventsPath: path.join(__dirname, "events"),
   });
   ```

   - `client`: Your Zoom client instance.
   - `commandsPath`: The path to the directory containing your command files. (will be added soon.)
   - `eventsPath`: The path to the directory containing your event files.

3. **Define Commands**: Define your commands in separate files within the specified `commandsPath`. Each command file should export a function containing the command logic.

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
  console.log(message);
};
```

## Developer To-Do

- messageCreate command handler.
- interactionCreate command handler.
- validations (Before executing the code).
- better documentation.
