// Game canvas
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = 1500;
canvas.height = 500;

// Game object
let game;
let lastTime;

// Bottons
const playButton = document.getElementById('play_button');
const howtoButton = document.getElementById('howto_button');
// const scoreButton = document.getElementById('score_button');
const howtoback_button = document.getElementById('howtoback_button');
const home_button = document.getElementById('home_button');
const retry_button = document.getElementById('retry_button');

// Sounds
const buttonclickMusic = document.getElementById('buttonclick');
let backgroundMusic;


const gameName = document.getElementById('gameName');
var title = 'Space Shooter';
var developerMode = '';
var muteMode = '';
let isMute = false;
let isGameStart = false;
let isHomeButtonClicked = false;
let isRetryButtonClicked = false;
let winLooseSound = true;

// Solid background
const background = new Image();
background.src = document.getElementById('background').src;
const howto_image = new Image();
howto_image.src = document.getElementById('howto_image').src;

function webTitle() {
    document.title = muteMode + title + developerMode;
}

class InputHandler {
    constructor(game) {
        this.game = game;
        // KeyDown
        window.addEventListener('keydown', e => {
            if (((e.key === 'ArrowUp') || (e.key === 'ArrowDown')) && this.game.keys.indexOf(e.key) === -1 && isGameStart) {
                this.game.keys.push(e.key);
            } else if (e.key === ' ' && isGameStart) {
                this.game.player.shootMiddle();
            } else if (e.key === 'd' && isGameStart) {
                this.game.debug = !this.game.debug;
                if (this.game.debug) {
                    developerMode = ' (Developer)';
                } else {
                    developerMode = '';
                }
                webTitle();
            }
        });
        // KeyUp
        window.addEventListener('keyup', e => {
            if (this.game.keys.indexOf(e.key) > -1) {
                this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
            }
        });
    }
}

class SoundController {
    constructor() {
        this.shootSound = document.getElementById("shot");
        this.powerupSound = document.getElementById("powerup");
        this.powerdownSound = document.getElementById("powerdown");
        this.smokeExplosionSound = document.getElementById("smokeExplosion");
        this.hitSound = document.getElementById("hit");
        this.shieldSound = document.getElementById("shieldSound");
        this.looseSound = document.getElementById('looseSound');
        this.winSound = document.getElementById('winSound');
    }
    playerWin() {
        this.winSound.currentTime = 0;
        if (!muteMode) this.winSound.play();
    }
    playerLoose() {
        this.looseSound.currentTime = 0;
        if (!muteMode) this.looseSound.play();
    }
    shield() {
        this.shieldSound.currentTime = 0;
        if (!muteMode) this.shieldSound.play();
    }
    hit() {
        this.hitSound.currentTime = 0;
        if (!muteMode) this.hitSound.play();
    }
    smokeExplosion() {
        this.smokeExplosionSound.currentTime = 0;
        if (!muteMode) this.smokeExplosionSound.play();
    }
    powerUp() {
        this.powerupSound.currentTime = 0;
        if (!muteMode) this.powerupSound.play();
    }
    powerDown() {
        this.powerdownSound.currentTime = 0;
        if (!muteMode) this.powerdownSound.play();
    }
    shot() {
        this.shootSound.currentTime = 0;
        if (!muteMode) this.shootSound.play();
    }
}

class Shield {
    constructor(game) {
        this.game = game;
        this.width = this.game.player.width;
        this.height = this.game.player.height;
        this.frameX = 0;
        this.maxFrame = 9;
        this.image = document.getElementById("shield");
        this.fps = 10;
        this.timer = 0;
        this.interval = 1000 / this.fps;
    }
    update(deltaTime) {
        if (this.frameX <= this.maxFrame) {
            if (this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
        }
    }
    draw(context) {
        context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height, this.game.player.x, this.game.player.y, this.width, this.height);
    }
    reset() {
        this.frameX = 0;
        this.game.sound.shield();
    }
}

class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.width = 10;
        this.height = 2;
        this.x = x;
        this.y = y - this.height * 0.5;
        this.speed = 3;
        this.markedForDeletion = false;
        this.image = document.getElementById('laserBlue01');
    }
    update() {
        this.x += this.speed;
        if (this.x > this.game.width * 0.8) {
            this.markedForDeletion = true;
        }
    }
    draw(context) {
        context.drawImage(this.image, this.x, this.y);
    }

}
class Particle {

}
class Player {
    constructor(game) {
        this.game = game;
        this.width = 75;
        this.height = 99;
        this.x = 20;
        this.y = (canvas.height - this.height) * 0.5;
        this.speedY = 0;
        this.maxSpeed = 2; // player move speed
        this.projectiles = [];
        this.images = [document.getElementById('playerShip1'), document.getElementById('playerShip2')]
        this.image = this.images[0];
        this.powerUp = false;
        this.powerUpTimer = 0;
        this.powerUpLimit = 10000; // 5 Sec
    }
    update(deltaTime) {
        if (this.game.keys.includes('ArrowUp')) {
            this.speedY = -this.maxSpeed;
        } else if (this.game.keys.includes('ArrowDown')) {
            this.speedY = this.maxSpeed;
        } else {
            this.speedY = 0;
        }
        this.y += this.speedY;
        // Vertical boundaries
        if (this.y > this.game.height - this.height * 0.5) {
            this.y = this.game.height - this.height * 0.5;
        } else if (this.y < -this.height * 0.5) {
            this.y = -this.height * 0.5;
        }
        // Handle projectiles
        this.projectiles.forEach(projectile => {
            projectile.update();
        });
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
        // Power up state
        if (this.powerUp) {
            if (this.powerUpTimer > this.powerUpLimit) {
                this.powerUpTimer = 0;
                this.powerUp = false;
                this.image = this.images[0];
                this.game.sound.powerDown();
            } else {
                this.powerUpTimer += deltaTime;
                this.image = this.images[1];
                this.game.ammo += 0.1;
            }
        }
    }
    draw(context) {
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, this.width, this.height);
        }
        context.drawImage(this.image, this.x, this.y);
        this.projectiles.forEach(Projectile => {
            Projectile.draw(context);
        });
    }
    shootMiddle() {
        if (this.game.ammo > 0) {
            this.projectiles.push(new Projectile(this.game, this.x + this.width, this.y + this.height * 0.5));
            this.game.ammo--;
        }
        this.game.sound.shot();
        if (this.powerUp) {
            this.shootTails();
        }
    }
    shootTails() {
        if (this.game.ammo > 0) {
            this.projectiles.push(new Projectile(this.game, this.x + 41, this.y + 2));
            this.projectiles.push(new Projectile(this.game, this.x + 41, this.y + this.height - 2));
        }
    }
    enterPowerUp() {
        this.powerUpTimer = 0;
        this.powerUp = true;
        if (this.game.ammo < this.game.maxAmmo) {
            this.game.ammo = this.game.maxAmmo;
        }
        this.game.sound.powerUp();
        this.image = this.images[1]; // Red ship
    }
}
class Enemy {
    constructor(game) {
        this.game = game;
        this.x = this.game.width;
        this.speedX = Math.random() * - 1.5 - 0.5;
        this.markedForDeletion = false;

    }
    update() {
        this.x += this.speedX - this.game.speed;
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }
    draw(context) {
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.fillStyle = 'black';
            context.font = '20px Helvetica';
            context.fillText(this.lives, this.x, this.y);
        }
        context.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

}

class EnemyType1 extends Enemy { // Gray ship enemy
    constructor(game) {
        super(game);
        this.width = 84;
        this.height = 103;
        this.lives = 3;
        this.score = this.lives;
        this.image = document.getElementById('enemy1');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'enemyShip';
    }
}

class EnemyType2 extends Enemy { // Blue ship enemy
    constructor(game) {
        super(game);
        this.width = 84;
        this.height = 97;
        this.lives = 5;
        this.score = this.lives;
        this.image = document.getElementById('enemy2');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'enemyShip';
    }
}

class EnemyType3 extends Enemy { // Green ship enemy
    constructor(game) {
        super(game);
        this.width = 84;
        this.height = 93;
        this.lives = 6;
        this.score = this.lives;
        this.image = document.getElementById('enemy3');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'enemyShip';
    }
}

class EnemyType4 extends Enemy { // Green ship enemy
    constructor(game) {
        super(game);
        this.width = 84;
        this.height = 82;
        this.lives = 8;
        this.score = this.lives;
        this.image = document.getElementById('enemy4');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'enemyShip';
    }
}

class Meteor extends Enemy { // Meteor
    constructor(game) {
        super(game);
        this.rotation = 0; // initialize the rotation angle to zero
        this.rotationSpeed = (Math.random() * 0.2 - 0.1) * (Math.random() < 0.5 ? -1 : 1); // generate a random rotation speed in both directions
    }
    update() {
        this.x += this.speedX - this.game.speed;
        this.rotation += this.rotationSpeed; // update the rotation angle
        if (this.x + this.width < 0) {
            this.markedForDeletion = true;
        }
    }
    draw(context) {
        context.save(); // save the canvas state
        context.translate(this.x + this.width / 2, this.y + this.height / 2); // move the origin to the center of the meteor
        context.rotate(this.rotation); // rotate the canvas by the rotation angle
        context.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height); // draw the meteor centered at the origin
        context.restore(); // restore the canvas state
        if (this.game.debug) {
            context.strokeRect(this.x, this.y, this.width, this.height);
            context.fillStyle = 'black';
            context.font = '20px Helvetica';
            context.fillText(this.lives, this.x, this.y);
        }
    }
}
class MeteorBrown1 extends Meteor { // Big brown meteor
    constructor(game) {
        super(game);
        this.width = 89;
        this.height = 82;
        this.lives = 10;
        this.score = 17;
        this.image = document.getElementById('meteorBrown1');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'meteorBrown1';
        this.rotationSpeed = (Math.random() * 0.2 - 0.1) * (Math.random() < 0.5 ? -1 : 1); // generate a random rotation speed in both directions
    }
}


class MeteorBrown2 extends Meteor { // little brown meteor
    constructor(game) {
        super(game);
        this.width = 29;
        this.height = 26;
        this.lives = 5;
        this.score = 15;
        this.image = document.getElementById('meteorBrown2');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'meteorBrown2';
        this.rotationSpeed = (Math.random() * 0.2 - 0.05) * (Math.random() < 0.5 ? -1 : 1); // generate a random rotation speed in both directions    
    }
}

class MeteorGrey1 extends Meteor { // small grey meteor
    constructor(game) {
        super(game);
        this.width = 45;
        this.height = 40;
        this.lives = 9;
        this.score = 13;
        this.image = document.getElementById('meteorGrey1');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'meteorGrey1';
        this.rotationSpeed = (Math.random() * 0.2 - 0.075) * (Math.random() < 0.5 ? -1 : 1); // generate a random rotation speed in both directions  
    }
}

class BoltGold extends Enemy { // Gold bolt
    constructor(game) {
        super(game);
        this.width = 19;
        this.height = 30;
        this.lives = 1;
        this.score = 0;
        this.image = document.getElementById('boltGold');
        this.y = Math.random() * (this.game.height - this.height);
        this.type = 'boltGold';
    }
}

class Layer {
    constructor(game, image, speedModifier) {
        this.game = game;
        this.image = image;
        this.speedModifier = speedModifier;
        this.width = 1768;
        this.height = 500;
        this.x = 0;
        this.y = 0;
    }
    update() {
        if (this.x <= -this.width) {
            this.x = 0;
        }
        this.x -= this.game.speed * this.speedModifier;
    }
    draw(context) {
        context.drawImage(this.image, this.x, this.y);
        context.drawImage(this.image, this.x + this.width, this.y);
    }

}
class Background {
    constructor(game) {
        this.game = game;
        this.image1 = document.getElementById('background_empty');
        this.layer1 = new Layer(this.game, this.image1, 1);
        this.layers = [this.layer1];
    }
    update() {
        this.layers.forEach(layer => layer.update());
    }
    draw(context) {
        this.layers.forEach(layer => layer.draw(context));
    }

}

class Explosion {
    constructor(game, x, y) {
        this.game = game;
        this.frameX = 0;
        this.fps = 30;
        this.timer = 0;
        this.interval = 1000 / this.fps;
        this.markedForDeletion = false;
    }
    update(deltaTime) {
        this.x -= this.game.speed;
        if (this.timer > this.interval) {
            this.frameX++;
            this.timer = 0;
        } else {
            this.timer += deltaTime;
        }
        if (this.frameX > this.maxFrame) {
            this.markedForDeletion = true;
        }
    }
    draw(context) {
        context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

class FireExplosion extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);
        this.image = document.getElementById('fireExplosion');
        this.spriteWidth = 100;
        this.spriteHeight = 107;
        this.width = this.spriteWidth;
        this.height = this.spriteHeight;
        this.x = x - this.width * 0.5;
        this.y = y - this.height * 0.5;
        this.maxFrame = 7;
    }
}

class SmokeExplosion1 extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);
        this.image = document.getElementById('smokeExplosion1');
        this.spriteWidth = 90;
        this.spriteHeight = 90;
        this.width = this.spriteWidth;
        this.height = this.spriteHeight;
        this.x = x - this.width * 0.5;
        this.y = y - this.height * 0.5;
        this.maxFrame = 8;
    }
}

class SmokeExplosion2 extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);
        this.image = document.getElementById('smokeExplosion2');
        this.spriteWidth = 45;
        this.spriteHeight = 45;
        this.width = this.spriteWidth;
        this.height = this.spriteHeight;
        this.x = x - this.width * 0.5;
        this.y = y - this.height * 0.5;
        this.maxFrame = 8;
    }
}

class SmokeExplosion3 extends Explosion {
    constructor(game, x, y) {
        super(game, x, y);
        this.image = document.getElementById('smokeExplosion3');
        this.spriteWidth = 30;
        this.spriteHeight = 30;
        this.width = this.spriteWidth;
        this.height = this.spriteHeight;
        this.x = x - this.width * 0.5;
        this.y = y - this.height * 0.5;
        this.maxFrame = 8;
    }
}

class UI {
    constructor(game) {
        this.game = game;
        this.fontSize = 20;
        this.fontFamily = 'Bangers';
        this.color = 'white';
    }
    draw(context) {
        context.save();
        context.fillStyle = this.color;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = 'black';
        context.font = this.fontSize + 'px ' + this.fontFamily;
        // Display score
        context.fillText('Score: ' + this.game.score, 20, 40);
        // Display game timer
        context.fillText('Timer: ' + (this.game.gameTime * 0.001).toFixed(1), 20, 100);
        // Game Win/Over
        if (this.game.gameOver) {
            context.textAlign = 'center';
            let message1;
            let message2;
            if (this.game.score > this.game.winningScore) {
                message1 = 'Most Wondrous!';
                message2 = 'Well done explorer!';
            } else {
                message1 = 'Blazes!';
                message2 = 'Good luck next time!';
            }
            context.font = '70px ' + this.fontFamily;
            context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 5);
            context.font = '25px ' + this.fontFamily;
            context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 30);
        }
        // Change display color when it's powerup
        if (this.game.player.powerUp) {
            context.fillStyle = '#FFCC00';
        }
        // Display ammo            
        for (let i = 0; i < this.game.ammo; i++) {
            context.fillRect(20 + 5 * i, 50, 3, 20)
        }

        context.restore();
    }
}
class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.background = new Background(this);
        this.player = new Player(this);
        this.input = new InputHandler(this);
        this.ui = new UI(this);
        this.sound = new SoundController();
        this.shield = new Shield(this);
        this.keys = [];
        this.enemies = [];
        this.explosions = [];
        this.enemyTimer = 0;
        this.enemyInterval = 1000; // 1 Sec
        this.ammo = 20;
        this.maxAmmo = 50;
        this.ammoTimer = 0;
        this.ammoInterval = 350; // 0.35 Sec
        this.gameOver = false;
        this.score = 0;
        this.winningScore = 400; // Winning score
        this.gameTime = 0;
        this.timeLimit = 90000; // Game time limit => 90 Sec
        this.speed = 1; // Game speed
        this.debug = false; // Debug mode
    }
    update(deltaTime) {
        if (!this.gameOver) {
            this.gameTime += deltaTime;
        }
        // Winning/Loosing sound
        if (this.gameTime > this.timeLimit) {
            this.gameOver = true;
            if (this.score > this.winningScore) {
                if(winLooseSound && isGameStart){
                    this.sound.playerWin(); // Winning sound
                    winLooseSound = false;
                }
            }else {
                if(winLooseSound && isGameStart){
                    this.sound.playerLoose(); // Loosing sound
                    winLooseSound = false;
                }
            }
            // Show home button
            home_button.style.display = 'block';
            home_button.disabled = false;
            // Show retry button
            retry_button.style.display = 'block';
            retry_button.disabled = false;
        }
        this.background.update(deltaTime);
        this.player.update(deltaTime);
        this.shield.update(deltaTime);
        if (this.ammoTimer > this.ammoInterval) {
            if (this.ammo < this.maxAmmo) {
                this.ammo++;
            }
            this.ammoTimer = 0;
        } else {
            this.ammoTimer += deltaTime;
        }
        this.explosions.forEach(explosion => explosion.update(deltaTime));
        this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion); this.enemies.forEach(enemy => {
            enemy.update();
            // Check collition with the enemy/powerUp
            if (this.checkCollision(this.player, enemy)) {
                enemy.markedForDeletion = true;
                this.shield.reset();
                if (enemy.type === 'boltGold') {
                    this.player.enterPowerUp();
                } else if (enemy.type === 'meteorBrown1') {
                    this.addExplosion(enemy);
                    if(!this.gameOver) this.score -= 6;
                } else if (enemy.type === 'meteorBrown2') {
                    this.addExplosion(enemy);
                    if(!this.gameOver) this.score -= 8;
                } else if (enemy.type === 'meteorGrey1') {
                    this.addExplosion(enemy);
                    if(!this.gameOver) this.score -= 10;
                }                
                if(!this.gameOver) this.score -= 5; // For all other enemy ships
                if (this.score <= 0) this.score = 0;
                this.addExplosion(enemy);
            }
            // Check collition with projectiles
            this.player.projectiles.forEach(projectile => {
                if (this.checkCollision(projectile, enemy)) {
                    enemy.lives--;
                    projectile.markedForDeletion = true;
                    if (enemy.lives <= 0) {
                        if (enemy.type === 'meteorBrown1' || enemy.type === 'meteorBrown2' || enemy.type === 'meteorGrey1') {
                            this.sound.smokeExplosion();
                            this.addExplosion(enemy);
                        } else if (enemy.type === 'enemyShip') {
                            this.sound.hit();
                            this.addExplosion(enemy);
                        }
                        enemy.markedForDeletion = true;
                        if (!this.gameOver) {
                            this.score += enemy.score;
                        }                        
                        // if (this.score > this.winningScore) {
                        //     this.gameOver = true;
                        // }
                    }
                }
            });
        });
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
            this.addEnemy();
            this.enemyTimer = 0;
        } else {
            this.enemyTimer += deltaTime;
        }
    }
    draw(context) {
        this.background.draw(context);
        this.player.draw(context);
        this.shield.draw(context);
        this.enemies.forEach(enemy => {
            enemy.draw(context);
        });
        this.explosions.forEach(explosion => {
            explosion.draw(context);
        });
        this.ui.draw(context);
    }
    addEnemy() {
        const randomize = Math.random();
        if (randomize < 0.05) {
            this.enemies.push(new BoltGold(this));
        } else if (randomize < 0.07) {
            this.enemies.push(new MeteorGrey1(this));
        } else if (randomize < 0.1) {
            this.enemies.push(new MeteorBrown2(this));
        } else if (randomize < 0.2) {
            this.enemies.push(new MeteorBrown1(this));
        } else if (randomize < 0.5) {
            this.enemies.push(new EnemyType4(this));
        } else if (randomize < 0.6) {
            this.enemies.push(new EnemyType3(this));
        } else if (randomize < 0.7) {
            this.enemies.push(new EnemyType2(this));
        } else if (randomize < 0.8) {
            this.enemies.push(new EnemyType1(this));
        }
    }
    addExplosion(enemy) {
        if (enemy.type === 'meteorBrown1') {
            this.explosions.push(new SmokeExplosion1(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
        } else if (enemy.type === 'meteorGrey1') {
            this.explosions.push(new SmokeExplosion2(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
        } else if (enemy.type === 'meteorBrown2') {
            this.explosions.push(new SmokeExplosion3(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
        } else if (enemy.type === 'enemyShip') {
            this.explosions.push(new FireExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
        }

    }
    checkCollision(rect1, rect2) {
        return (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y);
    }
}

function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas for looping
    game.update(deltaTime);
    game.draw(ctx);
    if(isHomeButtonClicked || isRetryButtonClicked){
        retry_button.style.display = 'none';
        retry_button.disabled = true;
        home_button.style.display = 'none';
        home_button.disabled = true;
        if(isHomeButtonClicked){            
            isGameStart = false;
            homePage();
        }
        isHomeButtonClicked = false;
        isRetryButtonClicked = false;
    }else{        
        requestAnimationFrame(animate);         
    }
}

function homePage(){
    // draw the image onto the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height); // Draw image
    // Show buttons
    gameName.style.display = 'block';
    playButton.style.display = 'block';
    playButton.disabled = false;
    howtoButton.style.display = 'block';
    howtoButton.disabled = false; 
    // scoreButton.style.display = 'block';       
    // scoreButton.disabled = false;    
    // Hide buttons
    howtoback_button.style.display = 'none';
    howtoback_button.disabled = true;
    home_button.style.display = 'none';
    home_button.disabled = true;
    retry_button.style.display = 'none';
    retry_button.disabled = true;
}

function m(){
    document.addEventListener('keydown', function (event) {
        if (event.key === 'm') {
            isMute = !isMute;
            if (!isGameStart) backgroundMusic.muted = isMute;
            if (isMute) {
                muteMode = '\u{1F507} ';
            } else {
                if (!isGameStart) backgroundMusic.play();
                muteMode = '';
            }
            webTitle();
        }
    });
}

function backgroundSound(){
    backgroundMusic = document.getElementById('backgroundmusic');
    // loop the background music until start button is clicked
    backgroundMusic.addEventListener('ended', function () {
        this.currentTime = 0;
        this.play();
    }, false);
    if(!isMute) backgroundMusic.play();
    m(); // Key press event "m"
}

function defaultButtonSettings(){
    playButton.disabled = false;
    playButton.style.display = 'block';
    howtoButton.disabled = false;
    howtoButton.style.display = 'block';
    // scoreButton.disabled = false;
    // scoreButton.style.display = 'block';
}

function buttonActionListners(){ 
    retry_button.addEventListener('click', () => {
        buttonclickMusic.play(); // Button click sound
        // Reset variable values    
        isHomeButtonClicked = false;
        isGameStart = true;
        isRetryButtonClicked = true;
        winLooseSound = true;
        // Hide buttons
        home_button.style.display = 'none';
        home_button.disabled = true;
        retry_button.style.display = 'none';
        retry_button.disabled = true;
        /////////
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas
        backgroundMusic.pause(); // Remove background music
        // background.remove(); 
        lastTime = performance.now(); // Set the initial value for lastTime
        game = new Game(canvas.width, canvas.height);
        animate(performance.now()); // Pass the current time   
    });
    home_button.addEventListener('click', () => {
        buttonclickMusic.play(); // Button click sound
        // Reset variable values    
        isHomeButtonClicked = true;
        isGameStart = false;
        isRetryButtonClicked = false;
        winLooseSound = true;        
        // Home page display
        defaultButtonSettings();
        homePage();
        backgroundSound();        
        m(); // Key press event "m"
    });
    howtoback_button.addEventListener('click', () => {
        buttonclickMusic.play(); // Button click sound
        homePage();
    });
    // scoreButton.addEventListener('click', () => {
    //     buttonclickMusic.play(); // Button click sound
    //     gameName.style.display = 'none';
    // });
    howtoButton.addEventListener('click', () => {
        buttonclickMusic.play(); // Button click sound
        // Hide items
        gameName.style.display = 'none';
        playButton.style.display = 'none';
        howtoButton.disabled = true;
        howtoButton.style.display = 'none';
        // scoreButton.disabled = true;
        // scoreButton.style.display = 'none';
        // Show items
        ctx.drawImage(howto_image, 0, 0, canvas.width, canvas.height);
        howtoback_button.style.display = 'block';
        howtoback_button.disabled = false;
    });
    playButton.addEventListener('click', () => {
        buttonclickMusic.play(); // Button click sound
        playButton.disabled = true;
        gameName.style.display = 'none';
        playButton.style.display = 'none';
        howtoButton.disabled = true;
        howtoButton.style.display = 'none';
        // scoreButton.disabled = true;
        // scoreButton.style.display = 'none';
        isGameStart = true;
        isHomeButtonClicked = false;
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear canvas
        backgroundMusic.pause(); // Remove background music
        // background.remove(); 
        lastTime = performance.now(); // Set the initial value for lastTime
        game = new Game(canvas.width, canvas.height);
        animate(performance.now()); // Pass the current time        
    });
}

function start() {
    background.onload = function () {
        // Home page display
        homePage();
        // Background music
        backgroundSound();
        // Action listners for all buttons
        buttonActionListners();
    };
}

start();