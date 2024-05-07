module.exports = async (client, message) => {
  const prefix = client.prefix;
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const command = message.content.slice(prefix.length).trim();

  const matchedCommand = client.commands.find(cmd => cmd.name === command || (cmd.aliases && cmd.aliases.includes(command)));
  if (!matchedCommand) return;

  try {
      matchedCommand.execute(message, [], client);
  } catch (error) {
      console.error(error);
      const errorMessage = await message.reply("There was an error executing that command.");
      setTimeout(() => {
          errorMessage.delete();
      }, 3000);
  }
};
