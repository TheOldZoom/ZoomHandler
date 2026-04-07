import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "zoomhandler";

const devOnly = Boolean(process.env.DEV_GUILD_IDS);

export default Command(
  new SlashCommandBuilder().setName("ping").setDescription("Reply with pong"),
  async (interaction) => {
    await interaction.reply("Pong!");
  },
  {
    userPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    cooldown: 3000,
    devOnly: true,
  },
);
