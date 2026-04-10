# ZoomHandler

> This is still in development, READMEs are made with AI ( I will eventually make a whole website documentation about it).

Source repository for **zoomhandler**, a Discord.js v14 library that loads events, prefix commands, and slash commands from the filesystem—with subcommands, permissions, cooldowns, and dev-guild tooling.

## Using the library

**Installation, API reference, examples, and behavior are documented in the package readme:**

**[→ `pkgs/zoomhandler/README.md`](pkgs/zoomhandler/README.md)**

If you are building a bot, start there. It covers `ZoomHandler`, `Command` / `CommandWithSubcommands`, `messageCommand` / `messageCommandWithSubcommands`, `Event`, registration, and TypeScript types.

Quick install (from npm):

```bash
npm install zoomhandler discord.js
```

## Repository layout

| Path                                                                     | Purpose                                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| [`pkgs/zoomhandler/`](pkgs/zoomhandler/)                                 | Library source (`src/`), build output (`dist/` on publish), and **[`README.md`](pkgs/zoomhandler/README.md)** |
| [`pkgs/zoomhandler/tests/one/`](pkgs/zoomhandler/tests/one/)             | Small runnable sample (Bun) that exercises commands, subcommands, and events                                  |
| [`.github/workflows/npm-publish.yml`](.github/workflows/npm-publish.yml) | Publishes the package from `pkgs/zoomhandler` on GitHub Releases (and manual workflow dispatch)               |

## Local development

From the package directory:

```bash
cd pkgs/zoomhandler
bun install
bun run build
```

To run the sample bot (after copying env vars—see [`tests/one/.env.example`](pkgs/zoomhandler/tests/one/.env.example)):

```bash
cd pkgs/zoomhandler/tests/one
bun install
bun run index.ts
```

## Support and issues

- Repository: [TheOldZoom/ZoomHandler](https://github.com/TheOldZoom/ZoomHandler)
- Discord: [TheOldZoom](https://discord.com/users/1041378399005978624)

Bug reports and feature requests are welcome via GitHub issues.

## License

See [LICENSE](LICENSE) in this repository.
