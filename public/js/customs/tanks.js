var GAME_WIDTH = window.innerWidth;
var GAME_HEIGHT = window.innerHeight;

var playerTank;
var playerTankId = 0;
var playerTankInitialPos = {
    x: 0,
    y: 0
};
// Set of tanks
var tanksList = {};
var mouse;
// Explosions
var NUM_OF_EXPLOSIONS = 10;
var explosions;
var BULLET_DAMAGE = 1;
//TODO remove after finish
var lineGraphics;
var graphics;
var obstacleList;
var graphUtil;

game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'tank-game', { preload: preload, create: eurecaClientSetup, update: update});

var ready = false;
var eurecaServer;
function eurecaClientSetup(){
    var eurecaClient = new Eureca.Client();
    eurecaClient.ready(function (serverProxy){
        eurecaServer = serverProxy;

        // Get current player tank ID
        eurecaClient.exports.setPlayerTankId = function(id){
            playerTankId = id;
            create();
            eurecaServer.handshake(id, playerTankInitialPos);
            ready = true;
        };

        // Kill the tank with the specified ID
        eurecaClient.exports.kill = function(id)
        {
            if (tanksList[id]) {
                tanksList[id].kill();
                console.log('> Killing ', id, tanksList[id]);
            }
        };

        // Spawn a new enemy with the specified ID and position
        eurecaClient.exports.spawnEnemy = function(id, x, y){
            // Do not spawn yourself :v
            if (id == playerTankId) return;

            console.log('> Spawning tank with id = ', id);
            // Add the new enemy to tanksList
            tanksList[id] = new EnemyTank(id, x, y, game, 'enemyTank', playerTank);
        };

        // Update the state of a tank with the specified ID
        eurecaClient.exports.updateState = function(id, state){
            var statePath = state.path;
            var restoredPath = [];
            for (var i = 0; i < statePath.length; i++){
                restoredPath.push(new Vertex(statePath[i].point.x, statePath[i].point.y, statePath[i].key));
            }
            if (tanksList[id])  {
                tanksList[id].path = restoredPath;
                tanksList[id].desireAngle = state.desireAngle;
                tanksList[id].update();
            }
        }
    });
}

/**
 * Abstract Tank class
 * @param id
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @constructor
 */
var Tank = function (id, x, y, game, tankSprite) {
    if (this.constructor === Tank) {
        throw new Error("Can't instantiate abstract class!");
    }
    this.id = id;
    this.game = game;

    this.tank = game.add.sprite(x, y, tankSprite, 'tank_body');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.p2.enable(this.tank);
    this.tank.body.static = true;
    this.tank.body.collideWorldBounds = true;

    // Attach the turret to the tank
    this.turret = game.add.sprite(0, 0, tankSprite, 'tank_gun');
    this.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.shadow = game.add.sprite(0, 0, tankSprite, 'tank_shadow');
    this.shadow.anchor.setTo(0.5, 0.5);

    // Bring the turret and the tank body to the front
    this.tank.bringToTop();
    this.turret.bringToTop();

    // Bullets
    this.bullets = game.add.group();
    this.bullets.createMultiple(30, 'bullet', 0, false); // quantity, key, frame, isExist
    this.game.physics.p2.enable(this.bullets);
    this.bullets.forEach(function (bullet) {
        bullet.body.static = true;
    }, this);
    this.bullets.applySpringForces = false;
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 0.5);
    this.bullets.setAll('outOfBoundsKill', true);
    this.bullets.setAll('checkWorldBounds', true);

    // Other information (default value)
    this.coolDownTime = 0;
    this.fireTime = 0;
    this.hp = 0;
    this.isDied = false;

    // HIEU
    this.finalDestination = null;
    this.path = null;
    this.mouseUpFlag = true;
    this.moveComplete = true;
    this.desireAngle = 0;

    this.tank.tankObject = this;
};

/**
 * PlayerTank class
 * @param id
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @constructor
 */

var PlayerTank = function(id, x, y, game, tankSprite){
    Tank.apply(this, arguments);
    this.coolDownTime = 500;
    this.hp = 10;
};

PlayerTank.prototype = Object.create(Tank);
PlayerTank.prototype.update = function () {
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.turret.rotation = angleToPointer(this.turret, this.game.input);

    // Fire on left click
    if (this.game.input.activePointer.leftButton.isDown){
        if (this.game.time.now - this.coolDownTime > this.fireTime){
            this.fire();
        }
    }

    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 10) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)) {
            this.tank.body.angle += val1;
        } else {
            this.tank.body.angle -= val2;
        }
    } else {
        this.tank.angle = this.desireAngle;
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
        var calculatePath = graphUtil.getShortestPath(new Vertex(x, y, 'start'), new Vertex(this.finalDestination.x, this.finalDestination.y, 'end'));
        this.path = calculatePath.path;
        if (Data.DEBUG) {
            drawPath(this.path, lineGraphics);
        }
        this.finalDestination = calculatePath.des;
        // Update flag
        this.moveComplete = false;
        moveToObject(this.tank, this.path[0].point, 120);
        eurecaServer.handleMovement({
            destination: {
                x: desx,
                y: desy
            },
            path: this.path,
            desireAngle: this.desireAngle
        });
    }
    if (this.game.input.activePointer.rightButton.isUp && this.mouseUpFlag == false) {
        this.mouseUpFlag = true;
    }
    // reset moveComplete flag
    if (this.path && this.path.length == 0) {
        this.moveComplete = true;
    }
    if (this.moveComplete) {
        this.finalDestination = null;
        this.tank.body.velocity.x = 0;
        this.tank.body.velocity.y = 0;
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3) {
        this.path.shift();
    }
    if (this.path && this.path.length > 0) {
        moveToObject(this.tank, this.path[0].point, 120);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
    }
};
PlayerTank.prototype.fire = function () {
    if (this.bullets.countDead() > 0) {
        // Group.getFirstExists(isExist)
        //var bullet = this.bullets.getFirstExists(false);
        var bullet = new Bullet(this.turret.x, this.turret.y, game);
        //bullet.sprite.body.reset(this.turret.x, this.turret.y);
        bullet.sprite.body.rotation = moveToPointer(bullet.sprite, 1000, this.game.input.activePointer);
        this.fireTime = this.game.time.now;
    }
};
PlayerTank.prototype.kill = function () {
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.isDied = true;
};

/**
 * EnemyTank class
 * @param id
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @param playerTank
 * @constructor
 */
var EnemyTank = function (id, x, y, game, tankSprite, playerTank) {
    Tank.apply(this, arguments);
    this.playerTank = playerTank;
    this.coolDownTime = 1000;
    this.hp = 3;
};

EnemyTank.prototype.update = function () {
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.turret.rotation = angleBetween(this.tank, this.playerTank.tank);

    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 5) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)){
            this.tank.body.angle += val1;
        } else {
            this.tank.body.angle -= val2;
        }
    } else {
        this.tank.angle = this.desireAngle;
    }

    // reset moveComplete flag
    if (this.path && this.path.length == 0) {
        this.moveComplete = true;
    }
    if (this.moveComplete) {
        this.finalDestination = null;
        this.tank.body.velocity.x = 0;
        this.tank.body.velocity.y = 0;
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3){
        this.path.shift();
    }
    if (this.path && this.path.length > 0){
        moveToObject(this.tank, this.path[0].point, 120);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
    }

    //this.game.physics.arcade.collide(this.playerTank.tank, this.tank);
    //this.game.physics.arcade.overlap(this.playerTank.bullets, this.tank, this.getShot, null, this);
};
EnemyTank.prototype.getShot = function (tank, bullet) {
    bullet.kill();
    tank.tankObject.hp -= BULLET_DAMAGE;
    if (tank.tankObject.hp <= 0) {
        var explosionAnimation = explosions.getFirstExists(false);
        explosionAnimation.reset(tank.x, tank.y);
        explosionAnimation.play('explode', 30, false, true);
        tank.tankObject.kill();
    }
};
EnemyTank.prototype.kill = function () {
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.isDied = true;
};


var Bullet = function (x, y, game) {
    this.game = game;
    this.sprite = game.add.sprite(x, y, 'bullet');
    game.physics.p2.enable(this.sprite);
    this.sprite.body.static = true;
};


function preload() {
    game.load.image('earth', '/public/assets/images/tank_map.png');
    game.load.atlas('playerTank', '/public/assets/images/red_tank.png', '/public/assets/images/red_tank.json');
    game.load.atlas('enemyTank', '/public/assets/images/blue_tank.png', '/public/assets/images/blue_tank.json');
    game.load.image('bullet', '/public/assets/images/bullet.png');
    game.load.spritesheet('explosion', '/public/assets/images/explosion.png', 64, 64, 23);
}

function create() {
    game.world.setBounds(Data.MAP_DATA.startx, Data.MAP_DATA.starty, Data.MAP_DATA.width, Data.MAP_DATA.height);
    game.stage.disableVisibilityChange = true;
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.add.tileSprite(Data.MAP_DATA.startx, Data.MAP_DATA.starty, Data.MAP_DATA.width, Data.MAP_DATA.height, 'earth');

    mouse = game.input.mouse;

    playerTankInitialPos = {
        x: game.world.randomX,
        y: game.world.randomY
    };

    playerTank = new PlayerTank(playerTankId, playerTankInitialPos.x, playerTankInitialPos.y, game, 'playerTank');
    tanksList[playerTankId] = playerTank;


    explosions = game.add.group();
    for (var i = 0; i < NUM_OF_EXPLOSIONS; i++) {
        var explosion = explosions.create(0, 0, 'explosion', 0, false);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explode');
    }
    // Disable default right click handler
    game.canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };
    // Obstacle
    lineGraphics = game.add.graphics(0, 0);
    graphics = game.add.graphics(0, 0);
    obstacleList = Data.generateObstacle();
    if (Data.DEBUG) {
        for (var obs = 0; obs < obstacleList.length; obs++) {
            obstacleList[obs].draw(graphics);
        }
        drawGrid(graphics);
    }
    graphUtil = new GraphUtils(obstacleList);

    game.camera.follow(playerTank.tank);
    game.camera.focusOnXY(playerTankInitialPos.x, playerTankInitialPos.y);
}

function update(){
    for (var tank in tanksList){
        if (!tanksList[tank].isDied){
            tanksList[tank].update();
        }
    }
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

function drawGrid(graphics) {
    var tileStep = 40;
    //Draw tile from left to right, from top to down
    graphics.lineStyle(1, 0x0000FF, 1);
    for (var y = Data.MAP_DATA.starty; y < Data.MAP_DATA.height; y += tileStep) {
        for (var x = Data.MAP_DATA.startx; x < Data.MAP_DATA.width; x += tileStep) {
            graphics.drawRect(x, y, tileStep, tileStep);
        }
    }
}