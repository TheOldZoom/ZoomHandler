import "discord.js";
import type { Collection } from "discord.js";
import Logger from "../classes/Logger";
import type { InteractionCommand, MessageCommand } from "../classes/Command";

declare module "discord.js" {
  interface Client<Ready extends boolean = boolean> {
    log: typeof Logger;
    interactionCommands: Collection<string, InteractionCommand>;
    messageCommands: Collection<string, MessageCommand>;
    prefix?: string;
    devGuilds?: string[];
    devUsers?: string[];
    messageCommandCooldowns?: Map<string, number>;
    interactionCommandCooldowns?: Map<string, number>;
  }
}

export {};
