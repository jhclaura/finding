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
				{name: 'eat', from: 'idle', to: 'consume'}
			]
		});
	}

	afterModelLoaded()
	{
		// this.model.rotation.x = -90 * Math.PI/180;
		this.model.rotation.y = 45 * Math.PI/180;
		this.model.position.set(-160, 10, 0);

		this.lazyFace = this.model.getObjectByName( 'Head' );
		let expressions = Object.keys( this.lazyFace.morphTargetDictionary );
		// console.log(this.lazyFace);
		// for (let i=0; i<expressions.length; i++)
		// {
		// 	console.log(expressions[i]);
		// }
		this.model.updateMatrixWorld();

		this.belly = this.model.getObjectByName( 'dummyBody' );
		// dummyBody.visible = false;
		// console.log(dummyBody);

		this.bodyJoint = this.model.getObjectByName( 'BodyJoint' );
		let bodyPosition = new THREE.Vector3();
		this.bodyJoint.getWorldPosition(bodyPosition);
		// console.log(bodyPosition);

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

		this.callback();
	}

	customUpdate(delta)
	{
		this.time += delta;

		this.lazyFace.morphTargetInfluences[0] = (Math.sin(this.time*2)+1)/2;
	}
}