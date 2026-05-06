// CITY CHAOS: SURVIVAL - GAME LOGIC

// ===== GAME STATE =====
const gameState = {
    currentLevel: 1,
    playerMoney: 0,
    playerHealth: 100,
    maxHealth: 100,
    unlockedLevels: 1,
    inventory: [],
    weapons: ['pistolet'],
    selectedWeapon: 'pistolet'
};

// ===== PLAYER OBJECT =====
const player = {
    x: 400,
    y: 300,
    width: 30,
    height: 40,
    health: 100,
    maxHealth: 100,
    speed: 5,
    weapon: 'pistolet',
    ammunition: 30,
    maxAmmunition: 30,
    isMoving: false,
    direction: 'down'
};

// ===== ENEMIES =====
class Enemy {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.health = 20 + (level * 5);
        this.maxHealth = this.health;
        this.speed = 2 + (level * 0.5);
        this.damage = 5 + (level * 2);
        this.level = level;
    }

    update(playerX, playerY) {
        // AI pathfinding - move towards player
        if (this.x < playerX) this.x += this.speed;
        if (this.x > playerX) this.x -= this.speed;
        if (this.y < playerY) this.y += this.speed;
        if (this.y > playerY) this.y -= this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        ctx.fillStyle = '#00ff00';
        const healthBarWidth = (this.health / this.maxHealth) * this.width;
        ctx.fillRect(this.x, this.y - 5, healthBarWidth, 3);
    }
}

// ===== LOOT SYSTEM =====
class LootBox {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.loot = this.generateLoot();
    }

    generateLoot() {
        const random = Math.random();
        if (random < 0.4) {
            return { type: 'money', amount: 50 + Math.random() * 100 };
        } else if (random < 0.7) {
            return { type: 'health', amount: 25 };
        } else {
            return { type: 'ammo', amount: 30 };
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ===== GAME VARIABLES =====
let canvas, ctx;
let enemies = [];
let lootBoxes = [];
let gameRunning = false;
let levelEnemiesKilled = 0;
let levelTotalEnemies = 0;

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// ===== MENU BUTTONS =====
document.getElementById('btn-play').addEventListener('click', () => {
    startGame();
    showScreen('gameplay');
});

document.getElementById('btn-levels').addEventListener('click', () => {
    generateLevelButtons();
    showScreen('level-selection');
});

document.getElementById('btn-shop').addEventListener('click', () => {
    updateShopUI();
    showScreen('shop');
});

document.getElementById('btn-back-levels').addEventListener('click', () => {
    showScreen('main-menu');
});

document.getElementById('btn-back-shop').addEventListener('click', () => {
    showScreen('main-menu');
});

document.getElementById('btn-back-game').addEventListener('click', () => {
    gameRunning = false;
    showScreen('main-menu');
});

document.getElementById('btn-inventory').addEventListener('click', () => {
    updateInventoryUI();
    showScreen('inventory');
});

document.getElementById('btn-back-inventory').addEventListener('click', () => {
    showScreen('gameplay');
});

document.getElementById('btn-shop-ingame').addEventListener('click', () => {
    updateShopUI();
    showScreen('shop');
});

// ===== LEVEL SELECTION =====
function generateLevelButtons() {
    const container = document.getElementById('level-buttons');
    container.innerHTML = '';
    
    for (let i = 1; i <= 20; i++) {
        const button = document.createElement('button');
        button.className = 'btn level-btn';
        button.textContent = i;
        
        if (i > gameState.unlockedLevels) {
            button.classList.add('locked');
            button.textContent = i + ' 🔒';
            button.disabled = true;
        } else {
            button.addEventListener('click', () => {
                gameState.currentLevel = i;
                document.getElementById('level-display').textContent = i;
                startGame();
                showScreen('gameplay');
            });
        }
        
        container.appendChild(button);
    }
}

// ===== INITIALIZE GAME =====
function initializeCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
}

// ===== START GAME =====
function startGame() {
    initializeCanvas();
    gameRunning = true;
    
    // Initialize level
    levelTotalEnemies = 5 + (gameState.currentLevel * 2);
    levelEnemiesKilled = 0;
    enemies = [];
    lootBoxes = [];
    
    // Spawn enemies
    for (let i = 0; i < levelTotalEnemies; i++) {
        let x, y;
        do {
            x = Math.random() * (canvas.width - 50) + 25;
            y = Math.random() * (canvas.height - 50) + 25;
        } while (Math.hypot(x - player.x, y - player.y) < 100);
        
        enemies.push(new Enemy(x, y, gameState.currentLevel));
    }
    
    // Reset player
    player.health = player.maxHealth;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    
    updateUI();
    gameLoop();
}

// ===== KEYBOARD CONTROLS =====
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key === ' ') {
        shootWeapon();
        e.preventDefault();
    }
    if (e.key === 'v') {
        useVehicle();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// ===== PLAYER MOVEMENT =====
function updatePlayer() {
    if (keys['z'] || keys['w']) {
        player.y -= player.speed;
        player.direction = 'up';
    }
    if (keys['s']) {
        player.y += player.speed;
        player.direction = 'down';
    }
    if (keys['q'] || keys['a']) {
        player.x -= player.speed;
        player.direction = 'left';
    }
    if (keys['d']) {
        player.x += player.speed;
        player.direction = 'right';
    }
    
    // Boundary check
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));
}

// ===== WEAPON SYSTEM =====
function shootWeapon() {
    if (!gameRunning || player.ammunition <= 0) return;
    
    player.ammunition--;
    
    // Find and damage closest enemy
    let closestEnemy = null;
    let closestDistance = 150;
    
    enemies.forEach(enemy => {
        const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    });
    
    if (closestEnemy) {
        const damage = 10 + (gameState.currentLevel * 2);
        closestEnemy.health -= damage;
        
        if (closestEnemy.health <= 0) {
            killEnemy(closestEnemy);
        }
    }
}

// ===== ENEMY DEATH =====
function killEnemy(enemy) {
    const index = enemies.indexOf(enemy);
    if (index > -1) {
        enemies.splice(index, 1);
        levelEnemiesKilled++;
        
        // Drop loot
        lootBoxes.push(new LootBox(enemy.x, enemy.y));
        
        // Reward money
        gameState.playerMoney += 50 + (gameState.currentLevel * 10);
        
        checkLevelComplete();
    }
}

// ===== CHECK LEVEL COMPLETION =====
function checkLevelComplete() {
    if (levelEnemiesKilled >= levelTotalEnemies) {
        completeLevel();
    }
}

// ===== COMPLETE LEVEL =====
function completeLevel() {
    gameRunning = false;
    
    if (gameState.currentLevel >= gameState.unlockedLevels) {
        gameState.unlockedLevels = Math.min(gameState.currentLevel + 1, 20);
    }
    
    alert(`✅ Niveau ${gameState.currentLevel} complété!\n💰 Vous avez gagné: ${gameState.playerMoney}$`);
    showScreen('main-menu');
}

// ===== VEHICLE SYSTEM =====
function useVehicle() {
    if (!gameRunning) return;
    alert('🚗 Système de véhicule en développement!');
}

// ===== SHOP SYSTEM =====
function updateShopUI() {
    document.getElementById('shop-money').textContent = gameState.playerMoney;
    
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', (e) => {
            const item = e.target.parentElement.dataset.item;
            const price = parseInt(e.target.parentElement.dataset.price);
            buyItem(item, price);
        });
    });
}

function buyItem(item, price) {
    if (gameState.playerMoney >= price) {
        gameState.playerMoney -= price;
        gameState.inventory.push(item);
        document.getElementById('shop-money').textContent = gameState.playerMoney;
        alert(`✅ ${item} acheté!`);
    } else {
        alert('❌ Argent insuffisant!');
    }
}

// ===== INVENTORY =====
function updateInventoryUI() {
    const inventoryDiv = document.getElementById('inventory-items');
    if (gameState.inventory.length === 0) {
        inventoryDiv.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Inventaire vide</p>';
        return;
    }
    
    inventoryDiv.innerHTML = gameState.inventory
        .map(item => `<div class="inventory-item">${item}</div>`)
        .join('');
}

// ===== UPDATE UI =====
function updateUI() {
    document.getElementById('player-health').textContent = player.health;
    document.getElementById('player-money').textContent = gameState.playerMoney;
    document.getElementById('current-level').textContent = gameState.currentLevel;
}

// ===== DRAW PLAYER =====
function drawPlayer() {
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Health bar
    ctx.fillStyle = '#00ff00';
    const healthBarWidth = (player.health / player.maxHealth) * player.width;
    ctx.fillRect(player.x, player.y - 5, healthBarWidth, 3);
    
    // Weapon indicator
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('🔫', player.x + player.width / 2 - 5, player.y + player.height + 10);
}

// ===== DRAW GAME =====
function drawGame() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Draw player
    drawPlayer();
    
    // Draw enemies
    enemies.forEach(enemy => {
        enemy.draw(ctx);
    });
    
    // Draw loot boxes
    lootBoxes.forEach(loot => {
        loot.draw(ctx);
    });
    
    // Draw level info
    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Niveau: ${gameState.currentLevel}`, 10, 20);
    ctx.fillText(`Ennemis: ${levelEnemiesKilled}/${levelTotalEnemies}`, 10, 40);
    ctx.fillText(`Munitions: ${player.ammunition}/${player.maxAmmunition}`, 10, 60);
}

// ===== COLLISION DETECTION =====
function checkCollisions() {
    // Player collision with loot
    lootBoxes.forEach((loot, index) => {
        if (Math.hypot(loot.x - player.x, loot.y - player.y) < 30) {
            collectLoot(loot);
            lootBoxes.splice(index, 1);
        }
    });
    
    // Enemy collision with player
    enemies.forEach(enemy => {
        if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 40) {
            player.health -= enemy.damage * 0.1;
            if (player.health <= 0) {
                gameOver();
            }
        }
    });
}

// ===== COLLECT LOOT =====
function collectLoot(loot) {
    switch (loot.loot.type) {
        case 'money':
            gameState.playerMoney += loot.loot.amount;
            break;
        case 'health':
            player.health = Math.min(player.health + loot.loot.amount, player.maxHealth);
            break;
        case 'ammo':
            player.ammunition = Math.min(player.ammunition + loot.loot.amount, player.maxAmmunition);
            break;
    }
}

// ===== GAME OVER =====
function gameOver() {
    gameRunning = false;
    alert(`☠️ Game Over! Vous avez échoué au niveau ${gameState.currentLevel}`);
    showScreen('main-menu');
}

// ===== GAME LOOP =====
function gameLoop() {
    if (!gameRunning) return;
    
    updatePlayer();
    
    enemies.forEach(enemy => {
        enemy.update(player.x, player.y);
    });
    
    checkCollisions();
    drawGame();
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

// ===== INITIALIZE =====
window.addEventListener('load', () => {
    showScreen('main-menu');
    generateLevelButtons();
});
