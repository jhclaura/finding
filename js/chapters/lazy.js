export default class LazyChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, creatureCreator, cha)
	{
		super();
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;
		this.cha = cha;

		this.tmpVector3 = new THREE.Vector3();
		this.tmpQuaternion = new THREE.Quaternion();

		this.colors = [0xffad5a, 0x6173f4, 0xf469a9, 0xFF5722];
		//this.colors = [0x65ead1, 0xf469a9, 0xff917b, 0xfcffc1];
		// this.colors = [0xf57665, 0xff5da2, 0x1abb9c, 0xf7aa00];
		this.materials = [];
		this.crumbs = [];

		this.time=0;
		this.crumbHeightFactor=0;
		this.crumbOriginalQuaternion = new THREE.Quaternion();
		this.hasCrumbBeGrabbed = false;
		this.currentGrabbedCrumb;

		// Events
		eventBus.on("ChapterEnds", ()=>{		
			this.end();
		});
		eventBus.on("ChaStartWalking", ()=>{
			TweenMax.killTweensOf(this, {crumbHeightFactor: true,});	//The values assigned to each property don’t matter
			TweenMax.to(this, 1.5, {crumbHeightFactor: 1});
		});
		eventBus.on("ChaStopWalking", ()=>{
			TweenMax.killTweensOf(this, {finalCrumbHeight: true});	//The values assigned to each property don’t matter
			TweenMax.to(this, 0.5, {crumbHeightFactor: 0});
		});

		this.setup();
	}

	setup()
	{		
		this.crumbOriginalQuaternion.setFromAxisAngle(new THREE.Vector3(0,1,0).normalize(), -90/180*Math.PI);

		for(let i=0; i<this.colors.length; i++)
		{
			this.materials.push( new THREE.MeshLambertMaterial({color: this.colors[i]}) );
		}

		// Create crumbs
		this.crumbGeometry = new THREE.TorusBufferGeometry(0.8, 0.4, 8, 10);
		// this.crumbShape = this.ammo.createShapeFromBuffergeometry(this.crumbGeometry);

		for(let i=0; i<20; i++)
		{
			for(let j=0; j<3; j++)
			{
				let _c = new THREE.Mesh(this.crumbGeometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
				_c.position.set(-i*15 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				_c.rotation.x = 90/180*Math.PI;
				_c.tag = "crumb";
				// this.crumbs.push(_c);
				this.add(_c);

				// this.tmpVector3.set(-i*15 + userUtil.getRandomFloat(-5,5), 0.5, 20+userUtil.getRandomFloat(-10,10));
				// let _c = new Crumb(this.ammo, this.tmpVector3, this.tmpQuaternion, this);
				// this.crumbs.push(_c);
				// this.add(_c);
			}
		}

		let target = new THREE.Vector3();
		target = this.cha.headJoint.getWorldPosition(target);
		target.y += 2;

		// TEST
		// for (let i=0; i<15; i++)
		// {			
		// 	// let _c = new Crumb(this.ammo, this.tmpVector3, this.tmpQuaternion, this, i);
		// 	let _c = new THREE.Mesh(this.crumbGeometry, this.materials[userUtil.getRandomInt(0,this.materials.length)]);
			
		// 	if(i==0)
		// 	{
		// 		this.tmpVector3.copy(target);
		// 		_c.position.copy(this.tmpVector3);
		// 		_c.rotation.x = 90/180*Math.PI;
		// 		this.add(_c);
		// 	}
		// 	else
		// 	{
		// 		this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), userUtil.getRandomFloat(-0.15,0.15), -0.8);
		// 		_c.position.copy(this.tmpVector3);
		// 		this.crumbs[i-1].add(_c);
		// 	}			
		// 	_c.tag = "crumb";
		// 	this.crumbs.push(_c);
		// 	console.log(this.crumbs[i]);
		// }
	}

	update(delta)
	{
		this.time += delta;

		if(this.crumbs.length>0)
		{
			this.cha.headJoint.getWorldPosition(this.tmpVector3);
			this.tmpVector3.y+=2;
			this.cha.headJoint.getWorldQuaternion(this.tmpQuaternion);
			this.crumbs[0].position.copy(this.tmpVector3);
			// this.tmpQuaternion.multiply(this.crumbOriginalQuaternion);
			// this.crumbs[0].quaternion.copy(this.tmpQuaternion.normalize());

			let baseHeightVal = 1.3/(this.crumbs.length-1);
			for(let i=1; i<this.crumbs.length; i++)
			{
				// let timeVariable = (this.time-i);
				let timeVariable = this.time;
				this.crumbs[i].position.z = -0.8 - ( Math.sin((this.time-i)*4) + 1 ) / 2 * (baseHeightVal * i * this.crumbHeightFactor);
			}
		}

		if (this.hasCrumbBeGrabbed)
		{
			let target = new THREE.Vector3();
			target = this.cha.rHandJoint.getWorldPosition(target);
			target.add(this.currentGrabbedCrumb.grabOffset);
			this.currentGrabbedCrumb.position.copy(target);
		}
	}

	end()
	{
		// prepareToEnd
	}

	cleanup()
	{
		// dispose stuff
	}

	bePicked(pickedCrumb)
	{
		let target = new THREE.Vector3();
		target = this.cha.rHandJoint.getWorldPosition(target);
		pickedCrumb.grabOffset = new THREE.Vector3();
		pickedCrumb.grabOffset.addVectors(pickedCrumb.position, target.multiplyScalar(-1));
		this.currentGrabbedCrumb = pickedCrumb;
		this.hasCrumbBeGrabbed = true;		
	}

	bePickedFinal(pickedCrumb)
	{
		this.hasCrumbBeGrabbed = false;
		this.currentGrabbedCrumb = null;

		pickedCrumb.tag = "pickedCrumb";
		this.crumbs.push(pickedCrumb);

		if(this.crumbs.length==1)
		{
			return;
		}
		else
		{
			this.crumbs[this.crumbs.length-2].attach(pickedCrumb);
			this.tmpVector3.set(userUtil.getRandomFloat(-0.15,0.15), userUtil.getRandomFloat(-0.15,0.15), -0.8);
			pickedCrumb.position.copy(this.tmpVector3);
		}
	}

	getRandomMaterial()
	{
		return this.materials[userUtil.getRandomInt(0,this.materials.length)];
	}
}