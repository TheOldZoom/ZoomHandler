import type { Client } from "discord.js";

export default class Event {
  public readonly name: string;
  public readonly once: boolean;
  public readonly run: (client: Client) => Promise<unknown>;

  constructor(
    name: string,
    once: boolean,
    run: (client: Client) => Promise<unknown>,
  ) {
    this.name = name;
    this.once = once;
    this.run = run;
  }
}
