import FindingsEvent from './findingsEvent.js'

export default class Creature extends THREE.Object3D {
  constructor(creatureCreator, ammo, startPosition) {
    super()
    this.creator = creatureCreator
    this.ammo = ammo
    this.startPosition = startPosition

    this.bodys = []
    this.piviots = []

    // re-use variables
    this.btVec3_1 = new Ammo.btVector3(0, 0, 0)

    this.verticle = true
    this.jointDistance = 0.3 // 0

    this.isPhysical = true
    this.startGrey = true

    // event
    // this.collision = {
    // 	hasEvent: (eventName)=>{
    // 		return this.collision.hasOwnProperty(eventName);
    // 	},
    // 	fire: (eventName)=>{
    // 		this.collision[eventName]();
    // 	}
    // };

    this.collision = new FindingsEvent()

    // this.collision.contact = this.onContact;
    // this.collision.collisionstart = this.onCollisionstart;
    // this.collision.collisionend = this.onCollisionend;

    this.createHead()
    this.createBodies()
    //this.createJoints();
  }

  follow(force) {
    this.btVec3_1.setValue(force.x, force.y, force.z)
    this.bodys[0].applyCentralForce(this.btVec3_1)
  }

  createHead() {
    this.hType = this.creator.getRandomType()

    if (this.startGrey) {
      this.head = new THREE.Mesh(
        this.creator.getGeometryByType(this.hType),
        this.creator.materials[this.creator.materials.length - 1],
      )
      this.head.finalMaterial = this.creator.getRandomMaterial()
    } else {
      this.head = new THREE.Mesh(
        this.creator.getGeometryByType(this.hType),
        this.creator.getRandomMaterial(),
      )
    }
    this.head.position.copy(this.startPosition)
    this.head.tag = 'creature'
    this.head.bodyType = this.hType
    this.add(this.head)

    let headPivot = new THREE.Vector3()
    if (this.verticle)
      headPivot.y -= this.creator.baseRadius + this.jointDistance
    else headPivot.z -= this.creator.baseRadius + this.jointDistance
    this.piviots.push(headPivot)

    let headShape = this.creator.getShapeByType(this.hType)
    let headBody = this.ammo.createRigidBody(
      this.head,
      headShape,
      20,
      this.head.position,
      this.head.quaternion,
    )
    headBody.setFriction(5)
    this.bodys.push(headBody)
  }

  createBodies() {
    this.bodyCount = userUtil.getRandomInt(1, 3)
    this.bodyMesh = []

    for (let i = 0; i < this.bodyCount; i++) {
      let hType = this.creator.getRandomType()
      let mesh
      if (this.startGrey) {
        mesh = new THREE.Mesh(
          this.creator.getGeometryByType(hType),
          this.creator.materials[this.creator.materials.length - 1],
        )
        mesh.finalMaterial = this.creator.getRandomMaterial()
      } else {
        mesh = new THREE.Mesh(
          this.creator.getGeometryByType(hType),
          this.creator.getRandomMaterial(),
        )
      }
      mesh.position.copy(this.startPosition)
      mesh.tag = 'creature'

      if (this.verticle)
        mesh.position.y -= this.creator.baseRadius * (i + 1) * 2
      else mesh.position.z -= this.creator.baseRadius * (i + 1) * 2
      this.add(mesh)
      this.bodyMesh.push(mesh)

      let pivot = new THREE.Vector3()
      if (this.verticle) pivot.y += this.creator.baseRadius + this.jointDistance
      else pivot.z -= this.creator.baseRadius + this.jointDistance
      this.piviots.push(pivot)

      if (this.bodyCount > i + 1) {
        let tailPivot = new THREE.Vector3()
        if (this.verticle)
          tailPivot.y -= this.creator.baseRadius + this.jointDistance
        else tailPivot.z += this.creator.baseRadius + this.jointDistance
        this.piviots.push(tailPivot)
      }

      let bodyShape = this.creator.getShapeByType(hType)
      let bodyBody = this.ammo.createRigidBody(
        mesh,
        bodyShape,
        20,
        mesh.position,
        mesh.quaternion,
      ) //type, mesh, mass
      bodyBody.setFriction(5)
      this.bodys.push(bodyBody)
    }
  }

  createJoints() {
    for (let i = 0; i < this.piviots.length; i += 2) {
      this.ammo.createP2PConstraint(
        this.bodys[i / 2],
        this.bodys[i / 2 + 1],
        this.piviots[i],
        this.piviots[i + 1],
      )
    }
  }

  changeHeadFromKinematicToDynamic() {
    if (this.bodys[0].isStaticOrKinematicObject()) {
      this.bodys[0].setCollisionFlags(0)
    }
  }

  changeHeadFromDynamicToKinematic() {
    if (!this.bodys[0].isStaticOrKinematicObject()) {
      console.log('change to kinematic')
      this.bodys[0].setCollisionFlags(2)
    }
  }

  updateKinematicHeadTransform(targetPos, targetRot) {
    this.ammo.updateKinematicBody(this.bodys[0], targetPos, targetRot)
  }

  // ref: https://github.com/bulletphysics/bullet3/blob/master/examples/CommonInterfaces/CommonRigidBodyBase.h
  deletePhysics() {
    // Remove constraint
    for (let i = 0; i < this.bodys.length; i++) {
      this.ammo.removeConstraint(this.bodys[i])
    }

    // Remove rigidbody
    this.ammo.removeRigidBody(this.head)
    for (let i = 0; i < this.bodyMesh.length; i++) {
      this.ammo.removeRigidBody(this.bodyMesh[i])
    }
    Ammo.destroy(this.btVec3_1)
    this.isPhysical = false
  }

  dispose() {
    if (this.isPhysical) this.deletePhysics()

    this.remove(this.head)
    for (let i = 0; i < this.bodyMesh.length; i++) {
      this.remove(this.bodyMesh[i])
    }
    this.bodyMesh = null
    this.bodys = null
    this.piviots = null
  }
}
