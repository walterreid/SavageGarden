"""Module containing all Human classes."""

from general_funcs import print_line, SLOW, FAST, NORMAL
from Item import Inventory, all_items

class Human(object):
    """Basic class for all humans in game."""

    def __init__(
            self, first_name=None, day_of_birth=0,
            parent_1=None, parent_2=None, age=0, gender='M', surname=None):
        """Constructor for Human class.

        Arguments:
        first_name -- first name of Human
        day_of_birth -- day Human was born
        parent_1 -- name of Human's father
        parent_2 -- name of Human's mother
        age -- age of Human
        gender -- gender of Human
        """
        self.alive = True
        self.name = first_name  # First name
        self.day_of_birth = day_of_birth
        self.parent_1 = parent_1 #Object
        self.parent_2 = parent_2 #Object
        self.age = age 
        self.gender = gender.upper()
        self.hunger = 0
        self.thirst = 0
        self.job = "" #eg trader, mechanic, hunter, farmer etc.
        self.inventory = Inventory(all_items())
        try:
            self.surname = self.parent_1.surname
        except:
            self.surname = surname
        self.partner = ""

        # The stats of the person. Affects the production of
        # room the person has been assigned to.
        self.stats = {"strength": 1,
                      "perception": 1,
                      "endurance": 1,
                      "charisma": 1,
                      "intelligence": 1,
                      "luck": 1
                     }
        
        self.assigned_room = ""  # Keeps track of where person is working.
        self.children = []  # List of all children's names.
        self.partner = "" #Significant other's name.
        self.level = 1  # Determines production efficiency.
        self.XP = 0

    def __str__(self):
        """String representation of object, first name and last name.

        Returns:
        str -- "Firstname Lastname"
        """
        return "{} {}".format(self.name.title(), self.surname.title())

    def print_(self):
        """Print name and attributes."""
        print_line("\n")
        print_line(
            self,
            "\n  Age:  {}".format(self.age) +
            "  Gender: {}".format(self.gender) +
            "  Hunger: {}".format(self.hunger) +
            "  Thirst: {}".format(self.thirst) +
            "  Room:   {}".format(self.assigned_room), 
            speed = FAST)
        for stat in self.stats.keys():
            print_line("   " + stat + " : " + str(self.stats[stat]))
        print_line("\n")
        
    def see_stats(self):
        """Check stats of inhabitant."""
        for stat in self.stats:
            print_line("{}: {}".format(stat, self.stats[stat]))
  
    def feed(self, amount):
        """Reduce hunger level of inhabitant.

        Arguments:
        amount -- how much to feed inhabitant
        """
        self.hunger -= amount
        if self.hunger < 0:
            self.hunger = 0

    def drink(self, amount):
        """Reduce thirst level of inhabitant.

        Arguments:
        amount -- how much to feed inhabitant
        """
        self.thirst -= amount
        if self.thirst < 0:
            self.thirst = 0
    
    def level_up(self):
        """Level up Human and ask player for input on what stat to level up."""
        print_line("{} has gained enough experience to level up!!!".format(self))
        self.see_stats()
        self.level += 1
        choice_dict = {
            'strength':self.stats["strength"],
            'perception':self.stats["perception"],
            'endurance':self.stats["endurance"],
            'charisma':self.stats["charisma"],
            'intelligence':self.stats["intelligence"], 
            'luck':self.stats["luck"]
            }
        #This method is overridden and super() is called by both subclasses of the Human class.
            
    def check_xp(self):
        """Check experience of inhabitant is enough to level up.

        Returns:
        bool -- whether or not Human can level up"""
        # Xp needed to level up increases exponentially
        xp_needed = 10 + (2**self.level)
        if self.XP >= xp_needed:
            return True
        else:
            return False
            
    def gain_xp(self, amount):
        """Increase experience of person. If they have enough to level 
        up, they do.
        
        Arguments:
        amount -- amount to level up by
        """
        self.XP += amount
        while self.check_xp():
            self.level_up()
            
    def max_HP(self):
        """Determines the maximum amount of natural health the person 
        can have, depending on level and gear equppied.
        
        Returns:
        max_HP -- The maximum amount of health. Base is 100.
        """
        
        max_HP = 100 + (10*self.level)
        max_HP += 5*(self.stats["strength"])
        """ #Leave this until armour is implemeted in Item.py
        for item_name in self.inventory.keys():
            try:
                if self.inventory[item_name].is_armour:
                    max_HP += self.inventory[item_name].level 
        """
        return max_HP

    def heal(self, amount):
        """Heal Human.

        Arguments:
        amount -- amount of health to give
        """
        max_health = self.max_HP()
        self.HP += amount
        if self.HP > max_health:  # Truncates health
            self.HP = max_health
        print_line("{} has healed and now has {} health \
        points".format(str(self), self.HP)) 
        
    def rebirth(self):
        """Don't know if I'll ever use this."""
        self.age = 0
        if self.gender == "m":
            print_line(
                self.name +
                " has been reborn and his stats have been reset")
        else:
            print_line(
                self.name +
                " has been reborn and her stats have been reset")
        self.stats["strength"] = self.perception = self.endurance =  1
        self.stats["charisma"] = self.luck = self.intelligence = 1

    def mature(self, person):
        """Increment Human's age.

        Arguments:
        person -- Human who's aging
        """
        person.age += 1
        print_line("{} has matured and is now {} years old!" \
        .format(self, self.age))

    def take_damage(self, amount):
        """Take health from Human.

        Arguments:
        amount -- amount of health to take
        """
        self.defense = self.stats["strength"] * 10
        damage_taken = amount - self.defense
        if damage_taken < 1:
            damage_taken = 0
        else:
            self.HP -= damage_taken
            if self.HP < 1:
                self.die()
    
    def increase_hunger(self, amount):
        """Increase hunger level of Human by certain amount
        
        Arguments:
        amount -- amount of hunger to increase by
        """
        self.hunger += amount
    
    def increase_thirst(self, amount):
        """Increase thirst level of Human by certain amount
        
        Arguments:
        amount -- amount of thirst to increase by
        """
        self.thirst += amount
    
    def scavenge(self, days=10):
        """Send inhabitant on scavenging mission.

        Arguments:
        days -- ask user for number of days if this is 'days'.
        """
        self.current_activity = "scavenging"
        if not (isinstance(days, int)) or days <= 0:
            person.days_to_scavenge_for = 10
        else:
            person.days_to_scavenge_for = days

    def can_mate(self):
        """Check if Human meets requirements to have children.

        Returns:
            bool -- whether or not human can mate
        """
        if self.age < 18:
            return False
        if len(self.children) > 5:  # Upper limit of children is 5
            return False
        # Have to wait for a year before parent can have child again.
        for child in self.children:
            if people(child).age < 1:
                return False
        return True

    def die(self, cause = ""):
        """Kill self, and unassign from a assigned room.
            #Should make this a method of the main game.
        Arguments:
        game -- main game object
        cause -- cause of death
        """
        print_line("{} has died of {}!".format(self, cause))
        if not isinstance(self, Player):
            pass
        else:
            self.alive = False


class NPC(Human):
    """NPC class, inherits Human attributes."""

    def __init__(
            self, first_name, day_of_birth,
            parent_1, parent_2, age, gender, surname=None):
        """NPC class constructor.

        Arguments:
        first_name -- first name of NPC
        day_of_birth -- day NPC was born on
        parent_1 -- father
        parent_2 -- mother
        age -- age of NPC
        gender -- gender of NPC
        """
        Human.__init__(
            self, first_name, day_of_birth,
            parent_1, parent_2, age, gender, surname)
        self.current_activity = ""
        self.days_active = 0
        self.activity_limit = 0
        self.scavenging = False
        self.days_scavenging = 0
        self.days_to_scavenge_for = 0
    
    def level_up(self):
        super().level_up()
        for stat in choice_dict.keys():
            print_line(" {}".format(stat), end = " ")
        choice = input("Please choose an attribute to level up: ")
        choice.lower()
        if choice in choice_dict:
            choice_dict[choice] += 1
        else:
            print_line("\nInvalid choice.\n")
            self.level -= 1
            self.level_up()

class Player(Human):
    """Player class, inherits Human attributes."""

    def __init__(
            self, first_name=None, day_of_birth=0,
            parent_1=None, parent_2=None, age=21, gender='M'):
        """Player class constructor.

        Arguments:
        first_name -- first name of Player
        day_of_birth -- day Player was born
        parent_1 -- father
        parent_2 -- mother
        age -- age of player
        gender -- gender of player
        """
        Human.__init__(
            self, first_name, day_of_birth,
            parent_1, parent_2, age, gender)
        player_stats = ["medic", "crafting", "tactician", "cooking",
                        "barter", "inspiration", "scrapper",
                        "electrician"]
        for stat in player_stats: #Adds player specific stats to stat 
            # dict
            self.stats[str(stat)] = 0
        """
        self.medic = 0  # Improves healing capabilities of stimpacks
        self.crafting = 0  # Chance to not use components when crafting.
        self.tactician = 0  # Boosts defense.
        self.cooking = 0  # Boosts production level of kitchen.
        self.barter = 0  # Increases selling prices, decreases buying prices.
        self.inspiration = 0  # Boosts production and defense.
        self.scrapper = 0  # Boosts chance of bonus components when scrapping.
        self.electrician = 0  # Boosts power production
        """
        
    def level_up(self):
        super().level_up()
        print_line("\n")
        print_line("You can level up any of these attributes: ")
        for stat in choice_dict.keys():
            print_line(" {}".format(stat), end = " ")
        choice = input("Please choose an attribute to level up: ")
        choice.lower()
        perks = ["medic", "crafting", "tactitian", "cooking",
                 "inspiration", "scrapper", "barter", "electrician"]
        #Perks specific to the player are added to the dictionary of
        #available choices
        for perk in perks:
            choice_dict[perk] = self.stats[perk]
        """ #Old choice_dict dictionary
        choice_dict = {
        'strength':self.stats["strength"], 'perception':self.stats["perception"],
        'endurance':self.stats["endurance"], 'charisma':self.stats["charisma"],
        'intelligence':self.stats["intelligence"], 'luck':self.stats["luck"],
        'medic':self.stats["medic"], 'crafting':self.stats["crafting"],
        'tactician':self.stats["tactician"], 'cooking':self.stats["cooking"],
        'inspiration':self.stats["inspiration"], 'scrapper':self.stats["scrapper"],
        'barter':self.stats["barter"], 'electrician':self.stats["electician"]
        }
        """
        if choice in choice_dict.keys():
            choice_dict[choice] += 1
        else:
            print_line("Invalid choice")
            self.level -= 1
            self.level_up()
