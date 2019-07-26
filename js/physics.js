// reference: https://github.com/mrdoob/three.js/blob/master/examples/webgl_physics_convex_break.html

export default class Physics
{
	constructor()
	{
		this.gravityConstant = 10;
		this.margin = 0.05;
		this.rigidBodies = [];
		this.inited = false;

		Ammo().then((AmmoLib)=>{
			Ammo = AmmoLib;
			this.init();
		});
	}

	init()
	{
		let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
		let dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
		let broadphase = new Ammo.btDbvtBroadphase();
		let solver = new Ammo.btSequentialImpulseConstraintSolver();

		this.physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration );
		this.physicsWorld.setGravity( new Ammo.btVector3( 0, - this.gravityConstant, 0 ) );

		this.transformAux1 = new Ammo.btTransform();
		this.tempBtVec3_1 = new Ammo.btVector3( 0, 0, 0 );

		this.pos = new THREE.Vector3();
		this.quat = new THREE.Quaternion();
		this.testMaterial = new THREE.MeshPhongMaterial( { color: 0x787878 } );

		this.collisions = {};
    	this.frameCollisions = {};

		this.inited = true;
	}

	processGeometry(bufGeometry)
	{
		// Obtain a Geometry
		let geo = new THREE.Geometry().fromBufferGeometry(bufGeometry);

		// Checks for duplicate vertices using hashmap.
		// Duplicated vertices are removed and faces' vertices are updated.
		let vertsDiff = geo.mergeVertices();

		// Convert back to BufferGeometry
		let indexedBufGeometry = this.createIndexedBufferGeometryFromGeometry(geo);

		// Create index arrays mapping the indexed vertices to bufGeometry vertices
        this.mapIndices( bufGeometry, indexedBufGeometry );
	}

	createShapeFromBuffergeometryMesh(mesh)
	{
		//console.log(mesh.geometry);
		let bufGeometry = mesh.geometry;
		let coords = bufGeometry.attributes.position.array;		
		let newShape = new Ammo.btConvexHullShape();
		for(let i=0, il=coords.length; i<il; i+=3)
		{
			this.tempBtVec3_1.setValue(coords[i]*mesh.scale.x, coords[i+1]*mesh.scale.y, coords[i+2]*mesh.scale.z);
			
			let lastOne = (i >= (il-3));	// bool to if recalculateLocalAabb(???) of ConvextHullShape
			newShape.addPoint(this.tempBtVec3_1, lastOne);
		}
		newShape.setMargin(this.margin);
		return newShape;
	}

	createShapeFromBuffergeometry(bufGeometry)
	{
		let coords = bufGeometry.attributes.position.array;		
		let newShape = new Ammo.btConvexHullShape();
		for(let i=0, il=coords.length; i<il; i+=3)
		{
			this.tempBtVec3_1.setValue(coords[i], coords[i+1], coords[i+2]);
			
			let lastOne = (i >= (il-3));	// bool to if recalculateLocalAabb(???) of ConvextHullShape
			newShape.addPoint(this.tempBtVec3_1, lastOne);
		}
		newShape.setMargin(this.margin);
		return newShape;
	}

	createBoxShape(scale)
	{
		let newShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x*0.5, scale.y*0.5, scale.z*0.5));
		newShape.setMargin(this.margin);
		return newShape;
	}

	createSphereShape(radius)
	{
		let newShape = new Ammo.btSphereShape(radius);
		newShape.setMargin(this.margin);
		return newShape;
	}

	createCylinderShape(radius, height)
	{
		let newShape = new Ammo.btCylinderShape(new Ammo.btVector3(radius, height*0.5, radius));
		newShape.setMargin(this.margin);
		return newShape;
	}

	createConeShape(radius, height)
	{
		let newShape = new Ammo.btConeShape(radius, height);
		newShape.setMargin(this.margin);
		return newShape;
	}

	throwBall(raycaster)
	{
		let ballMass = 20;
		let ballRadius = 0.4;
		let ball = new THREE.Mesh(new THREE.SphereBufferGeometry(ballRadius,14,10), this.testMaterial);
		ball.castShadow = true;
		ball.receiveShadow = true;

		let ballShape = new Ammo.btSphereShape(ballRadius);
		ballShape.setMargin(this.margin);
		// this.pos.copy(raycaster.ray.direction);
		// this.pos.add(raycaster.ray.origin);
		this.pos.set(2,10,0);
		this.quat.set(0,0,0,1);
		let ballBody = this.createRigidBody(ball, ballShape, ballMass, this.pos, this.quat);
		// this.pos.copy(raycaster.ray.direction);
		// this.pos.multiplyScalar(54);
		this.pos.set(0,-10,2);
		ballBody.setLinearVelocity(new Ammo.btVector3(this.pos.x, this.pos.y, this.pos.z));

		return ball;
	}

	throwBox(raycaster)
	{
		let ballMass = 30;
		let ballRadius = 1;
		let ball = new THREE.Mesh(new THREE.BoxBufferGeometry(ballRadius,ballRadius*2,ballRadius), this.testMaterial);
		ball.castShadow = true;
		ball.receiveShadow = true;

		let ballShape = new Ammo.btBoxShape(new Ammo.btVector3(ballRadius/2, ballRadius, ballRadius/2));
		ballShape.setMargin(this.margin);
		//this.pos.set(2,10,0);
		this.pos.copy( raycaster.ray.direction );
		this.pos.add( raycaster.ray.origin );
		this.quat.set(0,0,0,1);
		let ballBody = this.createRigidBody(ball, ballShape, ballMass, this.pos, this.quat);
		ballBody.setFriction(1);
		//this.pos.set(5,-10,5);
		this.pos.copy( raycaster.ray.direction );
		this.pos.multiplyScalar( 20 );
		ballBody.setLinearVelocity(new Ammo.btVector3(this.pos.x, this.pos.y, this.pos.z));

		return ball;
	}

	throw(referenceMesh, referenceMaterial, referenceShape)
	{
		let stuff = new THREE.Mesh(referenceMesh.geometry, referenceMaterial);
		stuff.scale.multiply(referenceMesh.scale); 
		stuff.castShadow = true;
		
		this.pos.set(2,10,0);
		this.quat.set(0,0,0,1);
		let stuffBody = this.createRigidBody(stuff, referenceShape, 20, this.pos, this.quat);
		stuffBody.setFriction(1);
		this.pos.set(0,-10,1);
		stuffBody.setLinearVelocity(new Ammo.btVector3(this.pos.x, this.pos.y, this.pos.z));

		return stuff;
	}

	createParallelepiped(refMesh, mass, pos, quat)
	{
		let bufGeometry = refMesh.geometry;
		let shape = new Ammo.btBoxShape(new Ammo.btVector3(bufGeometry.parameters.width*0.5, bufGeometry.parameters.height*0.5, bufGeometry.parameters.depth*0.5));
		shape.setMargin(this.margin);
		let shapeBody = this.createRigidBody(refMesh, shape, mass, pos, quat);
		shapeBody.setFriction(1);
	}

	createRigidBody(refMesh, shape, mass, pos, quat)
	{
		refMesh.position.copy(pos);
		refMesh.quaternion.copy(quat);

		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		let motionState = new Ammo.btDefaultMotionState(transform);

		let localInertia = new Ammo.btVector3(0,0,0);
		shape.calculateLocalInertia(mass, localInertia);
		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);

		refMesh.userData.motionState = motionState;
		refMesh.userData.physicsBody = body;
		// make rigidbody know THREE.Object3D
		body.entity = refMesh;

		if(mass>0)
		{
			this.rigidBodies.push(refMesh);
			// Disable deactivation
			body.setActivationState(4);
		}

		this.physicsWorld.addRigidBody(body);

		Ammo.destroy(transform);
		Ammo.destroy(localInertia);
		Ammo.destroy(rbInfo);

		return body;
	}

	removeRigidBody(refMesh)
	{
		if(refMesh.userData.physicsBody!=null)
		{
			this.physicsWorld.removeRigidBody(refMesh.userData.physicsBody);

			Ammo.destroy(refMesh.userData.physicsBody);
			refMesh.userData.physicsBody = null;
			Ammo.destroy(refMesh.userData.motionState);
			refMesh.userData.motionState = null;

			this.rigidBodies = this.rigidBodies.filter(item => item !== refMesh);
		}		
	}

	createP2PConstraint(body1, body2, v1, v2)
	{
		let p1 = new Ammo.btVector3(v1.x, v1.y, v1.z);
		let p2 = new Ammo.btVector3(v2.x, v2.y, v2.z);
		let p2p = new Ammo.btPoint2PointConstraint(body1, body2, p1, p2);
		body1.constraint = p2p;
		this.physicsWorld.addConstraint(p2p);	// bool: Disable Collisions Between Linked Bodies
	}

	removeConstraint(body)
	{
		if(body.constraint!=null)
		{
			this.physicsWorld.removeConstraint(body.constraint);
			Ammo.destroy(body.constraint);
			body.constraint = null;
		}
	}

	updateKinematicBody(body, pos, quat)
	{
		let ms = body.getMotionState();
		if(ms)
		{
			this.transformAux1.setIdentity();
			this.transformAux1.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
			if(quat)
				this.transformAux1.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
			ms.setWorldTransform(this.transformAux1);
		}		
	}

	update(dt)
	{
		if(!this.inited) return;

		// step world
		this.physicsWorld.stepSimulation(dt, 10);

		// update graphics
		for(let i=0; i<this.rigidBodies.length; i++)
		{
			let objThree = this.rigidBodies[i];
			let objPhys = objThree.userData.physicsBody;
			let ms = objPhys.getMotionState();
			if (ms)
			{
				ms.getWorldTransform(this.transformAux1);
				let p = this.transformAux1.getOrigin();
				let q = this.transformAux1.getRotation();
				objThree.position.set(p.x(), p.y(), p.z());
				objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			}
		}

		// Check for collisions and fire callbacks
		// Ref: https://github.com/playcanvas/engine/blob/d27a44b6d732c0f1bab94ef5126050db16a1d914/src/framework/components/rigid-body/system.js#L485
		let dispatcher = this.physicsWorld.getDispatcher();
		let numManifolds = dispatcher.getNumManifolds();
		this.frameCollisions = {};

		for (let i=0; i<numManifolds; i++)
		{
			let manifold = dispatcher.getManifoldByIndexInternal(i);
			let body0 = manifold.getBody0();	// btCollisionObject
			let body1 = manifold.getBody1();
			let wb0 = Ammo.castObject(body0, Ammo.btRigidBody);	// btRigidbody
			let wb1 = Ammo.castObject(body1, Ammo.btRigidBody);
			let e0 = wb0.entity;
			let e1 = wb1.entity;

			// check if entity is null
            if (!e0 || !e1) {
            	console.log("entity is null?!");
                continue;
            }

            let flags0 = body0.getCollisionFlags();
            let flags1 = body1.getCollisionFlags();
            let numContacts = manifold.getNumContacts();
            let forwardContacts = [];
            let reverseContacts = [];
            let newCollision, e0Events, e1Events;

            if (numContacts > 0)
            {
            	// TODO: don't fire contact events for triggers

            	e0Events = e0.collision? e0.collision.hasEvent("collisionstart")  || e0.collision.hasEvent("collisionend") || e0.collision.hasEvent("contact") : false;
            	e1Events = e1.collision? e1.collision.hasEvent("collisionstart")  || e1.collision.hasEvent("collisionend") || e1.collision.hasEvent("contact") : false;

            	// console.log(e0);

            	// TODO: globalEvents
            	if (e0Events || e1Events)
            	{
            		// TODO: generate contact points
            		
            		if(e0Events)
            		{
            			// TODO: forward result

            			if(e0.collision)
            			{
            				e0.collision.fire("contact");
            			}

            			newCollision = this.storeCollisions(e0, e1);
            			if(newCollision && e0.collision)
            			{
            				e0.collision.fire("collisionstart", e0);
            			}
            		}

            		if (e1Events)
            		{
            			// TODO: reverse result

            			if(e1.collision)
            			{
            				e1.collision.fire("contact");
            			}

            			newCollision = this.storeCollisions(e1, e0);
            			if (newCollision && e1.collision)
            			{
            				e1.collision.fire("collisionstart", e1);
            			}
            		}
            	}
            	//console.log(wb0);
            }
		}

		this.cleanOldCollisions();


	}

	/**
	 * @description Stores a collision between the entity and other in the contacts map and returns true if it is a new collision
	 * @param {pc.Entity} entity The entity
     * @param {pc.Entity} other The entity that collides with the first entity
     * @returns {Boolean} true if this is a new collision, false otherwise.
	 */
	storeCollisions(entity, other)
	{
		let isNewCollision = false;
		let uuid = entity.uuid;

		this.collisions[uuid] = this.collisions[uuid] || {others: [], entity: entity};

		if(this.collisions[uuid].others.indexOf(other)<0){
			this.collisions[uuid].others.push(other);
			isNewCollision = true;
		}

		this.frameCollisions[uuid] = this.frameCollisions[uuid] || {others: [], entity: entity};
		this.frameCollisions[uuid].others.push(other);

		return isNewCollision;
	}

	cleanOldCollisions()
	{
		for(let uuid in this.collisions)
		{
			if(this.collisions.hasOwnProperty(uuid))
			{
				let entity = this.collisions[uuid].entity;
				let entityCollision = entity.collision;
				let others = this.collisions[uuid].others;
				let length = others.length;
				let i = length;

				while(i--)
				{
					let other = others[i];
					// if the contact does not exit in the current frame collisions then fire event
					if (!this.frameCollisions[uuid] || this.frameCollisions[uuid].others.indexOf(other) < 0)
					{
						// remove from others list
						others.splice(i, 1);

						if (entityCollision && other.collision)
						{
							// TODO: check if both are rigidbodys
							// if (entity.rigidbody && other.rigidbody)
							entityCollision.fire("collisionend", other);

							// TODO: if entity is a trigger
							// entityCollision.fire("triggerleave", other);
						}
					}
				}

				if (others.length === 0)
				{
					delete this.collisions[uuid];
				}
			}
		}
	}

	applyForceToAll(impulse)
	{
		this.tempBtVec3_1.setValue(0,100,0);
		for(let i=0; i<this.rigidBodies.length; i++)
		{
			let objThree = this.rigidBodies[i];
			let objPhys = objThree.userData.physicsBody;
			objPhys.applyCentralImpulse (this.tempBtVec3_1);
		}
	}

	/////////////////
	/////////////////
	/////////////////

	createIndexedBufferGeometryFromGeometry( geometry ) {

        var numVertices = geometry.vertices.length;
        var numFaces = geometry.faces.length;

        var bufferGeom = new THREE.BufferGeometry();
        var vertices = new Float32Array( numVertices * 3 );
        var indices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );

        for ( var i = 0; i < numVertices; i++ ) {

            var p = geometry.vertices[ i ];

            var i3 = i * 3;

            vertices[ i3 ] = p.x;
            vertices[ i3 + 1 ] = p.y;
            vertices[ i3 + 2 ] = p.z;

        }

        for ( var i = 0; i < numFaces; i++ ) {

            var f = geometry.faces[ i ];

            var i3 = i * 3;

            indices[ i3 ] = f.a;
            indices[ i3 + 1 ] = f.b;
            indices[ i3 + 2 ] = f.c;

        }

        bufferGeom.setIndex( new THREE.BufferAttribute( indices, 1 ) );
        bufferGeom.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

        return bufferGeom;
    }

    isEqual( x1, y1, z1, x2, y2, z2 ) {
        var delta = 0.000001;
        return Math.abs( x2 - x1 ) < delta &&
                Math.abs( y2 - y1 ) < delta &&
                Math.abs( z2 - z1 ) < delta;
    }

    mapIndices( bufGeometry, indexedBufferGeom ) {

        // Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry

        var vertices = bufGeometry.attributes.position.array;
        var idxVertices = indexedBufferGeom.attributes.position.array;
        var indices = indexedBufferGeom.index.array;

        var numIdxVertices = idxVertices.length / 3;
        var numVertices = vertices.length / 3;

        bufGeometry.ammoVertices = idxVertices;
        bufGeometry.ammoIndices = indices;
        bufGeometry.ammoIndexAssociation = [];

        for ( var i = 0; i < numIdxVertices; i++ ) {

            var association = [];
            bufGeometry.ammoIndexAssociation.push( association );

            var i3 = i * 3;

            for ( var j = 0; j < numVertices; j++ ) {
                var j3 = j * 3;
                if ( this.isEqual( idxVertices[ i3 ], idxVertices[ i3 + 1 ],  idxVertices[ i3 + 2 ],
                              vertices[ j3 ], vertices[ j3 + 1 ], vertices[ j3 + 2 ] ) ) {
                    association.push( j3 );
                }
            }

        }
    }

    torqueImpulse(body)
    {
    	this.tempBtVec3_1.setValue(0,100,0);
    	body.applyTorqueImpulse(this.tempBtVec3_1);
    }    
}