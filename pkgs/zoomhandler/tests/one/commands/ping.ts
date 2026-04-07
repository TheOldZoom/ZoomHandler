import { PermissionFlagsBits } from "discord.js";
import { messageCommand } from "zoomhandler";

const devOnly = Boolean(process.env.DEV_GUILD_IDS);

export default messageCommand(
  {
    data: { name: "ping", description: "Reply with pong" },
    userPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    cooldown: 3000,
    devOnly,
  },
  async ({ message }) => {
    await message.reply("Pong!");
  },
);
