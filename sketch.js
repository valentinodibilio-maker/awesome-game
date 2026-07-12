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
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

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
        this.type = random() > 0.5 ? 'health' : 'score'; // health o score
    }
    
    display() {
        if (this.type === 'health') {
            fill(255, 100, 100);
            text('♥', this.x, this.y);
        } else {
            fill(255, 255, 0);
            text('★', this.x, this.y);
        }
        textSize(20);
        textAlign(CENTER, CENTER);
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
        text('AWESOME GAME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
        textSize(24);
        text('Premi SPAZIO per iniziare!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        updateStatus('Premi SPAZIO per iniziare!');
    } else if (gameOver) {
        // Schermata game over
        fill(255, 0, 0);
        textSize(48);
        textAlign(CENTER, CENTER);
        text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
        fill(0, 255, 0);
        textSize(24);
        text('Score: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        text('Level: ' + level, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        text('Premi R per ricominciare', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
        updateStatus('GAME OVER! Score: ' + score + ' | Level: ' + level);
    } else {
        // Gioco attivo
        
        // Movimento automatico
        if (keys['a'] || keys['A']) player.moveLeft();
        if (keys['d'] || keys['D']) player.moveRight();
        if (keys['w'] || keys['W']) player.moveUp();
        if (keys['s'] || keys['S']) player.moveDown();
        
        // Update scudo
        player.updateShield();
        
        // Update e display nemici
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].display();
            
            // Nemico esce dallo schermo
            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
                score += 10;
            }
            // Collisione con player
            else if (player.collidesWith(enemies[i])) {
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
            
            // Power-up esce dallo schermo
            if (powerups[i].isOffScreen()) {
                powerups.splice(i, 1);
            }
            // Collisione con player
            else if (player.collidesWith(powerups[i])) {
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
        textSize(18);
        textAlign(LEFT, TOP);
        text('❤️ Health: ' + player.health, 10, 10);
        text('Score: ' + score, 10, 35);
        text('Level: ' + level, 10, 60);
        text('Enemies: ' + enemies.length, 10, 85);
        
        if (player.shieldActive) {
            text('🛡️ Shield: ' + ceil(player.shieldTime / 60) + 's', 10, 110);
        }
        
        updateStatus('❤️ ' + player.health + ' | Score: ' + score + ' | Level: ' + level);
    }
}

function keyPressed() {
    keys = keys || {};
    keys[key] = true;
    
    if (key === ' ') {
        if (!gameActive && !gameOver) {
            gameActive = true;
            return false;
        } else if (gameActive) {
            player.activateShield();
            return false;
        }
    }
    
    if (key === 'r' || key === 'R') {
        if (gameOver) {
            resetGame();
        }
    }
}

function keyReleased() {
    keys = keys || {};
    keys[key] = false;
}

// Funzioni di controllo da pulsanti
function moveLeft() {
    if (gameActive) player.moveLeft();
}

function moveRight() {
    if (gameActive) player.moveRight();
}

function moveUp() {
    if (gameActive) player.moveUp();
}

function moveDown() {
    if (gameActive) player.moveDown();
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

// Inizializza l'oggetto keys
let keys = {};
