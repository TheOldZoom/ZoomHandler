const fs = require("fs");
const path = require("path");
const { Logger } = require("term-logger");
const { messageCreateHandler } = require("./utils/messageHandler");
async function registerEvents(eventsFolder, client) {
  fs.readdir(eventsFolder, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    const eventFiles = files.filter((file) => file.endsWith(".js"));

    eventFiles.forEach((file) => {
      const eventName = file.split(".")[0];
      const event = require(path.join(eventsFolder, file));
      client.on(eventName, event.bind(null, client));

      Logger.event(`Successfully registered event ${eventName}`);
    });
  });
  messageCreateHandler(client);
}

module.exports = { registerEvents };
