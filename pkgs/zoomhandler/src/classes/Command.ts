import {
  Client,
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  AutocompleteInteraction,
} from "discord.js";
import type {
  SlashCommandSubcommandsOnlyBuilder,
  SlashCommandOptionsOnlyBuilder,
  PermissionResolvable,
} from "discord.js";
import { assertMessageSubcommandAccess } from "../utils/Events";

export type InteractionCommand = CommandClass;

export interface MessageCommandContext {
  message: Message;
  args: string[];
  client: Client;
}

export interface MessageCommandClass {
  readonly data: { name: string; description: string };
  readonly userPermissions: PermissionResolvable[];
  readonly botPermissions: PermissionResolvable[];
  readonly cooldown: number;
  readonly devOnly: boolean;
  readonly client: Client;
  readonly subcommandKeys?: readonly string[];
  run(ctx: MessageCommandContext): void | Promise<void>;
}

export type MessageCommand = MessageCommandClass;

export type SlashSubcommandMeta = {
  userPermissions: PermissionResolvable[];
  botPermissions: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
};

export type InteractionCommandOptions = {
  permissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
  autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => Promise<void> | void;
};

export interface CommandClass {
  readonly data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  readonly userPermissions: PermissionResolvable[];
  readonly botPermissions: PermissionResolvable[];
  readonly cooldown: number;
  readonly devOnly: boolean;
  readonly slashSubcommands?: ReadonlyMap<string, SlashSubcommandMeta>;
  readonly client: Client;
  execute(interaction: ChatInputCommandInteraction): Promise<void> | void;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void> | void;
}

export function Command(
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
  execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void,
  options?: InteractionCommandOptions,
): new (client: Client) => CommandClass {
  const userPermissions: PermissionResolvable[] = [
    ...(options?.userPermissions ?? []),
    ...(options?.permissions ?? []),
  ];
  const botPermissions = options?.botPermissions ?? [];
  const cooldown = options?.cooldown ?? 0;
  const devOnly = options?.devOnly ?? false;
  const autocompleteFunction = options?.autocomplete;

  return class CommandClass implements CommandClass {
    public readonly data: typeof data;
    public readonly userPermissions: PermissionResolvable[];
    public readonly botPermissions: PermissionResolvable[];
    public readonly cooldown: number;
    public readonly devOnly: boolean;
    public readonly slashSubcommands: ReadonlyMap<
      string,
      SlashSubcommandMeta
    > | undefined = undefined;
    public readonly client: Client;
    private readonly executeFunction: typeof execute;
    private readonly autocompleteFunction?: typeof autocompleteFunction;

    constructor(client: Client) {
      this.client = client;
      this.data = data;
      this.userPermissions = userPermissions;
      this.botPermissions = botPermissions;
      this.cooldown = cooldown;
      this.devOnly = devOnly;
      this.executeFunction = execute;
      this.autocompleteFunction = autocompleteFunction;
    }

    public execute(
      interaction: ChatInputCommandInteraction,
    ): Promise<void> | void {
      return this.executeFunction(interaction);
    }

    public autocomplete(
      interaction: AutocompleteInteraction,
    ): Promise<void> | void {
      if (this.autocompleteFunction) {
        return this.autocompleteFunction(interaction);
      }
    }
  };
}

export type MessageCommandConfig = {
  data: { name: string; description: string };
  permissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
};

export function messageCommand(
  config: MessageCommandConfig,
  run: (ctx: MessageCommandContext) => void | Promise<void>,
): new (client: Client) => MessageCommandClass {
  const userPermissions: PermissionResolvable[] = [
    ...(config.userPermissions ?? []),
    ...(config.permissions ?? []),
  ];
  const botPermissions = config.botPermissions ?? [];
  const cooldown = config.cooldown ?? 0;
  const devOnly = config.devOnly ?? false;
  return class MessageCommandClassImpl implements MessageCommandClass {
    public readonly data = config.data;
    public readonly userPermissions: PermissionResolvable[];
    public readonly botPermissions: PermissionResolvable[];
    public readonly cooldown: number;
    public readonly devOnly: boolean;
    public readonly client: Client;
    private readonly runFunction: typeof run;

    constructor(client: Client) {
      this.client = client;
      this.userPermissions = userPermissions;
      this.botPermissions = botPermissions;
      this.cooldown = cooldown;
      this.devOnly = devOnly;
      this.runFunction = run;
    }

    public run(ctx: MessageCommandContext): void | Promise<void> {
      return this.runFunction(ctx);
    }
  };
}

export type MessageSubcommandOptions = {
  permissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
};

export function messageSubcommand(
  data: { name: string; description: string },
  run: (ctx: MessageCommandContext) => void | Promise<void>,
  options?: MessageSubcommandOptions,
) {
  const userPermissions: PermissionResolvable[] = [
    ...(options?.userPermissions ?? []),
    ...(options?.permissions ?? []),
  ];
  const botPermissions = options?.botPermissions ?? [];
  return {
    data,
    run,
    userPermissions,
    botPermissions,
    cooldown: options?.cooldown,
    devOnly: options?.devOnly,
  };
}

export function messageCommandWithSubcommands<
  T extends Record<string, ReturnType<typeof messageSubcommand>>,
>(
  config: MessageCommandConfig,
  subcommands: T,
  options?: {
    root?: (ctx: MessageCommandContext) => void | Promise<void>;
  },
): new (client: Client) => MessageCommandClass {
  const keys = Object.keys(subcommands) as (keyof T & string)[];
  const Base = messageCommand(config, async (ctx) => {
    const subcommandName = ctx.args[0]?.toLowerCase() ?? "";

    if (subcommandName === "") {
      if (options?.root) {
        await options.root(ctx);
      } else {
        await ctx.message.reply("Unknown subcommand!");
      }
      return;
    }

    const subcommand = subcommands[subcommandName as keyof T];

    if (subcommand) {
      if (
        !(await assertMessageSubcommandAccess(
          ctx.client,
          ctx.message,
          config,
          subcommand,
          subcommandName,
        ))
      ) {
        return;
      }
      await subcommand.run({
        message: ctx.message,
        client: ctx.client,
        args: ctx.args.slice(1),
      });
    } else {
      await ctx.message.reply("Unknown subcommand!");
    }
  });

  return class MessageCommandWithSubcommands extends Base {
    declare readonly subcommandKeys: readonly string[];
    constructor(client: Client) {
      super(client);
      Object.defineProperty(this, "subcommandKeys", {
        value: keys,
        enumerable: true,
        writable: false,
      });
    }
  };
}

export type SubcommandOptions = {
  permissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  cooldown?: number;
  devOnly?: boolean;
  autocomplete?: (
    interaction: AutocompleteInteraction,
  ) => Promise<void> | void;
};

export function Subcommand(
  data: SlashCommandSubcommandBuilder,
  execute: (interaction: ChatInputCommandInteraction) => Promise<void> | void,
  options?: SubcommandOptions,
) {
  const userPermissions: PermissionResolvable[] = [
    ...(options?.userPermissions ?? []),
    ...(options?.permissions ?? []),
  ];
  const botPermissions = options?.botPermissions ?? [];
  return {
    data,
    execute,
    autocomplete: options?.autocomplete,
    userPermissions,
    botPermissions,
    cooldown: options?.cooldown,
    devOnly: options?.devOnly,
  };
}

export function CommandWithSubcommands<
  T extends Record<string, ReturnType<typeof Subcommand>>,
>(
  data: SlashCommandBuilder,
  subcommands: T,
  options?: InteractionCommandOptions,
): new (client: Client) => CommandClass {
  Object.values(subcommands).forEach((subcommand) => {
    data.addSubcommand(subcommand.data);
  });

  const subMeta = new Map<string, SlashSubcommandMeta>();
  for (const subcommand of Object.values(subcommands)) {
    subMeta.set(subcommand.data.toJSON().name, {
      userPermissions: subcommand.userPermissions,
      botPermissions: subcommand.botPermissions,
      cooldown: subcommand.cooldown,
      devOnly: subcommand.devOnly,
    });
  }

  const Base = Command(
    data,
    async (interaction) => {
      const subcommandName = interaction.options.getSubcommand();
      const subcommand = subcommands[subcommandName as keyof T];

      if (subcommand) {
        await subcommand.execute(interaction);
      } else {
        await interaction.reply("Unknown subcommand!");
      }
    },
    options,
  );

  return class CommandWithSubcommandsClass extends Base {
    public override readonly slashSubcommands = subMeta as ReadonlyMap<
      string,
      SlashSubcommandMeta
    >;
    constructor(client: Client) {
      super(client);
    }
  };
}
