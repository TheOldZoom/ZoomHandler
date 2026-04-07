import type { Client, Interaction, Message } from "discord.js";

export async function interactionCreateEvent(
  client: Client,
  interaction: Interaction,
) {
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
}

export async function messageCreateEvent(client: Client, message: Message) {
  if (message.author.bot) return;
  const prefix = client.prefix;
  if (prefix === undefined || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/) ?? [];

  const commandName = (args.shift()?.toLowerCase() ?? "") as string;

  const command = client.messageCommands.get(commandName);

  if (!command) return;
  try {
    await command.run({ message, args, client });
  } catch (error) {
    console.error(error);
    await message.reply({
      content: "There was an error trying to execute that command!",
    });
  }
}
