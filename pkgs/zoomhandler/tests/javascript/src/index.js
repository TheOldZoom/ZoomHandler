const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { ZoomHandler } = require("zoomhandler");
const path = require("path");

process.loadEnvFile();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel],
});

new ZoomHandler({
  client,
  commandsPath: path.join(__dirname, "commands", "messages"),
  eventsPath: path.join(__dirname, "events"),
  prefix: "!",
});

client.login(process.env.TOKEN);
