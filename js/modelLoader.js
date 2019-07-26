export default class ModelLoader
{
	constructor()
	{
		this.GLTFloader = new THREE.GLTFLoader();

		// THREE.DRACOLoader.setDecoderPath( 'lib/draco/' );
		// this.GLTFloader.setDRACOLoader( new THREE.DRACOLoader() );
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