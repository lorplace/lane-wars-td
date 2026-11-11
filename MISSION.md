# Mission Brief: Lane Siege (Lane Wars TD)

## What this is
A browser-based 3D tower defense game inspired by the Warcraft 3 custom map "Line Tower Wars".
Original code and CC0 assets only (no Blizzard content). Built with vanilla JavaScript + Three.js.

- Live: https://lane-wars-td.pages.dev (Cloudflare Pages project `lane-wars-td`)
- Repo: https://github.com/lorplace/lane-wars-td
- Runs by double-clicking `index.html` (no server, no internet, no build step).

## Core gameplay (current state)
- 4 players side by side: you + 3 AI opponents (Ironhide = Hard builder, Vexa = Normal sender, Mopsy = Easy).
- Each player has an 11x20 lane. Creeps spawn at the top and walk to the bottom. Each leak costs lives (bosses 3); 0 lives = eliminated; last one standing wins.
- Ground creeps pathfind (BFS) around towers, so players maze. Placements that fully block the path are refused.
- Gold from kills + income every 10 s. Sending creeps (5 tiers) at an opponent raises your income (diminishing, capped at 110 per tick).
- Waves every 25 s, cycling normal / fast / armored / flying, boss every 10th wave. Creep HP scales harder after wave 18.
- 3 races (Human, Orc, Undead), each with 5 towers covering ground and air; towers upgrade to level 4 and sell for 70%.
- Lobby: pick race and AI difficulty. 60 s setup phase before wave 1 (Enter starts early, N holds the wave timer, P pauses; building works while paused).
- Free camera over all 4 lanes, minimap, lane hotkeys, multi-select towers (Shift+drag, Ctrl+A, double-click type) with bulk upgrade (U) and sell (Delete).
- Distinct impact, death and sound effects per tower and creep type; Effects High/Low and damage-number toggles.
- Removed on purpose (user feedback: "too much"): heroes and base tier upgrades. Do not re-add without asking.

## Code map
- `index.html`: page, HUD markup and styles, script loading order.
- `assets/logic.js`: pure game rules (lanes, pathfinding, waves, economy, sends, AI). Rendering-agnostic; keep it that way.
- `assets/races.js`: race and tower definitions (stats, costs, damage types). Data-driven; add races here.
- `assets/game3d.js`: Three.js renderer, camera, input, HUD wiring, effects, sound.
- `assets/core.js`: small shared helpers.
- `assets/models.js`: embedded CC0 KayKit models (base64, about 10 MB).
- `assets/three.bundle.js`: bundled Three.js (MIT).
- `tests/`: headless Chrome tests with playwright-core (`v5.js` gameplay, `ms.js` multi-select, `imp.js` impacts, `show.js` screenshots).

## Known issues and limits
- Balance is tuned only by AI-vs-AI simulation, not by humans. Without heroes, AIs struggle in early waves.
- AIs mostly build level 1 and 2 towers; late game they hoard gold.
- Performance on real GPUs is unverified (headless software rendering ran at about 10 fps). Late game can reach 300+ towers across lanes.
- Basic creeps are skeletons (no CC0 orc model); wolf, wyvern and ogre are primitive-built models.
- Abilities target automatically; towers always target the creep furthest along the path.
- R restarts instantly with no confirmation.
- Lightning lines are 1 px wide (WebGL limit).

## Mission (next goals, in priority order)
1. **Playtest and balance.** Early-wave AI survival, send economy, tower cost/DPS per race. Keep all 3 races roughly equal in win rate over simulated games.
2. **Performance.** Profile on a real laptop GPU; reduce draw calls (instancing for towers and creeps), cap effects on far lanes, keep 60 fps mid-game.
3. **Quality of life.** Restart confirmation, tower targeting modes (first / strongest / closest), clearer leak and send notifications, tooltips with tower stats.
4. **Content.** A 4th race (e.g. Night Elf) through `races.js`; better creep models if CC0 options exist.
5. **Online multiplayer (stretch).** Play against friends instead of AIs (e.g. WebRTC or a Cloudflare Durable Object relay).

## Rules for any contributor
- Keep it double-click playable from `index.html` with no build step and no CDN.
- Only original code and CC0 / permissively licensed assets; record every asset in `CREDITS.txt`.
- Keep `logic.js` free of rendering code.
- Run the headless tests (`npm install` then `node tests/v5.js`, etc.) with zero JS errors before shipping.
- Deploy: `npx wrangler@3 pages deploy <site dir> --project-name lane-wars-td --branch main` (needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).
