import { PermissionFlagsBits } from "discord.js";
import { messageCommandWithSubcommands, messageSubcommand } from "zoomhandler";

export default messageCommandWithSubcommands(
  {
    data: { name: "tools", description: "Toolbox commands" },
    userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    cooldown: 5000,
  },
  {
    ping: messageSubcommand(
      { name: "ping", description: "Reply with pong" },
      async ({ message }) => {
        await message.reply("Pong!");
      },
    ),
    echo: messageSubcommand(
      { name: "echo", description: "Echo the rest of the message" },
      async ({ message, args }) => {
        await message.reply(args.join(" ") || "…");
      },
      {
        cooldown: 2000,
        userPermissions: [PermissionFlagsBits.ManageMessages],
        botPermissions: [PermissionFlagsBits.EmbedLinks],
        devOnly: true,
      },
    ),
  },
  {
    root: async ({ message }) => {
      await message.reply("Subcommands: `ping`, `echo` — e.g. `!tools ping`");
    },
  },
);
