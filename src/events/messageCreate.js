module.exports = async (client, message) => {

  if (message.author.bot) return;
  const prefix = client.prefix;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const commandName = args.shift().toLowerCase();

  const command = client.messageCommands.get(commandName)

  if (!command) return;
  try {
    await command.run({ message, args, client });
  } catch (error) {
    console.error(error);
    await message.reply("There was an error trying to execute that command!");
  }
};
