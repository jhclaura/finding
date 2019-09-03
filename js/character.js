export default class Character extends THREE.Object3D {
	constructor(ammo, modelLoader, assetPath, tag) {
		super();
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.finishedLoading = false;
		this.tag = tag;

		this.modelLoader.load(assetPath, (gltf)=>{this.onLoadModel(gltf);});

		this.setupStateMachine();
	}

	setupStateMachine()
	{
		//
	}

	onLoadModel(gltf)
	{
		this.model = gltf.scene.children[0];
		this.animations = gltf.animations;
		console.log(this.model);
		console.log(this.animations);
		this.add(this.model);
		let tag = this.tag;
		this.model.traverse (function (mesh) {
	        if (mesh instanceof THREE.Mesh) {
	            mesh.tag = tag;
	        }
	    });

		this.animationMixer = new THREE.AnimationMixer(this.model);
		this.actionDictionary = {};
		for(let i=0; i<this.animations.length; i++)
		{
			this.actionDictionary[this.animations[i].name] = this.animationMixer.clipAction(this.animations[i]);
			// this.actionDictionary[this.animations[i].name] = this.animationMixer.clipAction(this.animations[i].optimize());
		}

		this.activateAllActions("idle");
		this.currentAction = 'idle';

		this.animationMixer.addEventListener( "loop", (e)=>{this.onAniLoopFinished(e);} );
		this.animationMixer.addEventListener( "finished", (e)=>{this.onAniFinished(e);} );

		this.finishedLoading = true;

		this.afterModelLoaded();
	}

	onAniLoopFinished(e)
	{
		//
	}

	onAniFinished(e)
	{
		//
	}

	afterModelLoaded()
	{
		//
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

	deactivateAllActions()
	{
		for (let key in this.actionDictionary)
		{
			this.setActionWeight(this.actionDictionary[key], 0);
		}
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
		startAction.crossFadeTo(endAction, duration, true);
		this.currentAction = userUtil.getKeyByValue(this.actionDictionary, endAction);
	}

	update(delta)
	{
		if (!this.finishedLoading) return;

		// --------ANIMATIONS--------
		if(this.animationMixer) this.animationMixer.update(delta);

		this.customUpdate(delta);
	}

	customUpdate()
	{
		//
	}
}