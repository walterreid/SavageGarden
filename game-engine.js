/**
 * JavaScript version of SimpleWebGameEngine
 * Replicates the Python game logic with localStorage persistence
 */

const ROOMS_DATA = {
    "living": {
        "risk": 0,
        "can_produce": false,
        "attribute" : "",
        "perk" : "",
        "produce" : "",
        "assigned_limit": 10,
        "extensions": 0,
        "components": [],
        "base_power_usage": 5,
        "power_per_extension": 2
    },
    "generator": {
        "risk": 2,
        "can_produce": true,
        "attribute" : "strength",
        "perk" : "electrician",
        "produce" : "watt",
        "assigned_limit": 3,
        "extensions": 0,
        "base_production": 8,
        "production_per_extension": 4,
        "components": ["steel", "steel", "steel", "steel"],
        "base_power_usage": 0,
        "power_per_extension": 0
    },
    "storage": {
        "risk": 0,
        "can_produce": false,
        "attribute" : "",
        "perk" : "",
        "produce" : "",
        "assigned_limit": 0,
        "extensions": 0,
        "components": ["steel", "steel"],
        "base_power_usage": 1,
        "power_per_extension": 1
    },
    "kitchen": {
        "risk": 1,
        "can_produce": true,
        "attribute" : "agility",
        "perk" : "cooking",
        "produce" : "food",
        "assigned_limit": 3,
        "extensions": 0,
        "base_production": 5,
        "production_per_extension": 2,
        "components": [],
        "base_power_usage": 10,
        "power_per_extension": 3
    },
    "trader": {
        "risk": 0,
        "can_produce": false,
        "attribute" : "",
        "perk" : "",
        "produce" : "",
        "assigned_limit": 1,
        "extensions": 0,
        "components": ["scrap", "scrap", "scrap", "steel", "steel"],
        "base_power_usage": 2,
        "power_per_extension": 1
    },
    "water": {
        "risk": 2,
        "can_produce": true,
        "attribute" : "perception",
        "perk" : "",
        "produce" : "water",
        "assigned_limit": 3,
        "extensions": 0,
        "base_production": 6,
        "production_per_extension": 2,
        "components": ["scrap", "scrap", "steel"],
        "base_power_usage": 10,
        "power_per_extension": 3
    },
    "radio": {
        "risk": 0,
        "can_produce": false,
        "attribute" : "",
        "perk" : "inspiration",
        "produce" : "",
        "assigned_limit": 2,
        "extensions": 0,
        "components": ["scrap", "scrap", "scrap", "steel", "steel"],
        "base_power_usage": 15,
        "power_per_extension": 5
    },
    "steel_mill": {
        "risk": 1,
        "can_produce": true,
        "attribute": "strength",
        "perk": "smelting",
        "produce": "steel",
        "assigned_limit": 2,
        "extensions": 0,
        "base_production": 2,
        "production_per_extension": 1,
        "components": ["scrap", "scrap", "scrap", "watt"],
        "base_power_usage": 8,
        "power_per_extension": 2,
        "conversion": { "input": ["scrap"], "output": ["steel"] }
    },
    "electronics_lab": {
        "risk": 2,
        "can_produce": true,
        "attribute": "intelligence",
        "perk": "electronics",
        "produce": "chip",
        "assigned_limit": 2,
        "extensions": 0,
        "base_production": 1,
        "production_per_extension": 1,
        "components": ["steel", "watt", "silicon"],
        "base_power_usage": 12,
        "power_per_extension": 3,
        "conversion": { "input": ["wire", "silicon"], "output": ["chip"] }
    },
    "workshop": {
        "risk": 2,
        "can_produce": true,
        "attribute": "agility",
        "perk": "crafting",
        "produce": "item",
        "assigned_limit": 2,
        "extensions": 0,
        "base_production": 1,
        "production_per_extension": 1,
        "components": ["steel", "watt"],
        "base_power_usage": 10,
        "power_per_extension": 2,
        "crafting": true
    }
};

const STARTUP_CONFIG = {
  "initialInventory": {
    "scrap": 10,
    "food": 10,
    "water": 10,
    "watt": 20,
    "steel": 5,
    "chip": 1,
    "medkit": 2,
    "stimpaks": 2,
    "radaways": 1
  },
  "initialPeople": [
    { "name": "Thompson", "gender": "M" },
    { "name": "Elenor", "gender": "F" },
    { "name": "Cole", "gender": "M" }
  ],
  "wandererArrival": {
    "minIntervalMs": 120000,
    "maxIntervalMs": 300000
  }
};

class SimpleWebGameEngine {
    constructor() {
        // Initialize global inventory from STARTUP_CONFIG
        this.globalInventory = JSON.parse(JSON.stringify(STARTUP_CONFIG.initialInventory));
        // Initialize rooms from ROOMS_DATA
        this.rooms = {};
        for (const [roomName, roomDef] of Object.entries(ROOMS_DATA)) {
            // Deep clone to avoid shared references
            this.rooms[roomName] = JSON.parse(JSON.stringify(roomDef));
            // Set built=true for starting rooms (living, generator, water, kitchen)
            this.rooms[roomName].built = ["living","generator","water","kitchen"].includes(roomName);
            this.rooms[roomName].assigned = false;
        }
        console.log('Rooms initialized:', Object.keys(this.rooms));
        
        // Initialize people from STARTUP_CONFIG
        this.people = {};
        for (const person of STARTUP_CONFIG.initialPeople) {
            this.people[person.name] = new SimplePerson(person.name, person.gender);
        }
        this.caps = 100;
        this.traderCaps = 500;
        this.happiness = 100;
        this.actionPoints = 50;
        this.defense = 0;
        this.security = "secure";
        this.days = 1;
        this.overuse = false;
        this.overuseAmount = 0;
        this.autoFeedEnabled = true;
        
        // Create initial inhabitants
        this.firstFew();
        
        // Initialize actions registry
        this.actions = {
            "quit": this.actionQuit.bind(this),
            "skip": this.actionSkip.bind(this),
            "auto assign all": this.actionAutoAssign.bind(this),
            "auto feed all": this.actionAutoFeedAll.bind(this),
            "toggle auto feed": this.actionToggleAutoFeed.bind(this),
            "feed": this.actionFeedPerson.bind(this),
            "drink": this.actionDrinkPerson.bind(this),
            "scavenge": this.actionScavengePerson.bind(this),
            "return": this.actionReturnFromScavengePerson.bind(this),
            "trade": this.actionTrade.bind(this),
            "craft": this.actionCraft.bind(this),
            "rush": this.actionRushRoom.bind(this),
            "assign": this.actionAssignPersonToRoom.bind(this),
            "unassign": this.actionUnassign.bind(this),
            "coitus": this.actionCoitus.bind(this),
            "build": this.actionBuildRoom.bind(this),
            "fix": this.actionFixRoom.bind(this),
            "heal": this.actionHeal.bind(this),
            "transfer": this.actionTransferItem.bind(this),
            "remove dead": this.actionRemoveDeadPerson.bind(this),
            "extend": this.actionExtendRoom.bind(this)
        };
        
        // Real-time game loop properties
        this.lastUpdated = Date.now();
        this.dayStartTime = Date.now();
        this.dayDuration = 360000; // 6 minutes in milliseconds
        this.tickInterval = 5000; // 5 seconds - status updates every 5 seconds
        this.lastTick = Date.now();
        this.isGameRunning = false;
        this.gameLoopId = null;
        
        // Scavenge mission tracking
        this.activeScavengeMissions = new Map(); // personName -> mission data
        
        // Wanderer arrival logic
        this.wandererCheckInterval = 5000; // 5 seconds
        this.wandererMinDelay = STARTUP_CONFIG.wandererArrival.minIntervalMs; // 3 min
        this.wandererMaxDelay = STARTUP_CONFIG.wandererArrival.maxIntervalMs; // 5 min
        this.lastWandererTime = Date.now();
        this.wandererWindowOpen = false;
        this.wandererWindowStart = null;
        this.wandererWindowEnd = null;
        this.pendingWanderer = null;
        
        // Start the game loop
        this.startGameLoop();
    }

    startGameLoop() {
        if (this.isGameRunning) return;
        
        this.isGameRunning = true;
        this.gameLoop();
    }

    stopGameLoop() {
        this.isGameRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    gameLoop() {
        if (!this.isGameRunning) return;
        
        const now = Date.now();
        
        // Check for tick events (every 5 seconds) - status updates and hunger/thirst
        if (now - this.lastTick >= this.tickInterval) {
            this.processTick();
            this.lastTick = now;
        }
        
        // Check for day completion (every 6 minutes)
        if (now - this.dayStartTime >= this.dayDuration) {
            this.completeDay();
            this.dayStartTime = now;
        }
        
        // Process scavenge missions
        this.updateScavengeMissions();
        
        // Wanderer arrival logic
        this.handleWandererArrival(now);
        
        // Handle living quarters birth
        this.handleLivingQuartersBirth(now);
        
        // Save game state periodically
        if (now % 30000 < 16) { // Every ~30 seconds
            this.saveGameState();
        }
        
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }

    handleWandererArrival(now) {
        // If a wanderer is pending, do nothing
        if (this.pendingWanderer) return;
        // If no living room or no available slot, do nothing
        const livingRoom = this.rooms['living'];
        if (!livingRoom || this.getLivingRoomCapacity() <= this.getPopulation()) return;
        // Calculate time since last wanderer event
        const sinceLast = now - this.lastWandererTime;
        // If not yet in window, check if 3 min passed
        if (!this.wandererWindowOpen) {
            if (sinceLast >= this.wandererMinDelay) {
                this.wandererWindowOpen = true;
                this.wandererWindowStart = now;
                this.wandererWindowEnd = now + (this.wandererMaxDelay - this.wandererMinDelay);
            } else {
                return; // Not yet eligible
            }
        }
        // If in window (3-5 min), check every 5s for 5% chance
        if (this.wandererWindowOpen) {
            // Only check every 5s
            if (!this.lastWandererCheck || now - this.lastWandererCheck >= this.wandererCheckInterval) {
                this.lastWandererCheck = now;
                // If window expired (5 min since last), reset for another 3 min
                if (now >= this.wandererWindowEnd) {
                    this.wandererWindowOpen = false;
                    this.lastWandererTime = now;
                    return;
                }
                // 5% chance
                if (Math.random() < 0.05) {
                    this.tryTriggerWandererArrival();
                    this.wandererWindowOpen = false;
                    this.lastWandererTime = now;
                }
            }
        }
    }

    processTick() {
        console.log('Game tick processed');
        
        // Process hunger/thirst for all people
        for (const person of Object.values(this.people)) {
            if (person.alive) {
                // Increase hunger and thirst slightly
                const oldHunger = person.hunger;
                const oldThirst = person.thirst;
                person.hunger = Math.min(100, person.hunger + 0.5);
                person.thirst = Math.min(100, person.thirst + 0.3);
                
                // Log significant changes
                if (Math.floor(person.hunger) !== Math.floor(oldHunger) || Math.floor(person.thirst) !== Math.floor(oldThirst)) {
                    console.log(`👤 ${person.name}: Hunger ${oldHunger.toFixed(1)} → ${person.hunger.toFixed(1)}, Thirst ${oldThirst.toFixed(1)} → ${person.thirst.toFixed(1)}`);
                }
            }
        }
        
        // Process room production
        for (const [roomName, room] of Object.entries(this.rooms)) {
            if (room.built && room.assigned) {
                const assignedPeople = Object.values(this.people).filter(p => p.assignedRoom === roomName);
                
                if (assignedPeople.length > 0) {
                    // Incremental production based on room type and production rate
                    const productionAmount = room.production || 1;
                    switch (room.produce) {
                        case 'food':
                            this.globalInventory.food = (this.globalInventory.food || 0) + productionAmount;
                            console.log(`🍽️ ${roomName} produced ${productionAmount} food. Total: ${this.globalInventory.food}`);
                            break;
                        case 'water':
                            this.globalInventory.water = (this.globalInventory.water || 0) + productionAmount;
                            console.log(`💧 ${roomName} produced ${productionAmount} water. Total: ${this.globalInventory.water}`);
                            break;
                        case 'watt':
                            this.globalInventory.watt = (this.globalInventory.watt || 0) + productionAmount;
                            console.log(`⚡ ${roomName} produced ${productionAmount} watts. Total: ${this.globalInventory.watt}`);
                            break;
                        case 'happiness':
                            this.happiness = Math.min(100, this.happiness + (productionAmount * 0.5));
                            console.log(`😊 ${roomName} produced ${productionAmount * 0.5} happiness. Total: ${this.happiness}`);
                            break;
                    }
                }
            }
        }
        
        // Auto-feed system (only when auto-feed is enabled)
        if (this.autoFeedEnabled) {
            this.processAutoFeed();
        }
        
        // Trigger UI update
        if (window.updateGameDisplay) {
            window.updateGameDisplay();
        }
    }

    processAutoFeed() {
        // Process all inhabitants
        const allPeople = Object.values(this.people);
        
        for (const person of allPeople) {
            if (!person || !person.alive) continue;
            
            // Check hunger - feed if above 60% and food is available
            if (person.hunger > 60 && this.globalInventory.food > 0) {
                const targetHunger = Math.random() * 5 + 5; // Random between 5-10%
                const hungerReduction = person.hunger - targetHunger;
                const foodNeeded = Math.ceil(hungerReduction / 20); // Each food reduces hunger by 20
                
                if (this.globalInventory.food >= foodNeeded) {
                    person.hunger = Math.max(0, person.hunger - (foodNeeded * 20));
                    this.globalInventory.food -= foodNeeded;
                    console.log(`${person.name} auto-fed ${foodNeeded} food (hunger: ${person.hunger.toFixed(1)}%)`);
                }
            }
            
            // Check thirst - drink if above 40% and water is available
            if (person.thirst > 40 && this.globalInventory.water > 0) {
                const targetThirst = Math.random() * 5 + 5; // Random between 5-10%
                const thirstReduction = person.thirst - targetThirst;
                const waterNeeded = Math.ceil(thirstReduction / 15); // Each water reduces thirst by 15
                
                if (this.globalInventory.water >= waterNeeded) {
                    person.thirst = Math.max(0, person.thirst - (waterNeeded * 15));
                    this.globalInventory.water -= waterNeeded;
                    console.log(`${person.name} auto-drank ${waterNeeded} water (thirst: ${person.thirst.toFixed(1)}%)`);
                }
            }
        }
    }

    completeDay() {
        console.log('Day completed!');
        this.days++;
        
        // Process day-end effects
        this.updateDay();
        
        // Trigger UI update
        if (window.updateGameDisplay) {
            window.updateGameDisplay();
        }
    }

    updateScavengeMissions() {
        const now = Date.now();
        
        for (const [personName, mission] of this.activeScavengeMissions) {
            const person = this.people[personName];
            if (!person) {
                console.warn(`Person ${personName} not found, removing from active missions`);
                this.activeScavengeMissions.delete(personName);
                continue;
            }
            
            // Skip processing if person is dead
            if (!person.alive) {
                console.log(`${personName} is dead, removing from active missions`);
                this.activeScavengeMissions.delete(personName);
                continue;
            }
            
            // Handle returning status
            if (mission.isReturning) {
                const returnTimeElapsed = now - mission.returnStartTime;
                mission.returnTimeElapsed = returnTimeElapsed;
                
                // Check if return journey is complete
                if (returnTimeElapsed >= mission.returnDuration) {
                    this.completeScavengeMission(personName, mission);
                    continue;
                }
                
                // Update return progress
                mission.returnProgress = returnTimeElapsed / mission.returnDuration;
                continue;
            }
            
            // Handle normal scavenging
            if (!person.isScavenging) {
                console.warn(`${personName} is not scavenging but in active missions, removing`);
                this.activeScavengeMissions.delete(personName);
                continue;
            }
            
            const timeElapsed = now - mission.startTime;
            
            // Update mission progress
            mission.timeElapsed = timeElapsed;
            
            // For indefinite missions (targetDays = 0), don't auto-complete
            if (mission.targetDays > 0) {
                const missionDuration = mission.targetDays * 24 * 60 * 60 * 1000; // Convert days to ms
                mission.progress = Math.min(1, timeElapsed / missionDuration);
                
                // Check if mission should complete
                if (timeElapsed >= missionDuration) {
                    this.completeScavengeMission(personName, mission);
                    continue;
                }
            } else {
                // For indefinite missions, progress is based on time elapsed (1 day = 100%)
                const oneDayMs = 24 * 60 * 60 * 1000;
                mission.progress = (timeElapsed / oneDayMs) % 1; // Keep progress between 0-1
            }
            
            // Generate random events only once per tick interval
            if (!mission.lastEventTime || (now - mission.lastEventTime) >= this.tickInterval) {
                if (Math.random() < 0.1) { // 10% chance per tick
                    try {
                        this.generateScavengeEvent(personName, mission);
                        mission.lastEventTime = now;
                    } catch (error) {
                        console.error(`Error generating scavenge event for ${personName}:`, error);
                        // Don't let errors crash the game loop
                    }
                }
            }
        }
    }

    generateScavengeEvent(personName, mission) {
        // Initialize mission state if not exists
        if (!mission.narrativeState) {
            mission.narrativeState = {
                currentLocation: null,
                locationTicks: 0,
                locationDuration: 0,
                hasIntro: false,
                lastEventTick: 0,
                lastEventType: null, // Track last event type to prevent duplicates
                isInsideBuilding: false,
                consecutiveQuietEvents: 0
            };
        }
        
        const state = mission.narrativeState;
        const person = this.people[personName];
        
        // Smart auto-use of medical supplies
        if (person && person.alive) {
            if (person.health < 70 && person.stimpaks > 0) {
                person.stimpaks--;
                person.health = Math.min(100, person.health + 25);
                this.addMissionLog(mission, `${personName} used a Stimpak to stabilize their wounds.`, 'medical');
            }
            if (person.radiation > 50 && person.radaways > 0) {
                person.radaways--;
                person.radiation = Math.max(0, person.radiation - 20);
                this.addMissionLog(mission, `${personName} injects a RadAway to flush out the toxins.`, 'medical');
            }
        }
        
        // Add narrative intro if not done yet
        if (!state.hasIntro) {
            const intros = [
                `${personName} walks out into the great unknown…`,
                `${personName} leaves the safety of the shelter and steps into the irradiated dusk.`,
                `${personName} disappears beyond the broken fence, gear in hand.`,
                `${personName} ventures into the wasteland, searching for supplies.`
            ];
            this.addMissionLog(mission, intros[Math.floor(Math.random() * intros.length)], 'narrative');
            state.hasIntro = true;
            state.isInsideBuilding = false;
            return;
        }
        
        // Prevent duplicate events in a row
        const now = Date.now();
        if (state.lastEventType && (now - state.lastEventTick) < 10000) { // 10 second cooldown
            return;
        }
        
        // Sparse timing - only 40% chance of events
        if (Math.random() > 0.4) {
            // Occasionally add quiet moments (only when outside buildings)
            if (Math.random() < 0.3 && !state.isInsideBuilding) {
                const quietMoments = [
                    `${personName} listens… but hears only wind.`,
                    `${personName} pauses to check their bearings.`,
                    `${personName} scans the horizon for threats.`
                ];
                
                // Prevent duplicate quiet events
                if (state.lastEventType !== 'quiet' || state.consecutiveQuietEvents < 2) {
                    this.addMissionLog(mission, quietMoments[Math.floor(Math.random() * quietMoments.length)], 'quiet');
                    state.lastEventType = 'quiet';
                    state.lastEventTick = now;
                    state.consecutiveQuietEvents = (state.lastEventType === 'quiet') ? state.consecutiveQuietEvents + 1 : 1;
                }
            }
            return;
        }
        
        // Add flavor refrains (10-20% chance) - only when outside buildings
        if (Math.random() < 0.15 && !state.isInsideBuilding) {
            const refrains = [
                `${personName} wanders the empty streets…`,
                `${personName} takes a cautious step off the main road…`,
                `${personName} moves quietly, searching for signs of life or salvage…`,
                `${personName} picks their way through the rubble…`
            ];
            this.addMissionLog(mission, refrains[Math.floor(Math.random() * refrains.length)], 'narrative');
            state.lastEventType = 'narrative';
            state.lastEventTick = now;
            state.consecutiveQuietEvents = 0;
            return;
        }
        
        // Location-based structure
        if (!state.currentLocation || state.locationTicks >= state.locationDuration) {
            // Start new location
            const locations = [
                { name: 'Apartment Building', duration: 3, type: 'building' },
                { name: 'School', duration: 4, type: 'building' },
                { name: 'Police Station', duration: 3, type: 'building' },
                { name: 'Ruined House', duration: 2, type: 'building' },
                { name: 'Parking Garage', duration: 3, type: 'building' },
                { name: 'Abandoned Store', duration: 2, type: 'building' },
                { name: 'Medical Clinic', duration: 3, type: 'building' },
                { name: 'Warehouse', duration: 4, type: 'building' }
            ];
            
            const location = locations[Math.floor(Math.random() * locations.length)];
            state.currentLocation = location;
            state.locationTicks = 0;
            state.locationDuration = location.duration;
            state.isInsideBuilding = (location.type === 'building');
            
            this.addMissionLog(mission, `${personName} approaches a ${location.name.toLowerCase()}…`, 'location');
            state.lastEventType = 'location';
            state.lastEventTick = now;
            state.consecutiveQuietEvents = 0;
            return;
        }
        
        // Generate events within current location
        state.locationTicks++;
        const location = state.currentLocation;
        
        const locationEvents = [
            // Search events (inside buildings)
            { type: 'search', message: `${personName} checks behind a loose wall panel…`, caps: 5, steel: 1 },
            { type: 'search', message: `${personName} searches through a filing cabinet…`, caps: 3, stimpaks: 1 },
            { type: 'search', message: `${personName} investigates a storage room…`, steel: 2, radaways: 1 },
            { type: 'search', message: `${personName} examines a broken vending machine…`, caps: 8 },
            
            // Combat events
            { type: 'combat', message: `${personName} is startled by a feral ghoul!`, health: -8, radiation: 0 },
            { type: 'combat', message: `${personName} fights off some raiders!`, health: -5, radiation: 0 },
            { type: 'combat', message: `${personName} encounters a hostile scavenger!`, health: -3, caps: 10 },
            
            // Radiation events
            { type: 'radiation', message: `${personName} stumbles into a glowing puddle…`, health: 0, radiation: 8 },
            { type: 'radiation', message: `${personName} passes through a radioactive area…`, health: 0, radiation: 5 },
            
            // Loot events
            { type: 'loot', message: `${personName} finds some scrap metal!`, steel: 3, caps: 5 },
            { type: 'loot', message: `${personName} discovers a medical cache!`, stimpaks: 1, radaways: 1 },
            { type: 'loot', message: `${personName} uncovers some pre-war supplies!`, caps: 15, steel: 2 }
        ];
        
        const event = locationEvents[Math.floor(Math.random() * locationEvents.length)];
        
        // Apply event effects
        if (person && person.alive) {
            // Ensure health is a valid number
            if (typeof person.health !== 'number' || isNaN(person.health)) {
                person.health = 100;
            }
            
            // Apply health changes
            if (event.health !== undefined && event.health !== 0) {
                person.health = Math.max(0, person.health + event.health);
                console.log(`${personName} health changed by ${event.health} to ${person.health}`);
            }
            
            // Apply radiation changes
            if (event.radiation !== undefined && event.radiation !== 0) {
                person.radiation = Math.min(100, person.radiation + event.radiation);
                console.log(`${personName} radiation changed by ${event.radiation} to ${person.radiation}`);
            }
            
            // Check for death
            if (person.health <= 0) {
                person.alive = false;
                person.isScavenging = false;
                person.isReturning = false;
                person.health = 0; // Ensure health is exactly 0
                
                // Add death log entry
                if (!mission.log) mission.log = [];
                mission.log.push({
                    timestamp: Date.now(),
                    message: `${personName} has died in the wasteland.`,
                    type: 'danger'
                });
                
                console.log(`${personName} has died during scavenging.`);
                return;
            }
            
            // Add found items to person's inventory
            if (event.caps) {
                person.caps = (person.caps || 0) + event.caps;
                console.log(`${personName} gained ${event.caps} caps (total: ${person.caps})`);
            }
            if (event.steel) {
                person.inventory.steel = (person.inventory.steel || 0) + event.steel;
                console.log(`${personName} gained ${event.steel} steel (total: ${person.inventory.steel})`);
            }
            if (event.stimpaks) {
                person.stimpaks = (person.stimpaks || 0) + event.stimpaks;
                console.log(`${personName} gained ${event.stimpaks} stimpaks (total: ${person.stimpaks})`);
            }
            if (event.radaways) {
                person.radaways = (person.radaways || 0) + event.radaways;
                console.log(`${personName} gained ${event.radaways} radaways (total: ${person.radaways})`);
            }
        }
        
        // Add to mission log
        this.addMissionLog(mission, event.message, event.type);
        
        // Add wound severity message after combat events
        if (event.type === 'combat' && event.health < 0) {
            const healthLoss = Math.abs(event.health);
            let woundMessage = '';
            
            if (healthLoss >= 8) {
                woundMessage = `${personName} is seriously wounded from the encounter.`;
            } else if (healthLoss >= 5) {
                woundMessage = `${personName} is moderately wounded from the fight.`;
            } else {
                woundMessage = `${personName} is lightly wounded from the skirmish.`;
            }
            
            // Add wound message after a short delay
            setTimeout(() => {
                this.addMissionLog(mission, woundMessage, 'wound');
            }, 1000);
        }
        
        // Check if location is complete and add transition
        if (state.locationTicks >= state.locationDuration) {
            const transitions = [
                `${personName} slips out of the building and back onto the road…`,
                `${personName} exits the structure and continues their journey…`,
                `${personName} leaves the area and moves on…`
            ];
            this.addMissionLog(mission, transitions[Math.floor(Math.random() * transitions.length)], 'transition');
            state.isInsideBuilding = false;
        }
        
        // Update state tracking
        state.lastEventType = event.type;
        state.lastEventTick = now;
        state.consecutiveQuietEvents = 0;
        
        console.log(`Scavenge event: ${event.message}`);
        
        // Trigger UI update to scroll mission logs
        if (window.gameUI && window.gameUI.scrollMissionLogsToBottom) {
            setTimeout(() => window.gameUI.scrollMissionLogsToBottom(), 50);
        }
    }

    addMissionLog(mission, message, type = 'event') {
        if (!mission.log) mission.log = [];
        mission.log.push({
            timestamp: Date.now(),
            message: message,
            type: type
        });
    }

    completeScavengeMission(personName, mission) {
        const person = this.people[personName];
        if (!person) return;
        
        // Generate final loot based on time spent
        const timeSpent = mission.isReturning ? 
            (mission.timeElapsed + mission.returnDuration) / (24 * 60 * 60 * 1000) : // Convert ms to days
            mission.timeElapsed / (24 * 60 * 60 * 1000);
        
        const loot = this.generateScavengeLoot(person, timeSpent);
        
        // Add loot to person's inventory
        for (const item of loot) {
            const itemName = item.name || item.toString();
            if (person.inventory[itemName]) {
                person.inventory[itemName] += 1;
            } else {
                person.inventory[itemName] = 1;
            }
        }
        
        // Return person from scavenging
        person.isScavenging = false;
        person.isReturning = false;
        person.scavengeDays = 0;
        person.scavengeTargetDays = 0;
        person.returnStartTime = null;
        person.returnDuration = null;
        
        // Remove from active missions
        this.activeScavengeMissions.delete(personName);
        
        console.log(`${personName} completed scavenge mission with loot:`, loot);
    }

    saveGameState() {
        const gameData = {
            people: this.people,
            rooms: this.rooms,
            caps: this.caps,
            traderCaps: this.traderCaps,
            happiness: this.happiness,
            actionPoints: this.actionPoints,
            defense: this.defense,
            security: this.security,
            days: this.days,
            overuse: this.overuse,
            overuseAmount: this.overuseAmount,
            autoFeedEnabled: this.autoFeedEnabled,
            globalInventory: this.globalInventory,
            lastUpdated: Date.now(),
            dayStartTime: this.dayStartTime,
            activeScavengeMissions: Array.from(this.activeScavengeMissions.entries()),
            pendingWanderer: this.pendingWanderer ? {
                name: this.pendingWanderer.name,
                gender: this.pendingWanderer.gender,
                stats: this.pendingWanderer.stats
            } : null
        };
        
        localStorage.setItem('savageGardenGame', JSON.stringify(gameData));
    }

    tryTriggerWandererArrival() {
        // Only trigger if there is space in the living room
        const living = this.rooms['living'];
        if (!living || !living.built) return;
        const assignedCount = Object.values(this.people).filter(p => p.alive && p.assignedRoom === 'living').length;
        const totalPeople = Object.values(this.people).filter(p => p.alive).length;
        if (totalPeople < (living.assigned_limit || 0)) {
            // Generate a new wanderer
            const names = ["Wanderer", "Stranger", "Nomad", "Survivor", "Traveler", "Scout", "Drifter", "Mara", "Jax", "Riley", "Morgan", "Ash", "Sky", "Blake", "Quinn"];
            const name = names[Math.floor(Math.random() * names.length)] + ' #' + (totalPeople + 1);
            const gender = Math.random() < 0.5 ? 'M' : 'F';
            const wanderer = new SimplePerson(name, gender);
            this.pendingWanderer = wanderer;
        }
    }

    firstFew() {
        const names = ["Thompson", "Elenor", "Codsworth", "Sharmak", "Luthor", "Marshall", "Cole", "Diven", "Davenport", "John", "Max", "Leth", "Exavor"];
        
        // Predefined equipment sets
        const equipmentSets = [
            {weapon: {name: 'Pipe Pistol', damage: '4-8'}, armor: {name: 'Leather Armor', bonus: {Endurance: 1}}, outfit: {name: 'Vault Suit'}},
            {weapon: {name: 'Rusty Knife', damage: '3-6'}, armor: {name: 'Raider Armor', bonus: {Endurance: 2}}, outfit: {name: 'Wasteland Gear'}},
            {weapon: null, armor: {name: 'Lab Coat', bonus: {Intelligence: 1}}, outfit: {name: 'Scientist Robes'}},
            {weapon: {name: 'Baseball Bat', damage: '5-10'}, armor: {name: 'Combat Armor', bonus: {Endurance: 3}}, outfit: {name: 'Military Fatigues'}},
            {weapon: null, armor: {name: 'Mercenary Gear', bonus: {Agility: 1}}, outfit: {name: 'Tactical Vest'}}
        ];
        
        console.log('Creating initial inhabitants...');
        for (let i = 0; i < 5; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const gender = Math.random() < 0.5 ? "M" : "F";
            const person = new SimplePerson(name, gender);
            
            // Give them some initial equipment
            const equipment = equipmentSets[i % equipmentSets.length];
            person.equipped = {...equipment};
            
            // Give them some basic medical supplies
            person.stimpaks = Math.floor(Math.random() * 3);
            person.radaways = Math.floor(Math.random() * 2);
            
            this.people[name] = person;
            console.log(`Created inhabitant: ${name} (${gender})`);
        }
        console.log('Total inhabitants created:', Object.keys(this.people).length);
    }

    getGameState() {
        const peopleData = {};
        for (const [name, person] of Object.entries(this.people)) {
            // Include all people, including dead ones, but mark them appropriately
            peopleData[name] = {
                name: person.name,
                age: person.age,
                gender: person.gender,
                health: person.alive ? (typeof person.health === 'number' ? person.health : 100) : 0, // Ensure health is a number
                hunger: typeof person.hunger === 'number' ? person.hunger : 0,
                thirst: typeof person.thirst === 'number' ? person.thirst : 0,
                radiation: typeof person.radiation === 'number' ? person.radiation : 0,
                room: person.assignedRoom,
                alive: person.alive,
                stats: person.stats,
                equipped: person.equipped,
                inventory: person.inventory,
                inventoryCapacity: person.inventoryCapacity,
                stimpaks: person.stimpaks,
                radaways: person.radaways,
                isScavenging: person.isScavenging,
                scavengeDays: person.scavengeDays,
                scavengeTargetDays: person.scavengeTargetDays,
                isReturning: person.isReturning,
                returnStartTime: person.returnStartTime,
                returnDuration: person.returnDuration,
                damageResistance: person.damageResistance,
                radResistance: person.radResistance
            };
        }
        
        const gameState = {
            people: peopleData,
            rooms: this.rooms,
            resources: {
                caps: this.caps,
                happiness: this.happiness,
                actionPoints: this.actionPoints,
                days: this.days,
                defense: this.defense,
                security: this.security,
                autoFeedEnabled: this.autoFeedEnabled
            },
            globalInventory: {...this.globalInventory},
            activeScavengeMissions: this.activeScavengeMissions,
            pendingWanderer: this.pendingWanderer ? {
                name: this.pendingWanderer.name,
                gender: this.pendingWanderer.gender,
                stats: this.pendingWanderer.stats
            } : null
        };
        
        console.log('Game state returned - People count:', Object.keys(peopleData).length);
        console.log('Game state returned - Rooms count:', Object.keys(this.rooms).length);
        
        return gameState;
    }

    getAvailableActions() {
        return Object.keys(this.actions);
    }

    getAvailableRoomsForAssignment() {
        const availableRooms = [];
        for (const [name, room] of Object.entries(this.rooms)) {
            if (room.built) {
                // Check if room has capacity
                let assignedCount = 0;
                for (const person of Object.values(this.people)) {
                    if (person.assignedRoom === name) {
                        assignedCount++;
                    }
                }

                
                // Living room has unlimited capacity for free sleeping
                const maxCapacity = room.freeSleeping ? Infinity : 2;
                
                if (assignedCount < maxCapacity) {
                    const roomInfo = {
                        name: name,
                        assignedCount: assignedCount,
                        maxCapacity: maxCapacity === Infinity ? 'Unlimited' : maxCapacity,
                        produce: room.produce,
                        production: room.production || 0,
                        freeSleeping: room.freeSleeping || false,
                        built: room.built,
                        assigned: room.assigned
                    };
                    availableRooms.push(roomInfo);
                }
            }
        }
        return availableRooms;
    }

    performAction(action, ...args) {
        console.log('Game engine performAction called with:', action, args);
        console.log('Available actions:', Object.keys(this.actions));
        
        if (!this.actions[action]) {
            console.log('Action not found:', action);
            return {error: `Invalid action: ${action}`};
        }
        
        console.log('Action found, executing:', action);
        try {
            const result = this.actions[action](...args);
            console.log('Action result:', result);
            if (result && typeof result === 'object' && result.quit) {
                return result;
            }
            return {success: true, message: `Action ${action} completed successfully`};
        } catch (e) {
            console.log('Action error:', e);
            return {error: `Error performing action ${action}: ${e.message}`};
        }
    }

    skipDay() {
        return this.updateDay();
    }

    updateDay() {
        this.actionPoints = 50;
        if (this.overuse) {
            this.actionPoints -= this.overuseAmount;
        }
        
        // Room production
        for (const [roomName, room] of Object.entries(this.rooms)) {
            if (room.built && room.assigned && room.produce) {
                // Check if room needs power (living room doesn't need power)
                if (room.produce === 'happiness') {
                    // Living room produces happiness without power cost
                    this.happiness = Math.min(100, this.happiness + room.production);
                } else if (this.globalInventory['watt'] >= room.wattage) {
                    this.globalInventory['watt'] -= room.wattage;
                    this.globalInventory[room.produce] += room.production;
                }
            }
        }
        
        // People updates
        for (const person of Object.values(this.people)) {
            if (person.alive) {
                person.hunger = Math.min(100, person.hunger + 10);
                person.thirst = Math.min(100, person.thirst + 20);
                
                // Handle scavenging
                if (person.isScavenging) {
                    person.scavengeDays += 1;
                    // Scavengers take damage and radiation
                    const damage = Math.floor(Math.random() * 11) + 5; // 5-15
                    const radiation = Math.floor(Math.random() * 6); // 0-5
                    person.health = Math.max(0, person.health - damage);
                    person.radiation = Math.min(100, person.radiation + radiation);
                    
                    // Use medical supplies if available
                    if (person.health < 50 && person.stimpaks > 0) {
                        person.health = Math.min(100, person.health + 30);
                        person.stimpaks -= 1;
                    }
                    
                    if (person.radiation > 20 && person.radaways > 0) {
                        person.radiation = Math.max(0, person.radiation - 15);
                        person.radaways -= 1;
                    }
                    
                    // Check if scavenging is complete
                    if (person.scavengeDays >= person.scavengeTargetDays) {
                        person.isScavenging = false;
                        // Generate loot
                        const loot = this.generateScavengeLoot(person, person.scavengeDays);
                        // Add loot to global inventory
                        for (const item of loot) {
                            const itemName = item.name || item.toString();
                            this.globalInventory[itemName] = (this.globalInventory[itemName] || 0) + 1;
                        }
                        person.scavengeDays = 0;
                        person.scavengeTargetDays = 0;
                    }
                }
                
                if (person.hunger >= 100 || person.thirst >= 100 || person.health <= 0) {
                    person.alive = false;
                    if (person.assignedRoom) {
                        this.rooms[person.assignedRoom].assigned = false;
                        person.assignedRoom = null;
                    }
                }
            }
        }
        
        // Player-specific logic removed - game now operates as overseer mode
        
        // Auto-feed if enabled
        if (this.autoFeedEnabled) {
            this.actionAutoFeedAll();
        }
        
        this.days += 1;
        this.lastUpdated = Date.now();
        return this;
    }

    // Action methods
    actionQuit() {
        return {quit: true, message: 'Game ended. Returning to main screen.'};
    }

    actionSkip() {
        return this.updateDay();
    }

    actionAutoAssign() {
        // Prioritize rooms that keep people alive (not living quarters)
        const priorityRooms = ["generator", "water", "kitchen"];
        // Get all built, non-living rooms, sorted by priority first
        const builtRooms = Object.keys(this.rooms)
            .filter(name => this.rooms[name].built && name !== 'living')
            .sort((a, b) => {
                const aPriority = priorityRooms.indexOf(a);
                const bPriority = priorityRooms.indexOf(b);
                if (aPriority === -1 && bPriority === -1) return 0;
                if (aPriority === -1) return 1;
                if (bPriority === -1) return -1;
                return aPriority - bPriority;
            });
        // Get all unassigned, alive people
        const unassignedPeople = Object.keys(this.people).filter(name =>
            !this.people[name].assignedRoom && this.people[name].alive
        );
        // Assign people to productive rooms up to each room's assigned_limit
        for (const roomName of builtRooms) {
            const room = this.rooms[roomName];
            const assigned = Object.values(this.people).filter(p => p.assignedRoom === roomName).length;
            const limit = room.assigned_limit || 0;
            let toAssign = Math.max(0, limit - assigned);
            while (toAssign > 0 && unassignedPeople.length > 0) {
                const personName = unassignedPeople.shift();
                this.people[personName].assignedRoom = roomName;
                toAssign--;
            }
            // Mark as assigned if at least one person is assigned
            room.assigned = Object.values(this.people).some(p => p.assignedRoom === roomName);
        }
        // After all productive rooms are full, assign any remaining people to living quarters
        const livingRoom = this.rooms['living'];
        if (livingRoom && livingRoom.built) {
            const assigned = Object.values(this.people).filter(p => p.assignedRoom === 'living').length;
            const limit = livingRoom.assigned_limit || 0;
            let toAssign = Math.max(0, limit - assigned);
            while (toAssign > 0 && unassignedPeople.length > 0) {
                const personName = unassignedPeople.shift();
                this.people[personName].assignedRoom = 'living';
                toAssign--;
            }
            livingRoom.assigned = Object.values(this.people).some(p => p.assignedRoom === 'living');
        }
        return this;
    }

    actionAutoFeedAll() {
        console.log('Auto feed all action called');
        
        if (this.autoFeedEnabled) {
            // Use the same intelligent auto-feed system
            this.processAutoFeed();
            
            return {
                success: true,
                message: 'Auto-fed all inhabitants who needed food or water.'
            };
        } else {
            return {
                success: false,
                message: 'Auto-feed is disabled. Enable it first.'
            };
        }
    }

    actionToggleAutoFeed() {
        this.autoFeedEnabled = !this.autoFeedEnabled;
        return {success: true, message: `Auto-feed is now ${this.autoFeedEnabled ? 'enabled' : 'disabled'}`};
    }

    actionCraft(itemName = "turret") {
        if (itemName === "turret" && this.globalInventory.steel >= 3) {
            this.globalInventory.steel -= 3;
            this.globalInventory.turret += 1;
        }
        return this;
    }

    actionRushRoom(roomName) {
        if (roomName && this.rooms[roomName] && this.rooms[roomName].built) {
            this.rooms[roomName].rushed = true;
            // Rush effects could be added here
        }
        return this;
    }

    actionAssignToRoom(personName, roomName) {
        if (personName && roomName && this.people[personName] && this.rooms[roomName]) {
            this.people[personName].assignedRoom = roomName;
            this.rooms[roomName].assigned = true;
        }
        return this;
    }

    actionUnassign(personName) {
        if (personName && this.people[personName]) {
            if (this.people[personName].assignedRoom) {
                this.rooms[this.people[personName].assignedRoom].assigned = false;
                this.people[personName].assignedRoom = null;
            }
        }
        return this;
    }

    actionCoitus(person1Name, person2Name) {
        if (person1Name && person2Name && this.people[person1Name] && this.people[person2Name] &&
            this.people[person1Name].alive && this.people[person2Name].alive) {
            if (Math.floor(Math.random() * 10) === 0) { // 10% chance
                const newPerson = new SimplePerson("Child", Math.random() < 0.5 ? "M" : "F");
                this.people[`Child_${Object.keys(this.people).length}`] = newPerson;
            }
        }
        return this;
    }

    actionBuildRoom(roomName) {
        if (!roomName || !this.rooms[roomName] || this.rooms[roomName].built) {
            return { success: false, message: 'Invalid or already built room.' };
        }
        // Get build requirements from room definition
        const roomDef = this.rooms[roomName];
        const requirements = roomDef.components || [];
        // Count required components
        const reqCounts = {};
        for (const comp of requirements) {
            reqCounts[comp] = (reqCounts[comp] || 0) + 1;
        }
        // Check inventory for all requirements
        for (const comp in reqCounts) {
            if (!this.globalInventory[comp] || this.globalInventory[comp] < reqCounts[comp]) {
                return { success: false, message: `Not enough ${comp} to build ${roomName}.` };
            }
        }
        // Deduct components
        for (const comp in reqCounts) {
            this.globalInventory[comp] -= reqCounts[comp];
        }
        this.rooms[roomName].built = true;
        this.actionPoints -= 10;
        return { success: true, message: `${roomName} built successfully!` };
    }

    actionFixRoom(roomName = "living") {
        if (roomName && this.rooms[roomName] && this.rooms[roomName].built) {
            this.actionPoints -= 5;
        }
        return this;
    }

    actionHeal(personName) {
        if (personName && this.people[personName] && this.globalInventory.medkit > 0) {
            this.people[personName].health = Math.min(100, this.people[personName].health + 30);
            this.globalInventory.medkit -= 1;
        }
        return this;
    }

    actionTransferItem(itemName, quantity = 1) {
        // This action now just logs the transfer since we're using a unified inventory
        return {success: true, message: `Item transfer not needed - using unified base inventory.`};
    }

    actionRemoveDeadPerson(personName) {
        const person = this.people[personName];
        
        if (person && !person.alive) {
            // Remove from people list
            delete this.people[personName];
            
            // Remove from active scavenge missions
            if (this.activeScavengeMissions.has(personName)) {
                this.activeScavengeMissions.delete(personName);
            }
            
            return {success: true, message: `Removed ${personName} from the vault.`};
        }
        
        return {error: 'Person is not dead or not found.'};
    }

    actionExtendRoom(roomName) {
        if (!roomName || !this.rooms[roomName] || !this.rooms[roomName].built) {
            return { success: false, message: 'Invalid or unbuilt room.' };
        }
        const room = this.rooms[roomName];
        // Example extension cost: 2 steel + 2 watt per extension (customize per room if desired)
        const steelCost = 2 + room.extensions;
        const wattCost = 2 + room.extensions;
        if ((this.globalInventory.steel || 0) < steelCost || (this.globalInventory.watt || 0) < wattCost) {
            return { success: false, message: `Not enough steel or watt to extend ${roomName}.` };
        }
        this.globalInventory.steel -= steelCost;
        this.globalInventory.watt -= wattCost;
        room.extensions = (room.extensions || 0) + 1;
        // Update assigned_limit, production, and power usage
        if (room.assigned_limit !== undefined && room.power_per_extension !== undefined) {
            room.assigned_limit += 1;
        }
        if (room.base_production !== undefined && room.production_per_extension !== undefined) {
            room.production = (room.base_production || 0) + (room.extensions * (room.production_per_extension || 0));
        }
        if (room.base_power_usage !== undefined && room.power_per_extension !== undefined) {
            room.power_usage = (room.base_power_usage || 0) + (room.extensions * (room.power_per_extension || 0));
        }
        return { success: true, message: `${roomName} extended! Capacity, production, and power usage increased.` };
    }

    // Individual person actions
    actionFeedPerson(personName) {
        if (personName && this.people[personName] && this.globalInventory.food > 0) {
            this.people[personName].hunger = Math.max(0, this.people[personName].hunger - 20);
            this.globalInventory.food -= 1;
            return {success: true, message: `Fed ${personName}.`};
        }
        return {error: 'Cannot feed person.'};
    }

    actionDrinkPerson(personName) {
        if (personName && this.people[personName] && this.globalInventory.water > 0) {
            this.people[personName].thirst = Math.max(0, this.people[personName].thirst - 20);
            this.globalInventory.water -= 1;
            return {success: true, message: `Gave water to ${personName}.`};
        }
        return {error: 'Cannot give water to person.'};
    }

    actionScavengePerson(personName, days = 0) {
        console.log(`Scavenge action called for ${personName} for ${days} days (0 = indefinite)`);
        
        if (this.people[personName]) {
            if (this.people[personName].isScavenging) {
                return {success: false, message: `${personName} is already scavenging.`};
            }
            
            this.people[personName].isScavenging = true;
            this.people[personName].scavengeDays = 0;
            this.people[personName].scavengeTargetDays = days;
            
            // Create scavenge mission
            this.activeScavengeMissions.set(personName, {
                startTime: Date.now(),
                targetDays: days,
                timeElapsed: 0,
                progress: 0,
                log: [],
                lastEventTime: null,
                person: this.people[personName]
            });
            
            const message = days === 0 ? 
                `${personName} started scavenging indefinitely.` : 
                `${personName} started scavenging for ${days} days.`;
            return {success: true, message: message};
        } else {
            return {success: false, message: `Person ${personName} not found.`};
        }
    }

    actionReturnFromScavengePerson(personName) {
        const person = this.people[personName];
        
        if (person && person.isScavenging) {
            // Calculate time spent out
            const mission = this.activeScavengeMissions.get(personName);
            if (mission) {
                const timeSpentOut = Date.now() - mission.startTime;
                
                // Calculate return time as 25% of time spent (rounded to nearest minute)
                const returnTimeMinutes = Math.round((timeSpentOut / 1000 / 60) * 0.25);
                const returnTimeMs = returnTimeMinutes * 60 * 1000;
                
                // Start return journey
                person.isReturning = true;
                person.returnStartTime = Date.now();
                person.returnDuration = returnTimeMs;
                
                // Update mission to show returning status
                mission.isReturning = true;
                mission.returnStartTime = Date.now();
                mission.returnDuration = returnTimeMs;
                mission.returnProgress = 0;
                mission.returnTimeElapsed = 0;
                
                // Add return log entry
                this.addMissionLog(mission, `${personName} is returning to base. Journey back will take ${returnTimeMinutes} minutes.`, 'info');
                
                return {success: true, message: `${personName} is returning to base.`};
            }
        }
        return {error: 'Person is not scavenging.'};
    }

    actionContinueJourney(personName) {
        const person = this.people[personName];
        
        if (person && person.isReturning) {
            // Cancel return and resume scavenging
            person.isReturning = false;
            person.returnStartTime = null;
            person.returnDuration = null;
            
            const mission = this.activeScavengeMissions.get(personName);
            if (mission) {
                mission.isReturning = false;
                mission.returnStartTime = null;
                mission.returnDuration = null;
                mission.returnProgress = 0;
                mission.returnTimeElapsed = 0;
                
                // Add continue journey log entry
                this.addMissionLog(mission, `${personName} decides to continue their journey instead of returning.`, 'info');
                
                return {success: true, message: `${personName} continues their journey.`};
            }
        }
        return {error: 'Person is not returning to base.'};
    }

    actionAssignPersonToRoom(personName, roomName) {
        console.log('Game engine: Assigning', personName, 'to', roomName);
        console.log('People:', this.people);
        console.log('Rooms:', this.rooms);
        
        if (personName && roomName && this.people[personName] && this.rooms[roomName]) {
            console.log('Assignment conditions met, proceeding...');
            this.people[personName].assignedRoom = roomName;
            this.rooms[roomName].assigned = true;
            console.log('Assignment completed. Person room:', this.people[personName].assignedRoom);
            console.log('Room assigned status:', this.rooms[roomName].assigned);
            return {success: true, message: `Assigned ${personName} to ${roomName}.`};
        }
        console.log('Assignment failed. Conditions not met.');
        return {error: 'Cannot assign person to room.'};
    }

    actionUnassignPerson(personName) {
        if (personName && this.people[personName]) {
            if (this.people[personName].assignedRoom) {
                this.rooms[this.people[personName].assignedRoom].assigned = false;
                this.people[personName].assignedRoom = null;
                return {success: true, message: `Unassigned ${personName}.`};
            }
        }
        return {error: 'Cannot unassign person.'};
    }

    actionGetPersonInfo(personName) {
        if (personName && this.people[personName]) {
            return {
                success: true,
                person: this.people[personName],
                message: `Retrieved info for ${personName}.`
            };
        }
        return {error: 'Person not found.'};
    }

    // Trade functionality
    actionTrade() {
        if (this.caps >= 10) {
            this.caps -= 10;
            this.globalInventory.steel += 5;
            return {success: true, message: 'Traded 10 caps for 5 steel.'};
        }
        return {error: 'Not enough caps to trade.'};
    }

    generateScavengeLoot(person, daysSpent) {
        const loot = [];
        
        // Base loot chance increases with time spent
        const baseChance = Math.min(0.3 + (daysSpent * 0.1), 0.8);
        
        // Perception affects finding better items
        const perceptionBonus = person.stats.P * 0.05;
        // Luck affects rare item chance
        const luckBonus = person.stats.L * 0.03;
        
        // Generate random loot
        const lootCount = Math.floor(Math.random() * 3) + 1 + daysSpent;
        for (let i = 0; i < lootCount; i++) {
            if (Math.random() <= baseChance + perceptionBonus + luckBonus) {
                const itemType = Math.floor(Math.random() * 10) + 1;
                
                if (itemType <= 3) { // Junk items
                    const junkItems = ['Screws', 'Springs', 'Gears', 'Circuit Board', 'Aluminum Can', 'Glass Bottle'];
                    loot.push({type: 'junk', name: junkItems[Math.floor(Math.random() * junkItems.length)], rarity: 'common'});
                } else if (itemType <= 5) { // Caps
                    const capsAmount = Math.floor(Math.random() * 21) + 5 + (person.stats.L * 2);
                    loot.push({type: 'caps', amount: capsAmount});
                } else if (itemType <= 7) { // Medical supplies
                    if (Math.random() <= 0.2 + (person.stats.I * 0.05)) {
                        loot.push({type: 'medical', name: 'Stimpak'});
                    } else {
                        loot.push({type: 'medical', name: 'RadAway'});
                    }
                } else if (itemType <= 9) { // Weapons (rare)
                    if (Math.random() <= 0.1 + (person.stats.P * 0.03)) {
                        const weapons = ['Pipe Pistol', 'Rusty Knife', 'Baseball Bat'];
                        loot.push({type: 'weapon', name: weapons[Math.floor(Math.random() * weapons.length)], damage: `${Math.floor(Math.random() * 6) + 3}-${Math.floor(Math.random() * 8) + 8}`});
                    }
                } else { // Armor (very rare)
                    if (Math.random() <= 0.05 + (person.stats.P * 0.02)) {
                        const armors = ['Leather Armor', 'Raider Armor', 'Lab Coat'];
                        loot.push({type: 'armor', name: armors[Math.floor(Math.random() * armors.length)], bonus: {Endurance: Math.floor(Math.random() * 3) + 1}});
                    }
                }
            }
        }
        
        return loot;
    }

    acceptWanderer() {
        if (this.pendingWanderer) {
            this.people[this.pendingWanderer.name] = this.pendingWanderer;
            this.pendingWanderer = null;
            // Reset wanderer timer logic
            this.lastWandererTime = Date.now();
            this.wandererWindowOpen = false;
            this.wandererWindowStart = null;
            this.wandererWindowEnd = null;
            return { success: true, message: 'Wanderer accepted and joined the vault!' };
        }
        return { success: false, message: 'No wanderer to accept.' };
    }
    rejectWanderer() {
        if (this.pendingWanderer) {
            this.pendingWanderer = null;
            // Reset wanderer timer logic
            this.lastWandererTime = Date.now();
            this.wandererWindowOpen = false;
            this.wandererWindowStart = null;
            this.wandererWindowEnd = null;
            return { success: true, message: 'Wanderer rejected.' };
        }
        return { success: false, message: 'No wanderer to reject.' };
    }

    getLivingRoomCapacity() {
        const living = this.rooms['living'];
        if (!living) return 0;
        // Default assigned_limit + extensions * extension_capacity (if present)
        const base = living.assigned_limit || 0;
        const ext = living.extensions || 0;
        const extCap = living.extension_capacity || 0;
        return base + ext * extCap;
    }

    getPopulation() {
        return Object.values(this.people).filter(p => p.alive).length;
    }

    handleLivingQuartersBirth(now) {
        const livingRoom = this.rooms['living'];
        if (!livingRoom || !livingRoom.built) return;
        const assigned = Object.values(this.people).filter(p => p.assignedRoom === 'living' && p.alive);
        const capacity = livingRoom.assigned_limit || 0;
        if (assigned.length < 2) return; // Need at least 2 assigned
        if (Object.keys(this.people).length >= capacity) return; // No space
        if (!this.lastBirthTime) this.lastBirthTime = now;
        if (now - this.lastBirthTime >= 60000) { // 1 minute
            // Generate a new person
            const names = ["Alex", "Sam", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Skyler", "Jamie", "Avery", "Drew", "Quinn", "Rowan", "Parker", "Reese"];
            const name = names[Math.floor(Math.random() * names.length)] + '_' + (Object.keys(this.people).length + 1);
            const gender = Math.random() < 0.5 ? 'M' : 'F';
            this.people[name] = new SimplePerson(name, gender);
            this.lastBirthTime = now;
        }
    }
}



class SimplePerson {
    constructor(name, gender) {
        this.name = name;
        this.age = 21;
        this.gender = gender;
        this.hunger = 0;
        this.thirst = 0;
        this.health = 100;
        this.radiation = 0;
        this.assignedRoom = null;
        this.alive = true;
        
        // SPECIAL stats (Fallout-style)
        this.stats = {
            'S': Math.floor(Math.random() * 10) + 1, // Strength
            'P': Math.floor(Math.random() * 10) + 1, // Perception
            'E': Math.floor(Math.random() * 10) + 1, // Endurance
            'C': Math.floor(Math.random() * 10) + 1, // Charisma
            'I': Math.floor(Math.random() * 10) + 1, // Intelligence
            'A': Math.floor(Math.random() * 10) + 1, // Agility
            'L': Math.floor(Math.random() * 10) + 1  // Luck
        };
        
        // Equipped items
        this.equipped = {
            weapon: null,
            armor: null,
            outfit: null
        };
        
        // Personal inventory (limited capacity)
        this.inventory = {};
        this.inventoryCapacity = 20;
        
        // Medical supplies
        this.stimpaks = 0;
        this.radaways = 0;
        
        // Scavenging status
        this.isScavenging = false;
        this.scavengeDays = 0;
        this.scavengeTargetDays = 0;
        this.isReturning = false;
        this.returnStartTime = null;
        this.returnDuration = null;
        
        // Combat stats
        this.damageResistance = 0;
        this.radResistance = 0;
    }
}

// Game state management
let gameEngine = null;
window.gameEngine = null;

function newGame() {
    console.log('Creating new game...');
    gameEngine = new SimpleWebGameEngine();
    window.gameEngine = gameEngine;
    const gameState = gameEngine.getGameState();
    console.log('New game state:', gameState);
    saveGame();
    return gameState;
}

function loadGame() {
    const savedGame = localStorage.getItem('savageGardenGame');
    console.log('Loading game from localStorage:', savedGame ? 'found' : 'not found');
    
    if (savedGame) {
        try {
            const gameData = JSON.parse(savedGame);
            console.log('Game data loaded:', gameData);
            
            gameEngine = new SimpleWebGameEngine();
            window.gameEngine = gameEngine;
            
            // Restore basic properties
            gameEngine.caps = gameData.caps || 100;
            gameEngine.traderCaps = gameData.traderCaps || 500;
            gameEngine.happiness = gameData.happiness || 100;
            gameEngine.actionPoints = gameData.actionPoints || 50;
            gameEngine.defense = gameData.defense || 0;
            gameEngine.security = gameData.security || "secure";
            gameEngine.days = gameData.days || 1;
            gameEngine.overuse = gameData.overuse || false;
            gameEngine.overuseAmount = gameData.overuseAmount || 0;
            gameEngine.autoFeedEnabled = gameData.autoFeedEnabled !== undefined ? gameData.autoFeedEnabled : true;
            gameEngine.globalInventory = gameData.globalInventory || {};
            gameEngine.rooms = gameData.rooms || {};
            
            // Restore complex objects (player removed - overseer mode)
            
            gameEngine.people = {};
            for (const [name, personData] of Object.entries(gameData.people || {})) {
                const person = new SimplePerson(name, personData.gender || 'M');
                
                // Ensure proper number types for critical stats
                person.health = typeof personData.health === 'number' ? personData.health : 100;
                person.radiation = typeof personData.radiation === 'number' ? personData.radiation : 0;
                person.hunger = typeof personData.hunger === 'number' ? personData.hunger : 0;
                person.thirst = typeof personData.thirst === 'number' ? personData.thirst : 0;
                person.alive = personData.alive !== false;
                
                // Copy other properties
                person.name = personData.name || name;
                person.age = personData.age || 21;
                person.gender = personData.gender || 'M';
                person.assignedRoom = personData.room || null;
                person.stats = personData.stats || person.stats;
                person.equipped = personData.equipped || person.equipped;
                person.inventory = personData.inventory || {};
                person.inventoryCapacity = personData.inventoryCapacity || 20;
                person.stimpaks = personData.stimpaks || 0;
                person.radaways = personData.radaways || 0;
                person.isScavenging = personData.isScavenging || false;
                person.scavengeDays = personData.scavengeDays || 0;
                person.scavengeTargetDays = personData.scavengeTargetDays || 0;
                person.isReturning = personData.isReturning || false;
                person.returnStartTime = personData.returnStartTime || null;
                person.returnDuration = personData.returnDuration || null;
                person.damageResistance = personData.damageResistance || 0;
                person.radResistance = personData.radResistance || 0;
                
                gameEngine.people[name] = person;
            }
            
            // Restore real-time properties
            if (gameData.dayStartTime) {
                gameEngine.dayStartTime = gameData.dayStartTime;
            }
            if (gameData.activeScavengeMissions) {
                gameEngine.activeScavengeMissions = new Map(gameData.activeScavengeMissions);
            }
            if (gameData.pendingWanderer) {
                gameEngine.pendingWanderer = new SimplePerson(gameData.pendingWanderer.name, gameData.pendingWanderer.gender);
                gameEngine.pendingWanderer.stats = gameData.pendingWanderer.stats;
            }
            
            gameEngine.lastUpdated = Date.now();
            
            const gameState = gameEngine.getGameState();
            console.log('Game state restored:', gameState);
            return gameState;
        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    }
    return null;
}

function saveGame() {
    if (gameEngine) {
        const gameData = {
            ...gameEngine,
            people: gameEngine.people,
            lastUpdated: Date.now()
        };
        localStorage.setItem('savageGardenGame', JSON.stringify(gameData));
    }
}

function performAction(action, ...args) {
    console.log('Global performAction called with:', action, args);
    if (!gameEngine) {
        console.log('No game engine found');
        return {error: 'No active game'};
    }
    
    console.log('Game engine found, calling performAction');
    const result = gameEngine.performAction(action, ...args);
    console.log('Game engine result:', result);
    saveGame();
    return result;
}

function skipDay() {
    if (!gameEngine) {
        return {error: 'No active game'};
    }
    
    const result = gameEngine.skipDay();
    saveGame();
    return {
        success: true,
        message: `Advanced to day ${gameEngine.days}`,
        gameState: gameEngine.getGameState()
    };
}

function getGameState() {
    if (!gameEngine) {
        return {error: 'No active game'};
    }
    return gameEngine.getGameState();
}

function getAvailableActions() {
    if (!gameEngine) {
        return [];
    }
    return gameEngine.getAvailableActions();
}

function getAvailableRooms() {
    if (!gameEngine) {
        return [];
    }
    return gameEngine.getAvailableRoomsForAssignment();
} 