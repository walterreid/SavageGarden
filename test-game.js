// Test system for Savage Garden JavaScript Game Engine
class GameTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    // Add a test
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    // Assert helper
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    // Run all tests
    runTests() {
        console.log('🧪 Running Game Tests...\n');
        
        for (const test of this.tests) {
            try {
                test.testFunction();
                console.log(`✅ PASS: ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ FAIL: ${test.name}`);
                console.log(`   Error: ${error.message}`);
                this.failed++;
            }
        }
        
        console.log(`\n📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
        
        if (this.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('⚠️  Some tests failed. Check the errors above.');
        }
    }
}

// Create test suite
const tester = new GameTester();

// Test 1: Game Initialization
tester.test('Game Initialization', () => {
    const game = new SimpleWebGameEngine();
    
    tester.assert(game.player, 'Player should be created');
    tester.assert(game.player.name === 'Walter', 'Player name should be Walter');
    tester.assert(game.people, 'People object should exist');
    tester.assert(Object.keys(game.people).length === 5, 'Should have 5 initial inhabitants');
    tester.assert(game.rooms, 'Rooms object should exist');
    tester.assert(Object.keys(game.rooms).length === 4, 'Should have 4 initial rooms');
    tester.assert(game.caps === 100, 'Should start with 100 caps');
    tester.assert(game.happiness === 100, 'Should start with 100 happiness');
    tester.assert(game.actionPoints === 50, 'Should start with 50 action points');
});

// Test 2: Room Structure
tester.test('Room Structure', () => {
    const game = new SimpleWebGameEngine();
    
    const expectedRooms = ['living', 'generator', 'water', 'kitchen'];
    for (const roomName of expectedRooms) {
        tester.assert(game.rooms[roomName], `Room ${roomName} should exist`);
        tester.assert(game.rooms[roomName].built === true, `Room ${roomName} should be built`);
    }
    
    // Check specific room properties
    tester.assert(game.rooms.living.produce === 'happiness', 'Living room should produce happiness');
    tester.assert(game.rooms.generator.produce === 'watt', 'Generator should produce watt');
    tester.assert(game.rooms.water.produce === 'water', 'Water room should produce water');
    tester.assert(game.rooms.kitchen.produce === 'food', 'Kitchen should produce food');
});

// Test 3: Inhabitant Creation
tester.test('Inhabitant Creation', () => {
    const game = new SimpleWebGameEngine();
    
    for (const [name, person] of Object.entries(game.people)) {
        tester.assert(person.name, 'Person should have a name');
        tester.assert(person.gender === 'M' || person.gender === 'F', 'Person should have valid gender');
        tester.assert(person.health >= 0 && person.health <= 100, 'Health should be between 0-100');
        tester.assert(person.hunger >= 0 && person.hunger <= 100, 'Hunger should be between 0-100');
        tester.assert(person.thirst >= 0 && person.thirst <= 100, 'Thirst should be between 0-100');
        tester.assert(person.stats, 'Person should have SPECIAL stats');
        tester.assert(person.equipped, 'Person should have equipped items');
        tester.assert(person.inventory, 'Person should have inventory');
        tester.assert(person.stimpaks >= 0, 'Person should have stimpaks');
        tester.assert(person.radaways >= 0, 'Person should have radaways');
    }
});

// Test 4: Action System
tester.test('Action System', () => {
    const game = new SimpleWebGameEngine();
    
    // Test valid actions
    const validActions = ['quit', 'skip', 'auto assign all', 'auto feed all', 'feed', 'drink', 'scavenge', 'trade'];
    for (const action of validActions) {
        tester.assert(game.actions[action], `Action ${action} should exist`);
    }
    
    // Test invalid action
    const result = game.performAction('invalid_action');
    tester.assert(result.error, 'Invalid action should return error');
});

// Test 5: Game State
tester.test('Game State', () => {
    const game = new SimpleWebGameEngine();
    const gameState = game.getGameState();
    
    tester.assert(gameState.player, 'Game state should have player');
    tester.assert(gameState.people, 'Game state should have people');
    tester.assert(gameState.rooms, 'Game state should have rooms');
    tester.assert(gameState.resources, 'Game state should have resources');
    tester.assert(gameState.globalInventory, 'Game state should have global inventory');
    tester.assert(gameState.playerInventory, 'Game state should have player inventory');
});

// Test 6: Basic Actions
tester.test('Basic Actions', () => {
    const game = new SimpleWebGameEngine();
    
    // Test skip action
    const skipResult = game.performAction('skip');
    tester.assert(skipResult.success || skipResult.error, 'Skip action should return result');
    
    // Test auto feed action
    const feedResult = game.performAction('auto feed all');
    tester.assert(feedResult.success || feedResult.error, 'Auto feed action should return result');
});

// Test 7: Person Actions
tester.test('Person Actions', () => {
    const game = new SimpleWebGameEngine();
    const personName = Object.keys(game.people)[0];
    
    // Test feed action
    const feedResult = game.performAction('feed', personName);
    tester.assert(feedResult.success || feedResult.error, 'Feed action should return result');
    
    // Test drink action
    const drinkResult = game.performAction('drink', personName);
    tester.assert(drinkResult.success || drinkResult.error, 'Drink action should return result');
});

// Test 8: Inventory System
tester.test('Inventory System', () => {
    const game = new SimpleWebGameEngine();
    
    tester.assert(game.globalInventory, 'Global inventory should exist');
    tester.assert(game.player.inventory, 'Player inventory should exist');
    
    // Check that inventories are objects
    tester.assert(typeof game.globalInventory === 'object', 'Global inventory should be an object');
    tester.assert(typeof game.player.inventory === 'object', 'Player inventory should be an object');
});

// Test 9: Room Assignment
tester.test('Room Assignment', () => {
    const game = new SimpleWebGameEngine();
    const availableRooms = game.getAvailableRoomsForAssignment();
    
    tester.assert(Array.isArray(availableRooms), 'Available rooms should be an array');
    tester.assert(availableRooms.length > 0, 'Should have available rooms');
    
    for (const room of availableRooms) {
        tester.assert(room.name, 'Room should have a name');
        tester.assert(room.built, 'Room should be built');
        tester.assert(typeof room.assignedCount === 'number', 'Room should have assigned count');
    }
});

// Test 10: Game Persistence
tester.test('Game Persistence', () => {
    const game = new SimpleWebGameEngine();
    
    // Test save/load
    saveGame();
    const loadedGame = loadGame();
    
    tester.assert(loadedGame, 'Game should load successfully');
    tester.assert(loadedGame.player, 'Loaded game should have player');
    tester.assert(loadedGame.people, 'Loaded game should have people');
    tester.assert(loadedGame.rooms, 'Loaded game should have rooms');
});

// Run tests when this file is loaded
if (typeof window !== 'undefined') {
    // Browser environment
    window.runGameTests = () => {
        tester.runTests();
    };
    
    console.log('🧪 Game tests loaded. Run window.runGameTests() to execute tests.');
} else {
    // Node.js environment
    tester.runTests();
} 