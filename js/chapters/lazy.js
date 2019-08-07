import LazyDude from '../lazyDude.js'
export default class LazyChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, creatureCreator, cha, chapterManager)
	{
		super();
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;
		this.cha = cha;
		this.chapterManager = chapterManager;
		this.scene = chapterManager.scene;
		this.cameraController = chapterManager.cameraController;

		this.tmpVector3 = new THREE.Vector3();
		this.tmpQuaternion = new THREE.Quaternion();

		this.colors = [0xffad5a, 0x6173f4, 0xf469a9, 0xFF5722];
		//this.colors = [0x65ead1, 0xf469a9, 0xff917b, 0xfcffc1];
		// this.colors = [0xf57665, 0xff5da2, 0x1abb9c, 0xf7aa00];
		this.materials = [];
		this.crumbs = [];

		this.time=0;
		this.crumbHeightFactor=0;
		this.crumbOriginalQuaternion = new THREE.Quaternion();
		this.hasCrumbBeGrabbed = false;
		this.currentGrabbedCrumb;

		this.inSceneB = false;

		// Events
		eventBus.on("ChapterEnds", ()=>{		
			this.end();
		});
		eventBus.on("ChaStartWalking", ()=>{
			TweenMax.killTweensOf(this, {crumbHeightFactor: true});	//The values assigned to each property don’t matter
			TweenMax.to(this, 1.5, {crumbHeightFactor: 1});
		});
		eventBus.on("ChaStopWalking", ()=>{
			TweenMax.killTweensOf(this, {finalCrumbHeight: true});	//The values assigned to each property don’t matter
			TweenMax.to(this, 0.5, {crumbHeightFactor: 0});
		});
		eventBus.on("ChaCollideTrigger", (trigger)=>{
			if (trigger=="sceneB")
			{
				if (this.inSceneB)
				{
					// back to scene A
					console.log("back to scene A");
					
					let followPosition = this.cameraController.getFollowPosition();
					TweenMax.to(this.cameraController, 2, {
						setX: followPosition.x, setY: followPosition.y, setZ: followPosition.z, currentFrustumSize: this.cameraController.defaultFrustumSize, onUpdate: ()=>{
							this.cameraController.setFrustumSize(this.cameraController.currentFrustumSize);
						}, onComplete:()=>{
							this.chapterManager.controlsCamera = false;
						}
					});

					this.inSceneB = false;
				}
				else
				{
					// to scene B
					console.log("to scene B");
					this.chapterManager.controlsCamera = true;

					// Move camera to fixed position
					let followPosition = this.cameraController.getFollowPosition();
					TweenMax.to(this.cameraController, 2, {
						setX: followPosition.x - 87, setY: 100, setZ: 90, currentFrustumSize: 150, onUpdate: ()=>{
							this.cameraController.setFrustumSize(this.cameraController.currentFrustumSize);
						}, onComplete:()=>{
							console.log(this.cameraController.camera.position);
						}
					});
					this.inSceneB = true;
				}
			}
		});

		this.setup();
	}

	setup()
	{
		this.crumbOriginalQuaternion.setFromAxisAngle(new THREE.Vector3(0,1,0).normalize(), -90/180*Math.PI);

		for(let i=0; i<this.colors.length; i++)
		{
			this.materials.push( new THREE.MeshLambertMaterial({color: this.colors[i]}) );
		}

		// Scene B Trigger
		this.boxGeo = new THREE.BoxBufferGeometry(1,1,1);
		this.SceneBTrigger = new THREE.Mesh(this.boxGeo, this.materials[0]);
		this.SceneBTrigger.tag = "trigger";
		this.SceneBTrigger.name = "sceneB";
		this.SceneBTrigger.scale.set(4, 10, 100);
		this.SceneBTrigger.position.set(-140, 0, 30);
		this.scene.add(this.SceneBTrigger);

		// Create crumbs
		this.crumbGeometry = new THREE.TorusBufferGeometry(0.8, 0.4, 8, 10);
		// this.crumbShape = this.ammo.createShapeFromBuffergeometry(this.crumbGeometry);

		for(let i=0; i<20; i++)
		{
			for(let j=0; j<3; j++)
			{
				let _c = new THREE.Mesh(this.crumbGeometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
				_c.position.set(-i*15 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				_c.rotation.x = 90/180*Math.PI;
				_c.tag = "crumb";
				// this.crumbs.push(_c);
				this.add(_c);

				// this.tmpVector3.set(-i*15 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				// let _c = new Crumb(this.ammo, this.tmpVector3, this.tmpQuaternion, this);
				// this.crumbs.push(_c);
				// this.add(_c);
			}
		}

		let target = new THREE.Vector3();
		target = this.cha.headJoint.getWorldPosition(target);
		target.y += 2;

		// TEST
		// for (let i=0; i<15; i++)
		// {			
		// 	// let _c = new Crumb(this.ammo, this.tmpVector3, this.tmpQuaternion, this, i);
		// 	let _c = new THREE.Mesh(this.crumbGeometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
			
		// 	if(i==0)
		// 	{
		// 		this.tmpVector3.copy(target);
		// 		_c.position.copy(this.tmpVector3);
		// 		_c.rotation.x = 90/180*Math.PI;
		// 		this.add(_c);
		// 	}
		// 	else
		// 	{
		// 		this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), userUtil.getRandomFloat(-0.15,0.15), -0.8);
		// 		_c.position.copy(this.tmpVector3);
		// 		this.crumbs[i-1].add(_c);
		// 	}			
		// 	_c.tag = "crumb";
		// 	this.crumbs.push(_c);
		// 	console.log(this.crumbs[i]);
		// }

		userUtil.loadShader("js/shaders/lavaVertex.vert", "js/shaders/lavaFragment.frag", (vert_text, frag_text)=>{this.onShaderLoaded(vert_text, frag_text);});

		// ------- Lazy Dude -------
		this.lazyDude = new LazyDude(this.ammo, this.modelLoader, "./assets/models/lazyDude.glb", 'lazyDude', ()=>{			
			// console.log(this.lazyDude.belly);
		});
		this.add(this.lazyDude);
		// this.modelLoader.load("./assets/models/lazyDude.glb", (gltf)=>{this.onLoadModel(gltf);});

	}

	onShaderLoaded(vert_text, frag_text)
	{
		this.bellyMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: {
					type: 'f',
					value: 0.0
				}
			},
			vertexShader: vert_text,
			fragmentShader: frag_text
		});

		this.lazyDude.belly.material = this.bellyMaterial;

		// let testMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(20,4), this.bellyMaterial);
		// this.add(testMesh);
	}

	onLoadModel(gltf)
	{		
		this.lazyDude = gltf.scene.children[0];
		console.log(this.lazyDude);
		this.lazyDude.rotation.x = -90 * Math.PI/180;
		this.lazyDude.rotation.z = 45 * Math.PI/180;
		this.lazyDude.position.y = 10;
		this.lazyDude.matrixWorldNeedsUpdate = true;

		this.LD_animations = gltf.animations;

		this.add(this.lazyDude);	// RootNode

		this.lazyFace = this.lazyDude.getObjectByName( 'Head' );
		// console.log(this.lazyFace);
		let expressions = Object.keys( this.lazyFace.morphTargetDictionary );
		for (let i=0; i<expressions.length; i++)
		{
			console.log(expressions[i]);
		}

		this.lazyDude.updateMatrixWorld();

		let dummyBody = this.lazyDude.getObjectByName( 'dummyBody' );
		dummyBody.visible = false;
		this.bodyJoint = this.lazyDude.getObjectByName( 'BodyJoint' );
		let bodyPosition = new THREE.Vector3();
		this.bodyJoint.getWorldPosition(bodyPosition);
		console.log(bodyPosition);

		// Create soft volumes
		this.softBellyGeometry = new THREE.SphereBufferGeometry( 1.5, 40, 25 );
		this.softBellyGeometry.translate( bodyPosition.x, bodyPosition.y, bodyPosition.z );
		this.ammo.processGeometryForSoftVolume(this.softBellyGeometry);
		this.softBelly = new THREE.Mesh( this.softBellyGeometry, new THREE.MeshLambertMaterial( { color: 0xff917b } ) );
		// this.softBelly.frustumCulled = false;
		this.add( this.softBelly );
		this.ammo.createSoftVolume( this.softBelly, this.softBellyGeometry, 15, 250 );

		this.LD_animationMixer = new THREE.AnimationMixer(this.lazyDude);
		this.LD_actionDictionary = {};
		for(let i=0; i<this.LD_animations.length; i++)
		{
			this.LD_actionDictionary[this.LD_animations[i].name] = this.LD_animationMixer.clipAction(this.LD_animations[i].optimize());//this.animations[i].optimize()
		}
		// this.LD_actionDictionary.clap.loop = THREE.LoopOnce;
		// this.LD_actionDictionary.clap.clampWhenFinished = true;
		this.activateAllActions("idle");
		this.LD_currentAction = 'idle';

		this.LD_animationMixer.addEventListener( "loop", (e)=>{this.onAniLoopFinished(e);} );
		this.LD_animationMixer.addEventListener( "finished", (e)=>{this.onAniFinished(e);} );
	}

	update(delta)
	{
		this.time += delta;
		this.lazyDude.update(delta);

		if(this.crumbs.length>0)
		{
			this.cha.headJoint.getWorldPosition(this.tmpVector3);
			this.tmpVector3.y+=2;
			this.cha.headJoint.getWorldQuaternion(this.tmpQuaternion);
			this.crumbs[0].position.copy(this.tmpVector3);
			// this.tmpQuaternion.multiply(this.crumbOriginalQuaternion);
			// this.crumbs[0].quaternion.copy(this.tmpQuaternion.normalize());

			let baseHeightVal = 1.3/(this.crumbs.length-1);
			for(let i=1; i<this.crumbs.length; i++)
			{
				// let timeVariable = (this.time-i);
				let timeVariable = this.time;
				this.crumbs[i].position.z = -0.8 - ( Math.sin((this.time-i)*4) + 1 ) / 2 * (baseHeightVal * i * this.crumbHeightFactor);
			}
		}

		if (this.hasCrumbBeGrabbed)
		{
			let target = new THREE.Vector3();
			target = this.cha.rHandJoint.getWorldPosition(target);
			target.add(this.currentGrabbedCrumb.grabOffset);
			this.currentGrabbedCrumb.position.copy(target);
		}

		if (this.bellyMaterial)
			this.bellyMaterial.uniforms['time'].value = this.time * 0.01;
	}

	end()
	{
		// prepareToEnd
	}

	cleanup()
	{
		// dispose stuff
	}

	bePicked(pickedCrumb)
	{
		let target = new THREE.Vector3();
		target = this.cha.rHandJoint.getWorldPosition(target);
		pickedCrumb.grabOffset = new THREE.Vector3();
		pickedCrumb.grabOffset.addVectors(pickedCrumb.position, target.multiplyScalar(-1));
		this.currentGrabbedCrumb = pickedCrumb;
		this.hasCrumbBeGrabbed = true;		
	}

	bePickedFinal(pickedCrumb)
	{
		this.hasCrumbBeGrabbed = false;
		this.currentGrabbedCrumb = null;

		pickedCrumb.tag = "pickedCrumb";
		this.crumbs.push(pickedCrumb);

		if(this.crumbs.length==1)
		{
			return;
		}
		else
		{
			this.crumbs[this.crumbs.length-2].attach(pickedCrumb);
			this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), userUtil.getRandomFloat(-0.15,0.15), -0.8);
			pickedCrumb.position.copy(this.tmpVector3);
		}
	}

	getRandomMaterial()
	{
		return this.materials[userUtil.getRandomInt(0,this.materials.length)];
	}
}