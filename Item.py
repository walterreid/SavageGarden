"""Module containing all Item classes."""

from general_funcs import print_line, FAST, SLOW, NORMAL
import json
import sys
import os


def all_items():
    """Get a list of all items available in game.

    Returns:
    items -- list of all items
    """
    fn = "items.json"
    path = os.path.join(os.path.dirname(sys.argv[0]), fn)
    with open(path) as i:
        items = [item for item in json.loads(i.read())]
    return items


class Item(object):
    """Item class. Only used for on-the-fly cases, not storage."""

    def __init__(self, name):
        """Item constructor.

        Arguments:
        name -- name of item
        """
        # Just needs to get the name, all other attributes are automatically
        # assigned by the following lines, from parsing an item.json file.
        self.name = name
        with open('items.json') as f:
            parsed = json.loads(f.read())
            try:
                item = parsed[self.name]
                self.value = item['value']
                self.weight = item['weight']
                self.components = item['components']
                self.rarity = item['rarity']
            except KeyError:
                print("Unknown item. This is a bug. Please contact the dev.")
        # Keeps track of whether item has been scrapped by player.
        self.scrapped = False

    def print_(self, count):
        """Print item name and attributes.

        Arguments:
        count -- amount of item held
        """
        att = " | {}: {}"
        print_line(
            "{} * {}".format(self.name, count),
            att.format("Weight", self.weight),
            att.format("Value", self.value),
            att.format("Rarity", self.rarity),
            att.format("Components", self.components),
            end="",
            speed=FAST)
        print()

    def count_component(self, component):
        """Count number of components in Item.

        Arguments:
        component -- component to count
        """
        return self.components.count(str(component))

    def scrap(self):
        """Destroy Item and add its components to inventory."""
        print_line(self.name, " has been scrapped and these")
        for item in self.components:
            inventory[item] += 1
            print_line(item)
        print_line("have been added to your inventory")

        chance = randint(0, 101)
        if (player.scrapper) * 3 > chance:
            print_line(
                "Your scrapper skill has allowed you to gain more components!")
            # Randomly adds extra component of the scrapped item the inventory.
            inventory[self.components[randint(len(self.components))]] += 1
        self.destroy("player")


class Inventory(dict):
    """Inventory class, inherits dict attributes."""

    def __init__(self, items=[]):
        """Inventory class constructor, sets values to 0."""
        for item in items:
            self[item] = 0
            
    def print_(self):
        """Print all items in inventory."""
        for item in self:
            if self[item] > 0:
                Item(item).print_(self[item])
