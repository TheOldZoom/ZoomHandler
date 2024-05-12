const path = require("path");

async function messageCreateHandler(client) {
  const event = require(path.join(
    __dirname,
    "..",
    "events",
    "messageCreate.js"
  ));
  client.on("messageCreate", event.bind(null, client));
}

async function InteractionCreateHandler(client) {
  const event = require(path.join(
    __dirname,
    "..",
    "events",
    "interactionCreate.js"
  ));
  client.on("interactionCreate", event.bind(null, client));
}

module.exports = { messageCreateHandler, InteractionCreateHandler };
