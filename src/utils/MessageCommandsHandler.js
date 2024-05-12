const fs = require("fs");
const path = require("path");
const { messageCreateHandler } = require("./commandsHandler");

async function MessageCommandsHandler(Path, client) {
  const commandFiles = fs
    .readdirSync(Path)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(Path, file));
    if (!command.data.name) {
      client.log.warn(file + " is missing a name, ignoring it.");
      continue;
    }
    if (!command.data.description) {
      client.log.warn(file + " is missing a description, ignoring it.");
      continue;
    }
    if (!command.run) {
      client.log.warn(file + " is missing an run function, ignoring it.");
      continue;
    }
    if (/\s/.test(command.data.name)) {
      client.log.warn(
        file + " contains a command name with spaces, ignoring it."
      );
      continue;
    }
    client.log.command(`Successfully loaded command ${command.data.name}`);
    client.messageCommands.set(command.data.name, command);
  }
  messageCreateHandler(client);
}

module.exports = { MessageCommandsHandler };
