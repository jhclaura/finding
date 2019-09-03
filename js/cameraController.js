export default class CameraController {
	constructor(camera, frustumSize, targetHeight, targetDistance) {
		this.camera = camera;
		this.defaultFrustumSize = frustumSize;
		this.camToTargetHeight = targetHeight;
		this.camToTargetDistance = targetDistance;

		this.screenWidth = window.innerWidth;
		this.screenHeight = window.innerHeight;
		this.aspect = this.screenWidth/this.screenHeight;
		this.currentFrustumSize = frustumSize;
	}

	setPosition(x, y, z)
	{
		this.camera.position.set(x, y, z);
		this.camera.updateProjectionMatrix();
	}

	setAxisPosition(axis, position)
	{
		switch(axis)
		{
			case "x":
			this.camera.position.x = position;
			break;
			case "y":
			this.camera.position.y = position;
			break;
			case "z":
			this.camera.position.z = position;
			break;
		}
		this.camera.updateProjectionMatrix();
	}

	setX(position)
	{
		this.camera.position.x = position;
	}

	setY(position)
	{
		this.camera.position.y = position;
	}

	setZ(position)
	{
		this.camera.position.z = position;
	}

	getX(position)
	{
		return this.camera.position.x;
	}

	getY(position)
	{
		return this.camera.position.y;
	}

	getZ(position)
	{
		return this.camera.position.z;
	}

	lookAt(x,y,z)
	{
		this.camera.lookAt(x,y,z);
	}

	setFrustumSize(size)
	{
		this.currentFrustumSize = size;
		this.updateFrustum();
	}

	updateFrustum(ratio=1)
	{
		this.camera.left = - ratio * this.currentFrustumSize * this.aspect / 2;
		this.camera.right = ratio * this.currentFrustumSize * this.aspect / 2;
		this.camera.top = this.currentFrustumSize / 2;
		this.camera.bottom = - this.currentFrustumSize / 2;
		this.camera.updateProjectionMatrix();
	}

	onScreenUpdate(width, height, ratio = 1)
	{
		this.screenWidth = width;
		this.screenHeight = height;
		this.aspect = this.screenWidth/this.screenHeight;
		this.updateFrustum(ratio);
	}

	follow(delta)
	{
		let target = new THREE.Vector3();
		target = this.camera.target.getRootWorldPosition(target);
		if (target == null) return;
		target.y += this.camToTargetHeight;
		target.z += this.camToTargetDistance;
		this.camera.position.lerp(target, delta*1);
	}

	getFollowPosition()
	{
		let target = new THREE.Vector3();
		target = this.camera.target.getRootWorldPosition(target);
		if (target == null) return null;
		target.y += this.camToTargetHeight;
		target.z += this.camToTargetDistance;
		return target;
	}

	reset()
	{

	}

	shake(amount)
	{
		this.intensity = 1;
		this.preShakePosition = this.camera.position.clone();
		TweenMax.to(this, 2, {intensity: 0, onUpdate: ()=>{
			let val = userUtil.getRandomFloat(-1*amount, amount) * this.intensity;
			// this.camera.position.x += val;
			this.camera.position.y = this.preShakePosition.y + val;
			// this.camera.position.z += val;
		}, onComplete: ()=>{
			this.camera.position.copy(this.preShakePosition);
		}});
	}
}