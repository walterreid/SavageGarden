# claude.md

## 🎮 Project Architecture

- `index.html`: Main UI, modal logic, and game display. All rendering and user interaction is handled here.
- `game-engine.js`: Core game logic, state machine, game loop, and all backend systems (resource, room, people, events, persistence).
- `rooms.json`: Room definitions, including capacity, production, power usage, and extension logic.
- `items.json`: Item/component definitions, including crafting and resource types.
- `test-game.js`: Test suite for validating game logic (optional for devs).

## 🧠 Game Systems Overview

- **Game Loop**: Runs via `requestAnimationFrame` in `game-engine.js`. Handles ticks, resource production, hunger/thirst, wanderer arrivals, and event triggers.
- **Rooms & Extensions**: Rooms are defined in `rooms.json` and instantiated in `game-engine.js`. Each room can be extended to increase capacity, production, and power usage. Living room capacity determines max population.
- **Resource & Production Loops**: Each tick, assigned people in rooms generate resources (food, water, watt, etc.) or convert inputs to outputs (e.g., steel mill: scrap + watt → steel). Power usage is deducted per room.
- **People/Inhabitants**: Managed as objects in `game-engine.js`. Each has SPECIAL stats, health, hunger, thirst, and can be assigned to rooms or sent on scavenging missions.
- **Wanderer Arrivals**: Periodically, a new wanderer appears if there is space in the living room. Arrival is handled with a modal and a timer for player decision.
- **Event Log**: All major actions and events are logged in the UI for player feedback and debugging.
- **State Persistence**: Game state is saved to and loaded from `localStorage` (see `saveGame`/`loadGame` in `game-engine.js`).

## 📁 File/Folder Naming Conventions

- All core logic is in root-level files (no `src/` or `lib/` folders).
- Data/config files use `.json` and are named for their domain (`rooms.json`, `items.json`).
- UI and logic are separated: `index.html` (UI), `game-engine.js` (logic).

## ⚙️ Editing Instructions for AI Assistants

- When modifying the game loop, ensure tick intervals and resource updates remain performant (avoid blocking UI thread).
- To add new rooms or items, update `rooms.json` or `items.json` and ensure the UI in `index.html` can display new properties.
- For new features (e.g., new event types, room mechanics), add logic to `game-engine.js` and update UI hooks in `index.html`.
- Use the event log system for all new gameplay events (call `this.log()` in UI or `addMissionLog()` in engine).
- When adding new persistent state, update both `saveGame` and `loadGame` logic.
- Test new features using `test-game.js` or by manual play in the browser.

## 📈 Changelog (Updated by AI)

- `2024-07-14`: Added `claude.md`; documented room extension and wanderer arrival systems
- `2024-07-14`: Added room extension system, production/consumption display, and living room population gating
- `2024-07-13`: Refactored resource/component/crafting loop; improved UI for room building and assignment
- `2024-07-12`: Migrated to JS/HTML-only architecture; removed Python backend 