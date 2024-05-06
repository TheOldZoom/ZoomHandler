const { Logger } = require("term-logger");
const { registerEvents } = require("./src/EventsHandler");
class ZoomHandler {
  /**
   * @param {Object} options
   * @param {any} options.client
   * @param {string} options.eventsPath
   * @param {string} options.commandsPath
   * @param {string[]} options.devGuilds
   */
  constructor({ client, eventsPath, commandsPath, devGuilds }) {
    this.client = client;
    this.eventsPath = eventsPath;
    this.commandsPath = commandsPath;
    this.devGuilds = devGuilds;

    if (!this.client) return Logger.error("Client is not defined.");

    registerEvents(this.eventsPath, this.client);
  }
}

// Export the ZoomHandler class
module.exports = { ZoomHandler };
