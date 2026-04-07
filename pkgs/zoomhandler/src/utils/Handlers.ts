import type {
  ApplicationCommandData,
  Client,
  Interaction,
  Message,
} from "discord.js";
import { Collection } from "discord.js";
import { readdir, stat } from "fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { interactionCreateEvent, messageCreateEvent } from "./events";
import type { InteractionCommand, MessageCommand } from "../classes/Command";

const require = createRequire(import.meta.url);

export function registerEvents(eventsFolder: string, client: Client): void {
  void (async () => {
    let eventFolders: string[];
    try {
      eventFolders = await readdir(eventsFolder);
    } catch (err) {
      console.error("Error reading directory:", err);
      return;
    }

    for (const eventFolder of eventFolders) {
      const eventFolderPath = path.join(eventsFolder, eventFolder);
      let stats;
      try {
        stats = await stat(eventFolderPath);
      } catch (err) {
        console.error("Error reading folder:", err);
        continue;
      }

      if (!stats.isDirectory()) continue;

      let files: string[];
      try {
        files = await readdir(eventFolderPath);
      } catch (err) {
        console.error("Error reading event folder:", err);
        continue;
      }

      for (const file of files.filter((f) => f.endsWith(".js"))) {
        const eventHandler = require(path.join(eventFolderPath, file));
        client.on(eventFolder, eventHandler.bind(null, client));
        client.log.event(`Successfully registered event ${eventFolder}`);
      }
    }
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
): Promise<ApplicationCommandData[]> {
  const commands: ApplicationCommandData[] = [];

  const readFiles = async (dir: string): Promise<void> => {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const st = await stat(filePath);
      if (st.isDirectory()) {
        await readFiles(filePath);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(filePath) as {
            data?: unknown;
            run?: unknown;
          };
          if (command.data === undefined) {
            client.log.warn(
              `SlashCommand in ${filePath} is missing required data`,
            );
            continue;
          }
          const json = slashDataToJSON(command.data);
          if (json === null || json.name == null || json.name === "") {
            client.log.warn(
              `SlashCommand in ${filePath} is missing required data`,
            );
            continue;
          }
          const name = json.name;
          commands.push(json);
          client.interactionCommands.set(name, command as InteractionCommand);
          client.log.slashcmd(`Registered ${name}`);
        } catch (error) {
          console.error(`Error loading command file ${filePath}:`, error);
        }
      }
    }
  };

  await readFiles(directory);
  return commands;
}

export async function interactionCreateHandler(
  directory: string,
  client: Client,
): Promise<void> {
  if (!client.application) {
    console.error("interactionCreateHandler: application is not available.");
    return;
  }

  try {
    const commands = await readCommands(directory, client);
    const existing = await client.application.commands.fetch();
    const nextNames = new Set(
      commands
        .map((c) => c.name)
        .filter((n): n is string => n != null && n !== ""),
    );
    for (const cmd of existing.values()) {
      if (!nextNames.has(cmd.name)) {
        client.log.slashcmd(`Deleted ${cmd.name}`);
      }
    }
    await client.application.commands.set(commands);
    client.on(
      "interactionCreate",
      (interaction: Interaction) =>
        void interactionCreateEvent(client, interaction),
    );
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
}

async function readMessageCommands(
  directory: string,
  client: Client,
): Promise<Collection<string, MessageCommand>> {
  const messageCommands = new Collection<string, MessageCommand>();

  const readFiles = async (dir: string): Promise<void> => {
    const files = await readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const st = await stat(filePath);
      if (st.isDirectory()) {
        await readFiles(filePath);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(filePath) as {
            data?: { name?: string; description?: string };
            run?: MessageCommand["run"];
          };
          if (
            !command.data?.name ||
            !command.data?.description ||
            !command.run ||
            /\s/.test(command.data.name)
          ) {
            client.log.warn(`Invalid command file ${filePath}, ignoring it.`);
            continue;
          }
          client.log.command(
            `Successfully loaded command ${command.data.name}`,
          );
          messageCommands.set(command.data.name, command as MessageCommand);
        } catch (error) {
          console.error(`Error loading command file ${filePath}:`, error);
        }
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
    const messageCommands = await readMessageCommands(directory, client);
    client.messageCommands = messageCommands;
    client.on(
      "messageCreate",
      (message: Message) => void messageCreateEvent(client as Client, message),
    );
  } catch (error) {
    console.error("Error loading message commands:", error);
  }
}
