var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;

game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'tank-game', { preload: preload, create: create, update: update });

var PlayerTank = function(x, y, game, cursors){
    this.game = game;
    this.cursors = cursors;

    this.tank = game.add.sprite(x, y, 'playerTank', 'tank1');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.tank);
    this.tank.body.collideWorldBounds = true;

    // Attach the turret to the tank
    this.tank.turret = game.add.sprite(0, 0, 'playerTank', 'turret');
    this.tank.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.tank.shadow = game.add.sprite(0, 0, 'playerTank', 'shadow');
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

    // Other information
    this.currentSpeed = 0;
    this.coolDownTime = 500;
    this.fireTime = 0;

    this.tank.hp = 10;
};

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
        this.currentSpeed = 100;
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

var EnemyTank = function(x, y, game, playerTank){
    this.playerTank = playerTank;
    this.game = game;

    this.tank = game.add.sprite(x, y, 'enemyTank', 'tank1');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.tank);
    this.tank.body.collideWorldBounds = true;
    this.tank.body.immovable = true;

    // Attach the turret to the tank
    this.tank.turret = game.add.sprite(0, 0, 'enemyTank', 'turret');
    this.tank.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.tank.shadow = game.add.sprite(0, 0, 'enemyTank', 'shadow');
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

    // Other information
    this.currentSpeed = 0;
    this.coolDownTime = 500;
    this.fireTime = 0;
    this.tank.hp = 5;
};

EnemyTank.prototype.update = function(){
    this.tank.turret.x = this.tank.x;
    this.tank.turret.y = this.tank.y;
    this.tank.shadow.x = this.tank.x;
    this.tank.shadow.y = this.tank.y;
    this.tank.shadow.angle = this.tank.angle;
    this.tank.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.playerTank.tank);

    this.game.physics.arcade.collide(this.playerTank.tank, this.tank);
    this.game.physics.arcade.overlap(this.playerTank.bullets, this.tank, this.getShotByPlayerTank, null, this);
};

EnemyTank.prototype.getShotByPlayerTank = function(tank, bullet){
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
    //game.world.setBounds(-1000, -1000, 2000, 2000);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    var land = game.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'earth');
    //land.fixedToCamera = true;  // TODO what is this

    cursors = game.input.keyboard.createCursorKeys();

    playerTank = new PlayerTank(game.world.centerX, game.world.centerY, game, cursors);

    for (var i = 0; i < NUM_OF_ENEMY_TANKS; i++){
        enemyTanks[i] = new EnemyTank(game.world.randomX, game.world.randomY, game, playerTank);
    }

    explosions = game.add.group();
    for (var i = 0; i < NUM_OF_EXPLOSIONS; i++){
        var explosion = explosions.create(0, 0, 'explosion', 0, false);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explode');
    }
}

function update(){
    playerTank.update();
    for (var i = 0; i < NUM_OF_ENEMY_TANKS; i++){
        enemyTanks[i].update();
    }
}