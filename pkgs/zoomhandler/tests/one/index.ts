import { ZoomHandler } from "zoomhandler";
import { Client, GatewayIntentBits } from "discord.js";
import path from "node:path";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

new ZoomHandler({
  client,
  prefix: "!",
  eventsPath: path.join(import.meta.dir, "events"),
  commandsPath: path.join(import.meta.dir, "commands"),
  interactionCommandsPath: path.join(import.meta.dir, "interactionCommands"),
  devGuilds: process.env.DEV_GUILD_IDS?.split(/[\s,]+/).filter(Boolean) ?? [],
  devUsers: process.env.DEV_USER_IDS?.split(/[\s,]+/).filter(Boolean) ?? [],
});

client.login(process.env.TOKEN);
