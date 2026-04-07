import { Events } from "discord.js";
import { Event } from "zoomhandler";

export default Event(
  "clientReady",
  async (client) => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(client.guilds.cache.size);
  },
  true,
);
