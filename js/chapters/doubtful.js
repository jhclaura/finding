export default class DoubtfulChapter extends THREE.Object3D
{
	constructor(ammo, modelLoader, chapterManager)
	{
		super();
		this.chapterName = "doubtful";
		this.ammo = ammo;
		this.modelLoader = modelLoader;
		this.chapterManager = chapterManager;
		this.cameraController = chapterManager.cameraController;
		this.Cha = chapterManager.cha;

		this.holePosition = new THREE.Vector3(-50,0,-50);
		this.cameraHeightForHole = -30;

		this.setup();

		// Events
		eventBus.on("ChaStopWalking", ()=>{		
			// turn to hole
			let chaRotateTarget = userUtil.quaternionLookAt(this.Cha.model, this.holePosition);
			// this.Cha.model.quaternion.copy(chaRotateTarget);
			let t_time = {t:0};
			TweenMax.to(t_time, 0.5, {t: 1, onUpdate:()=>{
				this.Cha.model.quaternion.slerp(chaRotateTarget, t_time.t);
			}});
		});
	}

	setup()
	{
		// hole detector
		this.holeGeo = new THREE.CylinderBufferGeometry(10,10,2);
		this.holeMat = new THREE.MeshLambertMaterial();
		this.hole = new THREE.Mesh(this.holeGeo, this.holeMat);
		this.hole.tag = "hole";

		this.hole.position.copy(this.holePosition);
		this.add(this.hole);

		// load ground
		this.modelLoader.load("./assets/models/hole.glb", (gltf)=>{this.onLoadGround(gltf);});
	}

	onLoadGround(gltf)
	{
		this.holeGround = gltf.scene.children[0];
		this.holeGround.children[0].scale.multiplyScalar(1000);
		this.holeGround.position.copy(this.holePosition);
		this.add(this.holeGround);
		let _ground = this.chapterManager.scene.getObjectByName("ground");
		_ground.visible = false;

		return;

		// move camera to side view
		this.chapterManager.controlsCamera = true;

		// Move camera to fixed position
		let followPosition = this.cameraController.getFollowPosition();
		
		// setZ: 0, ,
		TweenMax.to(this.cameraController, 2, {
			setX: this.holePosition.x, setY: this.cameraHeightForHole, setZ: this.holePosition.z, currentFrustumSize: 100, onUpdate: ()=>{
				this.cameraController.setFrustumSize(this.cameraController.currentFrustumSize);
			}, onComplete:()=>{
				
				this.cameraLookQTarget = userUtil.quaternionReverseLookAt(this.cameraController.camera, this.holePosition);

				TweenMax.to(this.cameraController.camera.quaternion, 2, {
					x: this.cameraLookQTarget.x, y: this.cameraLookQTarget.y, z: this.cameraLookQTarget.z, w: this.cameraLookQTarget.w
				});
			}
		});
	}

	update(delta)
	{
		this.time += delta;
	}

	end()
	{

	}

	cleanup()
	{

	}
}