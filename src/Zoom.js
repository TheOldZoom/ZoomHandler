const { registerEvents } = require("./EventsHandler");
const { MessageCommandsHandler } = require("./utils/MessageCommandsHandler");
const {
  interactionCreateHandler,
} = require("./utils/interactionCommandsHandler");

module.exports = {
  registerEvents,
  MessageCommandsHandler,
  interactionCreateHandler,
};
