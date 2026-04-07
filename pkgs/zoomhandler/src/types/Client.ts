import "discord.js";
import type { Client, Collection, Message, Interaction } from "discord.js";
import Logger from "../classes/Logger";
import type { InteractionCommand, MessageCommand } from "../classes/Command";

declare module "discord.js" {
  interface Client {
    log: typeof Logger;
    interactionCommands: Collection<string, InteractionCommand>;
    messageCommands: Collection<string, MessageCommand>;
    prefix?: string;
  }
}

export {};
