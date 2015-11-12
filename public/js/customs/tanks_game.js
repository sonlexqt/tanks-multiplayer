var GAME_WIDTH = window.innerWidth;
var GAME_HEIGHT = window.innerHeight;

var game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.AUTO, 'tank-game');

game.state.add('boot', bootState);
game.state.add('load', loadState);
game.state.add('menu', menuState);
game.state.add('play', playState);
game.state.add('victory', victoryState);
game.state.add('defeat', defeatState);

game.state.start('boot');
