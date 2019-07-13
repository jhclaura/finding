export default class Prop extends THREE.Object3D
{
	constructor(file, scene, modelLoader, material, loadedCallback)
	{
		super();
		this.scene = scene;
		this.modelLoader = modelLoader;
		this.finishedLoading = false;
		this.material = material;
		this.file = file;
		this.loadedCallback = loadedCallback;
		this.beGrabbed = false;

		this.init();
	}

	init()
	{
		this.modelLoader.load(this.file, (gltf)=>{this.onLoadModel(gltf);});
	}

	onLoadModel(gltf)
	{
		this.gltf = gltf;
		this.model = this.gltf.scene.children[0].children[0];
		if (this.material)
		{
			this.material.map = this.model.material.map;
			this.model.material = this.material;
		}
		this.add(this.model);
		//console.log(this.model);
		this.loadedCallback();
	}

	updateScale(scalar)
	{
		this.model.scale.multiplyScalar(scalar);
	}

	mesh()
	{
		return this.model;
	}
}