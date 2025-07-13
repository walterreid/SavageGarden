"""
Flask web application for Shelter Survival Text-Based game.
"""

from flask import Flask, render_template, request, jsonify, session
from simple_web_engine import SimpleWebGameEngine
import json

app = Flask(__name__)
app.secret_key = 'shelter_survival_secret_key'

# Store active games in memory (in production, use a database)
active_games = {}

@app.route('/')
def index():
    """Main game page."""
    return render_template('index.html')

@app.route('/api/new_game', methods=['POST'])
def new_game():
    """Start a new game."""
    data = request.get_json()
    player_name = data.get('player_name', 'Walter')
    father_surname = data.get('father_surname', 'Reed')
    mother_surname = data.get('mother_surname', 'Rogers')
    gender = data.get('gender', 'M')
    
    # Create new game
    game = SimpleWebGameEngine(player_name, father_surname, mother_surname, gender)
    
    # Store game in session
    session['game_id'] = id(game)
    active_games[session['game_id']] = game
    
    return jsonify({
        'success': True,
        'message': 'New game started',
        'game_state': game.get_game_state()
    })

@app.route('/api/game_state')
def get_game_state():
    """Get current game state."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    game = active_games[game_id]
    return jsonify(game.get_game_state())

@app.route('/api/actions')
def get_actions():
    """Get available actions."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    game = active_games[game_id]
    return jsonify(game.get_available_actions())

@app.route('/api/available_rooms')
def get_available_rooms():
    """Get available rooms for assignment."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    game = active_games[game_id]
    return jsonify(game.get_available_rooms_for_assignment())

@app.route('/api/perform_action', methods=['POST'])
def perform_action():
    """Perform a game action."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    data = request.get_json()
    action = data.get('action')
    args = data.get('args', [])
    
    game = active_games[game_id]
    result = game.perform_action(action, *args)
    
    # Handle quit action
    if result and isinstance(result, dict) and result.get('quit'):
        # Clear the session and remove the game
        if game_id in active_games:
            del active_games[game_id]
        session.pop('game_id', None)
        return jsonify({
            'quit': True,
            'message': 'Game ended. Returning to main screen.',
            'game_state': None
        })
    
    # Handle actions that return lists (like see_people)
    if isinstance(result, list):
        return jsonify({
            'result': {'success': True, 'message': 'Action completed', 'data': result},
            'game_state': game.get_game_state()
        })
    
    # Handle actions that return dictionaries with success/message but no data
    if isinstance(result, dict) and result.get('success') and 'data' not in result:
        # For "see" actions that should return data
        if action.startswith('see ') or action == 'help':
            if action == 'see people':
                data = game.action_see_people()
            elif action == 'see rooms':
                data = game.action_see_rooms()
            elif action == 'see inventory':
                data = game.action_see_inventory()
            elif action == 'see items':
                data = game.action_see_inventory()  # Same as see inventory
            elif action == 'see resources':
                data = game.action_see_resources()
            elif action == 'see day':
                data = [game.action_see_day()]  # Convert string to list for consistency
            elif action == 'help':
                data = game.action_help()
            else:
                data = None
                
            if data is not None:
                return jsonify({
                    'result': {'success': True, 'message': result.get('message', 'Action completed'), 'data': data},
                    'game_state': game.get_game_state()
                })
    
    return jsonify({
        'result': result,
        'game_state': game.get_game_state()
    })

@app.route('/api/update_day', methods=['POST'])
def update_day():
    """Update to the next day."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    game = active_games[game_id]
    game.update_day()
    
    return jsonify({
        'success': True,
        'message': f'Advanced to day {game.days}',
        'game_state': game.get_game_state()
    })

@app.route('/api/transfer_item', methods=['POST'])
def transfer_item():
    """Transfer an item from global inventory to player inventory."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    data = request.get_json()
    item_name = data.get('item_name')
    quantity = data.get('quantity', 1)
    
    if not item_name:
        return jsonify({'error': 'Item name is required'}), 400
    
    game = active_games[game_id]
    result = game.action_transfer_item(item_name, quantity)
    
    if result.get('success'):
        return jsonify({
            'success': True,
            'message': result.get('message', 'Item transferred successfully'),
            'game_state': game.get_game_state()
        })
    else:
        return jsonify({
            'success': False,
            'error': result.get('error', 'Transfer failed')
        }), 400

@app.route('/api/help')
def get_help():
    """Get help information."""
    game_id = session.get('game_id')
    if not game_id or game_id not in active_games:
        return jsonify({'error': 'No active game'}), 404
    
    game = active_games[game_id]
    return jsonify(game.action_help())

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002) 