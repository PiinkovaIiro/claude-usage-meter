# usage-meter

A Claude Code mod that keeps your usage on screen at all times, as a status line under the prompt:

```
Usage · 5h ▰▰▱▱▱ 42% ↻2h15 · 7d ▰▱▱▱▱ 18% ↻3d4h · ctx 31% · $1.24
```

- **5h / 7d**: how much of the five-hour and weekly rate-limit windows you have used, and (↻) when each resets
- **ctx**: how full the context window is
- **$**: what the session has cost so far

It refreshes after every reply and whenever a rate-limit window moves by a point. When a window passes 90 % the line gets a ⚠ and you get a one-time toast. Rate-limit figures appear after the first reply, and only on a subscription plan (Pro / Max).

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install usage-meter --marketplace PiinkovaIiro/claude-usage-meter
```

Answer `y` to add the marketplace, then pick a scope (the user scope makes it load in every session).

From a shell:

```bash
claude plugin install usage-meter --marketplace PiinkovaIiro/claude-usage-meter
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `PiinkovaIiro/claude-usage-meter`, then **Add plugin**.
