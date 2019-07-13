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

	throw(referenceMesh, referenceMaterial, raycaster)
	{
		let stuff = new THREE.Mesh(referenceMesh.geometry, referenceMaterial);
		stuff.scale.multiply(referenceMesh.scale); 
		stuff.castShadow = true;

		let stuffShape = this.createShapeFromBuffergeometryMesh(stuff);
		
		this.pos.set(2,10,0);
		this.quat.set(0,0,0,1);
		let stuffBody = this.createRigidBody(stuff, stuffShape, 20, this.pos, this.quat);
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

		refMesh.userData.physicsBody = body;

		if(mass>0)
		{
			this.rigidBodies.push(refMesh);
			// Disable deactivation
			body.setActivationState(4);
		}

		this.physicsWorld.addRigidBody(body);

		return body;
	}

	updateKinematicBody(body, pos, quat)
	{
		let ms = body.getMotionState();
		if(ms)
		{
			this.transformAux1.setIdentity();
			this.transformAux1.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
			this.transformAux1.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
			ms.setWorldTransform(this.transformAux1);
		}		
	}

	update(dt)
	{
		if(!this.inited) return;

		// step world
		this.physicsWorld.stepSimulation(dt, 10);

		// update rigidBodies
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