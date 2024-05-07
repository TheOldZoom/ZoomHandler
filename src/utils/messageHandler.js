const { Logger } = require("term-logger");
const path = require("path");
async function messageCreateHandler(client) {
  const eventsFolder = __dirname;

  const eventFile = "messageCreate.js";
  const eventName = eventFile.split(".")[0];
  const event = require(path.join(eventsFolder, eventFile));
  client.on(eventName, event.bind(null, client));
}

module.exports = { messageCreateHandler };
