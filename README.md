# Claude Code for Home Assistant

A Home Assistant add-on that runs Claude Code with a full-featured web terminal, image paste support, and pre-configured Home Assistant MCP.

## Installation

Add this repository to your Home Assistant add-on store, then install the **Claude Code** add-on.

## First run

After starting the add-on, open the web UI via the Home Assistant sidebar. Follow the Claude Code authentication prompt to log in with your Anthropic account.

## Multiple sessions

Use the `+` button in the tab bar to open additional named sessions. Each session runs an independent Claude Code instance.

## Image paste

Copy any screenshot or image to your clipboard and paste it (`Ctrl+V` / `Cmd+V`) while Claude Code is waiting for input. The image is saved locally and its path is inserted into the terminal — Claude will read and analyze it when you press Enter.

## MCP configuration

The Home Assistant MCP is pre-configured. To add additional MCPs, use Claude Code's built-in command inside the terminal:

```sh
claude mcp add-json my-mcp '{"command": "my-mcp-server"}'
```

## Configuration options

| Option | Default | Description |
|---|---|---|
| `terminal_font_size` | 14 | Terminal font size (10–24) |
| `terminal_theme` | dark | Terminal color theme (`dark` or `light`) |
| `auto_update_claude` | true | Auto-update Claude Code in background on start |
