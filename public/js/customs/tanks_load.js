var loadState = {
    preload: function(){
        game.load.image('earth', '/public/assets/images/tank_map.png');
        game.load.atlas('redTank', '/public/assets/images/red_tank.png', '/public/assets/images/red_tank.json');
        game.load.atlas('blueTank', '/public/assets/images/blue_tank.png', '/public/assets/images/blue_tank.json');
        game.load.image('bullet', '/public/assets/images/bullet.png');
        game.load.image('empty', '/public/assets/images/empty.png');
        game.load.spritesheet('explosion', '/public/assets/images/explosion.png', 64, 64, 23);
        game.load.image('menuBackground', '/public/assets/images/menu-background.jpg');
    },
    create: function(){
        game.stage.disableVisibilityChange = true;
        // Disable default right click handler
        game.canvas.oncontextmenu = function (e) {
            e.preventDefault();
        };

        game.state.start('menu');
    }
};