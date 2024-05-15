const fs = require("fs");
const path = require("path");
const { messageCreateHandler } = require("./commandsHandler");
const { Collection } = require("discord.js");

async function readMessageCommands(directory, client) {
  const messageCommands = new Map();

  const readFiles = async (dir) => {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        await readFiles(filePath); // recursively read subdirectories
      } else if (file.endsWith(".js")) {
        try {
          const command = require(filePath);
          if (!command.data.name || !command.data.description || !command.run || /\s/.test(command.data.name)) {
            client.log.warn(`Invalid command file ${filePath}, ignoring it.`);
            continue;
          }
          client.log.command(`Successfully loaded command ${command.data.name}`);
          messageCommands.set(command.data.name, command);
        } catch (error) {
          console.error(`Error loading command file ${filePath}:`, error);
        }
      }
    }
  };

  await readFiles(directory);
  return messageCommands;
}

async function MessageCommandsHandler(directory, client) {
  try {
    const messageCommands = await readMessageCommands(directory, client);
    client.messageCommands = messageCommands;
    messageCreateHandler(client);
  } catch (error) {
    console.error("Error loading message commands:", error);
  }
}

module.exports = { MessageCommandsHandler };
