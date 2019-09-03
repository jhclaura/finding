import Character from "./character.js"
export default class LazyDude extends Character {
	constructor(ammo, modelLoader, assetPath, tag, callback) {
		super(ammo, modelLoader, assetPath, tag);
		this.time = 0;
		this.callback = callback;
	}

	setupStateMachine()
	{
		this.fsm = new StateMachine({
			init: 'idle',
			transitions: [
				{name: 'notice', from: 'idle', to: 'confuse'},
				{name: 'aware', from: 'confuse', to: 'struggle'},
				{name: 'flip', from: 'struggle', to: 'flip'},
				{name: 'calmDown', from: 'flip', to: 'sit'}
			],
			methods: {
				onIdle: ()=>{
					this.startEating();
				},
				onNotice: ()=>{
					console.log("on lazyDude notice!");
					this.stopEating();

					// show eyebrows
					this.eyebrow_L.visible = true;
					this.eyebrow_R.visible = true;
				},
				onAware: ()=>{
					console.log("on lazyDude aware!");
					this.stopEating();
					this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.struggle, 0.5);
					setTimeout(()=>{
						console.log("dong!");
						this.chapter.shake();
					}, 2500);
				},
				onFlip: ()=>{
					console.log("on lazyDude flip!");
					this.actionDictionary.flip.reset();
					this.prepareCrossFade(this.actionDictionary.struggle, this.actionDictionary.flip, 0.5);
					setTimeout(()=>{
						console.log("dong!");
						this.chapter.shake();
					}, 1000);
				},
				onCalmDown: ()=>{
					console.log("on lazyDude flip!");
					this.actionDictionary.sitUp.reset();
					this.prepareCrossFade(this.actionDictionary.flip, this.actionDictionary.sitUp, 0.5);
					setTimeout(()=>{
						console.log("dong!");
						this.chapter.shake();
					}, 500);
				}
			}
		});
	}
	
	onAniLoopFinished(e)
	{
		let aniName = e.action._clip.name;
		switch(aniName)
		{
			case "struggle":
			if (this.actionDictionary[aniName].weight==1)
			{
				setTimeout(()=>{
					console.log("dong!");
					this.chapter.shake();
				}, 2200);
			}
			break;
		}
	}

	onAniFinished(e)
	{
		let aniName = e.action._clip.name;
		switch(aniName)
		{
			case "sitUp":
			if (this.actionDictionary[aniName].weight==1)
			{
				this.setActionWeight(this.actionDictionary.sitIdle, 1);
				this.actionDictionary.sitIdle.time = 0;
				this.actionDictionary.sitIdle.fadeIn(0.5);
				this.currentAction = 'sitIdle';

				this.lazyFace.morphTargetInfluences[1] = 0;
			}
			break;

			case "hitRight":
			case "hitLeft":
			if (this.actionDictionary[aniName].weight==1)
			{
				this.setActionWeight(this.actionDictionary.sitIdle, 1);
				this.actionDictionary.sitIdle.play();
				this.actionDictionary.sitIdle.fadeIn(0.5);
				this.currentAction = 'sitIdle';
			}
			break;
		}
	}

	afterModelLoaded()
	{
		// this.model.rotation.x = -90 * Math.PI/180;
		this.model.rotation.y = 45 * Math.PI/180;
		this.model.position.set(-160, 10, 0);

		this.eyebrow_L = this.model.getObjectByName( 'eyebrow_L' );
		this.eyebrow_L.visible = false;
		this.eyebrow_R = this.model.getObjectByName( 'eyebrow_R' );
		this.eyebrow_R.visible = false;

		this.lazyFace = this.model.getObjectByName( 'Head1' );
		let expressions = Object.keys( this.lazyFace.morphTargetDictionary );
		this.model.updateMatrixWorld();

		this.headPosition = new THREE.Vector3();
		this.lazyFace.getWorldPosition(this.headPosition);
		this.headRotation = new THREE.Quaternion();
		this.lazyFace.getWorldQuaternion(this.headRotation);

		this.headHolder = new THREE.Object3D();
		this.headShape = this.ammo.createShapeFromBuffergeometry(this.lazyFace.geometry);
		this.headBody = this.ammo.createRigidBody(this.headHolder, this.headShape, 50, this.headPosition, this.headRotation);
		this.headBody.setFriction(10);
		this.headBody.setCollisionFlags(2);	// set to kinematic

		this.headJoint = this.model.getObjectByName( 'HeadJoint' );
		this.leftEyeAnchor = this.model.getObjectByName( 'LeftEyeAnchor' );
		this.rightEyeAnchor = this.model.getObjectByName( 'RightEyeAnchor' );
		this.leftHandJoint = this.model.getObjectByName( 'LeftHandJoint1' );
		this.rightHandJoint = this.model.getObjectByName( 'RightHandJoint1' );
		this.belly = this.model.getObjectByName( 'dummyBody' );

		this.bodyJoint = this.model.getObjectByName( 'BodyJoint' );
		this.bodyPosition = new THREE.Vector3();
		this.bodyJoint.getWorldPosition(this.bodyPosition);

		// Create soft volumes
		// V1
		// this.softBellyGeometry = new THREE.SphereBufferGeometry( 55, 40, 25 );
		// this.softBellyGeometry.translate( bodyPosition.x, 100, bodyPosition.z );
		// this.ammo.processGeometryForSoftVolume(this.softBellyGeometry);
		// this.softBelly = new THREE.Mesh( this.softBellyGeometry, new THREE.MeshLambertMaterial( { color: 0xff917b } ) );
		
		// V2
		// this.softBellyGeometry = dummyBody.geometry;
		// this.softBellyGeometry.rotateX(-90 * Math.PI/180);
		// this.softBellyGeometry.translate( bodyPosition.x, bodyPosition.y, bodyPosition.z );
		// this.ammo.processGeometryForSoftVolume(this.softBellyGeometry);
		// this.softBelly = new THREE.Mesh( this.softBellyGeometry, new THREE.MeshLambertMaterial( { color: 0xff917b } ) );

		// this.add( this.softBelly );
		// this.ammo.createSoftVolume( this.softBelly, this.softBellyGeometry, 15, 250, 0.9 );	// mass, pressure

		this.bellyHolder = new THREE.Object3D();
		this.bellyShape = this.ammo.createSphereShape(60);
		this.bellyBody = this.ammo.createRigidBody(this.bellyHolder, this.bellyShape, 50, this.bodyPosition, this.bellyHolder.quaternion);
		this.bellyBody.setFriction(10);
		this.bellyBody.setCollisionFlags(2);	// set to kinematic

		// Left hand
		this.sphereGeo = new THREE.SphereBufferGeometry(15);
		this.sphereShape = this.ammo.createShapeFromBuffergeometry(this.sphereGeo);

		this.leftHandPosition = new THREE.Vector3();
		this.leftHandJoint.getWorldPosition(this.leftHandPosition);
		this.leftHandHolder = new THREE.Mesh(this.sphereGeo);
		this.add(this.leftHandHolder);
		this.leftHandBody = this.ammo.createRigidBody(this.leftHandHolder, this.sphereShape, 50, this.leftHandPosition, this.leftHandHolder.quaternion);
		this.leftHandBody.setCollisionFlags(2);		// set to kinematic

		// Right hand
		this.rightHandPosition = new THREE.Vector3();
		this.rightHandJoint.getWorldPosition(this.rightHandPosition);
		this.rightHandHolder = new THREE.Mesh(this.sphereGeo);
		this.add(this.rightHandHolder);
		this.rightHandBody = this.ammo.createRigidBody(this.rightHandHolder, this.sphereShape, 50, this.rightHandPosition, this.rightHandHolder.quaternion);
		this.rightHandBody.setCollisionFlags(2);	// set to kinematic

		// Animation setting
		this.doMouthAnimation = true;
		this.actionDictionary.flip.loop = THREE.LoopOnce;
		this.actionDictionary.flip.clampWhenFinished = true;
		this.actionDictionary.sitUp.loop = THREE.LoopOnce;
		this.actionDictionary.sitUp.clampWhenFinished = true;
		this.actionDictionary.hitRight.loop = THREE.LoopOnce;
		this.actionDictionary.hitRight.clampWhenFinished = true;
		this.actionDictionary.hitLeft.loop = THREE.LoopOnce;
		this.actionDictionary.hitLeft.clampWhenFinished = true;

		this.callback();
	}

	customUpdate(delta)
	{
		this.time += delta;

		if (this.fsm.state=='flip')
			this.lazyFace.morphTargetInfluences[1] = (Math.sin(this.time*2)+1)/2;
		else if (this.fsm.state=='sit')
			this.lazyFace.morphTargetInfluences[2] = (Math.sin(this.time*2)+1)/2;
		else if (this.doMouthAnimation)
			this.lazyFace.morphTargetInfluences[0] = (Math.sin(this.time*2)+1)/2;

		// update body parts position
		this.bodyJoint.getWorldPosition(this.bodyPosition);
		this.ammo.updateKinematicBody(this.bellyBody, this.bodyPosition);

		this.lazyFace.getWorldPosition(this.headPosition);
		this.lazyFace.getWorldQuaternion(this.headRotation);
		this.ammo.updateKinematicBody(this.headBody, this.headPosition, this.headRotation);

		this.leftHandJoint.getWorldPosition(this.leftHandPosition);
		this.rightHandJoint.getWorldPosition(this.rightHandPosition);
		this.ammo.updateKinematicBody(this.leftHandBody, this.leftHandPosition);
		this.ammo.updateKinematicBody(this.rightHandBody, this.rightHandPosition);
	}

	startEating()
	{
		this.eatInterval = setInterval(()=>{
			
		}, 500);
	}

	stopEating()
	{
		this.doMouthAnimation = false;
		this.lazyFace.morphTargetInfluences[0] = 0.1;
	}

	notice()
	{
		if (this.fsm.can('notice'))
		{
			this.fsm.notice();
		}
	}

	aware()
	{
		if (this.fsm.can('aware'))
		{
			this.fsm.aware();
		}
	}

	flip()
	{
		if (this.fsm.can('flip'))
		{
			this.fsm.flip();
			this.lazyFace.morphTargetInfluences[0] = 0;
		}
	}

	calmDown()
	{
		if (this.fsm.can('calmDown'))
		{
			this.fsm.calmDown();
		}
	}

	hitRight()
	{
		this.actionDictionary.sitUp.weight = 0;
		this.actionDictionary.hitLeft.weight = 0;
		if(this.currentAction=='sitIdle'){
			this.actionDictionary.sitIdle.stop();
			this.actionDictionary.hitRight.reset();
			this.actionDictionary.hitRight.weight = 1;
			// this.prepareCrossFade(this.actionDictionary.sitIdle, this.actionDictionary.hitRight, 0.5);
		}
	}

	hitLeft()
	{
		this.actionDictionary.sitUp.weight = 0;
		this.actionDictionary.hitRight.weight = 0;
		if(this.currentAction=='sitIdle'){
			this.actionDictionary.sitIdle.stop();
			this.actionDictionary.hitLeft.reset();
			this.actionDictionary.hitLeft.weight = 1;
			// this.prepareCrossFade(this.actionDictionary.sitIdle, this.actionDictionary.hitLeft, 0.5);
		}
	}
}