var mainMusic;
var bulletSound1;
var explosionSound;

var AudioManager = {
    playMainMusic: function(){
        // (marker, position, volume, loop, forceRestart)
        mainMusic.play('', 0, 1, true);
    },
    playBulletSound: function(bulletSoundNumber){
        switch (bulletSoundNumber){
            case 1:
                bulletSound1.play();
                break;
            default:
                bulletSound1.play();
                break;
        }
    },
    playExplosionSound: function(){
        explosionSound.play('', 0, 5, false);
    }
};

var loadState = {
    preload: function(){
        // Images & Sprites
        game.load.image('earth', '/public/assets/images/tank_map.png');
        game.load.atlas('redTank', '/public/assets/images/red_tank.png', '/public/assets/images/red_tank.json');
        game.load.atlas('blueTank', '/public/assets/images/blue_tank.png', '/public/assets/images/blue_tank.json');
        game.load.image('bullet', '/public/assets/images/bullet.png');
        game.load.image('empty', '/public/assets/images/empty.png');
        game.load.spritesheet('explosion', '/public/assets/images/explosion.png', 64, 64, 23);
        game.load.image('menuBackground', '/public/assets/images/menu-background.jpg');
        // Audio
        game.load.audio('mainMusic', '/public/assets/audio/main-music.ogg');
        game.load.audio('bulletSound1', '/public/assets/audio/bullet-sound-1.ogg');
        game.load.audio('explosionSound', '/public/assets/audio/explosion-sound.ogg');
    },
    create: function(){
        game.stage.disableVisibilityChange = true;
        // Disable default right click handler
        game.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };

        mainMusic = game.add.audio('mainMusic');
        bulletSound1 = game.add.audio('bulletSound1');
        explosionSound = game.add.audio('explosionSound');

        game.state.start('menu');
    }
};