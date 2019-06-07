export default class Util {
	constructor() {
		//
	}

	vector3MoveTowards(current, target, maxDistanceDelta)
	{
		let toVector_x = target.x - current.x;
		let toVector_y = target.y - current.y;
		let toVector_z = target.z - current.z;

		let sqdist = toVector_x*toVector_x + toVector_y*toVector_y + toVector_z*toVector_z;

		if(sqdist==0 || sqdist<=maxDistanceDelta*maxDistanceDelta)
		{
			current = target;
			return;
		}

		let dist = Math.sqrt(sqdist);

		current.x += toVector_x / dist * maxDistanceDelta;
		current.y += toVector_y / dist * maxDistanceDelta;
		current.z += toVector_z / dist * maxDistanceDelta;
	}

	quaternionLookAt(object, target)
	{
		let q1 = new THREE.Quaternion();
		let m1 = new THREE.Matrix4();
		let position = new THREE.Vector3();

		object.updateWorldMatrix(true, false);
		position.setFromMatrixPosition(object.matrixWorld);
		m1.lookAt(target, position, object.up);

		q1.setFromRotationMatrix(m1);

		if(object.parent)
		{
			m1.extractRotation(object.parent.matrixWorld);
			let q2 = new THREE.Quaternion();
			q2.setFromRotationMatrix(m1);
			q1.premultiply(q2.inverse());
		}
		return q1;
	}
}