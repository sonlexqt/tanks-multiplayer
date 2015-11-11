var playerTankSelectedTeam = 1;
var gameMode = 'singleplayer';
var playerTankName = 'Player';

var menuState = {
    create: function(){
        var self = this;

        var nameLabel = game.add.text(80, 80, 'TANKS - MENU', {
            font: '50px Arial',
            fill: '#ffffff'
        });
        var startLabel = game.add.text(80, game.world.height - 80, 'Press SpaceBar to start', {
            font: '25px Arial',
            fill: '#ffffff'
        });

        game.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'menuBackground');

        $('#btn-single-player').click(function(){
            gameMode = 'singleplayer';
            self.startSinglePlayer();
            $('#tank-menu-game-mode').css('display', 'none');
        });

        $('#btn-multi-player').click(function(){
            gameMode = 'multiplayer';
            $('#tank-menu-game-mode').css('display', 'none');
            $('#tank-menu-multiplayer-info').css('display', 'block');
        });

        $('.btn-select-team').click(function(){
            playerTankSelectedTeam = Number($(this).data('teamnumber'));
            $('#span-selected-team-name').text($(this).data('teamname'));
            $('#span-selected-team-name').css({
                color: $(this).data('color')
            });
        });

        $('#btn-start-multiplayer').click(function(){
            playerTankName = $('#input-player-name').val();
            $('#tank-menu-multiplayer-info').css('display', 'none');
            self.startMultiplayer();
        });
    },

    startSinglePlayer: function(){
        game.state.start('play');
    },

    startMultiplayer: function(){
        game.state.start('play');
    }
};