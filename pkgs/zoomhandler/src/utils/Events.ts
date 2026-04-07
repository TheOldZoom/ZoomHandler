import type {
  ChatInputCommandInteraction,
  Client,
  Interaction,
  Message,
  PermissionResolvable,
} from "discord.js";
import type {
  CommandClass,
  MessageCommandConfig,
  SlashSubcommandMeta,
} from "../classes/Command";

function errLine(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  return String(err);
}

function resolveDevUserAllowlist(client: Client): string[] | undefined {
  const g = client.devUsers;
  return g !== undefined && g.length > 0 ? [...g] : undefined;
}

async function assertSlashCommandAccess(
  client: Client,
  interaction: ChatInputCommandInteraction,
  command: CommandClass,
): Promise<boolean> {
  const subName = interaction.options.getSubcommand(false);
  const sub =
    subName !== null ? command.slashSubcommands?.get(subName) : undefined;

  const userPerms = [
    ...command.userPermissions,
    ...(sub?.userPermissions ?? []),
  ];
  const botPerms = [...command.botPermissions, ...(sub?.botPermissions ?? [])];
  const cooldownMs =
    sub?.cooldown !== undefined ? sub.cooldown : command.cooldown;

  if (command.devOnly || sub?.devOnly) {
    const allowed = [...(client.devGuilds ?? [])];
    if (!interaction.guildId || !allowed.includes(interaction.guildId)) {
      await interaction.reply({
        content: "This command is only available in development servers.",
        ephemeral: true,
      });
      return false;
    }
  }

  const allowUsers = resolveDevUserAllowlist(client);
  if (allowUsers !== undefined && !allowUsers.includes(interaction.user.id)) {
    await interaction.reply({
      content: "You cannot use this command.",
      ephemeral: true,
    });
    return false;
  }

  if (botPerms.length > 0) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return false;
    }
    if (!interaction.appPermissions.has(botPerms)) {
      await interaction.reply({
        content: "I don't have permission to run this command here.",
        ephemeral: true,
      });
      return false;
    }
  }

  if (userPerms.length > 0) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return false;
    }
    const perms = interaction.memberPermissions;
    if (!perms?.has(userPerms)) {
      await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
      return false;
    }
  }

  if (cooldownMs > 0) {
    const map = client.interactionCommandCooldowns ?? new Map<string, number>();
    if (!client.interactionCommandCooldowns) {
      client.interactionCommandCooldowns = map;
    }
    const key = `${interaction.commandName}:${subName ?? "_"}:${interaction.user.id}`;
    const now = Date.now();
    const until = map.get(key);
    if (until !== undefined && until > now) {
      await interaction.reply({
        content: `Try again in ${Math.ceil((until - now) / 1000)} second(s).`,
        ephemeral: true,
      });
      return false;
    }
    map.set(key, now + cooldownMs);
  }

  return true;
}

export type MessageSubcommandGuard = {
  userPermissions: PermissionResolvable[];
  botPermissions: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
};

export async function assertMessageSubcommandAccess(
  client: Client,
  message: Message,
  parent: MessageCommandConfig,
  sub: MessageSubcommandGuard,
  subKey: string,
): Promise<boolean> {
  const parentUser: PermissionResolvable[] = [
    ...(parent.userPermissions ?? []),
    ...(parent.permissions ?? []),
  ];
  const userPerms = [...parentUser, ...sub.userPermissions];
  const botPerms = [...(parent.botPermissions ?? []), ...sub.botPermissions];

  if (sub.devOnly) {
    const allowed = [...(client.devGuilds ?? [])];
    if (!message.guildId || !allowed.includes(message.guildId)) {
      await message.reply(
        "This command is only available in development servers.",
      );
      return false;
    }
  }

  const allowUsers = resolveDevUserAllowlist(client);
  if (allowUsers !== undefined && !allowUsers.includes(message.author.id)) {
    await message.reply("You cannot use this command.");
    return false;
  }

  if (botPerms.length > 0) {
    if (!message.guild || message.channel.isDMBased()) {
      await message.reply("This command can only be used in a server.");
      return false;
    }
    let me = message.guild.members.me;
    if (!me) {
      me = await message.guild.members.fetchMe().catch(() => null);
    }
    if (!me) {
      await message.reply("I could not verify my permissions here.");
      return false;
    }
    const inChannel = message.channel.permissionsFor(me);
    const effective = inChannel ?? me.permissions;
    if (!effective.has(botPerms)) {
      await message.reply("I don't have permission to run this command here.");
      return false;
    }
  }

  if (userPerms.length > 0) {
    const member = message.member;
    if (!message.guild || !member) {
      await message.reply("This command can only be used in a server.");
      return false;
    }
    if (!member.permissions.has(userPerms)) {
      await message.reply("You don't have permission to use this command.");
      return false;
    }
  }

  const cooldownMs = sub.cooldown ?? 0;
  if (cooldownMs > 0) {
    const map = client.messageCommandCooldowns ?? new Map<string, number>();
    if (!client.messageCommandCooldowns) client.messageCommandCooldowns = map;
    const key = `${parent.data.name}:${subKey}:${message.author.id}`;
    const now = Date.now();
    const until = map.get(key);
    if (until !== undefined && until > now) {
      await message.reply(
        `Try again in ${Math.ceil((until - now) / 1000)} second(s).`,
      );
      return false;
    }
    map.set(key, now + cooldownMs);
  }

  return true;
}

export async function interactionCreateEvent(
  client: Client,
  interaction: Interaction,
) {
  if (interaction.isAutocomplete()) {
    const command = client.interactionCommands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      client.log.error(`Autocomplete error: ${errLine(error)}`);
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  const command = client.interactionCommands.get(interaction.commandName);
  if (!command) return;
  if (!(await assertSlashCommandAccess(client, interaction, command))) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    client.log.error(`Slash command error: ${errLine(error)}`);
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

  if (command.devOnly) {
    const allowed = [...(client.devGuilds ?? [])];
    if (!message.guildId || !allowed.includes(message.guildId)) {
      await message.reply(
        "This command is only available in development servers.",
      );
      return;
    }
  }

  const allowUsers = resolveDevUserAllowlist(client);
  if (allowUsers !== undefined && !allowUsers.includes(message.author.id)) {
    await message.reply("You cannot use this command.");
    return;
  }

  if (command.botPermissions.length > 0) {
    if (!message.guild || message.channel.isDMBased()) {
      await message.reply("This command can only be used in a server.");
      return;
    }
    let me = message.guild.members.me;
    if (!me) {
      me = await message.guild.members.fetchMe().catch(() => null);
    }
    if (!me) {
      await message.reply("I could not verify my permissions here.");
      return;
    }
    const inChannel = message.channel.permissionsFor(me);
    const effective = inChannel ?? me.permissions;
    if (!effective.has(command.botPermissions)) {
      await message.reply("I don't have permission to run this command here.");
      return;
    }
  }

  if (command.userPermissions.length > 0) {
    const member = message.member;
    if (!message.guild || !member) {
      await message.reply("This command can only be used in a server.");
      return;
    }
    if (!member.permissions.has(command.userPermissions)) {
      await message.reply("You don't have permission to use this command.");
      return;
    }
  }

  if (command.cooldown > 0) {
    const map = client.messageCommandCooldowns ?? new Map<string, number>();
    if (!client.messageCommandCooldowns) client.messageCommandCooldowns = map;
    const key = `${command.data.name}:${message.author.id}`;
    const now = Date.now();
    const until = map.get(key);
    if (until !== undefined && until > now) {
      await message.reply(
        `Try again in ${Math.ceil((until - now) / 1000)} second(s).`,
      );
      return;
    }
    map.set(key, now + command.cooldown);
  }
  try {
    await command.run({ message, args, client });
  } catch (error) {
    console.error(error);
    await message.reply({
      content: "There was an error trying to execute that command!",
    });
  }
}
