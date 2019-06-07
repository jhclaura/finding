import ModelLoader from "./modelLoader.js"
import Cha from "./cha.js"

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

		this.ambientLight = new THREE.AmbientLight( 0xd8d8d8 );
		this.directionalLight = new THREE.DirectionalLight( 0xffffff,1 );
		this.scene.add( this.ambientLight );
		this.scene.add( this.directionalLight );

		//this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 1000 );
		let aspect = window.innerWidth/window.innerHeight;
		this.cameraFrustumSize = 70;
		this.camera = new THREE.OrthographicCamera( this.cameraFrustumSize*aspect/-2, this.cameraFrustumSize*aspect/2, this.cameraFrustumSize/2, this.cameraFrustumSize/-2, 0.1, 1000 );
		
		this.renderer = new THREE.WebGLRenderer( {antialias: true} );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.container = document.createElement( 'div' );
		document.body.appendChild( this.container );
		this.container.appendChild( this.renderer.domElement );

		// this.cameraControl = new THREE.OrbitControls(this.camera);
		// this.cameraControl.target.set( 0, 0, 0 );
		// this.cameraControl.enablePan = false;
		// this.cameraControl.update();
		this.camera.position.set( 0, 13, 30 );
		this.camera.lookAt( 0,0,0 );

		// this.cameraOrthoHelper = new THREE.CameraHelper( this.camera );
		// this.scene.add( this.cameraOrthoHelper );
		// this.cameraOrthoHelper.visible = true;

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();

		var geometry = new THREE.CylinderBufferGeometry( 0, 10, 30, 4, 1 );
		var material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
		for ( var i = 0; i < 500; i ++ ) {
			var mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = Math.random() * 1600 - 800;
			mesh.position.y = 0;
			mesh.position.z = Math.random() * 1600 - 800;
			mesh.updateMatrix();
			mesh.matrixAutoUpdate = false;
			this.scene.add( mesh );
		}

		geometry = new THREE.PlaneGeometry(100,100,1,1);
		material = new THREE.MeshLambertMaterial({color: 0xaaaaaa});
		this.ground = new THREE.Mesh(geometry, material);
		this.ground.rotation.x = -90 * Math.PI/180;
		this.scene.add(this.ground);

		this.Cha = new Cha(this.scene);
		this.scene.add(this.Cha);
		this.camera.target = this.Cha;

		this.modelLoader = new ModelLoader();
		this.modelLoader.load("./assets/models/cha_gameExport.glb", (gltf)=>{this.Cha.onLoadModel(gltf);});
		
		// DAT.GUI
		this.panel = panel;
		this.setupCameraPanel();
		//this.Cha.setupPanel(this.panel);
	}

	setupCameraPanel()
	{
		let folder = this.panel.addFolder("Camera");
		this.cameraPanelSettings = {
			"position x": 0,
			"position y": 13,
			"position z": 30,
		};
		folder.add(this.cameraPanelSettings, "position x", -50.0, 50.0, 0.1).onChange((position)=>{
			this.setCameraPosition("x", position);
		});
		folder.add(this.cameraPanelSettings, "position y", -50.0, 50.0, 0.1).onChange((position)=>{
			this.setCameraPosition("y", position);
		});
		folder.add(this.cameraPanelSettings, "position z", -50.0, 50.0, 0.1).onChange((position)=>{
			this.setCameraPosition("z", position);
		});
	}

	setCameraPosition(axis, position)
	{
		switch(axis)
		{
			case "x":
			this.camera.position.x = position;
			//this.camera.lookAt( 0,0,0 );
			this.camera.updateProjectionMatrix();
			break;
			case "y":
			this.camera.position.y = position;
			//this.camera.lookAt( 0,0,0 );
			this.camera.updateProjectionMatrix();
			break;
			case "z":
			this.camera.position.z = position;
			//this.camera.lookAt( 0,0,0 );
			this.camera.updateProjectionMatrix();
			break;
		}
		//this.cameraOrthoHelper.update();
	}

	cameraFollow(delta)
	{
		let target = new THREE.Vector3();
		target = this.camera.target.getRootWorldPosition(target);
		if (target == null) return;
		target.y += 13;
		target.z += 30;
		this.camera.position.lerp(target, delta*1);
	}

	animate(delta) {
		this.Cha.update(delta);
		//this.cameraControl.update(delta);
		this.cameraFollow(delta);
		this.renderer.render( this.scene, this.camera );
	}

	onWindowResize()
	{
		//this.camera.aspect = window.innerWidth / window.innerHeight;
		let aspect = window.innerWidth/window.innerHeight;
		this.camera.left = - this.cameraFrustumSize * aspect / 2;
		this.camera.right = this.cameraFrustumSize * aspect / 2;
		this.camera.top = this.cameraFrustumSize / 2;
		this.camera.bottom = - this.cameraFrustumSize / 2;

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

	onMouseClick(event)
	{
		event.preventDefault();
		this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		this.mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

		this.checkRaycast();
	}

	checkRaycast()
	{
		this.raycaster.setFromCamera(this.mouse, this.camera);
		let intersections = this.raycaster.intersectObjects(this.scene.children);
		if (intersections.length > 0)
		{
			if(intersections[0].object == this.ground)
			{
				console.log(intersections[0].point);
				this.Cha.updateMoveTarget(intersections[0].point);
			}
		}
	}
}