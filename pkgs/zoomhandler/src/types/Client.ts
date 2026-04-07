import "discord.js";
import type { Collection, Interaction, Message, Client } from "discord.js";
import Logger from "../classes/Logger";

export type InteractionCommand = {
  run: (args: { interaction: Interaction; client: Client }) => Promise<unknown>;
};

export type MessageCommand = {
  run: (args: {
    message: Message;
    client: Client;
    args: string[];
  }) => Promise<unknown>;
};

declare module "discord.js" {
  interface Client {
    log: typeof Logger;
    interactionCommands: Collection<string, InteractionCommand>;
    messageCommands: Collection<string, MessageCommand>;
    prefix?: string;
  }
}

export {};
