"""
Simplified web-based Fallout Shelter game engine.
"""

from collections import OrderedDict
from random import randint, randrange

class SimpleWebGameEngine:
    """Simplified game engine for web-based version."""
    
    def __init__(self, player_name="Walter", father_surname="Reed", mother_surname="Rogers", gender="M"):
        """Initialize the game engine with player data."""
        self.setup_player(player_name, father_surname, mother_surname, gender)
        
        # Initialize global inventory (separate from player inventory)
        self.global_inventory = {
            'turret': 1,
            'steel': 5,
            'chip': 1,
            'food': 10,
            'water': 10,
            'watt': 20,
            'medkit': 2
        }
        
        # Initialize player inventory (personal items)
        self.player.inventory = {
            'stimpaks': 2,
            'radaways': 1
        }
        
        # Initialize rooms
        self.rooms = {
            'living': {'name': 'living', 'built': True, 'assigned': False, 'produce': 'happiness', 'production': 2, 'wattage': 0, 'rushed': False, 'free_sleeping': True},
            'generator': {'name': 'generator', 'built': True, 'assigned': False, 'produce': 'watt', 'production': 5, 'wattage': 0, 'rushed': False, 'free_sleeping': False},
            'water': {'name': 'water', 'built': True, 'assigned': False, 'produce': 'water', 'production': 3, 'wattage': 3, 'rushed': False, 'free_sleeping': False},
            'kitchen': {'name': 'kitchen', 'built': True, 'assigned': False, 'produce': 'food', 'production': 2, 'wattage': 2, 'rushed': False, 'free_sleeping': False}
        }
        
        # Initialize people
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
        self.auto_feed_enabled = True  # New auto-feed setting
        
        # Create initial inhabitants
        self.first_few()
        
        # Initialize actions
        self.actions = OrderedDict()
        self.actions["quit"] = self.action_quit
        self.actions["skip"] = self.action_skip
        self.actions["auto assign all"] = self.action_auto_assign
        self.actions["auto feed all"] = self.action_auto_feed_all
        self.actions["toggle auto feed"] = self.action_toggle_auto_feed
        self.actions["feed"] = self.action_feed_person
        self.actions["drink"] = self.action_drink_person
        self.actions["scavenge"] = self.action_scavenge
        self.actions["return"] = self.action_return_from_scavenge
        self.actions["trade"] = self.action_trade
        self.actions["craft"] = self.action_craft
        self.actions["rush"] = self.action_rush_room
        self.actions["assign"] = self.action_assign_to_room
        self.actions["unassign"] = self.action_unassign
        self.actions["coitus"] = self.action_coitus
        self.actions["build"] = self.action_build_room
        self.actions["fix"] = self.action_fix_room
        self.actions["heal"] = self.action_heal
        self.actions["transfer"] = self.action_transfer_item

    def setup_player(self, name, father_surname, mother_surname, gender):
        """Create player object with provided data."""
        self.player = SimplePlayer(name, father_surname, mother_surname, gender)

    def first_few(self):
        """Create first few inhabitants with random names."""
        names = ["Thompson", "Elenor", "Codsworth", "Sharmak", "Luthor", "Marshall", "Cole", "Diven", "Davenport", "John", "Max", "Leth", "Exavor"]
        
        # Predefined equipment sets
        equipment_sets = [
            {'weapon': {'name': 'Pipe Pistol', 'damage': '4-8'}, 'armor': {'name': 'Leather Armor', 'bonus': {'Endurance': 1}}, 'outfit': {'name': 'Vault Suit'}},
            {'weapon': {'name': 'Rusty Knife', 'damage': '3-6'}, 'armor': {'name': 'Raider Armor', 'bonus': {'Endurance': 2}}, 'outfit': {'name': 'Wasteland Gear'}},
            {'weapon': None, 'armor': {'name': 'Lab Coat', 'bonus': {'Intelligence': 1}}, 'outfit': {'name': 'Scientist Robes'}},
            {'weapon': {'name': 'Baseball Bat', 'damage': '5-10'}, 'armor': {'name': 'Combat Armor', 'bonus': {'Endurance': 3}}, 'outfit': {'name': 'Military Fatigues'}},
            {'weapon': None, 'armor': {'name': 'Mercenary Gear', 'bonus': {'Agility': 1}}, 'outfit': {'name': 'Tactical Vest'}}
        ]
        
        for i in range(5):
            name = names[randint(0, len(names) - 1)]
            gender = "M" if randint(0, 1) == 0 else "F"
            person = SimplePerson(name, gender)
            
            # Give them some initial equipment
            equipment = equipment_sets[i % len(equipment_sets)]
            person.equipped = equipment.copy()
            
            # Give them some basic medical supplies
            person.stimpaks = randint(0, 2)
            person.radaways = randint(0, 1)
            
            self.people[name] = person

    def get_game_state(self):
        """Get current game state for web interface."""
        people_data = {}
        for name, person in self.people.items():
            if person.alive:
                people_data[name] = {
                    'name': person.name,
                    'age': person.age,
                    'gender': person.gender,
                    'health': person.health,
                    'hunger': person.hunger,
                    'thirst': person.thirst,
                    'radiation': person.radiation,
                    'room': person.assigned_room,
                    'alive': person.alive,
                    'stats': person.stats,
                    'equipped': person.equipped,
                    'inventory': person.inventory,
                    'inventory_capacity': person.inventory_capacity,
                    'stimpaks': person.stimpaks,
                    'radaways': person.radaways,
                    'is_scavenging': person.is_scavenging,
                    'scavenge_days': person.scavenge_days,
                    'scavenge_target_days': person.scavenge_target_days,
                    'damage_resistance': person.damage_resistance,
                    'rad_resistance': person.rad_resistance
                }
        
        return {
            'player': {
                'name': self.player.name,
                'age': self.player.age,
                'gender': self.player.gender,
                'health': self.player.health,
                'hunger': self.player.hunger,
                'thirst': self.player.thirst,
                'radiation': self.player.radiation,
                'room': self.player.assigned_room,
                'stats': self.player.stats,
                'equipped': self.player.equipped,
                'inventory': self.player.inventory,
                'inventory_capacity': self.player.inventory_capacity,
                'stimpaks': self.player.stimpaks,
                'radaways': self.player.radaways,
                'is_scavenging': self.player.is_scavenging,
                'scavenge_days': self.player.scavenge_days,
                'scavenge_target_days': self.player.scavenge_target_days,
                'damage_resistance': self.player.damage_resistance,
                'rad_resistance': self.player.rad_resistance
            },
            'people': people_data,
            'rooms': self.rooms,
            'resources': {
                'caps': self.caps,
                'happiness': self.happiness,
                'action_points': self.action_points,
                'days': self.days,
                'defense': self.defense,
                'security': self.security,
                'auto_feed_enabled': self.auto_feed_enabled
            },
            'global_inventory': dict(self.global_inventory.items()),
            'player_inventory': dict(self.player.inventory.items())
        }

    def get_available_actions(self):
        """Get list of available actions for the web interface."""
        return list(self.actions.keys())
    
    def get_available_rooms_for_assignment(self):
        """Get list of rooms that can be assigned to."""
        available_rooms = []
        for name, room in self.rooms.items():
            if room['built']:
                # Check if room has capacity (simplified: max 2 people per room)
                assigned_count = sum(1 for person in self.people.values() 
                                  if person.assigned_room == name)
                if self.player.assigned_room == name:
                    assigned_count += 1
                
                # Living room has unlimited capacity for free sleeping
                max_capacity = float('inf') if room.get('free_sleeping', False) else 2
                
                if assigned_count < max_capacity:
                    room_info = {
                        'name': name,
                        'assigned_count': assigned_count,
                        'max_capacity': max_capacity if max_capacity != float('inf') else 'Unlimited',
                        'produce': room.get('produce'),
                        'production': room.get('production', 0),
                        'free_sleeping': room.get('free_sleeping', False),
                        'wattage': room.get('wattage', 0)
                    }
                    available_rooms.append(room_info)
        return available_rooms

    def perform_action(self, action, *args):
        """Perform a game action and return the result."""
        if action not in self.actions:
            return {'error': f'Invalid action: {action}'}
        try:
            if action in ("trade", "assign", "unassign", "auto feed all", 
                         "auto assign all", "build", "craft", "fix", 'rush', 
                         'coitus', 'heal', 'skip'):
                result = self.actions[action](*args)
                if result is not None:
                    self = result
            else:
                result = self.actions[action](*args)
                if result and isinstance(result, dict) and result.get('quit'):
                    return result
            return {'success': True, 'message': f'Action {action} completed successfully'}
        except Exception as e:
            return {'error': f'Error performing action {action}: {str(e)}'}

    def update_day(self):
        """Update the game state for a new day."""
        self.action_points = 50
        if self.overuse:
            self.action_points -= self.overuse_amount
            
        # Room production
        for room_name, room in self.rooms.items():
            if room['built'] and room['assigned'] and room['produce']:
                # Check if room needs power (living room doesn't need power)
                if room['produce'] == 'happiness':
                    # Living room produces happiness without power cost
                    self.happiness = min(100, self.happiness + room['production'])
                elif self.global_inventory['watt'] >= room['wattage']:
                    self.global_inventory['watt'] -= room['wattage']
                    self.global_inventory[room['produce']] += room['production']
        
        # People updates
        for person in self.people.values():
            if person.alive:
                person.hunger = min(100, person.hunger + 10)
                person.thirst = min(100, person.thirst + 20)
                
                # Handle scavenging
                if person.is_scavenging:
                    person.scavenge_days += 1
                    # Scavengers take damage and radiation
                    damage = randint(5, 15)
                    radiation = randint(0, 5)
                    person.health = max(0, person.health - damage)
                    person.radiation = min(100, person.radiation + radiation)
                    
                    # Use medical supplies if available
                    if person.health < 50 and person.stimpaks > 0:
                        person.health = min(100, person.health + 30)
                        person.stimpaks -= 1
                    
                    if person.radiation > 20 and person.radaways > 0:
                        person.radiation = max(0, person.radiation - 15)
                        person.radaways -= 1
                    
                    # Check if scavenging is complete
                    if person.scavenge_days >= person.scavenge_target_days:
                        person.is_scavenging = False
                        # Generate loot
                        loot = self.generate_scavenge_loot(person, person.scavenge_days)
                        # Add loot to global inventory instead of personal
                        for item in loot:
                            if hasattr(item, 'name'):
                                item_name = item.name
                            else:
                                item_name = str(item)
                            self.global_inventory[item_name] = self.global_inventory.get(item_name, 0) + 1
                        person.scavenge_days = 0
                        person.scavenge_target_days = 0
                
                if person.hunger >= 100 or person.thirst >= 100 or person.health <= 0:
                    person.alive = False
                    if person.assigned_room:
                        self.rooms[person.assigned_room]['assigned'] = False
                        person.assigned_room = None
        
        # Handle player updates
        self.player.hunger = min(100, self.player.hunger + 10)
        self.player.thirst = min(100, self.player.thirst + 20)
        
        # Handle player scavenging
        if self.player.is_scavenging:
            self.player.scavenge_days += 1
            # Player takes damage and radiation
            damage = randint(5, 15)
            radiation = randint(0, 5)
            self.player.health = max(0, self.player.health - damage)
            self.player.radiation = min(100, self.player.radiation + radiation)
            
            # Use medical supplies if available
            if self.player.health < 50 and self.player.stimpaks > 0:
                self.player.health = min(100, self.player.health + 30)
                self.player.stimpaks -= 1
            
            if self.player.radiation > 20 and self.player.radaways > 0:
                self.player.radiation = max(0, self.player.radiation - 15)
                self.player.radaways -= 1
            
            # Check if scavenging is complete
            if self.player.scavenge_days >= self.player.scavenge_target_days:
                self.player.is_scavenging = False
                # Generate loot
                loot = self.generate_scavenge_loot(self.player, self.player.scavenge_days)
                # Add loot to global inventory
                for item in loot:
                    if hasattr(item, 'name'):
                        item_name = item.name
                    else:
                        item_name = str(item)
                    self.global_inventory[item_name] = self.global_inventory.get(item_name, 0) + 1
                self.player.scavenge_days = 0
                self.player.scavenge_target_days = 0
        
        # Auto-feed if enabled
        if self.auto_feed_enabled:
            self.action_auto_feed_all()
        
        self.days += 1
        return self

    # Action methods
    def action_help(self, *args):
        """Get help information."""
        help_text = []
        for action in self.actions.keys():
            if action == "skip":
                desc = "Skip current day."
            else:
                desc = "Perform game action."
            help_text.append(f"{action}: {desc}")
        return help_text

    def action_see_day(self, *args):
        """Get current day information."""
        return f"It is currently day number {self.days} in the vault."

    def action_see_people(self, *args):
        """Get information about all inhabitants."""
        people_info = []
        people_info.append(f"Player: {self.player.name}")
        for person in self.people.values():
            people_info.append(f"{person.name} ({person.gender}) - Hunger: {person.hunger}, Thirst: {person.thirst}, Health: {person.health}")
        
        # Add total count
        total_people = len(self.people) + 1  # +1 for player
        people_info.append(f"Total Inhabitants: {total_people}")
        
        return people_info

    def action_see_inventory(self, *args):
        """Get inventory contents."""
        # Handle the case where args might be the game object instead of a string
        if args and hasattr(args[0], 'lower'):
            inventory = args[0]
        else:
            inventory = "inventory"
            
        if inventory.lower() == "inventory":
            return self.player.inventory
        elif inventory.lower() == "trader":
            return {}  # No trader inventory in simplified version
        else:
            return {'error': f"No inventory named '{inventory}' exists."}

    def action_see_rooms(self, *args):
        """Get room information."""
        rooms_info = []
        for name, room in self.rooms.items():
            status = "Built" if room['built'] else "Not Built"
            assigned = "Assigned" if room['assigned'] else "Unassigned"
            rooms_info.append(f"{name}: {status}, {assigned}")
        return rooms_info

    def action_see_resources(self, *args):
        """Get resource information."""
        return {
            'caps': self.caps,
            'happiness': self.happiness,
            'action_points': self.action_points,
            'defense': self.defense,
            'security': self.security
        }

    def action_skip(self, *args):
        """Skip to the next day."""
        return self.update_day()

    def action_auto_assign(self, *args):
        """Auto assign all inhabitants to rooms."""
        available_rooms = [name for name, room in self.rooms.items() if room['built'] and not room['assigned']]
        unassigned_people = [name for name, person in self.people.items() if not person.assigned_room and person.alive]
        
        for i, person_name in enumerate(unassigned_people):
            if i < len(available_rooms):
                room_name = available_rooms[i]
                self.people[person_name].assigned_room = room_name
                self.rooms[room_name]['assigned'] = True
        
        return self

    def action_trade(self, *args):
        """Handle trading."""
        if self.caps >= 10:
            self.caps -= 10
            self.global_inventory['steel'] += 5
        return self

    def action_craft(self, *args):
        """Craft an item."""
        item_name = args[0] if args else "turret"
        if item_name == "turret" and self.global_inventory.get('steel', 0) >= 3:
            self.global_inventory['steel'] -= 3
            self.global_inventory['turret'] += 1
        return self

    def action_rush_room(self, *args):
        """Rush a room."""
        room = args[0] if args else "living"
        if room in self.rooms and self.rooms[room]['built']:
            self.rooms[room]['rushed'] = True
            self.action_points -= 10
        return self

    def action_assign_to_room(self, *args):
        """Assign a person to a room."""
        if len(args) >= 2:
            person_name = args[0]
            room_name = args[1]
            if room_name in self.rooms:
                if person_name == 'player':
                    self.player.assigned_room = room_name
                elif person_name in self.people:
                    self.people[person_name].assigned_room = room_name
                    self.rooms[room_name]['assigned'] = True
        return self

    def action_unassign(self, *args):
        """Unassign a person from their room."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name == 'player':
                self.player.assigned_room = None
            elif person_name in self.people:
                room_name = self.people[person_name].assigned_room
                if room_name and room_name in self.rooms:
                    self.rooms[room_name]['assigned'] = False
                self.people[person_name].assigned_room = None
        return self

    def action_auto_feed_all(self, *args):
        """Auto feed all inhabitants."""
        # Feed all inhabitants including player
        for person in self.people.values():
            if person.alive and self.global_inventory.get('food', 0) > 0:
                person.hunger = max(0, person.hunger - 20)
                self.global_inventory['food'] -= 1
        
        # Feed player
        if self.global_inventory.get('food', 0) > 0:
            self.player.hunger = max(0, self.player.hunger - 20)
            self.global_inventory['food'] -= 1
        
        # Give water to all inhabitants including player
        for person in self.people.values():
            if person.alive and self.global_inventory.get('water', 0) > 0:
                person.thirst = max(0, person.thirst - 20)
                self.global_inventory['water'] -= 1
        
        # Give water to player
        if self.global_inventory.get('water', 0) > 0:
            self.player.thirst = max(0, self.player.thirst - 20)
            self.global_inventory['water'] -= 1
        
        return self

    def action_feed_person(self, *args):
        """Feed a specific person."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name == 'player':
                if self.global_inventory.get('food', 0) > 0:
                    self.player.hunger = max(0, self.player.hunger - 20)
                    self.global_inventory['food'] -= 1
                    return self
            elif person_name in self.people:
                if self.people[person_name].alive and self.global_inventory.get('food', 0) > 0:
                    self.people[person_name].hunger = max(0, self.people[person_name].hunger - 20)
                    self.global_inventory['food'] -= 1
                    return self
        return self

    def action_drink_person(self, *args):
        """Give water to a specific person."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name == 'player':
                if self.global_inventory.get('water', 0) > 0:
                    self.player.thirst = max(0, self.player.thirst - 20)
                    self.global_inventory['water'] -= 1
                    return self
            elif person_name in self.people:
                if self.people[person_name].alive and self.global_inventory.get('water', 0) > 0:
                    self.people[person_name].thirst = max(0, self.people[person_name].thirst - 20)
                    self.global_inventory['water'] -= 1
                    return self
        return self

    def action_scavenge(self, *args):
        """Send a person out scavenging."""
        if len(args) >= 2:
            person_name = args[0]
            days = int(args[1])
            
            if person_name == 'player':
                if not self.player.is_scavenging:
                    self.player.is_scavenging = True
                    self.player.scavenge_target_days = days
                    self.player.scavenge_days = 0
                    return self
            elif person_name in self.people:
                if not self.people[person_name].is_scavenging:
                    self.people[person_name].is_scavenging = True
                    self.people[person_name].scavenge_target_days = days
                    self.people[person_name].scavenge_days = 0
                    return self
        return self

    def action_return_from_scavenge(self, *args):
        """Return a person from scavenging."""
        if len(args) >= 1:
            person_name = args[0]
            
            if person_name == 'player':
                if self.player.is_scavenging:
                    # Generate loot based on stats and time spent
                    loot = self.generate_scavenge_loot(self.player, self.player.scavenge_days)
                    # Handle different inventory types
                    if isinstance(self.player.inventory, list):
                        self.player.inventory.extend(loot)
                    else:
                        # Convert dict inventory to list for consistency
                        if not hasattr(self.player, '_inventory_list'):
                            self.player._inventory_list = []
                        self.player._inventory_list.extend(loot)
                    self.player.is_scavenging = False
                    self.player.scavenge_days = 0
                    self.player.scavenge_target_days = 0
                    return self
            elif person_name in self.people:
                if self.people[person_name].is_scavenging:
                    # Generate loot based on stats and time spent
                    loot = self.generate_scavenge_loot(self.people[person_name], self.people[person_name].scavenge_days)
                    self.people[person_name].inventory.extend(loot)
                    self.people[person_name].is_scavenging = False
                    self.people[person_name].scavenge_days = 0
                    self.people[person_name].scavenge_target_days = 0
                    return self
        return self

    def generate_scavenge_loot(self, person, days_spent):
        """Generate loot based on person's stats and time spent scavenging."""
        loot = []
        
        # Base loot chance increases with time spent
        base_chance = min(0.3 + (days_spent * 0.1), 0.8)
        
        # Perception affects finding better items
        perception_bonus = person.stats['P'] * 0.05
        # Luck affects rare item chance
        luck_bonus = person.stats['L'] * 0.03
        
        # Generate random loot
        for _ in range(randint(1, 3 + days_spent)):
            if randint(1, 100) <= (base_chance + perception_bonus + luck_bonus) * 100:
                item_type = randint(1, 10)
                
                if item_type <= 3:  # Junk items
                    junk_items = ['Screws', 'Springs', 'Gears', 'Circuit Board', 'Aluminum Can', 'Glass Bottle']
                    loot.append({'type': 'junk', 'name': junk_items[randint(0, len(junk_items)-1)], 'rarity': 'common'})
                elif item_type <= 5:  # Caps
                    caps_amount = randint(5, 25 + (person.stats['L'] * 2))
                    loot.append({'type': 'caps', 'amount': caps_amount})
                elif item_type <= 7:  # Medical supplies
                    if randint(1, 100) <= 20 + (person.stats['I'] * 5):
                        loot.append({'type': 'medical', 'name': 'Stimpak'})
                    else:
                        loot.append({'type': 'medical', 'name': 'RadAway'})
                elif item_type <= 9:  # Weapons (rare)
                    if randint(1, 100) <= 10 + (person.stats['P'] * 3):
                        weapons = ['Pipe Pistol', 'Rusty Knife', 'Baseball Bat']
                        loot.append({'type': 'weapon', 'name': weapons[randint(0, len(weapons)-1)], 'damage': f"{randint(3, 8)}-{randint(8, 15)}"})
                else:  # Armor (very rare)
                    if randint(1, 100) <= 5 + (person.stats['P'] * 2):
                        armors = ['Leather Armor', 'Raider Armor', 'Lab Coat']
                        loot.append({'type': 'armor', 'name': armors[randint(0, len(armors)-1)], 'bonus': {'Endurance': randint(1, 3)}})
        
        return loot

    def action_coitus(self, *args):
        """Have two adults try for a child."""
        if len(args) >= 2:
            person1_name = args[0]
            person2_name = args[1]
            if (person1_name in self.people and person2_name in self.people and
                self.people[person1_name].alive and self.people[person2_name].alive):
                if randint(1, 10) == 1:  # 10% chance
                    new_person = SimplePerson("Child", "M" if randint(0, 1) == 0 else "F")
                    self.people[f"Child_{len(self.people)}"] = new_person
        return self

    def action_build_room(self, *args):
        """Build a room."""
        room_name = args[0] if args else "living"
        if room_name in self.rooms and not self.rooms[room_name]['built']:
            if self.global_inventory.get('steel', 0) >= 5:
                self.rooms[room_name]['built'] = True
                self.global_inventory['steel'] -= 5
                self.action_points -= 10
        return self

    def action_fix_room(self, *args):
        """Fix a room."""
        room_name = args[0] if args else "living"
        if room_name in self.rooms and self.rooms[room_name]['built']:
            self.action_points -= 5
        return self

    def action_heal(self, *args):
        """Heal an inhabitant."""
        if len(args) >= 1:
            person_name = args[0]
            if person_name in self.people and self.global_inventory.get('medkit', 0) > 0:
                self.people[person_name].health = min(100, self.people[person_name].health + 30)
                self.global_inventory['medkit'] -= 1
                return self
        return self

    def action_quit(self, *args):
        """Quit the game and return to main screen."""
        return {'quit': True, 'message': 'Game ended. Returning to main screen.'}

    def action_toggle_auto_feed(self, *args):
        """Toggle auto-feed on/off."""
        self.auto_feed_enabled = not self.auto_feed_enabled
        return {'success': True, 'message': f'Auto-feed is now {"enabled" if self.auto_feed_enabled else "disabled"}'}

    def action_transfer_item(self, *args):
        """Transfer an item from global inventory to player inventory."""
        if len(args) >= 2:
            item_name = args[0]
            quantity = int(args[1])
            
            if item_name in self.global_inventory and self.global_inventory[item_name] >= quantity:
                self.global_inventory[item_name] -= quantity
                if item_name in self.player.inventory:
                    self.player.inventory[item_name] += quantity
                else:
                    self.player.inventory[item_name] = quantity
                return {'success': True, 'message': f'Transferred {quantity} {item_name}(s) from global to player inventory.'}
            else:
                return {'error': f'Not enough {item_name} in global inventory to transfer.'}
        return {'error': 'Invalid transfer parameters.'}

class SimplePlayer:
    """Simplified player class with detailed inventory and stats."""
    def __init__(self, name, father_surname, mother_surname, gender):
        self.name = f"{name} {father_surname}"
        self.age = 21
        self.gender = gender
        self.hunger = 0
        self.thirst = 0
        self.health = 100
        self.radiation = 0
        self.assigned_room = None
        
        # SPECIAL stats (Fallout-style)
        self.stats = {
            'S': randint(1, 10),  # Strength
            'P': randint(1, 10),  # Perception
            'E': randint(1, 10),  # Endurance
            'C': randint(1, 10),  # Charisma
            'I': randint(1, 10),  # Intelligence
            'A': randint(1, 10),  # Agility
            'L': randint(1, 10)   # Luck
        }
        
        # Equipped items
        self.equipped = {
            'weapon': None,
            'armor': None,
            'outfit': None
        }
        
        # Personal inventory (limited capacity)
        self.inventory = []
        self.inventory_capacity = 25  # Player gets slightly more capacity
        
        # Medical supplies
        self.stimpaks = 2  # Player starts with some medical supplies
        self.radaways = 1
        
        # Scavenging status
        self.is_scavenging = False
        self.scavenge_days = 0
        self.scavenge_target_days = 0
        
        # Combat stats
        self.damage_resistance = 0
        self.rad_resistance = 0

class SimplePerson:
    """Simplified person class with detailed inventory and stats."""
    def __init__(self, name, gender):
        self.name = name
        self.age = 21
        self.gender = gender
        self.hunger = 0
        self.thirst = 0
        self.health = 100
        self.radiation = 0
        self.assigned_room = None
        self.alive = True
        
        # SPECIAL stats (Fallout-style)
        self.stats = {
            'S': randint(1, 10),  # Strength
            'P': randint(1, 10),  # Perception
            'E': randint(1, 10),  # Endurance
            'C': randint(1, 10),  # Charisma
            'I': randint(1, 10),  # Intelligence
            'A': randint(1, 10),  # Agility
            'L': randint(1, 10)   # Luck
        }
        
        # Equipped items
        self.equipped = {
            'weapon': None,
            'armor': None,
            'outfit': None
        }
        
        # Personal inventory (limited capacity)
        self.inventory = []
        self.inventory_capacity = 20
        
        # Medical supplies
        self.stimpaks = 0
        self.radaways = 0
        
        # Scavenging status
        self.is_scavenging = False
        self.scavenge_days = 0
        self.scavenge_target_days = 0
        
        # Combat stats
        self.damage_resistance = 0
        self.rad_resistance = 0 