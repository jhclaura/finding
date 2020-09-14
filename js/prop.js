export default class Prop extends THREE.Object3D {
  constructor(file, scene, modelLoader, material, loadedCallback) {
    super()
    this.scene = scene
    this.modelLoader = modelLoader
    this.finishedLoading = false
    this.material = material
    this.file = file
    this.loadedCallback = loadedCallback
    this.beGrabbed = false

    this.init()
  }

  init() {
    this.modelLoader.load(this.file, (gltf) => {
      this.onLoadModel(gltf)
    })
  }

  onLoadModel(gltf) {
    this.gltf = gltf
    this.model = this.gltf.scene.children[0].children[0]
    if (this.material) {
      if (this.model.material && this.model.material.map)
        this.material.map = this.model.material.map
      this.model.material = this.material
    }
    this.add(this.model)
    this.loadedCallback(this)
  }

  updateScale(scalar) {
    this.model.scale.multiplyScalar(scalar)
  }

  mesh() {
    return this.model
  }
}
