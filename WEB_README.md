# Shelter Survival - Web Edition

A web-based version of the original Shelter Survival Text-Based game, built with Flask and modern web technologies.

## Features

- **Modern Web Interface**: Clean, responsive design that works on desktop and mobile
- **Real-time Game State**: Live updates of vault status, resources, and inhabitants
- **Interactive Actions**: Click-based gameplay instead of text commands
- **Visual Feedback**: Clear display of resources, people, and rooms
- **Game Log**: Real-time logging of game events and actions

## Installation

1. **Install Dependencies**:
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Run the Web Server**:
   ```bash
   python3 app.py
   ```

3. **Open Your Browser**:
   Navigate to `http://localhost:5000`

## How to Play

1. **Start a New Game**: Enter your character details and click "Start New Game"
2. **Manage Your Vault**: Use the action buttons to:
   - Build rooms
   - Assign people to rooms
   - Craft items
   - Trade resources
   - Rush rooms for bonuses
   - Heal injured inhabitants
3. **Monitor Resources**: Keep track of:
   - Food and water levels
   - Power consumption
   - Caps (currency)
   - Action points
4. **Advance Days**: Use "Skip Day" to progress time and see daily events

## Game Mechanics

### Resources
- **Caps**: Currency for trading and building
- **Food**: Required to feed inhabitants
- **Water**: Required to quench thirst
- **Power**: Required to operate rooms
- **Steel**: Building material for rooms and items

### Rooms
- **Living Quarters**: Houses inhabitants
- **Generator**: Produces power
- **Water Treatment**: Produces water
- **Kitchen**: Produces food

### Actions
- **Build**: Construct new rooms
- **Assign**: Put people to work in rooms
- **Craft**: Create items from materials
- **Trade**: Exchange resources
- **Rush**: Speed up room production (risky)
- **Heal**: Restore health to injured people

## Technical Details

### Backend
- **Flask**: Python web framework
- **Session Management**: Tracks active games
- **REST API**: JSON endpoints for game actions
- **Game Engine**: Refactored from original terminal version

### Frontend
- **HTML5/CSS3**: Modern, responsive design
- **JavaScript**: Real-time updates and interactions
- **Grid Layout**: Organized game interface
- **Real-time Updates**: Live game state synchronization

## File Structure

```
Shelter-Survival-Text-Based/
├── app.py                 # Flask web application
├── web_game_engine.py     # Web-compatible game engine
├── templates/
│   └── index.html        # Main game interface
├── requirements.txt       # Python dependencies
└── WEB_README.md         # This file
```

## Development

The web version maintains the core game logic while providing a modern interface. The original game files are preserved for reference:

- `Fallout_Shelter.py`: Original terminal game
- `Human.py`: Character system
- `Room.py`: Room management
- `Item.py`: Inventory system

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

1. **Server won't start**: Check if port 5000 is available
2. **Game not loading**: Ensure all dependencies are installed
3. **Actions not working**: Check browser console for JavaScript errors

## Future Enhancements

- Save/Load game functionality
- Multiplayer support
- Advanced room types
- More complex crafting system
- Visual room layouts
- Sound effects and music

---

**Original Game**: [Shelter-Survival-Text-Based](https://github.com/dis446/Shelter-Survival-Text-Based)
**Web Conversion**: Enhanced with modern web technologies while preserving the original gameplay experience. 