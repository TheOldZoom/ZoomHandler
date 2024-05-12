const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { InteractionCreateHandler } = require("./commandsHandler");

async function interactionCreateHandler(directory, client) {
  const commands = [];
  const commandFiles = fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".js"));

  const rest = new REST({ version: "10" }).setToken(client.token);

  const existingCommands = await rest.get(
    Routes.applicationCommands(client.user.id)
  );

  for (const file of commandFiles) {
    const command = require(path.join(directory, file));
    if (command.data === undefined) {
      client.log.warn("SlashCommand " + file + " does not have data defined");
      continue;
    }
    if (command.data.name === undefined) {
      client.log.warn("SlashCommand " + file + " does not have a name");
      continue;
    }
    if (command.data.description === undefined) {
      client.log.warn(
        "SlashCommand " + command.data.name + " does not have a description"
      );
      continue;
    }
    commands.push(command.data);
    client.interactionCommands.set(command.data.name, command);
    client.log.slashcmd(`Registered ${command.data.name}`);
  }

  for (const existingCommand of existingCommands) {
    if (!commands.find((cmd) => cmd.name === existingCommand.name)) {
      await rest.delete(
        Routes.applicationCommand(client.user.id, existingCommand.id)
      );
      client.log.slashcmd(`Deleted ${existingCommand.name}`);
    }
  }

  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    InteractionCreateHandler(client);
  } catch (error) {
    console.error(error);
  }
}

module.exports = { interactionCreateHandler };
