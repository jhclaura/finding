import LazyDude from '../lazyDude.js'
export default class LazyChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, creatureCreator, cha, chapterManager)
	{
		super();
		this.chapterName = "lazy";
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;
		this.cha = cha;
		this.chapterManager = chapterManager;
		this.scene = chapterManager.scene;
		this.cameraController = chapterManager.cameraController;

		this.debugMode = false;
		
		this.annoyTriggerAmount = 3;
		this.flipTriggerAmount = 6;

		this.tmpVector3 = new THREE.Vector3();
		this.tmpQuaternion = new THREE.Quaternion();

		this.colors = [0xffad5a, 0x6173f4, 0xf469a9, 0xFF5722];
		this.materials = [];
		this.allCrumbs = [];
		this.pickedCrumbs = [];
		this.thrownCrumbs = [];
		this.candys = [];
		this.droppedCandys = [];
		this.pickedBalls = [];
		this.allBalls = [];
		this.thrownBalls = [];

		this.time=0;
		this.crumbHeightFactor=0;
		this.crumbOriginalQuaternion = new THREE.Quaternion();
		this.hasCrumbBeGrabbed = false;
		this.currentGrabbedCrumb;
		this.thrownCrumbCount = 0;
		this.thingsOnHeadHeight = 1.3;

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
					this.cameraInSceneB();
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
		this.crumbShape = this.ammo.createShapeFromBuffergeometry(this.crumbGeometry);
		for(let i=0; i<20; i++)
		{
			for(let j=0; j<3; j++)
			{
				let _c = new THREE.Mesh(this.crumbGeometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
				_c.position.set(-i*10 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				_c.rotation.x = 90/180*Math.PI;
				_c.tag = "crumb";
				this.add(_c);
				this.allCrumbs.push(_c);
			}
		}

		let target = new THREE.Vector3();
		target = this.cha.headJoint.getWorldPosition(target);
		target.y += 2;

		// Create candy
		this.candyGeometry = new THREE.TetrahedronBufferGeometry(2);
		this.candyShape = this.ammo.createShapeFromBuffergeometry(this.candyGeometry);
		this.candyMateiral = new THREE.MeshLambertMaterial({color: 0x01df01});
		for (let i=0; i<20; i++)
		{
			let _c = new THREE.Mesh(this.candyGeometry, this.candyMateiral);
			_c.position.set(-178, 100, -18);
			_c.tag = "candy";
			this.add(_c);
			this.candys.push(_c);
		}

		userUtil.loadShader("js/shaders/lavaVertex.vert", "js/shaders/lavaFragment.frag", (vert_text, frag_text)=>{this.onShaderLoaded(vert_text, frag_text);});

		// ------- Lazy Dude -------
		this.lazyDude = new LazyDude(this.ammo, this.modelLoader, "./assets/models/lazyDude.glb", 'lazyDude', ()=>{			
			if (this.debugMode)
			{
				this.lazyDude.model.position.set(0, 10, 0);
			}
			this.lazyDude.chapter = this;
			if (this.bellyMaterial!=null)
				this.lazyDude.belly.material = this.bellyMaterial;
		});
		this.add(this.lazyDude);

		window.lazyDude = this.lazyDude;

		// VolleyBall
		this.volleyBallMat = new THREE.MeshLambertMaterial({color: 0xf4f0d9});
		this.textureLoader = new THREE.TextureLoader();
		this.textureLoader.load('assets/textures/volleyball.jpg', (tex)=>{
			this.volleyBallMat.map = tex;
		});
		this.volleyBallGeo = new THREE.SphereBufferGeometry(1.5);
		this.volleyBallShape = this.ammo.createShapeFromBuffergeometry(this.volleyBallGeo);

		if(this.debugMode)
		{
			this.cameraInSceneB();
		}
	}

	cameraInSceneB()
	{
		this.chapterManager.controlsCamera = true;

		// Move camera to fixed position
		let followPosition = this.cameraController.getFollowPosition();
		TweenMax.to(this.cameraController, 2, {
			setX: followPosition.x - 87, setY: 100, setZ: 90, currentFrustumSize: 150, onUpdate: ()=>{
				this.cameraController.setFrustumSize(this.cameraController.currentFrustumSize);
			}, onComplete:()=>{
				//console.log(this.cameraController.camera.position);
			}
		});
		this.inSceneB = true;
	}

	onShaderLoaded(vert_text, frag_text)
	{
		this.bellyMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: {
					type: 'f',
					value: 0.0
				},
				color_1: { value: new THREE.Color( 0xf5e1da ) },
				color_2: { value: new THREE.Color( 0xf1f1f1 ) },
				color_3: { value: new THREE.Color( 0x49beb7 ) }
			},
			vertexShader: vert_text,
			fragmentShader: frag_text
		});

		if(this.lazyDude!=null && this.lazyDude.belly!=null)
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
	}

	update(delta)
	{
		this.time += delta;
		this.lazyDude.update(delta);

		if (this.pickedCrumbs.length>0)
		{
			this.cha.headJoint.getWorldPosition(this.tmpVector3);
			this.tmpVector3.y+=2;
			this.cha.headJoint.getWorldQuaternion(this.tmpQuaternion);
			this.pickedCrumbs[0].position.copy(this.tmpVector3);
			let baseHeightVal = this.thingsOnHeadHeight /(this.pickedCrumbs.length-1);
			for(let i=1; i<this.pickedCrumbs.length; i++)
			{
				// let timeVariable = (this.time-i);
				let timeVariable = this.time;
				this.pickedCrumbs[i].position.z = -0.8 - ( Math.sin((this.time-i)*4) + 1 ) / 2 * (baseHeightVal * i * this.crumbHeightFactor);
			}
		}

		if (this.pickedBalls.length>0)
		{
			this.cha.headJoint.getWorldPosition(this.tmpVector3);
			this.tmpVector3.y+=2;
			this.cha.headJoint.getWorldQuaternion(this.tmpQuaternion);
			this.pickedBalls[0].position.copy(this.tmpVector3);
			let baseHeightVal = this.thingsOnHeadHeight /(this.pickedBalls.length-1);
			for(let i=1; i<this.pickedBalls.length; i++)
			{
				let timeVariable = this.time;
				this.pickedBalls[i].position.y = 2 + ( Math.sin((this.time-i)*4) + 1 ) / 2 * (baseHeightVal * i * this.crumbHeightFactor);
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

		if(pickedCrumb.tag == "crumb")
		{
			pickedCrumb.tag = "pickedCrumb";
			this.allCrumbs = this.allCrumbs.filter(item => item !== pickedCrumb);
			this.pickedCrumbs.push(pickedCrumb);

			if(this.pickedCrumbs.length==1)
			{
				return;
			}
			else
			{
				this.pickedCrumbs[this.pickedCrumbs.length-2].attach(pickedCrumb);
				this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), userUtil.getRandomFloat(-0.15,0.15), -0.8);
				pickedCrumb.position.copy(this.tmpVector3);
			}
		}
		else if (pickedCrumb.tag == "vball")
		{
			pickedCrumb.tag = "pickedBall";
			pickedCrumb.rotation.x = pickedCrumb.rotation.z = 0;
			this.allBalls = this.allBalls.filter(item => item !== pickedCrumb);
			this.pickedBalls.push(pickedCrumb);

			if(this.pickedBalls.length==1)
			{
				return;
			}
			else
			{
				this.pickedBalls[this.pickedBalls.length-2].attach(pickedCrumb);
				this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), 2, userUtil.getRandomFloat(-0.15,0.15));
				pickedCrumb.position.copy(this.tmpVector3);
			}
		}
	}

	getRandomMaterial()
	{
		return this.materials[userUtil.getRandomInt(0,this.materials.length)];
	}

	throwCrumb()
	{
		if(this.pickedCrumbs.length==0)
		{
			this.throwBall();
			return;
		}

		let targetPosition = this.lazyDude.bodyPosition.clone();
		targetPosition.y += 150;

		// get the last one
		let _crumb = this.pickedCrumbs[this.pickedCrumbs.length-1];
		this.pickedCrumbs = this.pickedCrumbs.filter(item => item !== _crumb);
		this.attach(_crumb);

		// throw to target
		let crumbBody = this.ammo.createRigidBody(_crumb, this.crumbShape, 5, _crumb.position, _crumb.quaternion);
		crumbBody.setFriction(10);
		targetPosition.sub(_crumb.position).normalize();
		targetPosition.multiplyScalar(70);
		_crumb.userBtVector3 = new Ammo.btVector3(targetPosition.x, targetPosition.y, targetPosition.z);
		crumbBody.setLinearVelocity(_crumb.userBtVector3);		
		this.thrownCrumbs.push(_crumb);

		// timed to delete physics
		// setTimeout(()=>{
		// 	// let d_crumb = this.thrownCrumbs[this.thrownCrumbs.length-1];
		// 	Ammo.destroy(_crumb.userBtVector3);
		// 	this.ammo.removeRigidBody(_crumb);
		// 	this.thrownCrumbs = this.thrownCrumbs.filter(item => item !== _crumb);
		// }, 5000);

		this.thrownCrumbCount++;

		if (this.thrownCrumbCount>1 && this.lazyDude.fsm.state=="idle")
		{
			this.lazyDude.notice();
		}
		else if(this.thrownCrumbCount>2 && this.lazyDude.fsm.state=="confuse")
		{
			this.lazyDude.aware();
		}
		else if(this.thrownCrumbCount>3 && this.lazyDude.fsm.state=="struggle")
		{
			this.lazyDude.flip();
		}
	}

	throwBall()
	{
		if(this.pickedBalls.length==0)
		{
			return;
		}

		this.lazyDude.hitRight();

		let targetPosition = new THREE.Vector3();
		this.lazyDude.headJoint.getWorldPosition(targetPosition);
		targetPosition.x -= 50;
		targetPosition.y += 50;

		// get the last one
		let _ball = this.pickedBalls[this.pickedBalls.length-1];
		this.pickedBalls = this.pickedBalls.filter(item => item !== _ball);
		this.attach(_ball);

		// throw to target
		let bBody = this.ammo.createRigidBody(_ball, this.volleyBallShape, 5, _ball.position, _ball.quaternion);
		bBody.setFriction(10);
		targetPosition.sub(_ball.position).normalize();
		targetPosition.multiplyScalar(70);
		_ball.userBtVector3 = new Ammo.btVector3(targetPosition.x, targetPosition.y, targetPosition.z);
		bBody.setLinearVelocity(_ball.userBtVector3);		
		this.thrownBalls.push(_ball);

		this.thrownCrumbCount++;

		if(this.thrownCrumbCount>1 && this.lazyDude.fsm.state=="flip")
		{
			this.lazyDude.calmDown();
		}
	}

	dropCandy()
	{
		if(this.candys.length==0) return;

		let targetPosition = new THREE.Vector3();
		if (this.lazyDude.fsm.state=='flip')
		{
			if (Math.random()>0.5)
				this.lazyDude.leftEyeAnchor.getWorldPosition(targetPosition);
			else
				this.lazyDude.rightEyeAnchor.getWorldPosition(targetPosition);
		}
		else
		{
			this.lazyDude.headJoint.getWorldPosition(targetPosition);
			targetPosition.y += 50;
		}

		// get the first one
		let _candy = this.candys[0];
		this.candys = this.candys.filter(item => item !== _candy);
		
		// drop
		console.log("drop candy!");
		let candyBody = this.ammo.createRigidBody(_candy, this.candyShape, 5, targetPosition, _candy.quaternion);
		candyBody.setFriction(1);
		this.droppedCandys.push(_candy);

		// timed to delete physics
		setTimeout(()=>{
			// let d_crumb = this.thrownCrumbs[this.thrownCrumbs.length-1];
			this.ammo.removeRigidBody(_candy);
			this.droppedCandys = this.droppedCandys.filter(item => item !== _candy);
			this.candys.push(_candy);
		}, 5000);
	}

	shake()
	{
		this.ammo.applyForceToAll(50);
		this.cameraController.shake(2);
	}

	convertAllCrumbsToBalls()
	{
		for (let i=this.allCrumbs.length-1; i>=0; i--)
		{
			this.createVolleyBall(this.allCrumbs[i].position);

			this.remove(this.allCrumbs[i]);
			this.allCrumbs.pop();
		}

		for (let i=this.pickedCrumbs.length-1; i>=0; i--)
		{
			let b = this.createVolleyBall(this.pickedCrumbs[i].position, true);
			b.rotation.x = b.rotation.z = 0;
			b.tag = "pickedBall";
			this.pickedBalls.push(b);

			this.remove(this.pickedCrumbs[i]);
			this.pickedCrumbs.pop();
		}
		for (let i=1; i<this.pickedBalls.length; i++)
		{
			this.pickedBalls[i-1].attach(this.pickedBalls[i]);
			this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), 2, userUtil.getRandomFloat(-0.15,0.15));
			this.pickedBalls[i].position.copy(this.tmpVector3);
		}

		for (let i=this.thrownCrumbs.length-1; i>=0; i--)
		{
			this.createVolleyBall(this.thrownCrumbs[i].position);

			Ammo.destroy(this.thrownCrumbs[i].userBtVector3);
			this.ammo.removeRigidBody(this.thrownCrumbs[i]);
			this.remove(this.thrownCrumbs[i]);
			this.thrownCrumbs.pop();
		}

		this.thingsOnHeadHeight = 4;
		this.thrownCrumbCount = 0;
	}

	createVolleyBall(b_position, returnBall=false)
	{
		let v_ball = new THREE.Mesh(this.volleyBallGeo, this.volleyBallMat);
		v_ball.position.copy(b_position); userUtil
		v_ball.position.y+=0.5;
		v_ball.rotation.x = userUtil.getRandomFloat(-45,45) / 180*Math.PI;
		v_ball.rotation.z = userUtil.getRandomFloat(70,100) / 180*Math.PI;
		v_ball.rotation.y = Math.random()*90/180*Math.PI;
		v_ball.tag = "vball";
		this.add(v_ball);

		if (returnBall)
			return v_ball;
		else
		{
			this.allBalls.push(v_ball);
			return null;
		}
	}
}