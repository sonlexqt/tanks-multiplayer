var graphics
var victoryState = {
    create: function(){
        graphics = game.add.graphics(0, 0);
        graphics.beginFill(0x000000, 1);
        graphics.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        graphics.endFill();
        var name = game.add.sprite(GAME_WIDTH/2, GAME_HEIGHT / 2, 'victory');
        var ratio = GAME_WIDTH / 1300;
        name.width = name.width * ratio;
        name.height = name.height * ratio;
        name.anchor.setTo(0.5, 0.5);
    },

    update: function() {

    }
};

var defeatState = {
    create: function(){
        graphics = game.add.graphics(0, 0);
        graphics.beginFill(0x000000, 1);
        graphics.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        graphics.endFill();
        var name = game.add.sprite(GAME_WIDTH/2, GAME_HEIGHT / 2, 'defeat');
        var ratio = GAME_WIDTH / 1300;
        name.width = name.width * ratio;
        name.height = name.height * ratio;
        name.anchor.setTo(0.5, 0.5);
    },

    update: function() {

    }
};