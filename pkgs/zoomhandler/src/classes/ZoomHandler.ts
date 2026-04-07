import "../types/Client";
import { Collection, type Client, Events } from "discord.js";
import Logger from "./Logger";
import {
  registerEvents,
  MessageCommandsHandler,
  interactionCreateHandler,
} from "../utils/Handlers";

export interface ZoomHandlerOptions {
  client: Client;
  prefix?: string;
  eventsPath?: string;
  commandsPath?: string;
  interactionCommandsPath?: string;
  devGuilds?: string[];
}

export default class ZoomHandler {
  public readonly client: Client;
  public readonly eventsPath: string | undefined;
  public readonly commandsPath: string | undefined;
  public readonly interactionCommandsPath: string | undefined;
  public readonly devGuilds: string[];

  constructor({
    client,
    prefix,
    eventsPath,
    commandsPath,
    interactionCommandsPath,
    devGuilds,
  }: ZoomHandlerOptions) {
    if (!client) {
      Logger.error("Client is not defined.");
      throw new Error("Client is not defined");
    }
    this.client = client;
    this.client.log = Logger;
    if (prefix !== undefined) {
      this.client.prefix = prefix;
    }
    this.eventsPath = eventsPath;
    this.commandsPath = commandsPath;
    this.interactionCommandsPath = interactionCommandsPath;
    this.devGuilds = devGuilds ?? [];
    this.client.interactionCommands = new Collection();
    this.client.messageCommands = new Collection();

    if (this.eventsPath !== undefined) {
      registerEvents(this.eventsPath, this.client);
    }

    if (this.commandsPath !== undefined) {
      if (this.client.prefix === undefined) {
        Logger.warn(
          "If commandsPath is defined, client.prefix must also be defined. Ignoring MessageCreate Commands",
        );
      } else {
        void MessageCommandsHandler(this.commandsPath, this.client);
      }
    }

    if (this.interactionCommandsPath !== undefined) {
      this.client.once(Events.ClientReady, () => {
        void interactionCreateHandler(
          this.interactionCommandsPath!,
          this.client,
        );
      });
    }
  }

  get log(): typeof Logger {
    return this.client.log;
  }

  get prefix(): string | undefined {
    return this.client.prefix;
  }
}
