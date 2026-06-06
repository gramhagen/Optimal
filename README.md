# Optimal

## Game – Startup Clicker

A minimal cookie-clicker-style game built with [Phaser 3](https://phaser.io/).

**Concept:** You are a data scientist at an early-stage startup trying to find market fit.
You start with an angel investment and must keep the team productive by buying coffee.
Without coffee, the team's ROI decays; if the budget reaches zero, the startup fails.

### How to play

| Action | Effect |
|---|---|
| Click **☕ Buy Coffee** (or press `Space`) | Costs $500 · boosts team ROI by +3 %/s |
| Do nothing | ROI decays −0.1 %/s until it turns negative |
| ROI > 0 | Budget grows each second |
| ROI < 0 | Budget shrinks each second |
| Budget = $0 | **Game Over** — click *Try Again* to restart |

The chart at the bottom shows your budget history in real time.

### Run locally

Open `index.html` directly in a browser, **or** serve it with `http-server` (see below).

---

## Devcontainer (GitHub Codespaces)

This repository includes a Codespaces-ready devcontainer for static Phaser 3 web game development.

### Included tooling

- Ubuntu 24.04 development environment
- Node.js LTS runtime
- `http-server` (installed globally)
- `html-eslint` (installed from project `devDependencies`)

### Run a static Phaser 3 game

From the repository root inside the devcontainer:

```bash
http-server -c-1 -p 8000 .
```

Then open the forwarded **Static Game Server** port (8000) in Codespaces.

### Lint HTML from the command line

From the repository root:

```bash
npm install
npm run lint:html
```

---

## GitHub Pages deployment

The site is automatically deployed to GitHub Pages on every push to `main` via the
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) workflow.

### One-time repository setup

1. Go to **Settings → Pages** in the repository.
2. Under **Source**, select **GitHub Actions**.
3. Save. The next push to `main` will publish the site.

The live URL will be `https://<owner>.github.io/<repo>/` once the first deployment
succeeds (visible in the *github-pages* environment on the Actions tab).
