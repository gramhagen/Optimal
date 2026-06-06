# Optimal

## Devcontainer (GitHub Codespaces)

This repository includes a Codespaces-ready devcontainer for static Phaser 3 web game development.

### Included tooling

- Ubuntu 24.04 development environment
- Node.js LTS runtime
- `http-server` (installed globally)

### Run a static Phaser 3 game

From the repository root inside the devcontainer:

```bash
http-server -c-1 -p 8000 .
```

Then open the forwarded **Static Game Server** port (8000) in Codespaces.
