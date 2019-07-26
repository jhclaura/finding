import Creature from "./creature.js"

export default class SameCreature extends Creature
{
	constructor(creatureCreator, ammo, startPosition)
	{
		super(creatureCreator, ammo, startPosition);

		this.followCurve = true;
		this.vec3_1 = new THREE.Vector3();
		this.quat_1 = new THREE.Quaternion();

		// event
		// this.collision = {
		// 	hasEvent: (eventName)=>{
		// 		return this.collision.hasOwnProperty(eventName);
		// 	},
		// 	fire: (eventName)=>{
		// 		this.collision[eventName]();
		// 	}
		// };

		// this.collision = new FindingsEvent();

		this.collision.contact = ()=>{this.onContact();};
		this.collision.collisionstart = (e)=>{this.onCollisionstart(e);};
		this.collision.collisionend = (e)=>{this.onCollisionend(e);};
	}

	createBodies()
	{
		// this.head.collision = this.collision;

		this.bodyCount = userUtil.getRandomInt(1,3);
		this.bodyMesh = [];

		for(let i=0; i<this.bodyCount; i++)
		{
			let hType = this.creator.getRandomType();
			let mesh;
			if(this.startGrey)
			{
				mesh = new THREE.Mesh( this.creator.getGeometryByType(hType), this.creator.materials[this.creator.materials.length-1] );
				mesh.finalMaterial = this.creator.getRandomMaterial();
			}
			else
			{
				mesh = new THREE.Mesh(this.creator.getGeometryByType(hType), this.creator.getRandomMaterial());
			}
			//mesh.position.copy(this.startPosition);
			mesh.tag = "creatureBody";
			mesh.bodyType = hType;

			// if(i==1)
			// 	mesh.collision = this.collision;

			if(this.verticle)
				mesh.position.y -= this.creator.baseRadius*(i+1)*2;
			else
				mesh.position.z -= this.creator.baseRadius*(i+1)*2;
			this.head.add(mesh);
			this.bodyMesh.push(mesh);
		}
	}

	createBodyBodies()
	{
		for(let i=0; i<this.bodyMesh.length; i++)
		{
			this.attach(this.bodyMesh[i]);
			this.bodyMesh[i].tag = "creature";

			let pivot = new THREE.Vector3();
			if(this.verticle)
				pivot.y += (this.creator.baseRadius+this.jointDistance);
			else
				pivot.z -= (this.creator.baseRadius+this.jointDistance);
			this.piviots.push(pivot);

			if(this.bodyCount>i+1)
			{
				let tailPivot = new THREE.Vector3();
				if(this.verticle)
					tailPivot.y -= (this.creator.baseRadius+this.jointDistance);
				else
					tailPivot.z += (this.creator.baseRadius+this.jointDistance);
				this.piviots.push(tailPivot);
			}

			let bodyShape = this.creator.getShapeByType(this.bodyMesh[i].bodyType);
			let bodyBody = this.ammo.createRigidBody(this.bodyMesh[i], bodyShape, 20, this.bodyMesh[i].position, this.bodyMesh[i].quaternion);	//type, mesh, mass
			bodyBody.setFriction(5);
			this.bodys.push(bodyBody);
		}
	}

	onClick()
	{
		if(!this.followCurve) return;

		console.log("Creature be clicked!");

		this.createBodyBodies();
		this.createJoints();

		this.head.material = this.head.finalMaterial;
		for(let i=0; i<this.bodyCount; i++)
		{
			this.bodyMesh[i].material = this.bodyMesh[i].finalMaterial;
		}
		this.changeHeadFromKinematicToDynamic();

		this.followCurve = false;
		//this.deletePhysics();

		this.danceAreaTarget = this.chapter.getDancerPosition();

		setTimeout(()=>{
			this.prepareForDance();
		}, 4000);
	}

	prepareForDance()
	{
		this.changeHeadFromDynamicToKinematic();

		this.vec3_1.set(this.head.position.x, this.head.position.y, this.head.position.z);

		// this.danceAreaTarget.copy(this.vec3_1);
		// this.danceAreaTarget.multiplyScalar(2);
		// this.danceAreaTarget.y = this.vec3_1.y;

		this.tl = new TimelineLite({onUpdate: ()=>{
			this.onDanceUpdate();
		}});
		this.tl.to(this.vec3_1, 5, {ease: Elastic.easeOut.config(1,0.3), y: 10});
		this.tl.to(this.vec3_1, this.getDuration(), {x: this.danceAreaTarget.x, z: this.danceAreaTarget.z, onComplete:()=>{
			this.tl.pause();
			this.tl.clear();
			this.tl.eventCallback("onComplete", ()=>{this.tl.restart();});
			this.createDanceRoutine();
		}});
	}

	createDanceRoutine()
	{
		this.tl.to(this.vec3_1, 3, {y: "+=4"});
		this.tl.to(this.vec3_1, 3, {y: "-=4"}, "+=1");

		switch(this.hType)
		{
			case "box":
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {y: Math.PI/2});
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {y: 0});
			break;

			case "sphere":
			this.tl.to(this.vec3_1, userUtil.getRandomFloat(1,3), {x: "+=2", z:"-=3"});
			this.tl.to(this.vec3_1, userUtil.getRandomFloat(1,3), {x: "-=2", z:"+=3"});
			break;

			case "cylinder":
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {x: -Math.PI/2});
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {x: 0});
			break;

			case "cone":
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {z: Math.PI/2});
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {z: 0});
			break;

			case "tetrahedron":
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {y: -Math.PI/2});
			this.tl.to(this.quat_1, userUtil.getRandomFloat(1,3), {y: 0});
			break;
		}
	}

	onDanceUpdate()
	{
		this.updateKinematicHeadTransform(this.vec3_1, this.quat_1);
	}

	getDuration()
	{	
		let d = this.vec3_1.distanceTo(this.danceAreaTarget)/15;
		console.log(d);
		return d;
	}

	prepareToEnd()
	{
		this.tl.pause();
		this.tl.clear();
		this.tl.eventCallback("onComplete", ()=>{
			console.log("complete!");
			this.deletePhysics();

			for(let i=0; i<this.bodyMesh.length; i++)
			{
				this.head.attach(this.bodyMesh[i]);
			}
			TweenMax.to(this.head.scale, 3, {x:8, y:8, z:8, delay: userUtil.getRandomFloat(1,3)});
			TweenMax.to(this.head.position, 3, {y: userUtil.getRandomFloat(5,25), delay: userUtil.getRandomFloat(1,3)});
		});

		this.tl.to(this.vec3_1, 3, {y: "+=4"});
		this.tl.to(this.vec3_1, 5, {y: 5}, "+=3");
		this.tl.play(0);
	}

	onContact()
	{
		//
	}

	onCollisionstart(self)
	{
		/*
		switch(self.bodyType)
		{
			case "box":
			// this.synth.triggerAttackRelease('C4', '8n');
			break;

			case "sphere":
			// this.synth.triggerAttackRelease('E4', '8n');
			break;

			case "cylinder":
			// this.synth.triggerAttackRelease('G4', '8n');
			break;

			case "cone":
			// this.synth.triggerAttackRelease('B4', '8n');
			break;

			case "tetrahedron":
			// this.synth.triggerAttackRelease('C2', '8n');
			break;
		}
		*/
	}

	onCollisionend(other)
	{
		// console.log(this.uuid + ": onCollisionend");
	}
}