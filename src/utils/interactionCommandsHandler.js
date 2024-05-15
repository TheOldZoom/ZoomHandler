const fs = require("fs");
const path = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { InteractionCreateHandler } = require("./commandsHandler");

async function readCommands(directory, client) {
  const commands = [];

  const readFiles = async (dir) => {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await readFiles(filePath);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(filePath);
          if (command.data === undefined || command.data.name === undefined || command.data.description === undefined) {
            client.log.warn(`SlashCommand in ${filePath} is missing required data`);
            continue;
          }
          commands.push(command.data);
          client.interactionCommands.set(command.data.name, command);
          client.log.slashcmd(`Registered ${command.data.name}`);
        } catch (error) {
          console.error(`Error loading command file ${filePath}:`, error);
        }
      }
    }
  };

  await readFiles(directory);
  return commands;
}

async function interactionCreateHandler(directory, client) {
  const rest = new REST({ version: "10" }).setToken(client.token);

  try {
    const commands = await readCommands(directory, client);

    const existingCommands = await rest.get(
      Routes.applicationCommands(client.user.id)
    );

    for (const existingCommand of existingCommands) {
      if (!commands.find((cmd) => cmd.name === existingCommand.name)) {
        await rest.delete(
          Routes.applicationCommand(client.user.id, existingCommand.id)
        );
        client.log.slashcmd(`Deleted ${existingCommand.name}`);
      }
    }

    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    InteractionCreateHandler(client);
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}

module.exports = { interactionCreateHandler };
