import Creature from "./creature.js"
import SameCreature from "./sameCreature.js"

export default class CreatureCreator
{
	constructor(ammo)
	{
		this.ammo = ammo;

		//this.creatures = [];
		this.types = ["box", "sphere", "cylinder", "cone", "tetrahedron"];
		this.colors = [0xf7DEAD, 0xCD4439, 0x72B896, 0x6F7777];

		this.geos = {};
		this.shapes = {};
		this.materials = [];

		this.sizeScalar = 2;

		this.basePosition = new THREE.Vector3(10,10,10);
		this.baseScale = new THREE.Vector3(1,1,1);
		this.baseRadius = 0.5;
		this.baseHeight = 1;
		this.baseMass = 2;

		// re-use variables
		this.vec3_1 = new THREE.Vector3();

		this.init();
	}

	init()
	{
		this.baseScale.multiplyScalar(this.sizeScalar);
		this.baseRadius *= this.sizeScalar;
		this.baseHeight *= this.sizeScalar;

		for(let i=0; i<this.types.length; i++)
		{
			// pre-create some primitive graphics shapes
			this.geos[this.types[i]] = this.createGeometryByType(this.types[i]);
			// pre-create some primitive physical shapes
			this.shapes[this.types[i]] = this.createShapeByType(this.types[i]);
		}
		for(let i=0; i<this.colors.length; i++)
		{
			this.materials.push( new THREE.MeshLambertMaterial({color: this.colors[i]}) );
		}
	}

	update(delta)
	{

	}

	follow(targetPosition)
	{
		// for(let i=0; i<this.creatures.length; i++)
		// {
		// 	this.vec3_1.subVectors(targetPosition, this.creatures[i].head.position).multiplyScalar(50);
		// 	this.creatures[i].follow(this.vec3_1);
		// }
	}

	create(startPosition)
	{
		if (startPosition) this.basePosition = startPosition;
		let n_creature = new Creature(this, this.ammo, this.basePosition);
		//this.creatures.push(n_creature);
		return n_creature;
	}

	createInSame(startPosition)
	{
		if (startPosition) this.basePosition = startPosition;
		let n_creature = new SameCreature(this, this.ammo, this.basePosition);
		//this.creatures.push(n_creature);
		return n_creature;
	}

	delete()
	{

	}

	getRandomType()
	{
		return this.types[userUtil.getRandomInt(0, this.types.length)];
	}

	getRandomColor()
	{
		return this.colors[userUtil.getRandomInt(0, this.colors.length)];
	}

	getRandomMaterial()
	{
		return this.materials[userUtil.getRandomInt(0, this.materials.length)];		
	}

	getGeometryByType(type)
	{
		return this.geos[type];
	}

	getShapeByType(type)
	{
		return this.shapes[type];
	}

	getIndexByType(type)
	{
		return this.types.indexOf(type);
	}

	createGeometryByType(type)
	{
		let newGeo;
		switch(type)
		{
			case "box":
			return newGeo = new THREE.BoxBufferGeometry(this.baseScale.x,this.baseScale.y,this.baseScale.z);
			break;

			case "sphere":
			return newGeo = new THREE.SphereBufferGeometry(this.baseRadius,15,15);
			break;

			case "cylinder":
			return newGeo = new THREE.CylinderBufferGeometry(this.baseRadius,this.baseRadius,this.baseHeight,10);
			break;

			case "cone":
			return newGeo = new THREE.ConeBufferGeometry(this.baseRadius,this.baseHeight,10);
			break;

			case "tetrahedron":
			return newGeo = new THREE.TetrahedronBufferGeometry(this.baseRadius);
			break;
		}
	}

	createShapeByType(type)
	{
		let newShape;
		switch(type)
		{
			case "box":
			newShape = this.ammo.createBoxShape(this.baseScale);
			break;

			case "sphere":
			newShape = this.ammo.createSphereShape(this.baseRadius);
			break;

			case "cylinder":
			newShape = this.ammo.createCylinderShape(this.baseRadius, this.baseHeight);
			break;

			case "cone":
			newShape = this.ammo.createConeShape(this.baseRadius,this.baseHeight);
			break;

			case "tetrahedron":
			newShape = this.ammo.createShapeFromBuffergeometry(this.geos[type]);
			break;
		}
		return newShape;
	}
}