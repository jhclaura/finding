export default class LazyChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, creatureCreator)
	{
		super();
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;

		this.tmpVector3 = new THREE.Vector3();

		this.colors = [0xffad5a, 0x6173f4, 0xf469a9, 0xFF5722];
		//this.colors = [0x65ead1, 0xf469a9, 0xff917b, 0xfcffc1];
		// this.colors = [0xf57665, 0xff5da2, 0x1abb9c, 0xf7aa00];
		this.materials = [];
		this.crumbs = [];

		// Events
		eventBus.on("ChapterEnds", ()=>{		
			this.end();
		});

		this.setup();
	}

	setup()
	{		
		for(let i=0; i<this.colors.length; i++)
		{
			this.materials.push( new THREE.MeshLambertMaterial({color: this.colors[i]}) );
		}

		// Create crumbs
		let geometry = new THREE.TorusBufferGeometry(0.8, 0.4, 8, 10);
		for(let i=0; i<20; i++)
		{
			for(let j=0; j<3; j++)
			{
				let _c = new THREE.Mesh(geometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
				_c.position.set(-i*15 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				_c.rotation.x = 90/180*Math.PI;
				_c.tag = "crumb";
				this.crumbs.push(_c);
				this.add(_c);
			}
		}		
	}

	update(delta)
	{
		//
	}

	end()
	{
		// prepareToEnd
	}

	cleanup()
	{
		// dispose stuff
	}
}