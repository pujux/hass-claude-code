# Changelog

## 1.0.5

- Remove tmux: terminal sessions are now managed directly by the server. This fixes scroll wheel, text selection, and garbage characters — all were caused by tmux's terminal multiplexing layer conflicting with xterm.js

## 1.0.4

- Fix scrolling: wheel/trackpad now scrolls through full terminal history via tmux copy mode (scroll up to browse history, scroll down to return to live output)
- Fix text selection: works natively again — click and drag to highlight, browser copy (Ctrl+C / Cmd+C) to copy

## 1.0.3

- Fix scroll wheel not working after 1.0.2 — intercept wheel event before xterm.js to ensure scrollback is driven correctly

## 1.0.2

- Fix text selection/copy broken by mouse mode — scroll wheel now handled by xterm.js directly, preserving native browser text selection

## 1.0.1

- Fix garbage characters (`1;2c`, `0;276;0c`) appearing on terminal open — tmux no longer probes the PTY for terminal capabilities
- Fix scroll wheel / trackpad sending unwanted arrow keys instead of scrolling — tmux mouse mode enabled

## 1.0.0

- Initial release
