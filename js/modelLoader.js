export default class ModelLoader
{
	constructor()
	{
		this.GLTFloader = new THREE.GLTFLoader();
	}

	load(file, callback)
	{
		this.GLTFloader.load(
			file,
			(gltf)=>{
				callback(gltf);
			},
			(xhr)=>{
				console.log((xhr.loaded/xhr.total*100)+'% loaded');
			},
			(error)=>{
				console.log(error);
			});
	}
}