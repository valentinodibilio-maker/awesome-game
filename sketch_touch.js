// Variabili del gioco
let player;
let enemies = [];
let powerups = [];
let score = 0;
let level = 1;
let gameActive = false;
let gameOver = false;

// Costanti
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 25;
const POWERUP_SIZE = 15;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

// Direzioni di movimento
let currentDirection = { up: false, down: false, left: false, right: false };

// Classe Player
class Player {
    constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT - 50;
        this.size = PLAYER_SIZE;
        this.health = 3;
        this.speed = 5;
        this.shieldActive = false;
        this.shieldTime = 0;
    }
    
    display() {
        if (this.shieldActive) {
            fill(0, 255, 200);
            stroke(0, 255, 200);
            strokeWeight(2);
            circle(this.x, this.y, this.size + 15);
            noStroke();
        }
        
        fill(0, 255, 0);
        square(this.x - this.size / 2, this.y - this.size / 2, this.size);
        
        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text('@', this.x, this.y);
    }
    
    moveLeft() {
        if (this.x - this.size / 2 > 0) this.x -= this.speed;
    }
    
    moveRight() {
        if (this.x + this.size / 2 < CANVAS_WIDTH) this.x += this.speed;
    }
    
    moveUp() {
        if (this.y - this.size / 2 > 0) this.y -= this.speed;
    }
    
    moveDown() {
        if (this.y + this.size / 2 < CANVAS_HEIGHT) this.y += this.speed;
    }
    
    activateShield() {
        if (!this.shieldActive) {
            this.shieldActive = true;
            this.shieldTime = 300; // 5 secondi a 60 fps
        }
    }
    
    updateShield() {
        if (this.shieldActive) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.shieldActive = false;
            }
        }
    }
    
    collidesWith(obj) {
        let d = dist(this.x, this.y, obj.x, obj.y);
        return d < (this.size + obj.size) / 2;
    }
}

// Classe Enemy
class Enemy {
    constructor(x = random(ENEMY_SIZE, CANVAS_WIDTH - ENEMY_SIZE), y = random(-50, -10)) {
        this.x = x;
        this.y = y;
        this.size = ENEMY_SIZE;
        this.speed = 2 + level * 0.5;
        this.dirX = random(-1, 1);
    }
    
    display() {
        fill(255, 0, 0);
        square(this.x - this.size / 2, this.y - this.size / 2, this.size);
        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text('X', this.x, this.y);
    }
    
    update() {
        this.y += this.speed;
        this.x += this.dirX;
        
        // Rimbalza sui bordi
        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > CANVAS_WIDTH) {
            this.dirX *= -1;
        }
    }
    
    isOffScreen() {
        return this.y > CANVAS_HEIGHT;
    }
}

// Classe PowerUp
class PowerUp {
    constructor(x = random(POWERUP_SIZE, CANVAS_WIDTH - POWERUP_SIZE), y = random(-50, -10)) {
        this.x = x;
        this.y = y;
        this.size = POWERUP_SIZE;
        this.speed = 1.5;
        this.type = random() > 0.5 ? 'health' : 'score';
    }
    
    display() {
        textSize(20);
        textAlign(CENTER, CENTER);
        if (this.type === 'health') {
            fill(255, 100, 100);
            text('♥', this.x, this.y);
        } else {
            fill(255, 255, 0);
            text('★', this.x, this.y);
        }
    }
    
    update() {
        this.y += this.speed;
    }
    
    isOffScreen() {
        return this.y > CANVAS_HEIGHT;
    }
}

function setup() {
    let container = document.getElementById('p5-container');
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent(container);
    
    // Disabilita zoom su touch
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    player = new Player();
    spawnInitialEnemies();
}

function draw() {
    background(20, 20, 30);
    
    // Bordi del canvas
    stroke(0, 255, 0);
    strokeWeight(3);
    noFill();
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!gameActive && !gameOver) {
        // Schermata iniziale
        fill(0, 255, 0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text('DODGE MASTERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
        textSize(18);
        text('Evita i nemici rossi (X)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        text('Raccogli power-up (♥ ★)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        text('Tocca SU per iniziare!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        updateStatus('Tocca SU per iniziare!');
    } else if (gameOver) {
        // Schermata game over
        fill(255, 0, 0);
        textSize(40);
        textAlign(CENTER, CENTER);
        text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
        fill(0, 255, 0);
        textSize(20);
        text('Score: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        text('Level: ' + level, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        text('Tocca RICOMINCIA per ricominciare', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        updateStatus('GAME OVER! Score: ' + score + ' | Level: ' + level);
    } else {
        // Gioco attivo
        
        // Movimento continuo
        if (currentDirection.left) player.moveLeft();
        if (currentDirection.right) player.moveRight();
        if (currentDirection.up) player.moveUp();
        if (currentDirection.down) player.moveDown();
        
        // Update scudo
        player.updateShield();
        
        // Update e display nemici
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].display();
            
            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
                score += 10;
            } else if (player.collidesWith(enemies[i])) {
                if (!player.shieldActive) {
                    player.health--;
                    enemies.splice(i, 1);
                    if (player.health <= 0) {
                        gameOver = true;
                        gameActive = false;
                    }
                } else {
                    enemies.splice(i, 1);
                    score += 20;
                }
            }
        }
        
        // Update e display power-up
        for (let i = powerups.length - 1; i >= 0; i--) {
            powerups[i].update();
            powerups[i].display();
            
            if (powerups[i].isOffScreen()) {
                powerups.splice(i, 1);
            } else if (player.collidesWith(powerups[i])) {
                if (powerups[i].type === 'health') {
                    player.health = min(player.health + 1, 5);
                } else {
                    score += 50;
                }
                powerups.splice(i, 1);
            }
        }
        
        // Spawn nemici casuali
        if (random() < 0.02 + level * 0.005) {
            enemies.push(new Enemy());
        }
        
        // Spawn power-up casuali
        if (random() < 0.008) {
            powerups.push(new PowerUp());
        }
        
        // Check level up
        if (score >= level * 100) {
            level++;
        }
        
        // Display player
        player.display();
        
        // Display HUD
        fill(0, 255, 0);
        textSize(16);
        textAlign(LEFT, TOP);
        text('❤️ Health: ' + player.health, 10, 10);
        text('Score: ' + score, 10, 30);
        text('Level: ' + level, 10, 50);
        
        if (player.shieldActive) {
            fill(0, 255, 200);
            text('🛡️ Shield: ' + ceil(player.shieldTime / 60) + 's', 10, 70);
        }
        
        updateStatus('❤️ ' + player.health + ' | Score: ' + score + ' | Level: ' + level);
    }
}

// Funzioni di controllo TOUCH
function moveUp() {
    if (gameActive) {
        currentDirection.up = true;
    } else if (!gameActive && !gameOver) {
        gameActive = true;
    }
}

function moveDown() {
    if (gameActive) currentDirection.down = true;
}

function moveLeft() {
    if (gameActive) currentDirection.left = true;
}

function moveRight() {
    if (gameActive) currentDirection.right = true;
}

function stopMove() {
    currentDirection = { up: false, down: false, left: false, right: false };
}

function doNothing() {
    // Pulsante centrale - non fa nulla
}

function activateShield() {
    if (gameActive) player.activateShield();
}

function restartGame() {
    resetGame();
}

function resetGame() {
    player = new Player();
    enemies = [];
    powerups = [];
    score = 0;
    level = 1;
    gameActive = true;
    gameOver = false;
    spawnInitialEnemies();
}

function spawnInitialEnemies() {
    for (let i = 0; i < 3 + level; i++) {
        enemies.push(new Enemy());
    }
}

function updateStatus(text) {
    document.getElementById('gameStatus').textContent = text;
}

// Prevent scrolling
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
