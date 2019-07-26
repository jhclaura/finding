export default class SameChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, creatureCreator)
	{
		super();
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;
		this.dancerAmount = 25;
		this.dancers = [];
		this.time=0;

		this.tmpVector3 = new THREE.Vector3();

		// https://threejs.org/examples/?q=spli#webgl_geometry_spline_editor
		this.curvePoints = [new THREE.Vector3(138.6743615096371, 40.14280497951931, 179.0837141800447),
							new THREE.Vector3(24.70087459121035, 77.81097874854169, 169.64984445264216),
							new THREE.Vector3(-120.92311591913383, 27.62837263852866, 219.46216302022344),
							new THREE.Vector3(-258.30675625215633, 25.322353607516831, 98.35195896075594),
							new THREE.Vector3(-129.44002841125004, 32.31442560053624, 26.553857133551432),
							new THREE.Vector3(-181.92441180482706, 60.5694637878305, -124.74023933404436),
							new THREE.Vector3(35.06286395807413, 43.856550620854875, 28.177723518170406),
							new THREE.Vector3(156.35138784790962, 42.01483515009217, -156.46552959410576)];
		
		// this.curvePoints = [new THREE.Vector3(8,10,14),	//8,10,12
		// 					new THREE.Vector3(0,10,12),
		// 					new THREE.Vector3(-8,10,14),	//-8,10,12
		// 					new THREE.Vector3(-6,10,0),
		// 					new THREE.Vector3(-8,10,-14),	//-8,10,-12
		// 					new THREE.Vector3(0,10,-12),
		// 					new THREE.Vector3(8,10,-14),	//8,10,-12
		// 					new THREE.Vector3(6,10,0)];

		this.dancerPositions = [];
		this.dancerOnPositionCount = 0;

		this.params = {
				extrusionSegments: 50,
				radius: 2,
				radiusSegments: 5,
				closed: true
			};

		//create a synth and connect it to the master output (your speakers)
		// this.synth = new Tone.Synth().toMaster();

		// Events
		eventBus.on("ChapterEnds", ()=>{		
			this.end();
		});

		this.setup();
	}

	setup()
	{
		for(let i=0; i<this.curvePoints.length; i++)
		{
			this.curvePoints[i].multiplyScalar(0.2);	//0.2
			this.curvePoints[i].y = 25;
		}

		this.curve = new THREE.CatmullRomCurve3(this.curvePoints);
		this.curve.curveType = 'catmullrom';
		this.curve.closed = true;
		// this.curve.tension = 0;

		// let points = this.curve.getPoints( 50 );
		// let geometry = new THREE.BufferGeometry().setFromPoints( points );
		// let material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
		// this.curveObject = new THREE.Line( geometry, material );

		this.curveObject = new THREE.Object3D();
		let geometry = new THREE.TubeBufferGeometry( this.curve, this.params.extrusionSegments, this.params.radius, this.params.radiusSegments, this.params.closed );
		let mesh = new THREE.Mesh(geometry ,this.creatureCreator.materials[this.creatureCreator.materials.length-1]);
		mesh.scale.y *= 0.5;
		mesh.position.y += 5;
		this.curveObject.add(mesh);
		geometry = new THREE.BoxBufferGeometry(1,20,1);
		let columePoints = [this.curvePoints[1], this.curvePoints[3], this.curvePoints[5], this.curvePoints[7]];
		for(let i=0; i<columePoints.length; i++)
		{
			mesh = new THREE.Mesh(geometry ,this.creatureCreator.materials[this.creatureCreator.materials.length-1]);
			mesh.position.copy(columePoints[i]);
			mesh.position.y -= 17;
			this.curveObject.add(mesh);
		}
		this.add(this.curveObject);
		
		// Create dance position
		for(let i=0; i<5; i++)
		{
			for(let j=0; j<5; j++)
			{
				let pos = new THREE.Vector3(i*20+(j%2)*5, 10, j*30);
				this.dancerPositions.push(pos);
			}
		}

		//v.1
		/*
		for(let i=0; i<5; i++)
		{
			for(let j=0; j<5; j++)
			{
				let pos = new THREE.Vector3(i*15, 10, j*15);
				let newDancer = this.creatureCreator.create(pos);
				this.add(newDancer);
				this.dancers.push(newDancer);

				// make head kinematic
				newDancer.changeHeadFromDynamicToKinematic();
			}
		}
		*/

		for(let i=0; i<this.dancerAmount; i++)
		{
			let pos = this.curve.getPointAt(1/this.dancerAmount * i);
			let newDancer = this.creatureCreator.createInSame(pos);
			newDancer.chapter = this;
			newDancer.curvePoint = 1/this.dancerAmount*i;
			// newDancer.synth = this.synth;

			this.add(newDancer);
			this.dancers.push(newDancer);

			// make head kinematic
			newDancer.changeHeadFromDynamicToKinematic();
		}

		// this.danceArea = [];
		// for(let i=0; i<this.creatureCreator.types.length; i++)
		// {
		// 	let d_area = new THREE.Mesh(this.creatureCreator.getGeometryByType(this.creatureCreator.types[i]), this.creatureCreator.materials[0]);
		// 	d_area.scale.multiplyScalar(10);
		// 	d_area.position.x = 30*i;
		// 	this.add(d_area);
		// 	this.danceArea.push(d_area);
		// }
	}

	update(delta)
	{
		this.time += delta;

		//this.curve.points[3].y = 5 + Math.sin(this.time) * 5;

		// animate head movement
		for(let i=0; i<this.dancers.length; i++)
		{
			if(!this.dancers[i].followCurve) continue;

			this.dancers[i].curvePoint += (delta/100);
			this.dancers[i].curvePoint -= Math.floor(this.dancers[i].curvePoint);
			this.curve.getPointAt(this.dancers[i].curvePoint, this.tmpVector3);

			this.dancers[i].updateKinematicHeadTransform(this.tmpVector3);
		}
	}

	end()
	{
		for(let i=0; i<this.dancers.length; i++)
		{
			this.dancers[i].prepareToEnd();
		}
	}

	cleanup()
	{
		// dispose stuff
		for(let i=0; i<this.dancers.length; i++)
		{
			this.dancers[i].dispose();
			this.remove(this.dancers[i]);
		}
		this.dancers = [];
		this.dancerPositions = [];
	}

	getDancerPosition()
	{
		this.dancerOnPositionCount++;
		if (this.dancerOnPositionCount == this.dancerAmount)
		{
			// all clicked!
			this.curveObject.visible = false;
		}
		return this.dancerPositions[this.dancerOnPositionCount-1];
	}
}