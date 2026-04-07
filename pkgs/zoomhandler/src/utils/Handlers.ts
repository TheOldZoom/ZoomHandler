import type {
  ApplicationCommandData,
  Client,
  Interaction,
  Message,
} from "discord.js";
import { Collection } from "discord.js";
import { readdir, stat } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import { interactionCreateEvent, messageCreateEvent } from "./Events";
import type {
  CommandClass,
  MessageCommand,
  MessageCommandClass,
} from "../classes/Command";

const require = createRequire(import.meta.url);

function errStr(err: unknown): string {
  if (err instanceof Error) return err.stack ?? err.message;
  return String(err);
}

function slashCommandNeedsDevGuildRegistration(instance: CommandClass): boolean {
  if (instance.devOnly) return true;
  if (!instance.slashSubcommands) return false;
  for (const sub of instance.slashSubcommands.values()) {
    if (sub.devOnly) return true;
  }
  return false;
}

function isHandlerFile(name: string): boolean {
  return (
    (name.endsWith(".js") || name.endsWith(".ts")) && !name.endsWith(".d.ts")
  );
}

function dedupeJsAndTs(filenames: string[]): string[] {
  const byStem = new Map<string, { js?: string; ts?: string }>();
  for (const f of filenames) {
    if (!isHandlerFile(f)) continue;
    const stem = f.replace(/\.(js|ts)$/, "");
    let e = byStem.get(stem);
    if (!e) {
      e = {};
      byStem.set(stem, e);
    }
    if (f.endsWith(".ts")) e.ts = f;
    else e.js = f;
  }
  const out: string[] = [];
  for (const e of byStem.values()) {
    const f = e.ts ?? e.js;
    if (f) out.push(f);
  }
  return out;
}

async function loadModule(filePath: string): Promise<unknown> {
  if (filePath.endsWith(".js")) {
    return require(filePath) as unknown;
  }
  return (await import(pathToFileURL(filePath).href)) as unknown;
}

function unwrapDefault(m: unknown): unknown {
  if (m !== null && typeof m === "object" && "default" in m) {
    return (m as { default: unknown }).default;
  }
  return m;
}

async function attachLoadedEvent(
  client: Client,
  eventName: string,
  filePath: string,
): Promise<boolean> {
  const raw = await loadModule(filePath);
  const loaded = unwrapDefault(raw);
  if (typeof loaded === "function") {
    try {
      const instance = new (loaded as new (c: Client) => unknown)(client);
      if (
        instance !== null &&
        typeof instance === "object" &&
        typeof (instance as { register?: unknown }).register === "function"
      ) {
        (instance as { register: () => void }).register();
        return true;
      }
    } catch {
      client.on(
        eventName,
        (loaded as (...args: unknown[]) => unknown).bind(null, client),
      );
      return true;
    }
    client.log.warn(`Invalid event export in ${filePath}`);
    return false;
  }
  client.log.warn(`Invalid event export in ${filePath}`);
  return false;
}

export function registerEvents(eventsFolder: string, client: Client): void {
  void (async () => {
    client.log.event(`Loading events from ${eventsFolder}`);
    let entries: string[];
    try {
      entries = await readdir(eventsFolder);
    } catch (err) {
      client.log.error(`Error reading events directory: ${errStr(err)}`);
      return;
    }

    let registered = 0;
    const dirNames = new Set<string>();

    for (const entry of entries) {
      const eventFolderPath = path.join(eventsFolder, entry);
      let stats;
      try {
        stats = await stat(eventFolderPath);
      } catch (err) {
        client.log.error(
          `Error reading path ${eventFolderPath}: ${errStr(err)}`,
        );
        continue;
      }

      if (!stats.isDirectory()) continue;
      dirNames.add(entry);

      let files: string[];
      try {
        files = await readdir(eventFolderPath);
      } catch (err) {
        client.log.error(
          `Error reading event folder ${eventFolderPath}: ${errStr(err)}`,
        );
        continue;
      }

      const fileNames = dedupeJsAndTs(files.filter(isHandlerFile));
      for (const file of fileNames) {
        const fp = path.join(eventFolderPath, file);
        try {
          if (await attachLoadedEvent(client, entry, fp)) {
            registered += 1;
            client.log.event(`Registered ${entry} (${file})`);
          }
        } catch (error) {
          client.log.error(`Error loading event ${fp}: ${errStr(error)}`);
        }
      }
    }

    for (const file of dedupeJsAndTs(entries.filter(isHandlerFile))) {
      const stem = file.replace(/\.(js|ts)$/, "");
      if (dirNames.has(stem)) continue;
      const fp = path.join(eventsFolder, file);
      try {
        if (await attachLoadedEvent(client, stem, fp)) {
          registered += 1;
          client.log.event(`Registered ${stem} (${file})`);
        }
      } catch (error) {
        client.log.error(`Error loading event ${fp}: ${errStr(error)}`);
      }
    }

    client.log.event(`Events finished (${registered} handler(s))`);
  })();
}

function slashDataToJSON(data: unknown): ApplicationCommandData | null {
  if (data === null || typeof data !== "object") return null;
  if (
    "toJSON" in data &&
    typeof (data as { toJSON?: () => ApplicationCommandData }).toJSON ===
      "function"
  ) {
    return (data as { toJSON: () => ApplicationCommandData }).toJSON();
  }
  if (
    "name" in data &&
    "description" in data &&
    typeof (data as { name: unknown }).name === "string" &&
    typeof (data as { description: unknown }).description === "string"
  ) {
    return data as ApplicationCommandData;
  }
  return null;
}

async function readCommands(
  directory: string,
  client: Client,
): Promise<void> {
  const readFiles = async (dir: string): Promise<void> => {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const st = await stat(fullPath);
      if (st.isDirectory()) {
        await readFiles(fullPath);
      }
    }
    const handlerFiles = dedupeJsAndTs(entries.filter(isHandlerFile));
    for (const file of handlerFiles) {
      const filePath = path.join(dir, file);
      try {
        const raw = await loadModule(filePath);
        const Exported = unwrapDefault(raw);
        if (typeof Exported !== "function") {
          client.log.warn(
            `Slash command ${filePath} must export a command class`,
          );
          continue;
        }
        const instance = new (Exported as new (c: Client) => CommandClass)(
          client,
        );
        const json = slashDataToJSON(instance.data);
        if (json === null || json.name == null || json.name === "") {
          client.log.warn(
            `SlashCommand in ${filePath} is missing required data`,
          );
          continue;
        }
        const name = json.name;
        client.interactionCommands.set(name, instance);
        client.log.slashcmd(`Registered ${name}`);
      } catch (error) {
        client.log.error(
          `Error loading slash command ${filePath}: ${errStr(error)}`,
        );
      }
    }
  };

  await readFiles(directory);
}

export async function interactionCreateHandler(
  directory: string,
  client: Client,
): Promise<void> {
  if (!client.application) {
    client.log.error(
      "interactionCreateHandler: application is not available (client not ready).",
    );
    return;
  }

  try {
    client.log.slashcmd(`Loading slash commands from ${directory}`);
    await readCommands(directory, client);

    const globalCommands: ApplicationCommandData[] = [];
    const perGuild = new Map<string, ApplicationCommandData[]>();
    const guildIdsToSync = new Set<string>();

    for (const id of client.devGuilds ?? []) {
      guildIdsToSync.add(id);
    }

    for (const instance of client.interactionCommands.values()) {
      const json = slashDataToJSON(instance.data);
      if (json === null || json.name == null || json.name === "") continue;

      if (slashCommandNeedsDevGuildRegistration(instance)) {
        const targets = [...(client.devGuilds ?? [])];
        if (targets.length === 0) {
          client.log.warn(
            `Slash command "${json.name}" is devOnly but ZoomHandler devGuilds is empty; it will not be registered.`,
          );
          continue;
        }
        for (const gid of targets) {
          guildIdsToSync.add(gid);
          let list = perGuild.get(gid);
          if (!list) {
            list = [];
            perGuild.set(gid, list);
          }
          list.push(json);
        }
      } else {
        globalCommands.push(json);
      }
    }

    const existing = await client.application.commands.fetch();
    const nextGlobalNames = new Set(
      globalCommands
        .map((c) => c.name)
        .filter((n): n is string => n != null && n !== ""),
    );
    for (const cmd of existing.values()) {
      if (!nextGlobalNames.has(cmd.name)) {
        client.log.slashcmd(`Deleted global ${cmd.name}`);
      }
    }
    await client.application.commands.set(globalCommands);
    client.log.slashcmd(
      `Global slash commands synced (${globalCommands.length} command(s))`,
    );

    for (const guildId of guildIdsToSync) {
      const guildCmds = perGuild.get(guildId) ?? [];
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        client.log.error(
          `Could not fetch guild ${guildId} for slash command registration.`,
        );
        continue;
      }
      await guild.commands.set(guildCmds);
      client.log.slashcmd(
        `Guild "${guild.name}" (${guildId}) slash commands synced (${guildCmds.length} command(s))`,
      );
    }
    client.on(
      "interactionCreate",
      (interaction: Interaction) =>
        void interactionCreateEvent(client, interaction),
    );
  } catch (error) {
    client.log.error(`Error registering slash commands: ${errStr(error)}`);
  }
}

async function readMessageCommands(
  directory: string,
  client: Client,
): Promise<Collection<string, MessageCommand>> {
  const messageCommands = new Collection<string, MessageCommand>();

  const readFiles = async (dir: string): Promise<void> => {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const st = await stat(fullPath);
      if (st.isDirectory()) {
        await readFiles(fullPath);
      }
    }
    const handlerFiles = dedupeJsAndTs(entries.filter(isHandlerFile));
    for (const file of handlerFiles) {
      const filePath = path.join(dir, file);
      try {
        const raw = await loadModule(filePath);
        const Exported = unwrapDefault(raw);
        if (typeof Exported !== "function") {
          client.log.warn(
            `Message command ${filePath} must export a command class`,
          );
          continue;
        }
        const instance = new (Exported as new (
          c: Client,
        ) => MessageCommandClass)(client);
        if (
          !instance.data?.name ||
          !instance.data?.description ||
          !instance.run ||
          /\s/.test(instance.data.name)
        ) {
          client.log.warn(`Invalid command file ${filePath}, ignoring it.`);
          continue;
        }
        const subLog =
          instance.subcommandKeys && instance.subcommandKeys.length > 0
            ? ` [${instance.subcommandKeys.join(", ")}]`
            : "";
        client.log.command(
          `Successfully loaded command ${instance.data.name}${subLog}`,
        );
        messageCommands.set(instance.data.name, instance);
      } catch (error) {
        client.log.error(
          `Error loading message command ${filePath}: ${errStr(error)}`,
        );
      }
    }
  };

  await readFiles(directory);
  return messageCommands;
}

export async function MessageCommandsHandler(
  directory: string,
  client: Client,
): Promise<void> {
  try {
    client.log.command(`Loading message commands from ${directory}`);
    const messageCommands = await readMessageCommands(directory, client);
    client.messageCommands = messageCommands;
    client.on(
      "messageCreate",
      (message: Message) => void messageCreateEvent(client as Client, message),
    );
    client.log.command(
      `Message commands ready (${messageCommands.size} command(s))`,
    );
  } catch (error) {
    client.log.error(`Error loading message commands: ${errStr(error)}`);
  }
}
