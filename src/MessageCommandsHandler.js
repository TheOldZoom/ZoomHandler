const fs = require("fs");
const path = require("path");

async function MessageCommandsHandler(Path, client) {
  const commandFiles = fs
    .readdirSync(Path)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(path.join(Path, file));
    if (!command.name) {
      client.log.warn(file + " is missing a name, ignoring it.");
      continue;
    }
    if (!command.description) {
      client.log.warn(file + " is missing a description, ignoring it.");
      continue;
    }
    if (!command.execute) {
      client.log.warn(file + " is missing an execute function, ignoring it.");
      continue;
    }
    if (/\s/.test(command.name)) {
      client.log.warn(
        file + " contains a command name with spaces, ignoring it."
      );
      continue;
    }
    client.log.command(`Successfully loaded command ${command.name}`);
    client.commands.set(command.name, command);
  }
}

module.exports = { MessageCommandsHandler };
