import Util from "./util.js"

export default class Creature extends THREE.Object3D
{
	constructor(creatureCreator, ammo, startPosition)
	{
		super();
		this.util = new Util();
		this.creator = creatureCreator;
		this.ammo = ammo;
		this.startPosition = startPosition;

		this.bodys = [];
		this.piviots = [];

		// re-use variables
		this.btVec3_1 = new Ammo.btVector3( 0, 0, 0 );

		this.createHead();
		this.createBodies();
		this.createJoints();
	}

	follow(force)
	{
		this.btVec3_1.setValue(force.x, force.y, force.z);
		this.bodys[0].applyCentralForce(this.btVec3_1);
	}

	createHead()
	{
		let hType = this.creator.getRandomType();
		this.head = new THREE.Mesh( this.creator.getGeometryByType(hType), this.creator.getRandomMaterial() );
		this.head.position.copy(this.startPosition);
		this.add(this.head);

		let headPivot = new THREE.Vector3();
		headPivot.z -= this.creator.baseRadius;
		this.piviots.push(headPivot);

		let headShape = this.creator.getShapeByType(hType);
		let headBody = this.ammo.createRigidBody(this.head, headShape, 20, this.head.position, this.head.quaternion);
		headBody.setFriction(5);
		this.bodys.push(headBody);
	}

	createBodies()
	{
		this.bodyCount = this.util.getRandomInt(1,3);
		for(let i=0; i<this.bodyCount; i++)
		{
			let hType = this.creator.getRandomType();
			let mesh = new THREE.Mesh(this.creator.getGeometryByType(hType), this.creator.getRandomMaterial());
			mesh.position.copy(this.startPosition);
			mesh.position.z = -this.creator.baseRadius*(i+1)*2;
			this.add(mesh);
			
			let pivot = new THREE.Vector3();
			pivot.z -= this.creator.baseRadius;
			this.piviots.push(pivot);

			if(this.bodyCount>i+1)
			{
				let tailPivot = new THREE.Vector3();
				tailPivot.z += this.creator.baseRadius;
				this.piviots.push(tailPivot);
			}

			let bodyShape = this.creator.getShapeByType(hType);
			let bodyBody = this.ammo.createRigidBody(mesh, bodyShape, 20, mesh.position, mesh.quaternion);	//type, mesh, mass
			bodyBody.setFriction(5);
			this.bodys.push(bodyBody);
		}
	}

	createJoints()
	{
		for(let i=0; i<this.piviots.length; i+=2)
		{
			console.log("create joint");
			this.ammo.createP2PConstraint( this.bodys[i/2], this.bodys[i/2+1], this.piviots[i], this.piviots[i+1]);
		}
	}

	delete()
	{

	}
}