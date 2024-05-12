module.exports = async (client, interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.interactionCommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.run({ interaction, client });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
};
