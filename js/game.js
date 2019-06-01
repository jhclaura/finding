import ModelLoader from "./modelLoader.js"

export default class Game {
	constructor() {
		this.name = "game";
	}

	init(panel) {
		// class DanceEmitter extends Events {}
		// this.emitter = new DanceEmitter();
		// window.eventBus = this.emitter;
		

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xbfe3dd );
		this.scene.add( new THREE.AmbientLight( 0x404040 ) );

		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 1000 );
		this.renderer = new THREE.WebGLRenderer( {antialias: true} );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.container = document.createElement( 'div' );
		document.body.appendChild( this.container );
		this.container.appendChild( this.renderer.domElement );
		// this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
		// this.material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		// this.cube = new THREE.Mesh( this.geometry, this.material );
		// this.scene.add( this.cube );

		this.cameraControl = new THREE.OrbitControls(this.camera);
		this.cameraControl.target.set( 0, 0, 0 );
		this.cameraControl.enablePan = false;
		this.camera.position.z = 5;
		this.cameraControl.update();

		this.modelLoader = new ModelLoader();
		this.modelLoader.load("./assets/models/cha_game_exporter.glb", (gltf)=>{this.onLoadFinderIdle(gltf);});
		
		this.panel = panel;
	}

	onLoadFinderIdle(gltf)
	{
		this.finderIdel = gltf;
		console.log(this.finderIdel.animations);
		console.log(this.finderIdel.scene);
		//this.finderIdel.scene
		this.scene.add(this.finderIdel.scene);

		this.mixerFinder = new THREE.AnimationMixer(this.finderIdel.scene);
		this.mixerFinder.clipAction(this.finderIdel.animations[0]).play();

		// this.actionFinder = {};
		// this.actionFinder["idle"] = this.mixerFinder.clipAction(this.finderIdel.animations[0]);
		// this.modelLoader.load("./assets/models/finder_arm.glb", (gltf)=>{this.onLoadFinderArm(gltf);});

		// this.finderIdel.animations.forEach( ( clip ) => {
		// 	this.mixerFinder.clipAction( clip ).play();
		// } );
	}

	onLoadFinderArm(gltf)
	{
		this.actionFinder["arm"] = this.mixerFinder.clipAction(gltf.animations[0]);
		this.finderIdel.animations.push(gltf.animations[0]);
		//this.mixerFinder.clipAction(this.finderIdel.animations[0]).play();

		this.setupPanel();
	}

	setupPanel()
	{
		let folder0 = this.panel.addFolder("Acitvate / Deactivate");
		let folder1 = this.panel.addFolder("Crossfading");
		let folder2 = this.panel.addFolder("Blend Weights");

		this.panelSettings = {
			'Deactivate all': ()=>{ this.deactivateAllActions(); },
			'Activate all': ()=>{ this.activateAllActions(); },
			"From Idle to Arm": ()=>{
				this.setWeight(this.actionFinder.arm, 1);
				this.actionFinder.arm.time = 0;
				this.actionFinder.idle.crossFadeTo(this.actionFinder.arm, 0.5, true);
				//this.prepareCrossfade(this.actionFinder.idle, this.actionFinder.arm, 1.0);
			},
			"From Arm to Idle": ()=>{
				this.setWeight(this.actionFinder.idle, 1);
				this.actionFinder.idle.time = 0;
				this.actionFinder.arm.crossFadeTo(this.actionFinder.idle, 0.5, true);
				//this.prepareCrossfade(this.actionFinder.arm, this.actionFinder.idle, 1.0);
			},
			"Idle weight": 0.0,
			"Arm weight": 1.0
		};

		folder0.add( this.panelSettings, 'Deactivate all' );
		folder0.add( this.panelSettings, 'Activate all' );
		folder1.add( this.panelSettings, "From Idle to Arm");
		folder1.add( this.panelSettings, "From Arm to Idle");
		folder2.add( this.panelSettings, "Idle weight", 0.0, 1.0, 0.01).onChange((weight)=>{
			this.setWeight(this.actionFinder.idle, weight);
		});
		folder2.add( this.panelSettings, "Arm weight", 0.0, 1.0, 0.01).onChange((weight)=>{
			this.setWeight(this.actionFinder.arm, weight);
		});
	}

	activateAllActions()
	{
		this.setWeight( this.actionFinder.idle, this.panelSettings[ 'Idle weight' ] );
		this.setWeight( this.actionFinder.arm, this.panelSettings[ 'Arm weight' ] );

		for(let key in this.actionFinder)
		{
			this.actionFinder[key].play();
		}
	}

	deactivateAllActions()
	{
		for(let key in this.actionFinder)
		{
			this.actionFinder[key].stop();
		}
	}

	setWeight(action, weight)
	{
		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( weight );
	}

	animate(delta) {
		if(this.mixerFinder)
			this.mixerFinder.update(delta);
		this.cameraControl.update(delta);
		this.renderer.render( this.scene, this.camera );
	}

	onWindowResize()
	{
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	onKeyDown(keyCode)
	{
		//console.log(keyCode);
		switch (keyCode)
		{
			// a, s, d
			case 65:
			case 83:
			case 68:
			break;

			// ←, ↓, →
			case 37:
			case 40:
			case 39:
			break;
		}
	}

	onKeyUp(keyCode)
	{
		switch (keyCode)
		{
			// a, s, d
			case 65:
			case 83:
			case 68:
			break;

			// ←, ↓, →
			case 37:
			case 40:
			case 39:
			break;
		}
	}
}