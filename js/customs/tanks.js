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
    this.turret = game.add.sprite(0, 0, 'playerTank', 'turret');
    this.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.shadow = game.add.sprite(0, 0, 'playerTank', 'shadow');
    this.shadow.anchor.setTo(0.5, 0.5);

    // Bring the turret and the tank body to the front
    this.tank.bringToTop();
    this.turret.bringToTop();

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
};

PlayerTank.prototype.update = function(){
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.turret.rotation = this.game.physics.arcade.angleToPointer(this.turret);

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
        bullet.reset(this.turret.x, this.turret.y);
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
    
    // Attach the turret to the tank
    this.turret = game.add.sprite(0, 0, 'enemyTank', 'turret');
    this.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.shadow = game.add.sprite(0, 0, 'enemyTank', 'shadow');
    this.shadow.anchor.setTo(0.5, 0.5);

    // Bring the turret and the tank body to the front
    this.tank.bringToTop();
    this.turret.bringToTop();

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
};

EnemyTank.prototype.update = function(){
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
};

function preload(){
    game.load.image('earth', '/assets/images/scorched_earth.png');
    game.load.atlas('playerTank', '/assets/images/tanks.png', '/assets/images/tanks.json');
    game.load.atlas('enemyTank', '/assets/images/enemy-tanks.png', '/assets/images/tanks.json');
    game.load.image('bullet', '/assets/images/bullet.png');
}

var playerTank;
var cursors;
var numOfEnemyTanks = 5;
var enemyTanks = [];

function create(){
    //game.world.setBounds(-1000, -1000, 2000, 2000);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    var land = game.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'earth');
    //land.fixedToCamera = true;  // TODO what is this

    cursors = game.input.keyboard.createCursorKeys();

    playerTank = new PlayerTank(game.world.centerX, game.world.centerY, game, cursors);

    for (var i = 0; i < numOfEnemyTanks; i++){
        enemyTanks[i] = new EnemyTank(game.world.randomX, game.world.randomY, game, playerTank);
    }
}

function update(){
    playerTank.update();
    for (var i = 0; i < numOfEnemyTanks; i++){
        game.physics.arcade.collide(playerTank, enemyTanks[i].tank);
        enemyTanks[i].update();
    }
}