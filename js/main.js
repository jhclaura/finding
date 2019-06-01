//var THREE = require('three');	// if using browserify
// import * as THREE from "/js/lib/three.module.js";	// nah..
import * as dat from '/js/lib/dat.gui.module.js';
import Game from "./game.js"
// import AudioHandler from "./audioHandler.js"

var game = new Game();
var stats = new Stats();
// var audioHandler;
var clock;
var panel;

window.onload = () => { 
	//console.log('window load!');
	start();
};

function start()
{
	// AUDIO
	// audioHandler = new AudioHandler();
	// audioHandler.init();
	// audioHandler.loadSound(true);
	// audioHandler.renderSound();

	clock = new THREE.Clock();
	panel = new dat.GUI({width: 300});
	
	// GAME
	game.init(panel);
	game.container.appendChild(stats.dom);
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('keydown', onKeyDown, false);
	window.addEventListener('keyup', onKeyUp, false);
	animate();
}

function animate(t) {
    requestAnimationFrame(animate);
    
    let delta = clock.getDelta();
    game.animate(delta);
    stats.update();
}

function onWindowResize()
{
	game.onWindowResize();
}

function onKeyDown(e)
{
	game.onKeyDown(e.keyCode);
}

function onKeyUp(e)
{
	game.onKeyUp(e.keyCode);
}