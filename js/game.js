import ModelLoader from "./modelLoader.js"
import Cha from "./cha.js"
import Prop from "./prop.js"
import PhysicsProp from "./physicsProp.js"
import Physics from "./physics.js"
import Util from "./util.js"
import CreatureCreator from "./creatureCreator.js"
import ChapterManager from "./chapterManager.js"

export default class Game {
	constructor() {
		this.name = "game";
		this.debugMode = false;

		this.screenWidth = window.innerWidth;
		this.screenHeight = window.innerHeight;

		this.camToChaHeight = 50;
		this.camToChaDistance = 120;
	}

	init(panel) {
		class FinderEmitter extends Events {}
		this.emitter = new FinderEmitter();
		window.eventBus = this.emitter;

		this.util = new Util();
		window.userUtil = this.util;

		// ENVIRONMENT_SETUP
		this.container = document.createElement( 'div' );
		document.body.appendChild( this.container );

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( 0xbfe3dd );

		this.ambientLight = new THREE.AmbientLight( 0xd8d8d8 );
		this.directionalLight = new THREE.DirectionalLight( 0xffffff,1 );
		// this.directionalLight.castShadow = true;
		this.scene.add( this.ambientLight );
		this.scene.add( this.directionalLight );

		//this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth/window.innerHeight, 0.1, 1000 );
		let aspect = window.innerWidth/window.innerHeight;
		this.cameraFrustumSize = 90;
		
		if (this.debugMode)
		{			
			this.observeCamera = new THREE.PerspectiveCamera( 50, 0.5 * aspect, 1, 10000 );
			this.observeCamera.position.y = 100;
			this.observeCamera.position.x = 100;
			this.observeCamera.position.z = 100;
			this.observeCamera.lookAt(0,0,0);
			this.scene.add(this.observeCamera);

			this.camera = new THREE.OrthographicCamera( 0.5 * this.cameraFrustumSize*aspect/-2, 0.5 * this.cameraFrustumSize*aspect/2, this.cameraFrustumSize/2, this.cameraFrustumSize/-2, 1, 500 );
			this.camera.updateProjectionMatrix();
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
		// this.renderer.shadowMap.enabled = true;
		this.container.appendChild( this.renderer.domElement );
		if(this.debugMode)
		{
			this.renderer.autoClear = false;
			this.renderer.autoClearColor = false;
		}

		this.camera.position.set( 0, this.camToChaHeight, this.camToChaDistance );	//0,13,30
		this.camera.lookAt( 0,0,0 );

		this.raycaster = new THREE.Raycaster();
		this.mouse = new THREE.Vector2();
		this.moveMouse = new THREE.Vector3();
		this.moveMousePosition = new THREE.Vector3();

		// PHYSICS
		this.ammo = new Physics(()=>{this.createPhysicsObjects();});

		// OBJECTS
		var geometry = new THREE.CylinderBufferGeometry( 0, 10, 30, 4, 1 );
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff } );
		for ( var i = 0; i < 500; i ++ ) {
			var mesh = new THREE.Mesh( geometry, material );
			mesh.position.x = Math.random() * 1600 - 800;
			mesh.position.y = 0;
			mesh.position.z = Math.random() * 1600 - 800;
			mesh.updateMatrix();
			mesh.matrixAutoUpdate = false;
			this.scene.add( mesh );
		}

		geometry = new THREE.BoxBufferGeometry(500, 1, 500, 1, 1, 1);
		material = new THREE.MeshLambertMaterial({color: 0x787878});
		this.ground = new THREE.Mesh(geometry, material);
		this.ground.position.y -= 0.5;
		this.ground.tag = "ground";
		// this.ground.receiveShadow = true;
		this.scene.add(this.ground);
		this.ammo.createParallelepiped(this.ground, 0, this.ground.position, this.ground.quaternion);

		// geometry = new THREE.SphereGeometry(1);
		// material = new THREE.MeshBasicMaterial({color: 0x0000ff});
		// this.mouseBall = new THREE.Mesh(geometry, material);
		// this.mouseBall.name = "arrow";
		// this.scene.add(this.mouseBall);

		this.modelLoader = new ModelLoader();
		this.Cha = new Cha(this.scene, this.modelLoader);
		this.scene.add(this.Cha);
		this.camera.target = this.Cha;

		// Arrow
		let arrowMaterial = new THREE.MeshBasicMaterial({color:0xffffff, depthTest: false})
		this.arrow = new PhysicsProp( "./assets/models/arrow.glb", this.scene, this.modelLoader, arrowMaterial, this.ammo, ()=>{
			this.arrow.updateScale(830);
			this.arrow.position.y = 20;
			this.arrow.rotation.x = -20 * Math.PI/180;
			this.arrow.initPhysics(20, 1, true); // mass, friction, isKinematic

			this.arrow.beLerping = false;
			this.arrow.originalQ = new THREE.Quaternion();
			this.arrow.originalQ.copy(this.arrow.quaternion);
			this.arrow.tmpVector3 = new THREE.Vector3();
			this.arrow.normalMaterial = new THREE.MeshBasicMaterial({color:0xffffff, map: this.arrow.model.material.map});
		});
		this.arrow.visible = false;
		//this.container.style.cursor = "none";

		this.scene.add(this.arrow);

		this.creatureCreator = new CreatureCreator(this.ammo);

		this.chapterManager = new ChapterManager(this.scene, this.ammo, this.modelLoader, this.creatureCreator, this.Cha);
		
		// DAT.GUI
		this.panel = panel;
		this.setupCameraPanel();

		

		// var dir = new THREE.Vector3( 1,0,0 );
		// this.arrowHelper = new THREE.ArrowHelper(dir, this.camera.position, 10, 0xff0000);
		// console.log(this.arrowHelper);
		// this.scene.add(this.arrowHelper);

		// Events
		eventBus.on("onCapture", ()=>{
			this.arrow.updateKinematicBodyTransform(this.moveMouse, this.arrow.quaternion);
			this.toggleCursor();
		});

		eventBus.on("clapFinish", ()=>{
			this.arrow.beGrabbed = true;

			let target = new THREE.Vector3();
			target = this.Cha.rHandJoint.getWorldPosition(target);
			this.arrow.grabOffset.addVectors(this.arrow.position, target.multiplyScalar(-1));

			this.arrow.changeFromDynamicToKinematic();
		});

		eventBus.on("throwFinish", ()=>{
			this.arrow.beGrabbed = false;

			this.arrow.changeFromKinematicToDynamic();

			let relPos = new THREE.Vector3(0,5,0);
			relPos.y += this.arrow.position.y;
			this.arrow.applyImpulse(new THREE.Vector3(0,-150,0), relPos);

			setTimeout(()=>{
				this.arrow.changeFromDynamicToKinematic();
				this.arrow.beLerping = true;
			}, 3000);
		});

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
		target.y += this.camToChaHeight;
		target.z += this.camToChaDistance;
		this.camera.position.lerp(target, delta*1);
	}

	animate(delta)
	{
		this.ammo.update(delta);
		this.Cha.update(delta);
		this.moveMousePosition = this.Cha.updateHeadLookAt(this.raycaster);
		//this.creatureCreator.follow(this.Cha.rootWorldPosition);
		this.cameraFollow(delta);
		this.chapterManager.update(delta);

		if (this.arrow.beGrabbed)
		{
			let target = new THREE.Vector3();
			target = this.Cha.rHandJoint.getWorldPosition(target);
			target.add(this.arrow.grabOffset);
			this.arrow.updateKinematicBodyTransform(target, this.arrow.quaternion);
		}
		else if (this.arrow.beLerping)
		{
			let target = new THREE.Vector3();
			//target.lerpVectors(this.arrow.position, this.moveMouse, delta*2 );
			target.copy(this.arrow.position);
			this.util.vector3MoveTowards(target, this.moveMouse, delta*15);
			let targetQ = new THREE.Quaternion();
			THREE.Quaternion.slerp( this.arrow.quaternion, this.arrow.originalQ, targetQ, delta*4 );

			this.arrow.updateKinematicBodyTransform(target, targetQ);

			if (this.arrow.position.distanceToSquared(this.moveMouse)<0.2*0.2)
			{
				this.arrow.beLerping = false;
				this.arrow.updateKinematicBodyTransform(target, this.arrow.originalQ);
				this.toggleCursor();
			}
		}

		this.render(delta);
	}

	render(delta)
	{
		if (this.debugMode)
		{
			//this.camera.far = 100;
			//this.camera.updateProjectionMatrix();
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

		//Cha
		this.Cha.onWindowResize();
	}

	onKeyDown(keyCode)
	{
		//console.log(keyCode);
		switch (keyCode)
		{
			// a
			case 65:
			this.Cha.lookReset();
			break;
			
			// s
			case 83:
			this.container.style.cursor = "auto";
			break;

			// d
			case 68:
			break;

			// ←, ↓, →
			case 37:
			case 40:
			case 39:
			break;

			// h
			case 72:
			this.container.style.cursor = "none";
			break;

			// e
			case 69:
			this.chapterManager.end();
			break;

			// c
			case 67:
			this.chapterManager.cleanup();
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

		// --------TEST---------
		// let newCreature = this.creatureCreator.create();
		// this.scene.add(newCreature);
	}

	onMouseMove(event)
	{
		this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
		this.mouse.y = - (event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
		this.raycaster.setFromCamera(this.mouse, this.camera);

		// Convert Screen space to World space
		/*
		this.moveMouse.set((event.clientX / this.screenWidth) * 2 - 1, - (event.clientY / this.screenHeight) * 2 + 1, 0.5);
		this.moveMouse.unproject(this.camera);
		this.moveMouse.sub(this.camera.position).normalize();
		//let distance = (0 - this.camera.position.z) / this.moveMouse.z;
		let distance = this.camera.far;
		this.arrowHelper.position.copy(this.camera.position);
		this.arrowHelper.setDirection(this.moveMouse);
		this.arrowHelper.setLength(distance, distance*0.2, distance*0.2*0.2);
		this.moveMousePosition.copy(this.camera.position).add(this.moveMouse.multiplyScalar(distance));
		*/

		this.moveMouse.set(
				(event.clientX / this.screenWidth) * 2 - 1,
				- (event.clientY / this.screenHeight) * 2 + 1,
				-0.52 //-0.997
			);
		this.moveMouse.unproject(this.camera);

		if(this.arrow.visible && !this.arrow.beGrabbed && !this.arrow.beLerping)
		{
			//this.arrow.position.copy(this.moveMousePosition);

			// Update Kinematic Arrow
			this.arrow.updateKinematicBodyTransform(this.moveMouse, this.arrow.quaternion);
		}
	}

	raycastGround()
	{
		let intersections = this.raycaster.intersectObject(this.ground);
		if (intersections.length > 0)
		{
			this.arrow.tmpVector3 = intersections[0].point;
			this.arrow.tmpVector3.y+=2;
			this.arrow.updateKinematicBodyTransform(this.arrow.tmpVector3, this.arrow.quaternion);
		}
	}

	checkRaycast()
	{
		this.raycaster.setFromCamera(this.mouse, this.camera);
		let intersections = this.raycaster.intersectObjects(this.scene.children, true);
		if (intersections.length > 0)
		{
			let targetObject = intersections[0].object;
			let targetPoint = intersections[0].point;
			if (intersections[0].object.name=="arrow")
			{
				if (intersections.length > 1){
					targetObject = intersections[1].object;
					targetPoint = intersections[1].point;
				}
			}
			console.log(targetObject);

			switch (targetObject.tag)
			{
				case "cha":
				this.Cha.bePoked(intersections[0].point);
				break;

				case "ground":
				//console.log(targetPoint);
				this.Cha.updateMoveTarget(targetPoint);
				break;

				case "creature":
				targetObject.parent.onClick();
				break;

				case "creatureBody":
				targetObject.parent.parent.onClick();
				break;

				case "crumb":
				this.Cha.pickUp(targetObject);
				break;
			}
		}

		//test
		// this.scene.add(this.ammo.throw(this.arrow.model, this.arrow.normalMaterial, this.arrow.shape));
	}

	toggleCursor()
	{
		this.arrow.visible = !this.arrow.visible;

		if (!this.arrow.visible)
			this.container.style.cursor = "auto";
		else
			this.container.style.cursor = "none";
	}
}