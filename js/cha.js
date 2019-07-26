// Animation reference: https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
// import Util from "./util.js"

export default class Cha extends THREE.Object3D {
	constructor(scene, modelLoader) {
		super();
		this.scene = scene;
		this.modelLoader = modelLoader;
		this.finishedLoading = false;
		this.showRaycastHelper = false;

		this.init();
	}

	init()
	{
		this.currentAction = "";
		this.fsm = new StateMachine({
			init: 'idle',
			transitions: [
				{name: 'walk', from: 'idle', to: 'follow'},
				{name: 'stopWalking', from: 'follow', to: 'idle'},
				{name: 'capture', from: ['idle', 'follow'], to: 'clap'},
				{name: 'drop', from: 'clap', to: 'idle'},
				{name: 'pickDown', from: ['idle', 'follow'], to: 'pick'},
				{name: 'pickUp', from: 'pick', to: 'idle'}
			],
			methods: {
				onWalk: ()=>{
					this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.walk, 0.5);
				},
				onStopWalking: ()=>{
					this.prepareCrossFade(this.actionDictionary.walk, this.actionDictionary.idle, 0.5);
				},
				onCapture: (lifecycle)=>{
					eventBus.emit("onCapture");
					//console.log("onCapture! lifecycle.from: " + lifecycle.from);
					this.actionDictionary.clap.reset();
					if (lifecycle.from == 'idle')
						this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.clap, 0.5);
					else
						this.prepareCrossFade(this.actionDictionary.walk, this.actionDictionary.clap, 0.5);
				},
				onDrop: ()=>{
					this.actionDictionary.throw.paused = false;
					TweenMax.to( this.spineJoint.children[0].quaternion, 0.5, {x:0, y:0, z:0, w:1, delay: 0.5} );
					this.prepareCrossFade(this.actionDictionary.clap, this.actionDictionary.throw, 0.5);

					setTimeout(()=>{
						eventBus.emit("throwFinish");
					}, 500);
				},
				onPickDown: (lifecycle)=>{
					if (lifecycle.from == 'idle')
						this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.squad, 0.5);
					else
						this.prepareCrossFade(this.actionDictionary.walk, this.actionDictionary.squad, 0.5);
				}
			}
		});
		this.justCaptured = false;

		this.modelLoader.load("./assets/models/cha_gameExport.glb", (gltf)=>{this.onLoadModel(gltf);});

		this.moveTarget = new THREE.Vector3();
		this.rotateTarget = new THREE.Quaternion();
		this.headLookTarget = new THREE.Quaternion();
		this.rootWorldPosition = new THREE.Vector3();

		// this.util = new Util();

		let geo = new THREE.CylinderGeometry( 0, 2, 4, 5 );
		let mat = new THREE.MeshLambertMaterial({ color: 0x777777 });
		this.dummyHead = new THREE.Mesh(geo, mat);
		this.dummyHead.visible = false;
		this.dummyHead.scale.multiplyScalar(2);
		this.dummyHead.position.y = 15;

		this.identityQuaternion = new THREE.Quaternion();

		// Dialogue

		this.dialogueContainer = document.createElement('div');
		this.dialogueContainer.id = "cha_type_wrap";
		this.dialogueContainer.className = "type_wrap";
		this.dialogueContainer.style.top = window.innerHeight/4 + "px";
		this.dialogueContainer.style.left = window.innerWidth/3 + "px";
		document.body.appendChild(this.dialogueContainer);

		this.dialogue = document.createElement('span');
		this.dialogue.id = "cha_type";
		this.dialogueContainer.appendChild(this.dialogue);

		this.dialogueCursor = document.createElement('span');
		this.dialogueCursor.className = "typed-cursor typed-cursor--blink";
		this.dialogueContainer.appendChild(this.dialogueCursor);

		this.typed = new Typed("#cha_type", {
			strings: ["<i>First</i> sentence.", "&amp; a second sentence.", " "],
			typeSpeed: 40,
			backDelay: 500,
			startDelay: 1000,
			showCursor: false,
  			cursorChar: '<',
  			onStart: (arrayPos, self)=>{
  				console.log("Cha's dialogue starts!");
  				self.showCursor = true;
  			},
			onComplete: (self)=>{
				console.log("Cha's dialogue ends!");
				self.showCursor = false;
				self.reset();
				self.stop();
			}
		});
		this.typed.stop();

		// --------Collision--------
		if (this.showRaycastHelper)
		{
			var dir = new THREE.Vector3( 0, 0, 1 );
			var origin = new THREE.Vector3( 0, 1, 0 );
			var length = 5;
			var hex = 0xff0000;
			this.arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
			this.add(this.arrowHelper);
		}
		this.collisionRaycaster = new THREE.Raycaster();
		this.collisionRaycaster.far = 5;
		this.raycastOrigin = new THREE.Vector3();
		this.raycastDirection = new THREE.Vector3();
		this.previousCollider = null;
	}

	onLoadModel(gltf)
	{
		this.gltf = gltf;
		this.model = this.gltf.scene.children[0];
		this.model.children[0].scale.multiplyScalar(1000);
		console.log(this.model);	// RootNode
		//console.log(this.model.children[0]);	// Cha
		this.animations = this.gltf.animations;
		console.log(this.animations);
		this.add(this.model);

		// if (this.showRaycastHelper)
		// 	this.model.add(this.arrowHelper);

		this.spineJoint = this.model.children[0].children[0].children[0].children[2];
		// ===== Debug look =====
		this.headJoint = this.model.children[0].children[0].children[0].children[2].children[0].children[0].children[2];
		this.rHandJoint = this.model.children[0].children[0].children[0].children[2].children[0].children[0].children[1].children[0].children[0].children[0];
		this.model.children[0].children[0].children[0].children[2].children[0].children[0].attach(this.dummyHead);
		this.lookQuaternionBase = this.dummyHead.quaternion;

		// Bounding box
		this.model.traverse (function (mesh)
	    {
	        if (mesh instanceof THREE.Mesh)
	        {
	            //mesh.geometry.computeBoundingBox ();
	            // mesh.frustumCulled = false;
	            mesh.tag = "cha";
	        }
	    });

		this.animationMixer = new THREE.AnimationMixer(this.model);
		this.actionDictionary = {};
		for(let i=0; i<this.animations.length; i++)
		{
			this.actionDictionary[this.animations[i].name] = this.animationMixer.clipAction(this.animations[i]);//this.animations[i].optimize()
		}

		this.actionDictionary.clap.loop = THREE.LoopOnce;
		this.actionDictionary.clap.clampWhenFinished = true;

		this.activateAllActions("idle");
		this.currentAction = 'idle';

		this.animationMixer.addEventListener( "loop", (e)=>{this.onAniLoopFinished(e);} );
		this.animationMixer.addEventListener( "finished", (e)=>{this.onAniFinished(e);} );

		// Bounding box
		this.bbox = new THREE.Box3().setFromObject(this.model);
		this.bboxHelper = new THREE.Box3Helper( this.bbox, 0xffff00 );
		this.add(this.bboxHelper);

		this.modelLoader.load("./assets/models/cha_frontShield.glb", (gltf)=>{
			this.invisibleEditDome = gltf.scene.children[0].children[0];
			this.invisibleEditDome.scale.multiplyScalar(1000);
			//this.invisibleEditDome.material.visible = false;
			this.invisibleEditDome.visible = false;
			this.model.add(this.invisibleEditDome);
			this.finishedLoading = true;
		});
	}

	onAniLoopFinished(e)
	{
		let aniName = e.action._clip.name;
		switch(aniName)
		{
			// case "walk":
			// if(e.action.weight==1)
			// 	this.model.children[0].children[0].position.z += 0.01;
			// break;

			case "clap":
			if (this.actionDictionary[aniName].weight==1)
			{
				console.log("pause clap");
				// this.pauseAllActions();
				// this.actionDictionary[aniName].time = 1;
			}
			break;

			case "throw":
			if (this.actionDictionary[aniName].weight==1)
			{
				console.log("throw end");

				this.actionDictionary[aniName].weight = 0;
				//this.actionDictionary.idle.weight = 1;
				// console.log("unpause all");
				// this.unPauseAllActions();
				//eventBus.emit("throwFinish");
				this.prepareCrossFade(this.actionDictionary.throw, this.actionDictionary.idle, 0.5);
			}
			break;

			case "pickUp":
			if (this.actionDictionary[aniName].weight==1)
			{
				console.log("pickUp end");

				this.actionDictionary[aniName].weight = 0;
				// this.actionDictionary.idle.weight = 1;
				//eventBus.emit("throwFinish");
				this.fsm.pickUp();
				this.prepareCrossFade(this.actionDictionary.squad, this.actionDictionary.idle, 0.5);
			}
			break;
		}
	}

	onAniFinished(e)
	{
		let aniName = e.action._clip.name;
		switch(aniName)
		{
			// case "walk":
			// if(e.action.weight==1)
			// 	this.model.children[0].children[0].position.z += 0.01;
			// break;

			case "clap":
			if (this.actionDictionary[aniName].weight==1){
				console.log("clap finished");
				eventBus.emit("clapFinish");
			}
			break;
		}
	}

	pauseAllActions()
	{
		for (let key in this.actionDictionary)
		{
			this.actionDictionary[key].paused = true;
		}
	}

	unPauseAllActions()
	{
		for (let key in this.actionDictionary)
		{
			this.actionDictionary[key].paused = false;
		}
	}

	activateAllActions(initialAction)
	{
		for (let key in this.actionDictionary)
		{
			if(key==initialAction)
				this.setActionWeight(this.actionDictionary[key], 1);
			else
				this.setActionWeight(this.actionDictionary[key], 0);
			this.actionDictionary[key].play();
		}
	}

	setupPanel(panel)
	{
		this.panel = panel;
		let folder = this.panel.addFolder("Crossfading");
		this.panelSettings = {
			"Idle -> Walk": ()=>{
				this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.walk, 0.5);
			},
			"Walk -> Idle": ()=>{
				this.prepareCrossFade(this.actionDictionary.walk, this.actionDictionary.idle, 0.5);
			}
		};
		folder.add(this.panelSettings, "Idle -> Walk");
		folder.add(this.panelSettings, "Walk -> Idle");
	}

	// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
	// the start action's timeScale to ((start animation's duration) / (end animation's duration))
	setActionWeight(action, weight)
	{
		action.enabled = true;
		action.setEffectiveTimeScale( 1 );
		action.setEffectiveWeight( weight );
	}

	prepareCrossFade(startAction, endAction, duration)
	{
		this.setActionWeight(endAction, 1);
		endAction.time = 0;
		startAction.crossFadeTo(endAction, duration, true);//.setEffectiveWeight(0);
		this.currentAction = userUtil.getKeyByValue(this.actionDictionary, endAction);
	}

	getRootWorldPosition(vector3)
	{
		if (this.model)
		{
			this.model.children[0].children[0].getWorldPosition(vector3)
			this.rootWorldPosition.copy(vector3);
			return vector3;
		}
		else
		{
			return null;
		}
	}

	update(delta)
	{
		if (!this.finishedLoading) return;

		// --------ANIMATIONS--------
		if(this.animationMixer) this.animationMixer.update(delta);
		// if(this.actionDictionary.walk.getEffectiveWeight() == 1)
		// {
		// 	this.model.children[0].position.z += (delta * 0.01);			
		// }

		// look at mouse


		// --------TRANSFORMATION--------
		switch(this.fsm.state)
		{
			case 'follow':
			this.headJoint.quaternion.slerp( this.identityQuaternion, 0.1 );
			this.model.quaternion.slerp(this.rotateTarget, delta*5);

			//this.model.position.lerp(this.moveTarget, delta * 1);
			userUtil.vector3MoveTowards(this.model.position, this.moveTarget, delta*10);
			//console.log(this.model.children[0].position.distanceTo(this.moveTarget));
			if (this.model.position.distanceToSquared(this.moveTarget) < 1.5 * 1.5)
			{
				if(this.fsm.can('stopWalking'))
					this.fsm.stopWalking();
			}
			break;

			// case 'clap':
			// console.log(this.actionDictionary.clap.time);
			// break;
		}

		// --------COLLISION DETECTION--------
		this.model.getWorldPosition(this.raycastOrigin);
		this.raycastOrigin.y += 1;
		this.model.getWorldDirection(this.raycastDirection);
		this.collisionRaycaster.set(this.raycastOrigin, this.raycastDirection);

		if (this.showRaycastHelper)
		{
			this.arrowHelper.position.copy(this.raycastOrigin);
			this.arrowHelper.setDirection(this.raycastDirection);
		}

		let intersect = this.collisionRaycaster.intersectObjects(this.scene.children);
		if (intersect.length>0)
		{
			//console.log("Cha hits " + intersect[0].object);
			let intersectObject = intersect[0].object;
			if (intersectObject.tag == "trigger")
			{
				if (intersectObject != this.previousCollider)
				{
					//console.log("Cha hits " + intersectObject.name);
					eventBus.emit("ChaCollideTrigger", intersectObject.name);
				}
				this.previousCollider = intersectObject;
			}
			else
			{
				this.previousCollider = null;
			}
		}
		else
		{
			this.previousCollider = null;
		}
	}

	updateMoveTarget(moveTarget)
	{
		//this.model.lookAt(moveTarget);
		this.rotateTarget = userUtil.quaternionLookAt(this.model, moveTarget);
		//this.moveTarget = this.model.worldToLocal(moveTarget);
		this.moveTarget = moveTarget;
		
		//console.log(this.model.position.distanceTo(this.moveTarget));
		if (this.model.position.distanceToSquared(this.moveTarget) > 1.5 * 1.5)
		{
			if(this.fsm.can('walk'))
			{
				console.log("transition from Idle to Follow");
				this.fsm.walk();
			}
		}
	}

	updateHeadLookAt(raycaster)
	{
		if (!this.finishedLoading) return null;

		let intersects = [];
		this.invisibleEditDome.raycast(raycaster, intersects);
		if (intersects.length>0)
		{	
			// ver. Instant
			// this.headLookTarget.copy(this.dummyHead.quaternion);
			// this.headJoint.quaternion.copy(this.headLookTarget);
			// this.headJoint.lookAt(intersects[0].point);
			// this.headJoint.quaternion.multiply(this.headLookTarget.inverse());

			// ver. Lerp
			let q1 = this.dummyHead.quaternion.clone();
			this.headLookTarget.copy(q1);
			this.headLookTarget = userUtil.quaternionLookAt(this.headJoint, intersects[0].point);
			this.headLookTarget.multiply(q1.inverse());

			this.headJoint.quaternion.slerp( this.headLookTarget, 0.05 );
			// this.spineJoint.quaternion.slerp( this.headLookTarget, 0.05 );
			// this.spineJoint.children[0].quaternion.slerp( this.headLookTarget, 0.05 );

			return intersects[0].point;
		}
		else
		{
			this.lookReset(0.05);
			return null;
		}
	}

	lookReset(speed = 0.1)
	{
		this.headJoint.quaternion.slerp( this.identityQuaternion, speed );
	}

	bePoked (location)
	{
		//this.typed.toggle();
		if(this.fsm.can('capture') && !this.justCaptured)
		{
			console.log("cha capture!");
			this.fsm.capture();
			this.justCaptured = true;
			setTimeout(()=>{
				this.justCaptured = false;
			}, 1000);

			// tween body to arrow
			// TweenMax.to( this.spineJoint.quaternion, 0.5, {x:this.headLookTarget.x, y:this.headLookTarget.y, z:this.headLookTarget.z, w:this.headLookTarget.w, delay: 0.5} );
			//TweenMax.to( this.spineJoint.children[0].quaternion, 0.5, {x:this.headLookTarget.x, y:this.headLookTarget.y, z:this.headLookTarget.z, w:this.headLookTarget.w, delay: 0.5} );
		}
		else if (this.fsm.can('drop'))
		{
			console.log("cha drop!");
			this.fsm.drop();
		}
	}

	pickUp(object)
	{
		switch (object.tag)
		{
			case "crumb":
			if(this.fsm.can('pickDown'))
			{
				this.fsm.pickDown();
			}
			break;
		}
	}

	onWindowResize()
	{
		this.dialogueContainer.style.top = window.innerHeight/4 + "px";
		this.dialogueContainer.style.left = window.innerWidth/3 + "px";
	}
}
