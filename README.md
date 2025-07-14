# SavageGarden - Web Edition

A web-based vault management and survival game inspired by Fallout Shelter, implemented in JavaScript and HTML. This version is standalone and does not require Python or Flask.

## Features
- Modern, responsive web interface
- Real-time game state and log
- Scavenging, combat, and room management
- Assign people to rooms, manage resources, and survive as long as possible

## How to Play
1. Open `index.html` in your browser (no server required)
2. Manage your vault, assign people, and survive!

## File Structure
- `index.html` — Main game interface and UI
- `game-engine.js` — JavaScript game engine and logic
- `test-game.js` — JavaScript test suite for the game engine
- `rooms.json` — Room definitions
- `items.json` — Item definitions
- `README.md` — This file

## Notes
- Legacy Python files and Flask backend have been removed for clarity. The project is now fully JavaScript/HTML based.
- If you need the original Python version, see the project history or previous commits.

## Architecture Overview

- **index.html**: Handles all UI, modals, and user interaction. Renders the game state and logs events.
- **game-engine.js**: Contains the main game loop, state management, resource/production logic, room/people systems, and persistence.
- **rooms.json**: Defines all room types, their capacity, production, power usage, and extension logic.
- **items.json**: Defines all items/components/resources used in crafting and production.

### How it works
- The game loop runs in `game-engine.js` and updates resources, people, and events every tick.
- All state is saved to localStorage and loaded on page refresh.
- To add new features, update the relevant JSON and JS files, and ensure the UI in `index.html` can display new properties.

See `claude.md` for a detailed AI/developer guide and changelog.

---

By T.G. and contributors 


