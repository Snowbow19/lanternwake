# Lanternwake · Stormwatch

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Snowbow19/lanternwake/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard)
[![reward](https://make.fun/badge/best-game-01/Snowbow19/lanternwake/reward.svg)](https://make.fun/bounty/best-game-01)

A little light. A long way home.

Bring stranded crews through four storm-lit waters. Read the tides, secure fading lanterns and fit a ship that can make the next crossing.

## Choose your ship

- **Northreach Tug:** balanced handling, 100 hull and three tow berths.
- **Cove Skiff:** faster sailing, 75 hull and two berths; earn a harbor medal to unlock it.
- **Harbor Cutter:** heavier protection, 145 hull and four berths; complete the campaign to unlock it.

## Sail the Northreach

Lantern Harbor teaches the lines. Glass Channel adds reef lanes and directional currents. Murmur Banks hides crews in fog. Dawn Passage combines storms, currents and turning water in the final crossing.

Waiting crews have distress clocks. Taking a tow secures their light. Flares buy nearby crews more time, reveal fog and calm hazards. An overstretched line can part; recover the adrift crews before their lights expire. Lose too many crews, your hull or the remaining time, and the attempt ends.

Rescues and supplies earn brass. Buy engines, plating, winches, storm bells and signal lanterns in port, repair hull, or save brass for a later fitting. Prices rise with your ship's fittings. Brass brought ashore after the campaign adds ten points per unit to its final score.

Earn medals, unlock charts and chase best scores. Campaign checkpoints keep your ship, fittings, hull, brass and score between waters. Unlocked charts can also be replayed separately.

## Stand the Stormwatch

Complete the campaign to unlock endless rescue. Each watch changes the sea, increases the pressure and offers another chance to refit. Your hull, brass and fittings carry forward. Save the crews, keep your lines and decide what your next crossing can afford.

Stormwatch has its own checkpoint, best score and furthest-watch record. Restarting or returning to the chart room records the progress you earned. A failed watch ends the run.

## Play

Serve `game` with a static web server and open it in a desktop browser. Every asset is local; the game needs no account, external library or network service.

```sh
python3 -m http.server 8769 --directory game
```

| Control | Action |
| --- | --- |
| WASD or arrows | Steer |
| Click sea or minimap | Set a course |
| Space | Take a nearby boat in tow |
| E | Launch a flare |
| Shift | Boost |
| C | Switch close and chart views |
| P or Escape | Pause or resume |
| R | Retry a chart or start a new Stormwatch run |

Sound starts muted. Progress stays in the current browser; the voyage also works when storage is unavailable.

## Build the entry

Node.js 22.18 or later copies the game, its real playthrough screenshots and the dossier into the output directory. No dependencies need to be installed.

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

MIT License. Entered on [make.fun](https://make.fun/).

Explore [make.fun coding bounties through this referral link](https://make.fun/r/t1apzc29).
