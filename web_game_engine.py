"""
Web-based Fallout Shelter game engine.
Refactored from the original terminal-based game.
"""

from collections import OrderedDict
from random import randint, randrange
import pickle
import sys
import os

from Human import Human, Player, NPC
from Room import Room, all_rooms
from Item import Item, Inventory, all_items

class WebGameEngine:
    """Main game engine class for web-based version."""
    
    def __init__(self, player_name="Walter", father_surname="Reed", mother_surname="Rogers", gender="M"):
        """Initialize the game engine with player data."""
        self.setup_player(player_name, father_surname, mother_surname, gender)
        self.all_items = all_items()
        self.all_rooms = all_rooms()
        self.player.inventory['turret'] += 1
        self.player.inventory["steel"] += 5
        self.player.inventory["chip"] += 1
        
        self.rooms = {
            'living': Room('living'),
            'generator': Room('generator'),
            'water': Room('water'),
            'kitchen': Room('kitchen')
        }
        self.people = {}
        self.caps = 100
        self.trader_caps = 500
        self.happiness = 100
        self.action_points = 50
        self.defense = 0
        self.security = "secure"
        self.days = 1
        self.overuse = False
        self.overuse_amount = 0
        self.actions = OrderedDict()
        
        self.first_few()
        self.populate_people()
        
        if self.check_built_room("trader"):
            self = self.find_rand_items('trader', 10)
        
        # Initialize actions
        self.actions["quit"] = self.action_quit
        self.actions["skip"] = None
        self.actions["help"] = self.action_help
        self.actions["see day"] = self.action_see_day
        self.actions["see people"] = self.action_see_people
        self.actions["see inventory"] = self.action_see_inventory
        self.actions["see items"] = self.action_see_inventory
        self.actions["see trader"] = self.action_see_inventory
        self.actions["see rooms"] = self.action_see_rooms
        self.actions["see resources"] = self.action_see_resources
        self.actions["auto assign all"] = self.action_auto_assign
        self.actions["trade"] = self.action_trade
        self.actions["craft"] = self.action_craft
        self.actions["rush"] = self.action_rush_room
        self.actions["assign"] = self.action_assign_to_room
        self.actions["unassign"] = self.action_unassign
        self.actions["auto feed all"] = self.action_auto_feed_all
        self.actions["coitus"] = self.action_coitus
        self.actions["build"] = self.action_build_room
        self.actions["fix"] = self.action_fix_room
        self.actions["heal"] = self.action_heal

    def setup_player(self, name, father_surname, mother_surname, gender):
        """Create player object with provided data."""
        father = Human(surname=father_surname)
        mother = Human(surname=mother_surname)
        self.player = Player(name, 0, father, mother, 21, gender)

    def first_few(self):
        """Create first few inhabitants with random names."""
        used_names = []
        names = [
            "Thompson", "Elenor", "Codsworth", "Sharmak", "Luthor", "Marshall",
            "Cole", "Diven", "Davenport", "John", "Max", "Leth", "Exavor"
        ]
        
        for i in range(5):
            while True:
                name = names[randint(0, len(names) - 1)]
                if name not in used_names:
                    used_names.append(name)
                    break
            
            gender = "M" if randint(0, 1) == 0 else "F"
            person = NPC(name, 0, None, None, 21, gender)
            self.people[str(person)] = person
            person.assigned_room = None

    def populate_people(self):
        """Populate the people dictionary with initial inhabitants."""
        # This is called after first_few to ensure all people are properly initialized
        pass

    def get_game_state(self):
        """Get current game state as a dictionary for web API."""
        return {
            'player': {
                'name': str(self.player),
                'age': self.player.age,
                'gender': self.player.gender,
                'hunger': self.player.hunger,
                'thirst': self.player.thirst,
                'health': self.player.health,
                'room': self.player.assigned_room,
                'stats': {
                    'strength': self.player.strength,
                    'perception': self.player.perception,
                    'endurance': self.player.endurance,
                    'charisma': self.player.charisma,
                    'intelligence': self.player.intelligence,
                    'luck': self.player.luck
                }
            },
            'people': {
                name: {
                    'name': str(person),
                    'age': person.age,
                    'gender': person.gender,
                    'hunger': person.hunger,
                    'thirst': person.thirst,
                    'health': person.health,
                    'room': person.assigned_room,
                    'alive': person.alive
                } for name, person in self.people.items()
            },
            'rooms': {
                name: {
                    'name': room.name,
                    'built': room.built,
                    'assigned': room.assigned,
                    'produce': room.produce,
                    'production': room.production,
                    'wattage': room.wattage,
                    'rushed': room.rushed
                } for name, room in self.rooms.items()
            },
            'resources': {
                'caps': self.caps,
                'happiness': self.happiness,
                'action_points': self.action_points,
                'days': self.days,
                'defense': self.defense,
                'security': self.security
            },
            'inventory': dict(self.player.inventory.items())
        }

    def get_available_actions(self):
        """Get list of available actions for the web interface."""
        return list(self.actions.keys())

    def perform_action(self, action, *args):
        """Perform a game action and return the result."""
        if action not in self.actions:
            return {'error': f'Invalid action: {action}'}
        
        try:
            if action in ("trade", "assign", "unassign", "auto feed all", 
                         "auto assign all", "build", "craft", "fix", 'rush', 
                         'coitus', 'heal'):
                result = self.actions[action](self, *args)
                if result is not None:
                    self = result
            else:
                self.actions[action](self, *args)
            
            return {'success': True, 'message': f'Action {action} completed successfully'}
        except Exception as e:
            return {'error': f'Error performing action {action}: {str(e)}'}

    def update_day(self):
        """Update the game state for a new day."""
        self.action_points = 50
        if self.overuse:
            self.action_points -= self.overuse_amount
            
        self = self.update_all_room_production()
        
        # Room loop
        for room in self.rooms.values():
            if self.player.inventory['watt'] >= room.wattage:
                self.player.inventory['watt'] -= room.wattage
                if room.produce:
                    self.player.inventory[room.produce] += room.production
            else:
                # Log power issue instead of printing
                pass
            if room.rushed:
                room.rushed = False
        
        self = self.action_auto_feed_all()
        
        # People loop
        for person in self.people.values():
            if person.check_xp():
                person.level_up()
            person.increase_hunger(10)
            if person.hunger > 99:
                if person.assigned_room:
                    self = self.unassign(str(person))
                person.die(self, "hunger")
            person.increase_thirst(20)
            if person.thirst > 99:
                if person.assigned_room:
                    self = self.unassign(str(person))
                person.die(self, "thirst")
            
            # Handle activities
            if person.current_activity != "":
                if person.current_activity == "scavenging":
                    person.take_damage(person, randint(0, 30))
                if person.days_active == person.activity_limit:
                    person.current_activity = ""
                    person.active_days = 0
                    person.activity_limit = 0
                else:
                    person.days_active += 1
        
        if self.check_built_room('trader'):
            if self.rooms['trader'].assigned:
                self = self.lose_items('trader', 10)
                self = self.find_rand_items('trader', 10)
        
        self.days += 1
        return self

    # Action methods (refactored to return results instead of printing)
    def action_help(self):
        """Get help information."""
        help_text = []
        for action, func in self.actions.items():
            if action == "skip":
                desc = "Skip current day."
            else:
                desc = "No description available."
                if func and hasattr(func, '__doc__') and func.__doc__:
                    desc = func.__doc__.split('.')[0] + '.'
            help_text.append(f"{action}: {desc}")
        return help_text

    def action_see_day(self):
        """Get current day information."""
        return f"It is currently day number {self.days} in the vault."

    def action_see_people(self):
        """Get information about all inhabitants."""
        people_info = []
        people_info.append(str(self.player))
        for person in self.people.values():
            people_info.append(str(person))
        return people_info

    def action_see_inventory(self, inventory="inventory"):
        """Get inventory contents."""
        inv = inventory.lower()
        if inv == "inventory":
            return dict(self.player.inventory.items())
        elif inv == "trader":
            return dict(self.trader_inventory.items()) if hasattr(self, 'trader_inventory') else {}
        else:
            return {'error': f"No inventory named '{inventory}' exists."}

    def action_see_rooms(self):
        """Get room information."""
        rooms_info = []
        for room in self.rooms.values():
            rooms_info.append(str(room))
        return rooms_info

    def action_see_resources(self):
        """Get resource information."""
        return {
            'caps': self.caps,
            'happiness': self.happiness,
            'action_points': self.action_points,
            'defense': self.defense,
            'security': self.security
        }

    def action_auto_assign(self):
        """Auto assign all inhabitants to rooms."""
        # Simple auto-assignment logic
        available_rooms = [name for name, room in self.rooms.items() if room.built and not room.assigned]
        unassigned_people = [name for name, person in self.people.items() if not person.assigned_room and person.alive]
        
        for i, person_name in enumerate(unassigned_people):
            if i < len(available_rooms):
                room_name = available_rooms[i]
                self.people[person_name].assigned_room = room_name
                self.rooms[room_name].assigned = True
        
        return self

    def action_trade(self):
        """Handle trading."""
        # Basic trading logic
        if self.caps >= 10:
            self.caps -= 10
            self.player.inventory['steel'] += 5
            return self
        return self

    def action_craft(self, item_name):
        """Craft an item."""
        # Basic crafting logic
        if item_name == "turret" and self.player.inventory.get('steel', 0) >= 3:
            self.player.inventory['steel'] -= 3
            self.player.inventory['turret'] += 1
        return self

    def action_rush_room(self, room):
        """Rush a room."""
        if room in self.rooms and self.rooms[room].built:
            self.rooms[room].rushed = True
            self.action_points -= 10
        return self

    def action_assign_to_room(self, *args):
        """Assign a person to a room."""
        if len(args) >= 2:
            person_name = args[0]
            room_name = args[1]
            if person_name in self.people and room_name in self.rooms:
                self.people[person_name].assigned_room = room_name
                self.rooms[room_name].assigned = True
        return self

    def action_unassign(self, *args):
        """Unassign a person from their room."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name in self.people:
                room_name = self.people[person_name].assigned_room
                if room_name and room_name in self.rooms:
                    self.rooms[room_name].assigned = False
                self.people[person_name].assigned_room = None
        return self

    def action_auto_feed_all(self):
        """Auto feed all inhabitants."""
        for person in self.people.values():
            if person.alive and self.player.inventory.get('food', 0) > 0:
                person.hunger = max(0, person.hunger - 20)
                self.player.inventory['food'] -= 1
        return self

    def action_coitus(self, *args):
        """Have two adults try for a child."""
        # Basic reproduction logic
        if len(args) >= 2:
            person1_name = args[0]
            person2_name = args[1]
            if (person1_name in self.people and person2_name in self.people and
                self.people[person1_name].alive and self.people[person2_name].alive):
                # Simple reproduction chance
                if randint(1, 10) == 1:  # 10% chance
                    new_person = NPC("Child", 0, None, None, 0, "M" if randint(0, 1) == 0 else "F")
                    self.people[str(new_person)] = new_person
        return self

    def action_build_room(self, room_name):
        """Build a room."""
        if room_name in self.rooms and not self.rooms[room_name].built:
            if self.player.inventory.get('steel', 0) >= 5:
                self.rooms[room_name].built = True
                self.player.inventory['steel'] -= 5
                self.action_points -= 10
        return self

    def action_fix_room(self, room_name):
        """Fix a room."""
        if room_name in self.rooms and self.rooms[room_name].built:
            # Basic fix logic
            self.action_points -= 5
        return self

    def action_heal(self, *args):
        """Heal an inhabitant."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name in self.people and self.player.inventory.get('medkit', 0) > 0:
                self.people[person_name].health = min(100, self.people[person_name].health + 30)
                self.player.inventory['medkit'] -= 1
        return self

    def action_quit(self):
        """Quit the game."""
        return {'message': 'Game quit'}

    # Helper methods
    def check_built_room(self, room):
        """Check if a room is built."""
        return room in self.rooms and self.rooms[room].built

    def find_rand_items(self, inven, num):
        """Find random items."""
        # Basic random item generation
        items = ['steel', 'food', 'water', 'medkit']
        for _ in range(num):
            item = items[randint(0, len(items) - 1)]
            if hasattr(self, 'trader_inventory'):
                self.trader_inventory[item] = self.trader_inventory.get(item, 0) + 1
        return self

    def lose_items(self, inven, number):
        """Lose items from inventory."""
        # Basic item loss logic
        if hasattr(self, 'trader_inventory'):
            for _ in range(number):
                if self.trader_inventory:
                    item = list(self.trader_inventory.keys())[randint(0, len(self.trader_inventory) - 1)]
                    if self.trader_inventory[item] > 0:
                        self.trader_inventory[item] -= 1
        return self

    def unassign(self, name):
        """Unassign a person from their room."""
        if name in self.people:
            room_name = self.people[name].assigned_room
            if room_name and room_name in self.rooms:
                self.rooms[room_name].assigned = False
            self.people[name].assigned_room = None
        return self

    def update_all_room_production(self):
        """Update all room production."""
        # Basic production update
        for room in self.rooms.values():
            if room.built and room.produce:
                room.production = randint(1, 5)  # Random production
        return self 