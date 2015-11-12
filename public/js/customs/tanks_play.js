// Current player's tank information
var playerTank;
var playerTankId = 0;
var playerTankInitialPos = {
    x: 0,
    y: 0
};
var playerTankHPText;
var scoreText;
var playerTankLevel;
// Set of tanks
var tanksList = {};
var blueTeamTanks = 0;
var redTeamTanks = 0;
// TODO
var playerInitialCPUTanks = 2;
var mouse;
// Explosions
var NUM_OF_EXPLOSIONS = 10;
var explosions;
// Bullets
var bulletList = {};
var BULLET_DAMAGE = 10;
//TODO remove after finish
var lineGraphics;
var graphics;
var obstacleList;
var graphUtil;
var platforms;
var hpItems;
var weaponItems;

var ready = false; // ready = "is connected to server ?"
var eurecaServer;


function eurecaClientSetup() {
    var eurecaClient = new Eureca.Client();
    eurecaClient.ready(function (serverProxy) {
        eurecaServer = serverProxy;

        // Get current player tank ID
        eurecaClient.exports.setPlayerTankId = function (id) {
            playerTankId = id;
            _create();
            eurecaServer.handshake(id, playerTankName, playerTankSelectedTeam, playerTankInitialPos);
            ready = true;
        };

        // Kill the tank with the specified ID
        eurecaClient.exports.kill = function (id) {
            if (tanksList[id]) {
                tanksList[id].kill();
                console.log('> Killing ', id, tanksList[id]);
            }
        };

        // Spawn a new tank with the specified ID and position
        eurecaClient.exports.spawnNewTank = function (id, name, teamNumber, x, y) {
            // Do not spawn yourself :v
            if (id == playerTankId) return;

            console.log('> Spawning tank with id = ', id);
            // Add the new enemy to tanksList
            var tankSprite = (teamNumber == 1) ? 'blueTank' : 'redTank';
            tanksList[id] = new OtherPlayerTank(id, name, teamNumber, x, y, game, tankSprite, playerTank);
            //console.log(tanksList[id]);
            //console.log('id: ' + id + ' - x: ' + x + ' - y: ' + y);
            // Fix the new tank's position
            tanksList[id].tank.x = x;
            tanksList[id].tank.y = y;
        };

        // Spawn a new CPU tank
        eurecaClient.exports.spawnNewCPUTank = function (id, name, teamNumber, x, y) {
            // Do not spawn your existing teammates again !
            if (tanksList[id]) return;
            var tankSprite = (teamNumber == 1) ? 'blueTank' : 'redTank';
            tanksList[id] = new CPUTank(id, name, teamNumber, x, y, game, tankSprite);
            // Fix the new tank's position
            tanksList[id].tank.x = x;
            tanksList[id].tank.y = y;
        };

        // Update the movement of a tank with the specified ID
        eurecaClient.exports.updateMovement = function (id, state) {
            var statePath = state.path;
            var restoredPath = [];
            for (var i = 0; i < statePath.length; i++) {
                restoredPath.push(new Vertex(statePath[i].point.x, statePath[i].point.y, statePath[i].key));
            }
            if (tanksList[id]) {
                tanksList[id].path = restoredPath;
                tanksList[id].desireAngle = state.desireAngle;
                tanksList[id].update();
            }
        };

        // Update the movement of a CPUT tank with the specified ID
        eurecaClient.exports.updateCPUMovement = function (state) {
            var id = state.cpuId;
            var statePath = state.path;
            var restoredPath = [];
            for (var i = 0; i < statePath.length; i++) {
                restoredPath.push(new Vertex(statePath[i].point.x, statePath[i].point.y, statePath[i].key));
            }
            if (tanksList[id]) {
                tanksList[id].path = restoredPath;
                tanksList[id].desireAngle = state.desireAngle;
                tanksList[id].update();
            }
        };

        // Update new fires
        eurecaClient.exports.updateFire = function (fireInfo) {
            if (tanksList[fireInfo.tankId]) {
                // For CPU tank's fireTime
                if (fireInfo.fireTime) {
                    tanksList[fireInfo.tankId].fireTime = fireInfo.fireTime;
                }
                // Update the the turret rotation of the tank which fired
                tanksList[fireInfo.tankId].turret.rotation = fireInfo.turret.rotation;
                // Create a new bullet & make it move
                var bullet = new Bullet(fireInfo.bulletInitialPos.x, fireInfo.bulletInitialPos.y, game, tanksList[fireInfo.tankId]);
                bulletList[bullet.sprite.id] = bullet;
                bullet.sprite.rotation = moveToPointer(bullet.sprite, 1000, fireInfo.pointer);
                // Play bullet fire sound
                AudioManager.playBulletSound(1);
            }
        };

        // Update tank hit bullets
        eurecaClient.exports.updateTankHitBullets = function (bulletInfo) {
            if (tanksList[bulletInfo.id]) {
                var tank = tanksList[bulletInfo.id].tank;
                if (BULLET_DAMAGE - 2 * tank.tankObject.level > 1) {
                    tank.tankObject.hp -= (BULLET_DAMAGE - 2 * tank.tankObject.level);
                } else {
                    tank.tankObject.hp -= 1;
                }
                if (tank.tankObject.hp <= 0) {
                    if (tank.tankObject.teamNumber == playerTankSelectedTeam) {
                        eurecaServer.handleTankDeath(tank.tankObject.id, tank.tankObject.isCPUTank);
                    }
                    var explosionAnimation = explosions.getFirstExists(false);
                    explosionAnimation.reset(tank.x, tank.y);
                    explosionAnimation.play('explode', 30, false, true);
                    tank.tankObject.kill();
                    // Play bullet explosion sound
                    AudioManager.playExplosionSound();
                    tanksList[bulletInfo.ownerId].level++;
                }
            }
            // TODO XIN
            //else if (cpuTankList[bulletInfo.tankId]) {
            //    var tank = tanksList[bulletInfo.tankId].tank;
            //    tank.tankObject.hp -= BULLET_DAMAGE
            //    if (tank.tankObject.hp <= 0) {
            //        var explosionAnimation = explosions.getFirstExists(false);
            //        explosionAnimation.reset(tank.x, tank.y);
            //        explosionAnimation.play('explode', 30, false, true);
            //        tank.tankObject.kill();
            //        tanksList[bulletInfo.ownerId].level++;
            //    }
            //}
        };
    });
}

/**
 * Abstract Tank class
 * @param id
 * @param name
 * @param teamNumber
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @constructor
 */
var Tank = function (id, name, teamNumber, x, y, game, tankSprite) {
    if (this.constructor === Tank) {
        throw new Error("Can't instantiate abstract class!");
    }
    this.id = id;
    this.tankName = name;
    this.teamNumber = teamNumber;
    this.game = game;

    this.tank = game.add.sprite(x, y, tankSprite, 'tank_body');
    this.tank.anchor.setTo(0.5, 0.5);
    this.game.physics.arcade.enable(this.tank);
    this.tank.body.collideWorldBounds = true;


    // Attach the turret to the tank
    this.turret = game.add.sprite(0, 0, tankSprite, 'tank_gun');
    this.turret.anchor.setTo(0.3, 0.5);

    // Attach the shadow of the tank
    this.shadow = game.add.sprite(0, 0, tankSprite, 'tank_shadow');
    this.shadow.anchor.setTo(0.5, 0.5);

    // Attach the tank name
    this.tankNameText = game.add.text(0, 0, this.tankName, {
        font: "15px Tahoma",
        fill: "#000000",
        align: "center"
    });
    this.tankNameText.anchor.setTo(0.5, -1.5);
    this.tankNameText.stroke = "#ffffff";
    this.tankNameText.strokeThickness = 3;

    // Bring the turret and the tank body to the front
    this.tank.bringToTop();
    this.turret.bringToTop();
    this.tankNameText.bringToTop();

    // Other information (default value)
    this.coolDownTime = 500;
    this.fireTime = 0;
    this.hp = 100;
    this.level = 0;
    this.isDied = false;
    this.isCPUTank = false;

    // HIEU
    this.finalDestination = null;
    this.path = null;
    this.mouseUpFlag = true;
    this.moveComplete = true;
    this.desireAngle = 0;

    this.tank.tankObject = this;
};

var CPUTank = function (id, name, teamNumber, x, y, game, tankSprite) {
    Tank.apply(this, arguments);
    this.isCPUTank = true;
    this.finalDestination = this.getTargetPosition();
    //console.log(this.finalDestination);
    var x = Math.round(this.tank.x);
    var y = Math.round(this.tank.y);
    var calculatePath = graphUtil.getShortestPath(new Vertex(x, y, 'start'), new Vertex(this.finalDestination.x, this.finalDestination.y, 'end'));
    this.path = calculatePath.path;
    eurecaServer.handleCPUMovement({
        cpuId: this.id,
        destination: {
            x: x,
            y: y
        },
        path: this.path,
        desireAngle: this.desireAngle
    });
    if (Data.DEBUG) {
        drawPath(this.path, lineGraphics);
    }

    this.coolDownTime = 1500;
    this.fireTime = 0;
    this.hp = 10;
    this.isDied = false;
};
CPUTank.prototype = Object.create(Tank);
CPUTank.prototype.update = function () {
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.tankNameText.x = this.tank.x;
    this.tankNameText.y = this.tank.y;
    this.turret.rotation = angleToPointer(this.turret, this.game.input);

    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 5) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)) {
            this.tank.angle += val1;
        } else {
            this.tank.angle -= val2;
        }
    } else {
        this.tank.angle = this.desireAngle;
    }

    if (this.path && this.path.length == 0) {
        this.moveComplete = true;
    }
    if (this.moveComplete) {
        this.finalDestination = null;
        this.tank.body.velocity.set(0, 0);
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3) {
        this.path.shift();
    }
    if (this.path && this.path.length > 0) {
        moveToObject(this.tank, this.path[0].point, 120);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
    }
    if (this.path && this.path.length == 0) {
        lineGraphics.clear();
        this.finalDestination = this.getTargetPosition();
        //console.log(this.finalDestination);
        var x = Math.round(this.tank.x);
        var y = Math.round(this.tank.y);
        var calculatePath = graphUtil.getShortestPath(new Vertex(x, y, 'start'), new Vertex(this.finalDestination.x, this.finalDestination.y, 'end'));
        this.path = calculatePath.path;
        eurecaServer.handleCPUMovement({
            cpuId: this.id,
            destination: {
                x: x,
                y: y
            },
            path: this.path,
            desireAngle: this.desireAngle
        });
        if (Data.DEBUG) {
            drawPath(this.path, lineGraphics);
        }
    }
    game.physics.arcade.collide(this.tank, platforms, this.findNewPosition, null, this);
    for (var key in tanksList) {
        var tankPos = new Phaser.Point(this.tank.x, this.tank.y);
        var dis = tankPos.distance(new Phaser.Point(tanksList[key].tank.x, tanksList[key].tank.y));
        if (dis <= 300 && this.teamNumber != tanksList[key].teamNumber && !tanksList[key].isDied) {
            this.fireToTank(tanksList[key]);
        }
        this.game.physics.arcade.collide(tanksList[key].tank, this.tank, this.findNewPosition, null, this);
    }
    game.physics.arcade.collide(this.tank, platforms, this.findNewPosition, null, this);
};
CPUTank.prototype.fireToTank = function (tank) {
    if (this.game.time.now - this.coolDownTime > this.fireTime && !this.isDied) {
        // Fire !
        this.fireTime = this.game.time.now;
        var pointer = {
            worldX: tank.tank.x,
            worldY: tank.tank.y
        };
        var bulletInitialPos = {
            x: this.turret.x,
            y: this.turret.y
        };
        var fireInfo = {
            tankId: this.id,
            turret: {
                rotation: this.turret.rotation
            },
            pointer: pointer,
            bulletInitialPos: bulletInitialPos,
            fireTime: this.fireTime
        };
        // Send fire information to server
        eurecaServer.handleFire(fireInfo);
    }
};
CPUTank.prototype.getTargetPosition = function () {

    return graphUtil.getARandomValidPosition();
};

CPUTank.prototype.findNewPosition = function () {
    this.finalDestination = this.getTargetPosition();
    //console.log(this.finalDestination);
    var x = Math.round(this.tank.x);
    var y = Math.round(this.tank.y);
    var calculatePath = graphUtil.getShortestPath(new Vertex(x, y, 'start'), new Vertex(this.finalDestination.x, this.finalDestination.y, 'end'));
    this.path = calculatePath.path;
    eurecaServer.handleCPUMovement({
        cpuId: this.id,
        destination: {
            x: x,
            y: y
        },
        path: this.path,
        desireAngle: this.desireAngle
    });
    if (Data.DEBUG) {
        drawPath(this.path, lineGraphics);
    }
};
CPUTank.prototype.kill = function () {
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.tankNameText.kill();
    this.isDied = true;
    delete tanksList[this.id];
};

/**
 * PlayerTank class
 * @param id
 * @param name
 * @param teamNumber
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @constructor
 */
var PlayerTank = function (id, name, teamNumber, x, y, game, tankSprite) {
    Tank.apply(this, arguments);
};

PlayerTank.prototype = Object.create(Tank);
PlayerTank.prototype.update = function () {
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.tankNameText.x = this.tank.x;
    this.tankNameText.y = this.tank.y;
    this.turret.rotation = angleToPointer(this.turret, this.game.input);

    // Fire on left click
    if (this.game.input.activePointer.leftButton.isDown) {
        if (this.game.time.now - this.coolDownTime > this.fireTime) {
            // Fire !
            this.fireTime = this.game.time.now;
            var pointer = {
                worldX: this.game.input.activePointer.worldX,
                worldY: this.game.input.activePointer.worldY
            };
            var bulletInitialPos = {
                x: this.turret.x,
                y: this.turret.y
            };
            var fireInfo = {
                tankId: this.id,
                turret: {
                    rotation: this.turret.rotation
                },
                pointer: pointer,
                bulletInitialPos: bulletInitialPos
            };
            // Send fire information to server
            eurecaServer.handleFire(fireInfo);
        }
    }

    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 5) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)) {
            this.tank.angle += val1;
        } else {
            this.tank.angle -= val2;
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

        this.finalDestination = calculatePath.des;
        // Update flag
        this.moveComplete = false;
        moveToObject(this.tank, this.path[0].point, Data.tank_velocity);
        // Send movement information to server

        eurecaServer.handleMovement({
            destination: {
                x: desx,
                y: desy
            },
            path: this.path,
            desireAngle: this.desireAngle
        });

        if (Data.DEBUG) {
            drawPath(this.path, lineGraphics);
        }
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
        this.tank.body.velocity.set(0, 0);
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3) {
        this.path.shift();
    }
    if (this.path && this.path.length > 0) {
        moveToObject(this.tank, this.path[0].point, Data.tank_velocity);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
    }

    for (var key in tanksList) {
        if (key != this.id) {
            this.game.physics.arcade.collide(tanksList[key].tank, this.tank);
            //this.game.physics.arcade.overlap(this.tank, tanksList[key].tank, tankCollideTankHandler, null, this);
        }
    }
    game.physics.arcade.collide(this.tank, platforms);
    game.physics.arcade.overlap(this.tank, hpItems, onHitHPItem, null, this);
    game.physics.arcade.overlap(this.tank, weaponItems, onHitWeaponItem, null, this);
};

PlayerTank.prototype.kill = function () {
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.tankNameText.kill();
    this.isDied = true;
    delete tanksList[this.id];
};

/**
 * OtherPlayerTank class
 * @param id
 * @param name
 * @param teamNumber
 * @param x
 * @param y
 * @param game
 * @param tankSprite
 * @param playerTank
 * @constructor
 */
var OtherPlayerTank = function (id, name, teamNumber, x, y, game, tankSprite, playerTank) {
    Tank.apply(this, arguments);
    this.playerTank = playerTank;
};

OtherPlayerTank.prototype.update = function () {
    this.turret.x = this.tank.x;
    this.turret.y = this.tank.y;
    this.shadow.x = this.tank.x;
    this.shadow.y = this.tank.y;
    this.shadow.angle = this.tank.angle;
    this.tankNameText.x = this.tank.x;
    this.tankNameText.y = this.tank.y;

    // Adjust angle
    if (Math.abs(this.tank.angle - this.desireAngle) >= 5) {
        var val1 = (this.desireAngle - this.tank.angle) / 10;
        var val2 = (this.tank.angle - this.desireAngle) / 10;
        if (Math.abs(val1) < Math.abs(val2)) {
            this.tank.angle += val1;
        } else {
            this.tank.angle -= val2;
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
        this.tank.body.velocity.set(0, 0);
    }

    if (this.path && this.path.length > 0 && this.path[0].point.distance(new Phaser.Point(this.tank.x, this.tank.y)) <= 3) {
        this.path.shift();
    }
    if (this.path && this.path.length > 0) {
        moveToObject(this.tank, this.path[0].point, Data.tank_velocity);
        this.desireAngle = Phaser.Point.angle(new Phaser.Point(this.tank.x, this.tank.y), this.path[0].point) * 180 / Math.PI;
    }

    for (var key in tanksList) {
        if (key != this.id) {
            this.game.physics.arcade.collide(tanksList[key].tank, this.tank);
        }
    }
    game.physics.arcade.collide(this.tank, platforms);
    game.physics.arcade.overlap(this.tank, hpItems, onHitHPItem, null, this);
    game.physics.arcade.overlap(this.tank, weaponItems, onHitWeaponItem, null, this);
};

OtherPlayerTank.prototype.kill = function () {
    this.game.state.start('victory');
    this.tank.kill();
    this.turret.kill();
    this.shadow.kill();
    this.tankNameText.kill();
    this.isDied = true;
    delete tanksList[this.id];
};


var Bullet = function (x, y, game, tank) {
    this.game = game;
    this.tank = tank;
    this.sprite = game.add.sprite(x, y, 'bullet');
    game.physics.arcade.enable(this.sprite);
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;
    this.sprite.outOfBoundsKill = true;
    this.sprite.checkWorldBounds = true;

    //this.sprite.body.static = true;
    this.isKilled = false;
    this.index = 0;
    this.sprite.id = ++Bullet.id;
    this.sprite.bulletObject = this;
};
Bullet.id = 0;
Bullet.prototype.hit = function () {
    //console.log("hit");
};

Bullet.prototype.kill = function () {
    this.sprite.kill();
    this.isKilled = true;
};
Bullet.prototype.update = function () {
    for (var key in tanksList) {
        if (key != this.tank.id) {
            this.game.physics.arcade.overlap(this.sprite, tanksList[key].tank, tankHitBullets, null, this);
        }
    }
    this.game.physics.arcade.collide(this.sprite, platforms, bulletHitPlatform, null, this);
};

function _create() {
    game.world.setBounds(Data.MAP_DATA.startx, Data.MAP_DATA.starty, Data.MAP_DATA.width, Data.MAP_DATA.height);
    game.stage.disableVisibilityChange = true;
    game.physics.startSystem(Phaser.Physics.ARCADE);
    //game.physics.p2.setImpactEvents(true);
    game.add.tileSprite(Data.MAP_DATA.startx, Data.MAP_DATA.starty, Data.MAP_DATA.width, Data.MAP_DATA.height, 'earth');

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

    mouse = game.input.mouse;

    var tankSprite = (playerTankSelectedTeam == 1) ? 'blueTank' : 'redTank';
    playerTankInitialPos = (playerTankSelectedTeam == 1) ? {
        x: 1050,
        y: 1836
    } : {
        x: 1050,
        y: 230
    };
    playerTank = new PlayerTank(playerTankId, playerTankName, playerTankSelectedTeam, playerTankInitialPos.x, playerTankInitialPos.y, game, tankSprite);
    tanksList[playerTankId] = playerTank;
    // playerTankHPText
    playerTankHPText = game.add.text(10, 10, 'Your HP: ' + tanksList[playerTankId].hp, {
        font: "25px Tahoma",
        fill: "#000000",
        align: "center"
    });

    playerTankHPText.stroke = "#ffffff";
    playerTankHPText.strokeThickness = 3;
    playerTankHPText.fixedToCamera = true;

    playerTankLevel = game.add.text(window.innerWidth / 3, 10, 'Your Level: ' + tanksList[playerTankId].level, {
        font: "25px Tahoma",
        fill: "#000000",
        align: "center"
    });
    playerTankLevel.stroke = "#ffffff";
    playerTankLevel.strokeThickness = 3;
    playerTankLevel.fixedToCamera = true;

    // scoreText
    updateScore();
    scoreText = game.add.text(window.innerWidth / 3 * 2, 10, 'BLUE: ' + blueTeamTanks + ' - RED: ' + redTeamTanks, {
        font: "25px Tahoma",
        fill: "#000000",
        align: "center"
    });
    scoreText.stroke = "#ffffff";
    scoreText.strokeThickness = 3;
    scoreText.fixedToCamera = true;

    explosions = game.add.group();
    for (var i = 0; i < NUM_OF_EXPLOSIONS; i++) {
        var explosion = explosions.create(0, 0, 'explosion', 0, false);
        explosion.anchor.setTo(0.5, 0.5);
        explosion.animations.add('explode');
    }

    game.camera.follow(playerTank.tank);
    game.camera.focusOnXY(playerTankInitialPos.x, playerTankInitialPos.y);

    platforms = game.add.group();
    platforms.enableBody = true;
    Data.generatePlatforms(game, 'empty', platforms);

    for (i = 1; i <= playerInitialCPUTanks; i++) {
        var cpuTankId = 'team' + playerTankSelectedTeam + '-' + Date.now();
        var cpuTankName = 'CPU-' + playerTankSelectedTeam + '(' + i + ')';
        var cpuTankInitialPos = (playerTankSelectedTeam == 1) ? {
            x: Math.round(719 + Math.random() * 647),
            y: Math.round(1500 + Math.random() * 108)
        }:{
            x: Math.round(750 + Math.random() * 598),
            y: Math.round(469 + Math.random() * 102)
        };
        var cpuTank = new CPUTank(cpuTankId, cpuTankName, playerTankSelectedTeam, cpuTankInitialPos.x, cpuTankInitialPos.y, game, tankSprite);
        tanksList[cpuTankId] = cpuTank;
        eurecaServer.handleSpawnCPUTank(cpuTankId, cpuTankName, playerTankSelectedTeam, cpuTankInitialPos);
    }


    hpItems = game.add.group();
    hpItems.enableBody = true;
    createNewHPItem(197, 196);
    createNewHPItem(1633, 1630);

    weaponItems = game.add.group();
    weaponItems.enableBody = true;
    createNewWeaponItem(1625, 196);
    createNewWeaponItem(170, 1676);
}

function _update() {
    for (var tank in tanksList) {
        if (!tanksList[tank].isDied) {
            tanksList[tank].update();
        }
    }

    for (var bullet in bulletList) {
        if (!bulletList[bullet].sprite.alive) {
            delete bulletList[bullet];
            continue;
        }
        bulletList[bullet].update();
    }

    // Update the text of current player's HP
    if (playerTankHPText) {
        if (tanksList[playerTankId]) {
            playerTankHPText.text = 'Your HP: ' + tanksList[playerTankId].hp;
            playerTankLevel.text = 'Your Level: ' + tanksList[playerTankId].level;
        } else {
            playerTankHPText.text = 'You died.';
        }
    }

    if (hpItems && hpItems.length < 1) {
        var pos = Math.round(Math.random() * 4);
        var x, y;
        switch (pos) {
            case 0:
            {
                x = Math.round(177 + Math.random() * 323);
                y = Math.round(162 + Math.random() * 317);
                break;
            }
            case 1:
            {
                x = Math.round(1590 + Math.random() * 283);
                y = Math.round(174 + Math.random() * 326);
                break;
            }
            case 2:
            {
                x = Math.round(1592 + Math.random() * 298);
                y = Math.round(1567 + Math.random() * 321);
                break;
            }
            case 3:
            {
                x = Math.round(174 + Math.random() * 356);
                y = Math.round(1538 + Math.random() * 346);
                break;
            }
        }
        createNewHPItem(x - 86, y - 86);
    }

    if (scoreText) {
        updateScore();
        scoreText.text = 'BLUE: ' + blueTeamTanks + ' - RED: ' + redTeamTanks;
    }
    if (playerTank && playerTank.hp <= 0) {
        game.state.start('defeat');
    }
}

function tankHitBullets(bullet, tank) {
    bullet.kill();
    if (tank.tankObject.teamNumber == playerTankSelectedTeam) {
        eurecaServer.handleTankHitBullets({
            id: tank.tankObject.id,
            ownerId: bullet.bulletObject.tank.id
        });
    }
    delete bulletList[bullet.id];
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

var playState = {
    create: function () {
        eurecaClientSetup();
    },
    update: function () {
        if (ready) {
            _update();
        }
    }
};

var bulletHitPlatform = function (bullet, platform) {
    bullet.kill();

    var explosionAnimation = explosions.getFirstExists(false);
    explosionAnimation.reset(bullet.x, bullet.y);
    explosionAnimation.play('explode', 30, false, true);
    delete bulletList[bullet.id];
    //console.log('hit platform');
};

var createNewHPItem = function (x, y) {
    var item = hpItems.create(x, y, 'hpitem');
    item.body.setSize(50, 49, 78, 73);
    item.body.immovable = true;
};

var createNewWeaponItem = function (x, y) {
    var item = weaponItems.create(x, y, 'weaponitem');
    item.body.setSize(47, 54, 115, 59);
    item.body.immovable = true;
};

var onHitHPItem = function (tank, item) {
    tank.tankObject.hp += 10;
    item.kill();
    hpItems.remove(item);
};

var onHitWeaponItem = function (tank, item) {
    tank.tankObject.level += 1;
    item.kill();
    weaponItems.remove(item);
};

function updateScore() {
    var totalTanks = Object.keys(tanksList).length;
    var _blueTanks = 0;
    var _redTanks = 0;
    for (var key in tanksList) {
        if (tanksList[key].teamNumber == 1) {
            _blueTanks += 1;
        }
    }
    _redTanks = totalTanks - _blueTanks;
    blueTeamTanks = _blueTanks;
    redTeamTanks = _redTanks;
}