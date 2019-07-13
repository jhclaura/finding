import Prop from "./prop.js"

export default class PhysicsProp extends Prop
{
	constructor(file, scene, modelLoader, material, ammo, loadedCallback)
	{
		super(file, scene, modelLoader, material, loadedCallback);
		this.ammo = ammo;
		this.grabOffset = new THREE.Vector3();
		
		// re-use variables
		this.btVec3_1 = new Ammo.btVector3( 0, 0, 0 );
		this.btVec3_2 = new Ammo.btVector3( 0, 0, 0 );
	}

	initPhysics(mass, friction, isKinematic)
	{
		this.shape = this.ammo.createShapeFromBuffergeometryMesh(this.model);
		this.body = this.ammo.createRigidBody(this, this.shape, mass, this.position, this.quaternion);
		this.body.setFriction(friction);
		if(isKinematic)
		{
			this.body.setCollisionFlags(2);
		}
	}

	updateKinematicBodyTransform(targetPos, targetRot)
	{
		this.ammo.updateKinematicBody(this.body, targetPos, targetRot);
	}

	isStaticOrKinematicObject(body)
    {
    	return this.body.isStaticOrKinematicObject();
    }

    changeFromKinematicToDynamic()
    {
    	if (this.body.isStaticOrKinematicObject())
    	{
    		this.body.setCollisionFlags(0);
    	}
    }

    changeFromDynamicToKinematic()
    {
    	if (!this.body.isStaticOrKinematicObject())
    	{
    		this.body.setCollisionFlags(2);
    	}
    }

    applyImpulse(impulse, relativePos)
    {
    	this.btVec3_1.setValue(impulse.x, impulse.y, impulse.z);
    	if (relativePos)
    	{
    		this.btVec3_2.setValue(relativePos.x, relativePos.y, relativePos.z);
    		this.body.applyImpulse(this.btVec3_1, this.btVec3_2);
    	}
    	else
    	{
    		this.body.applyCentralImpulse(this.btVec3_1);
    	}
    }    
}