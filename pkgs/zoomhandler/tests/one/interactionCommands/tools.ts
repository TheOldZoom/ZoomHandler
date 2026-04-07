import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { CommandWithSubcommands, Subcommand } from "zoomhandler";

const devOnly = Boolean(process.env.DEV_GUILD_IDS);

export default CommandWithSubcommands(
  new SlashCommandBuilder().setName("tools").setDescription("Toolbox commands"),
  {
    ping: Subcommand(
      new SlashCommandSubcommandBuilder()
        .setName("ping")
        .setDescription("Reply with pong"),
      async (interaction) => {
        await interaction.reply("Pong!");
      },
      {
        cooldown: 5000,
        userPermissions: [PermissionFlagsBits.SendMessages],
      },
    ),
    echo: Subcommand(
      new SlashCommandSubcommandBuilder()
        .setName("echo")
        .setDescription("Echo your text")
        .addStringOption((opt) =>
          opt.setName("text").setDescription("Text to echo").setRequired(true),
        ),
      async (interaction) => {
        const text = interaction.options.getString("text", true);
        await interaction.reply(text);
      },
      {
        cooldown: 2000,
        userPermissions: [PermissionFlagsBits.ManageMessages],
        botPermissions: [PermissionFlagsBits.Administrator],
      },
    ),
  },
  {
    cooldown: 3000,
    devOnly,
  },
);
