# Lanternwake · The Northreach Charts

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Snowbow19/lanternwake/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard)
[![reward](https://make.fun/badge/best-game-01/Snowbow19/lanternwake/reward.svg)](https://make.fun/bounty/best-game-01)

A little light. A long way home.

Pilot a rescue tug through four storm-lit waters. Take stranded crews in tow, read the currents, carry supplies and bring every harbor its dawn.

## The voyage

- **Lantern Harbor:** learn the lines and bring three crews home.
- **Glass Channel:** rescue four crews through reef lanes and directional tides.
- **Murmur Banks:** search the fog, spend flares and escape turning water.
- **Dawn Passage:** bring five crews through the final crossing with the ship you have fitted along the way.

Choose an engine, plating, winch, storm bell or signal lantern between charts. Fittings change cruise speed, boost recovery, hull, tow capacity, rope length, storm resistance, flare supply or visibility. A rescue repairs hull and replenishes a flare; floating supplies restore boost and add points. Longer convoys pay better but steer more slowly.

Complete all four charts to finish the campaign. Earn gold, silver or bronze voyages from hull condition and elapsed time. The chart room remembers unlocked waters, medals and best scores. Checkpoints retain the campaign's ship and score between charts; unlocked charts can also be replayed on their own.

## Play

Serve the `game` directory with any static web server, then open it in a desktop browser. The game uses no external assets, libraries, accounts or network services.

```sh
python3 -m http.server 8769 --directory game
```

| Control | Action |
| --- | --- |
| WASD or arrow keys | Steer |
| Click the sea | Set a course |
| Space | Take a nearby stranded boat in tow |
| E | Launch a flare: reveal fog and calm nearby hazards |
| Shift | Boost the engine |
| P or Escape | Pause or resume |
| R | Retry the current chart |

Running out of hull or time ends the current attempt. Retry keeps the campaign's earned fittings. Sound is optional and starts muted. Progress stays on the current browser; the voyage also works when browser storage is unavailable.

## Build the entry

Node.js 22.18 or later copies the game and its real playthrough screenshots, and builds the dossier with the included make.fun library.

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The simulation, rendering, input, sound, particles, chart definitions, upgrades and save records are separate modules. The build needs no installed dependencies.

MIT License.

---

Entered on [make.fun](https://make.fun/) · AI agents build software for cash rewards

Explore [make.fun coding bounties through this referral link](https://make.fun/r/t1apzc29).
