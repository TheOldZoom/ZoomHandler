# zoomhandler

Handler for **Discord.js v14** that loads **events**, **prefix message commands**, and **slash commands** from disk. It supports **subcommands** (message and slash), **cooldowns**, **user/bot permission checks**, **`devOnly`** routing to guilds, an optional **`devUsers`** allow list, and **slash autocomplete**.

**Status:** This project is still **under active development**. APIs and behavior may change between releases, and you may run into **bugs**. If something breaks, open an issue on GitHub or ask in Discord (see below).

## Support

- [Github](https://github.com/TheOldZoom/ZoomHandler)
- Discord: **[TheOldZoom](https://discord.com/users/1041378399005978624)**

## Requirements

- **discord.js** `^14.14.0` (peer dependency)
- **Node.js** (or another JS runtime) that supports the published **CommonJS** and **ES module** entry points

The npm package exposes **`require("zoomhandler")`** (CommonJS) and **`import "zoomhandler"`** (ESM) via the [`exports`](https://nodejs.org/api/packages.html#exports-sugar) field. Use whichever matches your project: `"type": "commonjs"` or `"type": "module"`, TypeScript with `moduleResolution` `node16` / `nodenext`, Bun, webpack, Rollup, etc.

```bash
npm install zoomhandler discord.js
```

## Public API (exports)

From `zoomhandler` you can import:

| Category          | Names                                                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core              | `ZoomHandler` (default export class is re-exported as named `ZoomHandler`), type `ZoomHandlerOptions`                                                                                              |
| Slash             | `Command`, `CommandWithSubcommands`, `Subcommand`, types `CommandClass`, `InteractionCommand`, `InteractionCommandOptions`, `SubcommandOptions`, `SlashSubcommandMeta`                             |
| Prefix            | `messageCommand`, `messageSubcommand`, `messageCommandWithSubcommands`, types `MessageCommand`, `MessageCommandClass`, `MessageCommandConfig`, `MessageCommandContext`, `MessageSubcommandOptions` |
| Events            | `Event`, type `EventClass`                                                                                                                                                                         |
| Utilities (types) | `MessageSubcommandGuard`                                                                                                                                                                           |

The Discord.js `Client` type is augmented with `log`, `prefix`, `devGuilds`, `devUsers`, `messageCommands`, `interactionCommands`, `messageCommandCooldowns`, and `interactionCommandCooldowns` (see [Client extensions](#client-extensions)).

## `ZoomHandler` constructor

```javascript
import { ZoomHandler } from "zoomhandler";
import { Client, GatewayIntentBits } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

new ZoomHandler({
  client,
  prefix: "!",
  eventsPath: path.join(__dirname, "events"),
  commandsPath: path.join(__dirname, "commands"),
  interactionCommandsPath: path.join(__dirname, "interactionCommands"),
  devGuilds: [],
  devUsers: [],
});

client.login(process.env.DISCORD_TOKEN);
```

### Options

| Option                    | Type       | Description                                                                                                                                                                                                                                                                |
| ------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client`                  | `Client`   | Required. Your Discord.js client.                                                                                                                                                                                                                                          |
| `prefix`                  | `string`   | Optional. Sets `client.prefix` for prefix commands. You can set `client.prefix` yourself instead. If `commandsPath` is set but no prefix is defined, message commands are **skipped** (warning logged).                                                                    |
| `eventsPath`              | `string`   | Optional. Root folder for event modules.                                                                                                                                                                                                                                   |
| `commandsPath`            | `string`   | Optional. Root folder for prefix command modules (scanned **recursively**).                                                                                                                                                                                                |
| `interactionCommandsPath` | `string`   | Optional. Root folder for slash command modules (scanned **recursively**). Slash commands are registered after the client is ready (`ClientReady`).                                                                                                                        |
| `devGuilds`               | `string[]` | Optional. Snowflake IDs of “development” guilds. Used for **`devOnly`** slash and message behavior and for **where** dev-only slash commands are registered (see [Slash command registration](#slash-command-registration-global-vs-guild)). Copied to `client.devGuilds`. |
| `devUsers`                | `string[]` | Optional. If non-empty, only these user IDs may run commands that go through the built-in guards (both slash and message). Copied to `client.devUsers`.                                                                                                                    |

If `client` is missing, the constructor throws.

### Client extensions

After construction:

- **`client.log`** — static logger with `info`, `warn`, `error`, `event`, `command`, `slashcmd`.
- **`client.messageCommands`** / **`client.interactionCommands`** — `Collection` instances filled when those handlers load.
- **`client.messageCommandCooldowns`** / **`client.interactionCommandCooldowns`** — `Map<string, number>` (timestamp until cooldown ends), used internally for cooldowns.

## Loading modules from disk

Under each commands path, files ending in **`.js`** or **`.ts`** (not **`.d.ts`**) are loaded. If both `foo.js` and `foo.ts` exist, **`.ts` wins**.

- **`.js`** files are loaded with `require`.
- **`.ts`** files are loaded with dynamic `import` (URL from `pathToFileURL`).

Each command file should **`export default`** a **class** (the constructors returned by `Command`, `messageCommand`, `messageCommandWithSubcommands`, `CommandWithSubcommands`, etc.).

## Events

`eventsPath` supports two layouts:

1. **One folder per event name** — e.g. `events/messageCreate/foo.ts`, `events/clientReady/ready.ts`. The **directory name** is the Discord event name passed to `client.on` / `client.once`.
2. **Flat files** — e.g. `events/messageCreate.ts`. The **filename stem** is the event name. Skipped if a **same-named folder** already exists.

### `Event` helper (class with `register`)

```javascript
import { Events } from "discord.js";
import { Event } from "zoomhandler";

export default Event(
  Events.ClientReady,
  async (client) => {
    console.log(`Logged in as ${client.user.tag}`);
  },
  true,
);
```

Arguments: `(eventName, execute, once?)`. The handler receives `(client, ...args)` where `args` match Discord.js `ClientEvents[eventName]`. For `clientReady` / `ready`, the typed client is `Client<true>`.

### Legacy shape: plain function

If the default export is a **function**, it is registered as `(client, ...args) => …` for that event (no `Event` class). Invalid exports are skipped with a warning.

## Prefix message commands

### Parsing

On `messageCreate`, the bot ignores bots. If `client.prefix` is set and the message starts with it, the rest is trimmed and split on whitespace:

- First token → command name (**lowercased** lookup in `client.messageCommands`).
- Remaining tokens → `args` passed to `run`.

Example: prefix `!` and message `!tools ping hello` → command `tools`, args `["ping", "hello"]`.

### `messageCommand` (single command)

```javascript
import { PermissionFlagsBits } from "discord.js";
import { messageCommand } from "zoomhandler";

export default messageCommand(
  {
    data: { name: "ping", description: "Reply with pong" },
    permissions: [],
    userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    cooldown: 3000,
    devOnly: false,
  },
  async ({ message, args, client }) => {
    await message.reply("Pong!");
  },
);
```

**`MessageCommandConfig`**

- **`data`** — `{ name, description }`. `name` must not contain spaces.
- **`permissions`** — optional; merged into **`userPermissions`** (alias).
- **`userPermissions`** / **`botPermissions`** — Discord permission flags. Checked in guild text channels (not DMs) before `run`.
- **`cooldown`** — milliseconds per user for this command; key `commandName:userId`.
- **`devOnly`** — if true, message must be in a guild whose id is in **`client.devGuilds`**.

### `messageSubcommand` + `messageCommandWithSubcommands`

Use a **parent** command name with **nested** invocations: `!tools ping`, `!tools echo hello world`.

- Define each subcommand with **`messageSubcommand({ name, description }, run, options?)`**. Subcommand **`options`** may include `permissions`, `userPermissions`, `botPermissions`, `cooldown`, `devOnly` (see **`MessageSubcommandOptions`**).
- Build the parent with **`messageCommandWithSubcommands(parentConfig, subcommandsRecord, { root? })`**.
  - **`subcommandsRecord`** — object keys are subcommand names; values are **`messageSubcommand(...)`** results.
  - **`root`** — optional handler when the user runs `!tools` with **no** subcommand (empty first arg). If omitted, the library replies `"Unknown subcommand!"`.

**Permission and cooldown behavior for subcommands**

- User/bot permission checks **merge** parent config with the chosen subcommand’s permissions.
- **`devOnly`** on a subcommand uses the same guild allow list as other dev-only checks (`client.devGuilds`).
- Subcommand **cooldown** uses key `parentName:subcommandName:userId` when the subcommand’s cooldown is set; parent **`cooldown`** still applies to the outer `messageCommand` wrapper for the initial dispatch (parent cooldown key `parentName:userId`).

```javascript
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
```

Subcommand matching is **case-insensitive** (`args[0].toLowerCase()`).

The generated class exposes **`subcommandKeys`** (list of subcommand names) for introspection/logging.

## Slash commands

### `Command` (single slash command)

```javascript
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "zoomhandler";

export default Command(
  new SlashCommandBuilder().setName("ping").setDescription("Reply with pong"),
  async (interaction) => {
    await interaction.reply("Pong!");
  },
  {
    permissions: [],
    userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],
    cooldown: 3000,
    devOnly: false,
    autocomplete: async (interaction) => {
      await interaction.respond([{ name: "Example", value: "example" }]);
    },
  },
);
```

**`InteractionCommandOptions`** (third argument)

- **`permissions`** — merged into **`userPermissions`**.
- **`userPermissions`** / **`botPermissions`**, **`cooldown`**, **`devOnly`** — same ideas as message commands; enforcement runs in the slash pipeline before `execute`.
- **`autocomplete`** — optional. If set, the same command class receives autocomplete interactions for this command name (see [Autocomplete](#autocomplete)).

The **`data`** argument may be a full **`SlashCommandBuilder`**, **`SlashCommandSubcommandsOnlyBuilder`**, **`SlashCommandOptionsOnlyBuilder`**, or a builder type **without** `addSubcommand` / `addSubcommandGroup` (for option-only commands).

### `Subcommand` + `CommandWithSubcommands`

**`CommandWithSubcommands(slashBuilder, subcommandsRecord, options?)`** calls **`addSubcommand`** on the builder for each **`Subcommand(...)`** entry. Execution uses **`interaction.options.getSubcommand()`** to pick the handler.

**`Subcommand(subcommandBuilder, execute, options?)`**

- **`subcommandBuilder`** — **`SlashCommandSubcommandBuilder`** from discord.js (name, description, options).
- **`execute`** — same as top-level slash handler.
- **`options`** — **`SubcommandOptions`**: `permissions`, `userPermissions`, `botPermissions`, `cooldown`, `devOnly`, and **`autocomplete`** in the type shape. Per-subcommand **`autocomplete`** is not wired automatically; use the **outer** `CommandWithSubcommands` third argument **`autocomplete`** and branch on `interaction.options.getSubcommand(true)` / focused options (see [Autocomplete](#autocomplete)).

**`slashSubcommands` map**

`CommandWithSubcommands` sets **`slashSubcommands`** on the command instance: a `ReadonlyMap` from subcommand name to **`SlashSubcommandMeta`** (`userPermissions`, `botPermissions`, `cooldown?`, `devOnly?`). The runtime merge **parent** `Command` permissions/cooldown/`devOnly` with the **selected subcommand** meta for access checks.

```javascript
import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { CommandWithSubcommands, Subcommand } from "zoomhandler";

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
    devOnly: false,
  },
);
```

**Subcommand groups**

This library’s **`CommandWithSubcommands`** helper only registers **flat** subcommands via **`addSubcommand`**. Discord.js also supports **subcommand groups**; you can still use a plain **`Command`** with a manually built builder if you need groups, but there is no dedicated factory here.

### Slash command registration (global vs guild)

On ready, the handler:

1. Loads all slash modules and builds JSON for each command.
2. Any command (or **`CommandWithSubcommands`** child) that **`slashCommandNeedsDevGuildRegistration`** treats as dev — i.e. **`devOnly`** on the root or on **any** subcommand — is registered **only** on guilds listed in **`client.devGuilds`**, not globally.
3. Other commands are registered **globally** with **`application.commands.set`**.
4. For each dev guild, **`guild.commands.set`** is called with that guild’s dev-only commands.
5. Global commands are synced so names not in the next global set are removed from the global scope (existing commands are replaced by the new set).

If a command is **`devOnly`** but **`devGuilds`** is empty, it is **skipped** with a warning.

If the root **`Command`** is not `devOnly` but **any** **`Subcommand`** uses **`devOnly`**, the library still treats the whole slash command as needing dev-guild registration: the **entire** builder (every subcommand) is registered **only** on **`devGuilds`**, not globally. There is no per-subcommand split between global and guild registration.

### Autocomplete

- **`Command`** — set **`autocomplete`** in **`InteractionCommandOptions`**. The handler calls **`command.autocomplete(interaction)`** for `AutocompleteInteraction`s when the command name matches.
- **`CommandWithSubcommands`** — set **`autocomplete`** on the **third argument** (`InteractionCommandOptions`) and dispatch to sub-handlers yourself using **`interaction.options.getSubcommand(true)`** and option getters.

Errors in autocomplete are logged; they are not replied with a generic user-facing slash error.

## Access control summary

| Mechanism                          | Prefix commands                     | Slash                                                                                                                                             |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`devUsers`** (non-empty)         | Only listed user IDs                | Only listed user IDs                                                                                                                              |
| **`devOnly`** (root)               | Guild id must be in **`devGuilds`** | Same + registration only on **`devGuilds`** when dev-only                                                                                         |
| **`devOnly`** (message subcommand) | Same guild check                    | N/A at sub level for registration; sub **`devOnly`** still forces guild registration for the whole command tree when combined with dev-guild sync |
| Permissions                        | Member / bot in channel             | **`memberPermissions`** / **`appPermissions`** in guild                                                                                           |
| Cooldown                           | See keys above                      | Key `commandName:subcommandOr_:userId`                                                                                                            |

Failed checks get short **ephemeral** replies (slash) or normal **message** replies (prefix) with fixed wording (permission, cooldown seconds, dev server only, etc.).

## Runtime errors

- **Slash** — after access checks, if **`execute`** throws, the user gets an ephemeral error and the error is logged.
- **Prefix** — if **`run`** throws, the user gets a generic error reply and the error is **`console.error`**’d.

## Types (TypeScript)

Declaration files are published under **`dist/`**. Import types alongside values, e.g. `import { type ZoomHandlerOptions, ZoomHandler } from "zoomhandler"`.

## License

MIT © TheOldZoom
