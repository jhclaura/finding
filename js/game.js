import ModelLoader from "./modelLoader.js"
import Cha from "./cha.js"

export default class Game {
	constructor() {
		this.name = "game";
		this.debugMode = false;

		this.screenWidth = window.innerWidth;
		this.screenHeight = window.innerHeight;
	}

	init(panel) {
		// class DanceEmitter extends Events {}
		// this.emitter = new DanceEmitter();
		// window.eventBus = this.emitter;
		
		this.container = document.createElement( 'div' );
		document.body.appendChild( this.container );

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xbfe3dd );

		this.ambientLight = new THREE.AmbientLight( 0xd8d8d8 );
		this.directionalLight = new THREE.DirectionalLight( 0xffffff,1 );
		this.scene.add( this.ambientLight );
		this.scene.add( this.directionalLight );

		//this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 1000 );
		let aspect = window.innerWidth/window.innerHeight;
		this.cameraFrustumSize = 70;
		
		if (this.debugMode)
		{			
			this.observeCamera = new THREE.PerspectiveCamera( 50, 0.5 * aspect, 1, 10000 );
			this.observeCamera.position.y = 100;
			this.observeCamera.position.x = 100;
			this.observeCamera.position.z = 100;
			this.observeCamera.lookAt(0,0,0);
			this.scene.add(this.observeCamera);

			this.camera = new THREE.OrthographicCamera( 0.5 * this.cameraFrustumSize*aspect/-2, 0.5 * this.cameraFrustumSize*aspect/2, this.cameraFrustumSize/2, this.cameraFrustumSize/-2, 1, 500 );
			this.scene.add(this.camera);
			this.cameraHelper = new THREE.CameraHelper( this.camera );
			this.scene.add( this.cameraHelper );
		}
		else
		{
			this.camera = new THREE.OrthographicCamera( this.cameraFrustumSize*aspect/-2, this.cameraFrustumSize*aspect/2, this.cameraFrustumSize/2, this.cameraFrustumSize/-2, 1, 500 );
			this.scene.add(this.camera);
		}

		this.renderer = new THREE.WebGLRenderer( {antialias: true} );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.container.appendChild( this.renderer.domElement );
		if(this.debugMode)
		{
			this.renderer.autoClear = false;
			this.renderer.autoClearColor = false;
		}

		this.camera.position.set( 0, 13, 30 );	//0,13,30
		this.camera.lookAt( 0,0,0 );

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.moveMouse = new THREE.Vector3();
		this.moveMousePosition = new THREE.Vector3();

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

		geometry = new THREE.SphereGeometry(2);
		material = new THREE.MeshBasicMaterial({color: 0x0000ff});
		this.mouseBall = new THREE.Mesh(geometry, material);
		this.scene.add(this.mouseBall);

		this.Cha = new Cha(this.scene);
		this.scene.add(this.Cha);
		this.camera.target = this.Cha;

		this.modelLoader = new ModelLoader();
		this.modelLoader.load("./assets/models/cha_gameExport.glb", (gltf)=>{this.Cha.onLoadModel(gltf);});
		
		// DAT.GUI
		this.panel = panel;
		this.setupCameraPanel();
		//this.Cha.setupPanel(this.panel);

		var dir = new THREE.Vector3( 1,0,0 );
		this.arrowHelper = new THREE.ArrowHelper(dir, this.camera.position, 10, 0xff0000);
		console.log(this.arrowHelper);
		this.scene.add(this.arrowHelper);
	}

	setupCameraPanel()
	{
		let folder = this.panel.addFolder("Camera");
		this.cameraPanelSettings = {
			"position x": this.camera.position.x,
			"position y": this.camera.position.y,
			"position z": this.camera.position.z,
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
			// this.camera.lookAt( 0,0,0 );
			this.camera.updateProjectionMatrix();
			break;
			case "y":
			this.camera.position.y = position;
			// this.camera.lookAt( 0,0,0 );
			this.camera.updateProjectionMatrix();
			break;
			case "z":
			this.camera.position.z = position;
			// this.camera.lookAt( 0,0,0 );
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
		//this.cameraFollow(delta);
		this.render(delta);
	}

	render(delta)
	{
		if (this.debugMode)
		{
			this.camera.far = 100;
			this.camera.updateProjectionMatrix();
			this.cameraHelper.update();
			this.cameraHelper.visible = true;

			this.renderer.clear();

			this.cameraHelper.visible = true;
			this.renderer.setViewport(0, 0, this.screenWidth/2, this.screenHeight);
			// this.renderer.render(this.scene, this.observeCamera);
			this.renderer.render(this.scene, this.camera);

			this.cameraHelper.visible = true;
			this.renderer.setViewport(this.screenWidth/2, 0, this.screenWidth/2, this.screenHeight);
			// this.renderer.render(this.scene, this.camera);
			this.renderer.render(this.scene, this.observeCamera);
		}
		else
		{
			this.renderer.render( this.scene, this.camera );
		}
	}

	onWindowResize()
	{
		this.screenWidth = window.innerWidth;
		this.screenHeight = window.innerHeight;
		this.renderer.setSize(this.screenWidth, this.screenHeight);

		let aspect = this.screenWidth/this.screenHeight;

		if(this.debugMode)
		{
			this.observeCamera.aspect = 0.5*aspect;
			this.observeCamera.updateProjectionMatrix();
		}

		let ratio = 1;
		if(this.debugMode) ratio = 0.5;
		this.camera.left = - ratio * this.cameraFrustumSize * aspect / 2;
		this.camera.right = ratio * this.cameraFrustumSize * aspect / 2;
		this.camera.top = this.cameraFrustumSize / 2;
		this.camera.bottom = - this.cameraFrustumSize / 2;
		this.camera.updateProjectionMatrix();
	}

	onKeyDown(keyCode)
	{
		//console.log(keyCode);
		switch (keyCode)
		{
			// a, s, d
			case 65:
			this.Cha.lookReset();
			break;
			
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
		// this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		// this.mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

		this.checkRaycast();
	}

	onMouseMove(event)
	{
		this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		this.mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

		// Convert Screen space to World space
		/*
		this.moveMouse.set(
				(event.clientX / this.screenWidth) * 2 - 1,
				- (event.clientY / this.screenHeight) * 2 + 1,
				0.5
			);
		this.moveMouse.unproject(this.camera);
		this.moveMouse.sub(this.camera.position).normalize();
		//let distance = (0 - this.camera.position.z) / this.moveMouse.z;
		let distance = this.camera.far;
		this.arrowHelper.position.copy(this.camera.position);
		this.arrowHelper.setDirection(this.moveMouse);
		this.arrowHelper.setLength(distance, distance*0.2, distance*0.2*0.2);
		this.moveMousePosition.copy(this.camera.position).add(this.moveMouse.multiplyScalar(distance));
		*/
		this.raycaster.setFromCamera(this.mouse, this.camera);
		this.moveMousePosition = this.Cha.updateHeadLookAt(this.raycaster);
		if(this.moveMousePosition)
			this.mouseBall.position.copy(this.moveMousePosition);
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