import type {
  Client,
  Message,
  Interaction,
  ApplicationCommandData,
} from "discord.js";

export class MessageCommand {
  constructor(
    public readonly data: { name: string; description: string },
    public readonly devOnly: boolean,
  ) {}

  public run(args: {
    message: Message;
    client: Client;
    args: string[];
  }): Promise<unknown> {
    return this.run(args);
  }
}

export class InteractionCommand {
  constructor(
    public readonly data: ApplicationCommandData,
    public readonly devOnly: boolean,
  ) {}

  public run(args: {
    interaction: Interaction;
    client: Client;
  }): Promise<unknown> {
    return this.run(args);
  }
}
