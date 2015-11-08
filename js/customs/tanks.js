var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;

game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'tank-game', { preload: preload, create: create, update: update });

/**
 * Abstract Tank class
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @constructor
 */
var Tank = function(x, y, game, tankSprite){
    if (this.constructor === Tank) {
        throw new Error("Can't instantiate abstract class!");
    }

    this.game = game;

    this.tank = game.add.sprite(x, y, tankSprite, 'tank1');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.tank);
    this.tank.body.collideWorldBounds = true;

    // Attach the turret to the tank
    this.tank.turret = game.add.sprite(0, 0, tankSprite, 'turret');
    this.tank.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.tank.shadow = game.add.sprite(0, 0, tankSprite, 'shadow');
    this.tank.shadow.anchor.setTo(0.5, 0.5);

    // Bring the turret and the tank body to the front
    this.tank.bringToTop();
    this.tank.turret.bringToTop();

    // Bullets
    this.bullets = game.add.group();
    this.bullets.createMultiple(30, 'bullet', 0, false); // quantity, key, frame, isExist
    this.game.physics.arcade.enable(this.bullets);
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    // Other information (default value)
    this.currentSpeed = 0;
    this.coolDownTime = 0;
    this.fireTime = 0;
    this.tank.hp = 0;
};

/**
 * PlayerTank class
 * @param x
 * @param y
 * @param game
 * @param tankSprite ('playerTank')
 * @param cursors
 * @constructor
 */
var PlayerTank = function(x, y, game, tankSprite, cursors){
    Tank.apply(this, arguments);
    this.cursors = cursors;
    this.coolDownTime = 500;
    this.tank.hp = 10;
};

PlayerTank.prototype = Object.create(Tank);
PlayerTank.prototype.update = function(){
    this.tank.turret.x = this.tank.x;
    this.tank.turret.y = this.tank.y;
    this.tank.shadow.x = this.tank.x;
    this.tank.shadow.y = this.tank.y;
    this.tank.shadow.angle = this.tank.angle;
    this.tank.turret.rotation = this.game.physics.arcade.angleToPointer(this.tank.turret);

    // Controls handlers
    if (this.cursors.left.isDown){
        this.tank.angle -= 4;
    }
    else if (this.cursors.right.isDown){
        this.tank.angle += 4;
    }
    if (this.cursors.up.isDown){
        //  The speed we'll travel at
        this.currentSpeed = 200;
    }
    else
    {
        if (this.currentSpeed > 0)
        {
            this.currentSpeed -= 4;
        }
    }
    if (this.currentSpeed > 0)
    {
        this.game.physics.arcade.velocityFromAngle(this.tank.angle, this.currentSpeed, this.tank.body.velocity);
    }
    if (this.game.input.activePointer.isDown)
    {
        if (this.game.time.now - this.coolDownTime > this.fireTime){
            this.fire();
        }
    }
};
PlayerTank.prototype.fire = function(){
    if (this.bullets.countDead() > 0){
        // Group.getFirstExists(isExist)
        var bullet = this.bullets.getFirstExists(false);
        bullet.reset(this.tank.turret.x, this.tank.turret.y);
        // Physics.Arcade.moveToPointer(displayObject, speed (pixels/sec), pointer, maxTime (ms))
        bullet.rotation = this.game.physics.arcade.moveToPointer(bullet, 1000, this.game.input.activePointer, 500);
        this.fireTime = this.game.time.now;
    }
};

/**
 * EnemyTank class
 * @param x
 * @param y
 * @param game
 * @param tankSprite ('enemyTank')
 * @param playerTank
 * @constructor
 */
var EnemyTank = function(x, y, game, tankSprite, playerTank){
    Tank.apply(this, arguments);
    this.playerTank = playerTank;
    this.coolDownTime = 1000;
    this.tank.hp = 3;
};

EnemyTank.prototype.update = function(){
    this.tank.turret.x = this.tank.x;
    this.tank.turret.y = this.tank.y;
    this.tank.shadow.x = this.tank.x;
    this.tank.shadow.y = this.tank.y;
    this.tank.shadow.angle = this.tank.angle;
    this.tank.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.playerTank.tank);

    this.game.physics.arcade.collide(this.playerTank.tank, this.tank);
    this.game.physics.arcade.overlap(this.playerTank.bullets, this.tank, this.getShot, null, this);
};
EnemyTank.prototype.getShot = function(tank, bullet){
    bullet.kill();
    tank.hp -= BULLET_DAMAGE;
    if (tank.hp <= 0){
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(tank.x, tank.y);
        explosionAnimation.play('explode', 30, false, true);
        tank.kill();
        tank.turret.kill();
        tank.shadow.kill();
    }
};

var playerTank;
var cursors;
var NUM_OF_ENEMY_TANKS = 5;
var enemyTanks = [];
var NUM_OF_EXPLOSIONS = 10;
var explosions;
var BULLET_DAMAGE = 1;

function preload(){
    game.load.image('earth', '/assets/images/scorched_earth.png');
    game.load.atlas('playerTank', '/assets/images/tanks.png', '/assets/images/tanks.json');
    game.load.atlas('enemyTank', '/assets/images/enemy-tanks.png', '/assets/images/tanks.json');
    game.load.image('bullet', '/assets/images/bullet.png');
    game.load.spritesheet('explosion', '/assets/images/explosion.png', 64, 64, 23);
}

function create(){
    game.world.setBounds(-1000, -1000, 2000, 2000);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    var land = game.add.tileSprite(-1000, -1000, 2000, 2000, 'earth');

    cursors = game.input.keyboard.createCursorKeys();

    playerTank = new PlayerTank(game.world.centerX, game.world.centerY, game, 'playerTank', cursors);

    for (var i = 0; i < NUM_OF_ENEMY_TANKS; i++){
        enemyTanks[i] = new EnemyTank(game.world.randomX, game.world.randomY, game, 'enemyTank', playerTank);
    }

    explosions = game.add.group();
    for (i = 0; i < NUM_OF_EXPLOSIONS; i++){
        var explosion = explosions.create(0, 0, 'explosion', 0, false);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explode');
    }

    game.camera.follow(playerTank.tank);
}

function update(){
    playerTank.update();
    for (var i = 0; i < NUM_OF_ENEMY_TANKS; i++){
        enemyTanks[i].update();
    }
}