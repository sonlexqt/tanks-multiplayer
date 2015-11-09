var GAME_WIDTH = 800;
var GAME_HEIGHT = 600;

var playerTank;
var cursors;
var mouse;
var NUM_OF_ENEMY_TANKS = 0; // TODO set = 0 for multiplayer development
var enemyTanks = [];
var NUM_OF_EXPLOSIONS = 10;
var explosions;
var BULLET_DAMAGE = 1;
//TODO remove after finish
var lineGraphics;
var graphics;
var obstacleList;
var graphUtil;

var ready = false;
var eurecaServer;
function eurecaClientSetup(){
    var eurecaClient = new Eureca.Client();
    eurecaClient.ready(function (serverProxy){
        eurecaServer = serverProxy;
        create();
        ready = true;
    });
}

game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'tank-game', { preload: preload, create: eurecaClientSetup, update: update});

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

    this.tank = game.add.sprite(x, y, tankSprite, 'red_tank');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.tank);
    this.tank.body.collideWorldBounds = true;

    // Attach the turret to the tank
    this.turret = game.add.sprite(0, 0, tankSprite, 'red_tank_turret');
    this.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.shadow = game.add.sprite(0, 0, tankSprite, 'shadow');
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

    // Other information (default value)
    this.currentSpeed = 0;
    this.coolDownTime = 0;
    this.fireTime = 0;
    this.hp = 0;

    // HIEU
    this.rotateVelocity = 4;
    this.moveVelocity = 4;
    this.destinationList = [];
    this.finalDestination = null;
    this.path = null;

    this.tank.tankObject = this;
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
    this.hp = 10;
    this.mouseUpFlag = true;
    this.moveComplete = true;
    this.desireAngle = 0;
};

PlayerTank.prototype = Object.create(Tank);
PlayerTank.prototype.update = function(){
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.turret.rotation = this.game.physics.arcade.angleToPointer(this.turret);
    // Controls handlers
    if (this.cursors.left.isDown){
        this.tank.angle -= this.rotateVelocity;
    }
    else if (this.cursors.right.isDown){
        this.tank.angle += this.rotateVelocity;

    }
    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 5) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)){
            this.tank.angle += val1;
        } else {
            this.tank.angle -= val2;
        }
    } else {
        this.tank.angle = this.desireAngle;
    }
    // Only fire on left click
    if (this.game.input.activePointer.leftButton.isDown)
    {
        if (this.game.time.now - this.coolDownTime > this.fireTime){
            this.fire();
        }
    }
    // Set destination on right click
    if (this.game.input.activePointer.rightButton.isDown && this.mouseUpFlag == true) {
        this.mouseUpFlag = false;
        var desx = Math.round(this.game.input.x + this.game.camera.position.x - GAME_WIDTH / 2);
        var desy = Math.round(this.game.input.y + this.game.camera.position.y - GAME_HEIGHT / 2);
        this.finalDestination = new Phaser.Point(desx, desy);
        lineGraphics.clear();
        var x = Math.round(this.tank.x);
        var y = Math.round(this.tank.y);
        this.path = graphUtil.getShortestPath(new Vertex(x, y, 'start'), new Vertex(this.finalDestination.x, this.finalDestination.y, 'end'));
        //var path = graphUtil.getShortestPath(new Vertex(game.rnd.integerInRange(50, 750), game.rnd.integerInRange(50, 750), 'start'), new Vertex(game.rnd.integerInRange(50, 750), game.rnd.integerInRange(50, 750), 'end'))
        drawPath(this.path, lineGraphics);
        // Update flag
        this.moveComplete = false
        this.game.physics.arcade.moveToObject(this.tank, this.path[0].point, 120);
        console.log("mouse " + this.game.input.x + " - " + this.game.input.y);
        console.log("camera " + this.game.camera.position);
        console.log("tank " + this.tank.position);
        console.log("final des " + this.finalDestination);
    }
    if (this.game.input.activePointer.rightButton.isUp && this.mouseUpFlag == false) {
        this.mouseUpFlag = true;
    }
    // reset moveComplete flag
    if ( this.finalDestination != null && this.finalDestination.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3) {
        this.moveComplete = true;
    }
    if (this.moveComplete && this.finalDestination != null) {
        this.finalDestination = null;
        this.tank.body.velocity.set(0, 0);
        //console.log("finish");
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3){
        this.path.shift();
    }
    if (this.path && this.path.length > 0){
        this.game.physics.arcade.moveToObject(this.tank, this.path[0].point, 120);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
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
PlayerTank.prototype.kill = function(){
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
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
    this.hp = 3;
};

EnemyTank.prototype.update = function(){
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.turret.rotation = this.game.physics.arcade.angleBetween(this.tank, this.playerTank.tank);

    this.game.physics.arcade.collide(this.playerTank.tank, this.tank);
    this.game.physics.arcade.overlap(this.playerTank.bullets, this.tank, this.getShot, null, this);
};
EnemyTank.prototype.getShot = function(tank, bullet){
    bullet.kill();
    tank.tankObject.hp -= BULLET_DAMAGE;
    if (tank.tankObject.hp <= 0){
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(tank.x, tank.y);
        explosionAnimation.play('explode', 30, false, true);
        tank.tankObject.kill();
    }
};
EnemyTank.prototype.kill = function(){
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
};

function preload(){
    //game.load.image('earth', '/public/assets/images/scorched_earth.png');
    game.load.image('earth', '/public/assets/images/tank_map.png');
    //game.load.atlas('playerTank', '/public/assets/images/tanks.png', '/public/assets/images/tanks.json');
    game.load.atlas('enemyTank', '/public/assets/images/enemy-tanks.png', '/public/assets/images/tanks.json');
    game.load.atlas('playerTank', '/public/assets/images/tank_sprite.png', '/public/assets/images/tanks_sprite.json');
    //game.load.atlas('enemyTank', '/public/assets/images/tank_sprite.png', '/public/assets/images/tanks.json');
    game.load.image('bullet', '/public/assets/images/bullet.png');
    game.load.spritesheet('explosion', '/public/assets/images/explosion.png', 64, 64, 23);
}

function create(){
    game.world.setBounds(-1000, -1000, 2059, 2070);
    game.physics.startSystem(Phaser.Physics.ARCADE);

    var land = game.add.tileSprite(-1000, -1000, 2059, 2070, 'earth');
    //land.fixedToCamera = true;  // TODO XIN

    cursors = game.input.keyboard.createCursorKeys();

    mouse = game.input.mouse;
    var playerTankInitialPos = {
        x: game.world.randomX,
        y: game.world.randomY
    };
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
    // Disable deault right click handler
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
    // Obstacle
    lineGraphics = game.add.graphics(0, 0);
    graphics = game.add.graphics(0, 0);
    generateTiles(graphics);
    obstacleList = Data.generateObstacle();
    for (var obs = 0; obs < obstacleList.length; obs++) {
        obstacleList[obs].draw(graphics);
    }
    graphUtil = new GraphUtils(obstacleList);

    game.camera.follow(playerTank.tank);
    game.camera.focusOnXY(playerTankInitialPos.x, playerTankInitialPos.y);
}

function update(){
    if (!ready) return;
    playerTank.update();
    for (var i = 0; i < NUM_OF_ENEMY_TANKS; i++){
        enemyTanks[i].update();
    }
    console.log('> playerTank\'s position:');
    console.log('x: ' + playerTank.tank.x + ' - y: ' + playerTank.tank.y);
}

function drawPath(path, graphics) {
    graphics.lineStyle(3, 0xFF0000, 1);
    graphics.beginFill(0xFF0000, 3);
    for (var vert = 0; vert < path.length - 1; vert++) {
        graphics.moveTo(path[vert].x, path[vert].y);
        graphics.lineTo(path[vert + 1].x, path[vert + 1].y);
    }
    graphics.endFill();
}

function generateTiles(graphics) {
    var tileStep = 40;
    //Draw tile from left to right, from top to down
    graphics.lineStyle(1, 0x0000FF, 1);
    for (var y = 0; y < GAME_HEIGHT; y += tileStep) {
        for (var x = 0; x < GAME_WIDTH; x += tileStep) {
            graphics.drawRect(x, y, tileStep, tileStep);
        }
    }
    //graphics.beginFill(0xFFFF0B, 1);
    //graphics.drawCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 20);
    //graphics.drawCircle(endx, endy, 10);
    //graphics.drawCircle(startx, starty, 10);
    //graphics.moveTo(startx, starty);
    //graphics.lineTo(endx, endy);
    //graphics.endFill();
}