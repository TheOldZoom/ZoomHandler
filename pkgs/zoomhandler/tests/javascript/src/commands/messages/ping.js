const { messageCommand } = require("zoomhandler");

module.exports = messageCommand(
  { data: { name: "ping", description: "Ping the bot" } },
  async ({ message, args, client }) => {
    await message.reply(`Ping: ${client.ws.ping}ms`);
  },
);
