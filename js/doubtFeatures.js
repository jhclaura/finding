import PhysicsProp from './physicsProp.js'

export default class DoubtFeatures extends THREE.Object3D {
  constructor(
    chapterManager,
    ammo,
    modelLoader,
    initialPossition,
    assetPathes,
    tag,
  ) {
    super()
    this.chapterManager = chapterManager
    this.ammo = ammo
    this.modelLoader = modelLoader
    this.tag = tag
    this.featurePosition = new THREE.Vector3()
    this.grabOffset = new THREE.Vector3()

    let featureMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
    })

    // load
    for (let i = 0; i < assetPathes.length; i++) {
      let feature = new PhysicsProp(
        assetPathes[i],
        this.chapterManager.scene,
        this.modelLoader,
        featureMaterial,
        this.ammo,
        (newFeature) => {
          newFeature.updateScale(1000)
          newFeature.initPhysics(20, 1, true)
          newFeature.children[0].tag = this.tag
          newFeature.updateKinematicBodyTransform(
            initialPossition,
            feature.quaternion,
          )
        },
      )
      this.add(feature)
    }

    this.setup()
  }

  setup() {
    eventBus.on('mouseUp', () => {
      this.release()
    })
  }

  update(delta) {
    if (this.grabber && this.grabbedFeature) {
      // Grab with offset
      this.grabbedFeature.updateKinematicBodyTransform(
        this.featurePosition.subVectors(
          this.grabber.moveMouse,
          this.grabOffset,
        ),
        this.grabbedFeature.quaternion,
      )
    }
  }

  grab(feature) {
    this.grabber = this.chapterManager.game
    this.grabbedFeature = feature
    this.grabOffset.subVectors(
      this.chapterManager.game.moveMouse,
      this.grabbedFeature.position,
    )
  }

  release() {
    this.grabber = undefined
    this.grabbedFeature = undefined
  }
}
