#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <cmath>
#include <iomanip>
#include <string>

using namespace std;

// Costanti del gioco
const int GAME_WIDTH = 80;
const int GAME_HEIGHT = 25;
const int PLAYER_START_X = GAME_WIDTH / 2;
const int PLAYER_START_Y = GAME_HEIGHT - 3;

// Struttura per il giocatore
struct Player {
    int x, y;
    int health;
    int score;
    char symbol;
};

// Struttura per i nemici
struct Enemy {
    int x, y;
    char symbol;
};

// Struttura per i power-up
struct PowerUp {
    int x, y;
    char symbol;
    int type; // 0 = salute, 1 = punti
};

// Struttura per i pulsanti touch
struct Button {
    int x1, y1, x2, y2;
    string label;
    char action;
};

// Variabili globali
Player player;
vector<Enemy> enemies;
vector<PowerUp> powerups;
vector<Button> buttons;
bool gameRunning = true;
int level = 1;
int autoMoveDirection = 0; // 0=niente, 1=su, 2=giu, 3=sinistra, 4=destra

// Funzione per pulire lo schermo
void clearScreen() {
    #ifdef _WIN32
        system("cls");
    #else
        system("clear");
    #endif
}

// Funzione per inizializzare i pulsanti touch
void initButtons() {
    buttons.clear();
    
    // Pulsanti di movimento e azioni
    buttons.push_back({2, 22, 8, 23, " UP ", 'w'});
    buttons.push_back({2, 24, 8, 25, "DOWN", 's'});
    buttons.push_back({10, 23, 16, 24, "LEFT", 'a'});
    buttons.push_back({18, 23, 24, 24, "RIGHT",'d'});
    buttons.push_back({26, 22, 35, 24, "SHIELD", ' '});
    buttons.push_back({37, 22, 43, 24, "QUIT", 'q'});
}

// Funzione per inizializzare il gioco
void initGame() {
    player.x = PLAYER_START_X;
    player.y = PLAYER_START_Y;
    player.health = 3;
    player.score = 0;
    player.symbol = '@';
    
    enemies.clear();
    powerups.clear();
    
    // Crea nemici iniziali
    for (int i = 0; i < 3 + level; i++) {
        Enemy e;
        e.x = rand() % (GAME_WIDTH - 2) + 1;
        e.y = rand() % 5 + 1;
        e.symbol = 'X';
        enemies.push_back(e);
    }
    
    initButtons();
}

// Funzione per disegnare un pulsante
void drawButton(const Button& btn) {
    cout << "\033[" << (btn.y1 + 1) << ";" << (btn.x1 + 1) << "H";
    cout << "[" << btn.label << "]";
}

// Funzione per disegnare il gioco
void drawGame() {
    clearScreen();
    
    // Crea la mappa
    vector<vector<char>> map(GAME_HEIGHT, vector<char>(GAME_WIDTH, ' '));
    
    // Bordi
    for (int i = 0; i < GAME_WIDTH; i++) {
        map[0][i] = '=';
        map[GAME_HEIGHT - 1][i] = '=';
    }
    for (int i = 0; i < GAME_HEIGHT; i++) {
        map[i][0] = '|';
        map[i][GAME_WIDTH - 1] = '|';
    }
    
    // Giocatore
    if (player.y >= 0 && player.y < GAME_HEIGHT && 
        player.x >= 0 && player.x < GAME_WIDTH) {
        map[player.y][player.x] = player.symbol;
    }
    
    // Nemici
    for (const auto& enemy : enemies) {
        if (enemy.y >= 0 && enemy.y < GAME_HEIGHT && 
            enemy.x >= 0 && enemy.x < GAME_WIDTH) {
            map[enemy.y][enemy.x] = enemy.symbol;
        }
    }
    
    // Power-up
    for (const auto& powerup : powerups) {
        if (powerup.y >= 0 && powerup.y < GAME_HEIGHT && 
            powerup.x >= 0 && powerup.x < GAME_WIDTH) {
            map[powerup.y][powerup.x] = powerup.symbol;
        }
    }
    
    // Stampa la mappa
    for (int i = 0; i < GAME_HEIGHT; i++) {
        for (int j = 0; j < GAME_WIDTH; j++) {
            cout << map[i][j];
        }
        cout << "\n";
    }
    
    // Info
    cout << "\n";
    cout << "HEALTH: ";
    for (int i = 0; i < player.health; i++) cout << "H";
    cout << "   SCORE: " << setw(8) << player.score 
         << "   LEVEL: " << setw(2) << level << "   ENEMIES: " << setw(2) << enemies.size() << "\n";
    cout << "\n";
    
    // Pulsanti touch
    cout << " [UP]    [DOWN]   [LEFT]   [RIGHT]  [SHIELD]  [QUIT]\n";
}

// Funzione per muovere il giocatore
void movePlayer(char direction) {
    switch(direction) {
        case 'w': if (player.y > 1) player.y--; break;
        case 's': if (player.y < GAME_HEIGHT - 2) player.y++; break;
        case 'a': if (player.x > 1) player.x--; break;
        case 'd': if (player.x < GAME_WIDTH - 2) player.x++; break;
    }
}

// Funzione per muovere i nemici
void moveEnemies() {
    for (auto& enemy : enemies) {
        enemy.y++;
        
        // Nemico esce dallo schermo
        if (enemy.y >= GAME_HEIGHT - 1) {
            enemy.y = 0;
            enemy.x = rand() % (GAME_WIDTH - 2) + 1;
            player.score += 10;
        }
        
        // Movimento orizzontale casuale
        if (rand() % 3 == 0) {
            enemy.x += (rand() % 3 - 1);
            if (enemy.x < 1) enemy.x = 1;
            if (enemy.x >= GAME_WIDTH - 1) enemy.x = GAME_WIDTH - 2;
        }
    }
}

// Funzione per creare power-up casualmente
void spawnPowerups() {
    if (rand() % 50 == 0) {
        PowerUp p;
        p.x = rand() % (GAME_WIDTH - 2) + 1;
        p.y = 2;
        p.type = rand() % 2;
        p.symbol = (p.type == 0) ? '+' : '*';
        powerups.push_back(p);
    }
}

// Funzione per muovere power-up
void movePowerups() {
    for (auto it = powerups.begin(); it != powerups.end(); ) {
        it->y++;
        if (it->y >= GAME_HEIGHT - 1) {
            it = powerups.erase(it);
        } else {
            ++it;
        }
    }
}

// Funzione per controllare collisioni
void checkCollisions() {
    // Collisione con nemici
    for (auto it = enemies.begin(); it != enemies.end(); ) {
        if (it->x == player.x && it->y == player.y) {
            player.health--;
            it = enemies.erase(it);
            if (player.health <= 0) {
                gameRunning = false;
            }
        } else {
            ++it;
        }
    }
    
    // Collisione con power-up
    for (auto it = powerups.begin(); it != powerups.end(); ) {
        if (it->x == player.x && it->y == player.y) {
            if (it->type == 0) {
                player.health = min(player.health + 1, 5);
            } else {
                player.score += 50;
            }
            it = powerups.erase(it);
        } else {
            ++it;
        }
    }
}

// Funzione per aumentare il livello
void checkLevelUp() {
    if (player.score >= level * 100) {
        level++;
        for (int i = 0; i < level; i++) {
            Enemy e;
            e.x = rand() % (GAME_WIDTH - 2) + 1;
            e.y = rand() % 5 + 1;
            e.symbol = 'X';
            enemies.push_back(e);
        }
    }
}

// Funzione principale del gioco
void gameLoop() {
    int frameCount = 0;
    int invincibleFrames = 0;
    
    while (gameRunning) {
        drawGame();
        
        // Input TOUCH - leggi un carattere
        char input;
        cout << "\nDigita comando (w=su, s=giu, a=sx, d=dx, spazio=scudo, q=esci): ";
        cin >> input;
        
        if (input == 'q') gameRunning = false;
        else if (input == 'w' || input == 's' || input == 'a' || input == 'd') {
            movePlayer(input);
        }
        else if (input == ' ') {
            invincibleFrames = 100;
            player.symbol = '*';
        }
        
        // Logica del gioco
        moveEnemies();
        movePowerups();
        spawnPowerups();
        
        if (invincibleFrames > 0) {
            invincibleFrames--;
            if (invincibleFrames == 0) {
                player.symbol = '@';
            }
        } else {
            checkCollisions();
        }
        
        checkLevelUp();
        frameCount++;
    }
}

// Funzione per il menu finale
void gameOver() {
    clearScreen();
    cout << "\n";
    cout << "  GAME OVER - DODGE MASTERS!\n";
    cout << "\n";
    cout << "  Final Score: " << player.score << "\n";
    cout << "  Final Level: " << level << "\n";
    cout << "  Final Health: " << player.health << "\n";
    cout << "\n";
}

int main() {
    srand(time(0));
    
    clearScreen();
    cout << "\n";
    cout << "  ===== AWESOME GAME - DODGE MASTERS (TOUCH VERSION) =====\n";
    cout << "\n";
    cout << "  Evita i nemici (X) e raccogli i power-up!\n";
    cout << "  + = Salute   |   * = 50 Punti\n";
    cout << "\n";
    cout << "  Comandi TOUCH:\n";
    cout << "  W = SU\n";
    cout << "  S = GIU\n";
    cout << "  A = SINISTRA\n";
    cout << "  D = DESTRA\n";
    cout << "  SPAZIO = SCUDO (10 secondi)\n";
    cout << "  Q = ESCI\n";
    cout << "\n";
    cout << "  Premi INVIO per iniziare!\n";
    
    cin.get();
    
    initGame();
    gameLoop();
    gameOver();
    
    return 0;
}
