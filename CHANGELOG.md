# Changelog

## 1.0.2

- Fix text selection/copy broken by mouse mode — scroll wheel now handled by xterm.js directly, preserving native browser text selection

## 1.0.1

- Fix garbage characters (`1;2c`, `0;276;0c`) appearing on terminal open — tmux no longer probes the PTY for terminal capabilities
- Fix scroll wheel / trackpad sending unwanted arrow keys instead of scrolling — tmux mouse mode enabled

## 1.0.0

- Initial release
