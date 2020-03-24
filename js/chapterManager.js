import SameChapter from "./chapters/same.js"
import LazyChapter from "./chapters/lazy.js"
// import LostChapter from "./chapters/lost.js"
// import LikeChapter from "./chapters/like.js"
import DoubtfulChapter from "./chapters/doubtful.js"
// import JealousChapter from "./chapters/jealous.js"

export default class ChapterManager
{
	constructor(scene, cameraController, ammo, modelLoader, creatureCreator, cha, renderer)
	{
		this.chapterNames = ["lazy", "lost", "same", "like", "doubtful", "jealous"];
		this.scene = scene;
		this.cameraController = cameraController;
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.creatureCreator = creatureCreator;
		this.cha = cha;
		this.renderer = renderer;

		this.currentChapter;
		this.controlsCamera = false;
		this.triggers = {};

		this.setup();
	}

	setup()
	{
		let geo = new THREE.ConeBufferGeometry(3,5,4);
		let mat = new THREE.MeshBasicMaterial({color: 0x123456, wireframe: true});
		// create triggers
		for (let i=0; i<this.chapterNames.length; i++)
		{
			let triggerMesh = new THREE.Mesh(geo, mat);
			triggerMesh.tag = "trigger";
			triggerMesh.name = this.chapterNames[i];
			this.triggers[this.chapterNames[i]] = triggerMesh;
			triggerMesh.position.set(Math.sin(360/this.chapterNames.length*i*Math.PI/180)*25, 2.5, Math.cos(360/this.chapterNames.length*i*Math.PI/180)*25);
			this.scene.add(triggerMesh);
		}
		this.triggersArray = Object.values(this.triggers);

		eventBus.on("ChaCollideTrigger", (trigger)=>{
			console.log("Cha hits " + trigger);
			if (trigger=="lazy" || trigger=="same" || trigger=="doubtful")
				this.start(trigger);
			else
				return;

			// hide all triggers
			for(let i=0; i<this.triggersArray.length; i++)
			{
				this.triggersArray[i].visible = false;
			}
		});
	}

	start(chapter)
	{

		switch(chapter)
		{
			case "lazy":
			this.currentChapter = new LazyChapter(this.ammo, this.modelLoader, this.creatureCreator, this.cha, this);
			break;

			case "lost":
			this.currentChapter = new LostChapter(this.ammo, this.modelLoader);
			break;

			case "same":
			this.currentChapter = new SameChapter(this.ammo, this.modelLoader, this.creatureCreator);
			break;

			case "like":
			this.currentChapter = new LikeChapter(this.ammo, this.modelLoader);
			break;

			case "doubtful":
			this.currentChapter = new DoubtfulChapter(this.ammo, this.modelLoader, this);
			break;

			case "jealous":
			this.currentChapter = new JealousChapter(this.ammo, this.modelLoader);
			break;
		}
		this.scene.add(this.currentChapter);

		eventBus.emit("ChapterStarts");
	}

	update(delta)
	{
		if (this.currentChapter)
		{
			this.currentChapter.update(delta);
		}
	}

	end()
	{
		eventBus.emit("ChapterEnds");
	}

	cleanup()
	{
		this.currentChapter.cleanup();
		this.scene.remove(this.currentChapter);
		this.currentChapter = null;

		// show all triggers
		for(let i=0; i<this.triggersArray.length; i++)
		{
			this.triggersArray[i].visible = true;
		}
	}

	throw()
	{
		if(this.currentChapter.chapterName == "lazy")
		{
			this.currentChapter.throwCrumb();
			this.currentChapter.dropCandy();
		}
	}

	volleyball()
	{
		if(this.currentChapter.chapterName == "lazy")
		{
			this.currentChapter.convertAllCrumbsToBalls();
		}
	}
}