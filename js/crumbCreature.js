export default class Crumb extends THREE.Object3D {
  constructor(ammo, startPosition, startRotation, chapter, index) {
    super()
    this.ammo = ammo
    this.startPosition = startPosition
    this.startRotation = startRotation
    this.chapter = chapter
    this.index = index

    this.piviots = []

    this.jointDistance = -0.1

    this.createMesh()
    // this.createBody();
  }

  createMesh() {
    this.mesh = new THREE.Mesh(
      this.chapter.crumbGeometry,
      this.chapter.getRandomMaterial(),
    )
    this.mesh.position.copy(this.startPosition)
    this.mesh.quaternion.copy(this.startRotation)
    this.mesh.tag = 'crumb'
    this.add(this.mesh)

    if (this.index != 0) {
      this.chapter.crumbs[0].mesh.attach(this.mesh)
    }
  }

  createBody() {
    if (this.index == 0) {
      let pivot = new THREE.Vector3()
      pivot.y += 0.4 + this.jointDistance
      this.piviots.push(pivot)

      let tailPivot = new THREE.Vector3()
      tailPivot.y += 0.4 + this.jointDistance
      this.piviots.push(tailPivot)

      this.body = this.ammo.createRigidBody(
        this.mesh,
        this.chapter.crumbShape,
        10,
        this.mesh.position,
        this.mesh.quaternion,
      )
      // this.body.setFriction(10);
      // kinematic body
      this.body.setCollisionFlags(2)
    } else {
      // restricted joint to
      let pivot = new THREE.Vector3()
      pivot.y -= 0.4 + this.jointDistance
      this.piviots.push(pivot)

      let tailPivot = new THREE.Vector3()
      tailPivot.y += 0.4 + this.jointDistance
      this.piviots.push(tailPivot)

      this.body = this.ammo.createRigidBody(
        this.mesh,
        this.chapter.crumbShape,
        10,
        this.mesh.position,
        this.mesh.quaternion,
      )
      // this.body.setFriction(10);
      // this.body.setDamping(1,1);

      // create joint
      this.ammo.createConeConstraint(
        this.body,
        this.chapter.crumbs[this.index - 1].body,
        this.piviots[0],
        this.chapter.crumbs[this.index - 1].piviots[1],
      )
    }
  }

  updateKinematicBodyTransform(targetPos, targetRot) {
    if (this.body.isStaticOrKinematicObject())
      this.ammo.updateKinematicBody(this.body, targetPos, targetRot)
  }

  bePicked() {
    console.log('be picked!')
  }
}
