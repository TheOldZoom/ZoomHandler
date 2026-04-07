import type { Client, ClientEvents } from "discord.js";

type BotClient<K extends keyof ClientEvents> = K extends "clientReady" | "ready"
  ? Client<true>
  : Client;

export interface EventClass {
  readonly name: keyof ClientEvents;
  readonly once: boolean;
  readonly client: Client;
  execute(...args: any[]): Promise<void> | void;
  register(): void;
  unregister(): void;
}

export function Event<K extends keyof ClientEvents>(
  name: K,
  execute: (
    client: BotClient<K>,
    ...args: ClientEvents[K]
  ) => Promise<void> | void,
  once: boolean = false,
): new (client: Client) => EventClass {
  return class EventClass implements EventClass {
    public readonly name: K;
    public readonly once: boolean;
    public readonly client: Client;
    private readonly executeFunction: typeof execute;

    constructor(client: Client) {
      this.client = client;
      this.name = name;
      this.once = once;
      this.executeFunction = execute;
    }

    public execute(...args: ClientEvents[K]): Promise<void> | void {
      return this.executeFunction(this.client as BotClient<K>, ...args);
    }

    public register(): void {
      if (this.once) {
        this.client.once(this.name, this.execute.bind(this));
      } else {
        this.client.on(this.name, this.execute.bind(this));
      }
    }

    public unregister(): void {
      this.client.off(this.name, this.execute.bind(this));
    }
  };
}
