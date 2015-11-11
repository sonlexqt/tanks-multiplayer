var menuState = {
    create: function(){
        var nameLabel = game.add.text(80, 80, 'TANKS - MENU', {
            font: '50px Arial',
            fill: '#ffffff'
        });
        var startLabel = game.add.text(80, game.world.height - 80, 'Press SpaceBar to start', {
            font: '25px Arial',
            fill: '#ffffff'
        });
        var spaceBarKey = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
        spaceBarKey.onDown.addOnce(this.start, this);
    },

    start: function(){
        game.state.start('play');
    }
};