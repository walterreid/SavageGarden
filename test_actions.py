"""
Test cases for the web-based Shelter Survival game actions.
"""

import json
import requests

BASE_URL = "http://localhost:5002"

def test_new_game(session):
    """Test starting a new game."""
    print("Testing new game creation...")
    
    response = session.post(f"{BASE_URL}/api/new_game", json={
        "player_name": "Test",
        "father_surname": "Player",
        "mother_surname": "Test",
        "gender": "M"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "game_state" in data
    
    print("✅ New game creation works")
    return data["game_state"]

def test_available_rooms(session):
    """Test getting available rooms for assignment."""
    print("Testing available rooms API...")
    
    response = session.get(f"{BASE_URL}/api/available_rooms")
    
    assert response.status_code == 200
    rooms = response.json()
    assert isinstance(rooms, list)
    
    # Check that we have the expected rooms
    room_names = [room["name"] for room in rooms]
    expected_rooms = ["living", "generator", "water", "kitchen"]
    for room in expected_rooms:
        assert room in room_names
    
    print("✅ Available rooms API works")
    return rooms

def test_assign_unassign_actions(session):
    """Test assign and unassign actions."""
    print("Testing assign/unassign actions...")
    
    # Test assign action
    assign_response = session.post(f"{BASE_URL}/api/perform_action", json={
        "action": "assign",
        "args": ["player", "living"]
    })
    
    assert assign_response.status_code == 200
    assign_data = assign_response.json()
    assert assign_data["result"]["success"] == True
    
    # Verify player is assigned
    game_state = assign_data["game_state"]
    assert game_state["player"]["room"] == "living"
    
    # Test unassign action
    unassign_response = session.post(f"{BASE_URL}/api/perform_action", json={
        "action": "unassign",
        "args": ["player"]
    })
    
    assert unassign_response.status_code == 200
    unassign_data = unassign_response.json()
    assert unassign_data["result"]["success"] == True
    
    # Verify player is unassigned
    game_state = unassign_data["game_state"]
    assert game_state["player"]["room"] is None
    
    print("✅ Assign/unassign actions work")

def test_auto_assign_all(session):
    """Test auto assign all action."""
    print("Testing auto assign all...")
    
    response = session.post(f"{BASE_URL}/api/perform_action", json={
        "action": "auto assign all",
        "args": []
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["success"] == True
    
    print("✅ Auto assign all works")

def test_auto_feed_all(session):
    """Test auto feed all action."""
    print("Testing auto feed all...")
    
    response = session.post(f"{BASE_URL}/api/perform_action", json={
        "action": "auto feed all",
        "args": []
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["result"]["success"] == True
    
    print("✅ Auto feed all works")

def test_skip_day(session):
    """Test skip day action."""
    print("Testing skip day...")
    
    response = session.post(f"{BASE_URL}/api/update_day")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    
    print("✅ Skip day works")

def test_quit_action(session):
    """Test quit action."""
    print("Testing quit action...")
    
    response = session.post(f"{BASE_URL}/api/perform_action", json={
        "action": "quit",
        "args": []
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["quit"] == True
    
    print("✅ Quit action works")

def test_actions_list(session):
    """Test that the actions list contains only the expected actions."""
    print("Testing actions list...")
    
    response = session.get(f"{BASE_URL}/api/actions")
    
    assert response.status_code == 200
    actions = response.json()
    
    # Expected actions after simplification
    expected_actions = [
        "quit", "skip", "auto assign all", "auto feed all", 
        "trade", "craft", "rush", "assign", "unassign", 
        "coitus", "build", "fix", "heal"
    ]
    
    for action in expected_actions:
        assert action in actions, f"Action '{action}' should be available"
    
    # Check that removed actions are not present
    removed_actions = ["help", "see people", "see rooms", "see resources", "see day", "see inventory", "see items"]
    for action in removed_actions:
        assert action not in actions, f"Action '{action}' should not be available"
    
    print("✅ Actions list contains correct actions")

def test_game_state_structure(session):
    """Test that game state has the correct structure."""
    print("Testing game state structure...")
    
    response = session.get(f"{BASE_URL}/api/game_state")
    
    assert response.status_code == 200
    game_state = response.json()
    
    # Check required top-level keys
    required_keys = ["player", "people", "rooms", "resources", "inventory"]
    for key in required_keys:
        assert key in game_state, f"Game state should have '{key}' key"
    
    # Check player structure
    player = game_state["player"]
    player_keys = ["name", "age", "gender", "hunger", "thirst", "health", "room", "stats"]
    for key in player_keys:
        assert key in player, f"Player should have '{key}' key"
    
    # Check people structure
    people = game_state["people"]
    assert isinstance(people, dict)
    for person_name, person in people.items():
        person_keys = ["name", "age", "gender", "hunger", "thirst", "health", "room", "alive"]
        for key in person_keys:
            assert key in person, f"Person '{person_name}' should have '{key}' key"
    
    # Check rooms structure
    rooms = game_state["rooms"]
    assert isinstance(rooms, dict)
    for room_name, room in rooms.items():
        room_keys = ["name", "built", "assigned", "produce", "production", "wattage", "rushed"]
        for key in room_keys:
            assert key in room, f"Room '{room_name}' should have '{key}' key"
    
    # Check resources structure
    resources = game_state["resources"]
    resource_keys = ["caps", "happiness", "action_points", "days", "defense", "security"]
    for key in resource_keys:
        assert key in resources, f"Resources should have '{key}' key"
    
    # Check inventory structure
    inventory = game_state["inventory"]
    assert isinstance(inventory, dict)
    
    print("✅ Game state has correct structure")

def run_all_tests():
    """Run all test cases."""
    print("🧪 Running Shelter Survival Web Game Tests")
    print("=" * 50)
    
    try:
        session = requests.Session()
        # Start a new game for testing
        game_state = test_new_game(session)
        
        # Test the new room assignment system
        test_available_rooms(session)
        test_assign_unassign_actions(session)
        
        # Test core actions
        test_auto_assign_all(session)
        test_auto_feed_all(session)
        test_skip_day(session)
        
        # Test actions list
        test_actions_list(session)
        
        # Test game state structure
        test_game_state_structure(session)
        
        # Test quit (this will end the session)
        test_quit_action(session)
        
        print("\n🎉 All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests() 