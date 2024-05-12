const { Logger } = require("zoom-logger");
const {
  MessageCommandsHandler,
  registerEvents,
  interactionCreateHandler,
  deleteinteractionCommands,
} = require("./src/Zoom");
const { Collection } = require("discord.js");
class ZoomHandler {
  /**
   * @param {Object} options
   * @param {any} options.client
   * @param {string} options.eventsPath
   * @param {string} options.messageCommandsPath
   * @param {string[]} options.devGuilds
   * @param {string} options.interactionCommandsPath
   */
  constructor({
    client,
    eventsPath,
    messageCommandsPath,
    interactionCommandsPath,
    devGuilds,
  }) {
    this.client = client;
    this.eventsPath = eventsPath;
    this.commandsPath = messageCommandsPath;
    this.interactionCommandsPath = interactionCommandsPath;
    this.devGuilds = devGuilds;
    this.client.log = Logger;
    this.client.interactionCommands = new Collection();
    this.client.messageCommands = new Collection();
    if (!this.client) {
      Logger.error("Client is not defined.");
      return;
    }
    registerEvents(this.eventsPath, this.client);
    if (this.commandsPath !== undefined && this.client.prefix === undefined) {
      Logger.warn(
        "If messageCommandsPath is defined, client.prefix must also be defined. Ignoring MessageCreate Commands"
      );
      return;
    }
    if (this.commandsPath !== undefined) {
      MessageCommandsHandler(this.commandsPath, this.client);
    }
    if (this.interactionCommandsPath !== undefined) {
      client.on("ready", (client) => {
        interactionCreateHandler(this.interactionCommandsPath, this.client);
      });
    }
  }
}

module.exports = { ZoomHandler };
