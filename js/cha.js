// Animation reference: https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_skinning_blending.html
import Util from "./util.js"

export default class Cha extends THREE.Object3D {
	constructor(scene, modelLoader) {
		super();
		this.scene = scene;
		this.modelLoader = modelLoader;
		this.finishedLoading = false;
		this.init();
	}

	init()
	{
		this.fsm = new StateMachine({
			init: 'idle',
			transitions: [
				{name: 'walk', from: 'idle', to: 'follow'},
				{name: 'stopWalking', from: 'follow', to: 'idle'}
			],
			methods: {
				onWalk: ()=>{
					this.prepareCrossFade(this.actionDictionary.idle, this.actionDictionary.walk, 0.5);
				},
				onStopWalking: ()=>{
					this.prepareCrossFade(this.actionDictionary.walk, this.actionDictionary.idle, 0.5);
				}
			}
		});

		this.modelLoader.load("./assets/models/cha_gameExport.glb", (gltf)=>{this.onLoadModel(gltf);});

		this.moveTarget = new THREE.Vector3();
		this.rotateTarget = new THREE.Quaternion();
		this.headLookTarget = new THREE.Quaternion();

		this.util = new Util();

		// let geo = new THREE.SphereGeometry(15);
		// let mat = new THREE.MeshBasicMaterial({visible: false, color: 0x00ffff});
		// this.invisibleDome = new THREE.Mesh(geo, mat);
		// this.invisibleDome.position.y = 3;

		let geo = new THREE.CylinderGeometry( 0, 2, 4, 5 );
		let mat = new THREE.MeshLambertMaterial({ color: 0x777777 });
		this.dummyHead = new THREE.Mesh(geo, mat);
		this.dummyHead.visible = false;
		this.dummyHead.scale.multiplyScalar(2);
		this.dummyHead.position.y = 15;

		this.identityQuaternion = new THREE.Quaternion();
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

		//this.model.add(this.invisibleDome);
		// ===== Debug look =====
		this.headJoint = this.model.children[0].children[0].children[0].children[2].children[0].children[0].children[2];
		this.model.children[0].children[0].children[0].children[2].children[0].children[0].attach(this.dummyHead);
		this.lookQuaternionBase = this.dummyHead.quaternion;

		// Bounding box
		this.model.traverse (function (mesh)
	    {
	        if (mesh instanceof THREE.Mesh)
	        {
	            //mesh.geometry.computeBoundingBox ();
	            // mesh.frustumCulled = false;
	        }
	    });

		this.animationMixer = new THREE.AnimationMixer(this.model);
		this.actionDictionary = {};
		for(let i=0; i<this.animations.length; i++)
		{
			this.actionDictionary[this.animations[i].name] = this.animationMixer.clipAction(this.animations[i].optimize());
		}
		this.activateAllActions("idle");

		//this.animationMixer.addEventListener( "loop", (e)=>{this.onAniLoopFinished(e);} );

		// Bounding box
		this.bbox = new THREE.Box3().setFromObject(this.model);
		this.bboxHelper = new THREE.Box3Helper( this.bbox, 0xffff00 );
		this.add(this.bboxHelper);

		this.modelLoader.load("./assets/models/cha_frontShield.glb", (gltf)=>{
			this.invisibleEditDome = gltf.scene.children[0].children[0];
			this.invisibleEditDome.scale.multiplyScalar(1000);
			this.invisibleEditDome.material.visible = false;
			this.model.add(this.invisibleEditDome);
			this.finishedLoading = true;
		});
	}

	onAniLoopFinished(e)
	{
		switch(e.action._clip.name)
		{
			// case "walk":
			// if(e.action.weight==1)
			// 	this.model.children[0].children[0].position.z += 0.01;
			// break;
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
	}

	getRootWorldPosition(vector3)
	{
		if (this.model)
			return this.model.children[0].children[0].getWorldPosition(vector3);
		else
			return null;
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
			this.util.vector3MoveTowards(this.model.position, this.moveTarget, delta*10);
			//console.log(this.model.children[0].position.distanceTo(this.moveTarget));
			if (this.model.position.distanceToSquared(this.moveTarget) < 1.5 * 1.5)
			{
				if(this.fsm.can('stopWalking'))
					this.fsm.stopWalking();
			}
			break;
		}
	}

	updateMoveTarget(moveTarget)
	{
		//this.model.lookAt(moveTarget);
		this.rotateTarget = this.util.quaternionLookAt(this.model, moveTarget);
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
			this.headLookTarget = this.util.quaternionLookAt(this.headJoint, intersects[0].point);
			this.headLookTarget.multiply(q1.inverse());

			this.headJoint.quaternion.slerp( this.headLookTarget, 0.05 );

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
}
