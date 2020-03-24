import { GPUComputationRenderer } from "../lib/misc/GPUComputationRenderer.js";
import DoubtDude from "../doubtDude.js";

export default class DoubtfulChapter extends THREE.Object3D {
  constructor(ammo, modelLoader, chapterManager) {
    super();
    this.chapterName = "doubtful";
    this.ammo = ammo;
    this.modelLoader = modelLoader;
    this.chapterManager = chapterManager;
    this.cameraController = chapterManager.cameraController;
    this.Cha = chapterManager.cha;
    this.renderer = chapterManager.renderer;

    this.holePosition = new THREE.Vector3(-50, 0, -50);
    this.cameraHeightForHole = -30;
    this.time = 0;

    this.setup();

    // Events
    eventBus.on("ChaStopWalking", () => {
      if (this.Cha.currentAction != "squatDown") return;
      // turn to hole
      let chaRotateTarget = userUtil.quaternionLookAt(
        this.Cha.model,
        this.holePosition
      );
      // this.Cha.model.quaternion.copy(chaRotateTarget);
      let t_time = { t: 0 };
      TweenMax.to(t_time, 1, {
        t: 1,
        onUpdate: () => {
          this.Cha.model.quaternion.slerp(chaRotateTarget, t_time.t);
        },
        onComplete: () => {
          this.setupCameraView();
        }
      });
    });
  }

  setup() {
    // hole detector
    this.holeGeo = new THREE.CircleBufferGeometry(10, 32);
    this.holeMat = new THREE.MeshLambertMaterial({ color: 0x787878 }); //visible: false
    this.hole = new THREE.Mesh(this.holeGeo, this.holeMat);
    this.hole.rotation.x = -Math.PI / 2;
    this.hole.tag = "hole";

    this.hole.position.copy(this.holePosition);
    this.add(this.hole);

    // load stuff
    // this.modelLoader.load("./assets/models/hole.glb", gltf => {
    //   this.onLoadGround(gltf);
    // });

    // ------- Doubt Dude -------
    this.doubtDude = new DoubtDude(
      this.ammo,
      this.modelLoader,
      "./assets/models/hole.glb",
      "doubtDude",
      () => {
        this.doubtDude.chapter = this;
        this.doubtDude.model.position.copy(this.holePosition);
      }
    );
    this.add(this.doubtDude);

    /*
    userUtil.loadShader(
      "js/shaders/snow_vs.glsl",
      "js/shaders/snow_fs.glsl",
      (vert, frag) => {
        userUtil.loadShader(
          "js/shaders/snow_sim_pos_fs.glsl",
          "js/shaders/snow_sim_velocity_fs.glsl",
          (simPos, simVel) => {
            this.onShaderLoader(vert, frag, simPos, simVel);
          }
        );
      }
    );
    */
  }

  update(delta) {
    this.time += delta;
    this.doubtDude.update(delta);

    if (this.snowMesh != null) {
      //this.snowMesh.material.uniforms[ "time" ].value = this.time;

      // this.positionUniforms[ "delta" ].value = delta;
      // this.velocityUniforms[ "time" ].value = this.time;
      // this.velocityUniforms[ "delta" ].value = delta;

      this.gpuCompute.compute();

      this.snowUniforms[
        "texturePosition"
      ].value = this.gpuCompute.getCurrentRenderTarget(
        this.positionVariable
      ).texture;
      this.snowUniforms[
        "textureVelocity"
      ].value = this.gpuCompute.getCurrentRenderTarget(
        this.velocityVariable
      ).texture;
    }
  }

  pokeDude() {
    this.doubtDude.poke();
  }

  end() {}

  cleanup() {}

  setupCameraView() {
    // move camera to side view
    this.chapterManager.controlsCamera = true;

    // Move camera to fixed position
    //let followPosition = this.cameraController.getFollowPosition();

    let newCamPos = new THREE.Vector3(
      this.holePosition.x,
      this.cameraHeightForHole,
      this.cameraController.getZ()
    );
    let lookPos = this.holePosition.clone();
    lookPos.y = this.cameraHeightForHole;
    this.cameraLookQTarget = userUtil.quaternionReverseLookAt(
      newCamPos,
      lookPos
    );
    TweenMax.to(this.cameraController.camera.quaternion, 2, {
      x: this.cameraLookQTarget.x,
      y: this.cameraLookQTarget.y,
      z: this.cameraLookQTarget.z,
      w: this.cameraLookQTarget.w
    });

    TweenMax.to(this.cameraController, 2, {
      setX: this.holePosition.x,
      setY: this.cameraHeightForHole,
      currentFrustumSize: 100,
      onUpdate: () => {
        this.cameraController.setFrustumSize(
          this.cameraController.currentFrustumSize
        );
      }
    });
  }

  onShaderLoader(vert, frag, simPos, simVel) {
    /*
		let refGeometry = new THREE.CircleBufferGeometry(1,6);
		let geometry = new THREE.InstancedBufferGeometry();
		geometry.index = refGeometry.index;
		geometry.attributes = refGeometry.attributes;

		let particleCount = 10000;

		// Instanced attributes
		let offsets = [];
		let colors = [];
		let timeOffsets = [];
		let currTime = 0;
		for(let i=0; i<particleCount; i++){
			offsets.push( (Math.random() - 0.5)*40, 0, (Math.random() - 0.5)*10 );
			colors.push( Math.random(), Math.random(), Math.random(), Math.random() );
			timeOffsets.push( currTime - Math.random()*10 );
		}

		geometry.addAttribute( "offset", new THREE.InstancedBufferAttribute( new Float32Array(offsets), 3 ) );
		geometry.addAttribute( "color", new THREE.InstancedBufferAttribute( new Float32Array(colors), 4 ) );
		geometry.addAttribute( "timeOffset", new THREE.InstancedBufferAttribute( new Float32Array(timeOffsets), 1 ) );

		let material = new THREE.RawShaderMaterial({
			uniforms: {
				"time": {value: currTime},
				"sinetime": {value: 1.0}
			},
			vertexShader: vert,
			fragmentShader: frag,
			side: THREE.DoubleSide
		});

		this.snowMesh = new THREE.Mesh(geometry, material);
		this.snowMesh.position.copy(this.holePosition);
		this.add(this.snowMesh);
		*/

    this.initComputeRenderer(simPos, simVel);

    this.initSnow(vert, frag);
  }

  initComputeRenderer(simPos, simVel) {
    this.WIDTH = 32;

    this.gpuCompute = new GPUComputationRenderer(
      this.WIDTH,
      this.WIDTH,
      this.renderer
    );

    let dtPosition = this.gpuCompute.createTexture();
    let dtVelocity = this.gpuCompute.createTexture();
    this.fillPositionTexture(dtPosition);
    this.fillVelocityTexture(dtVelocity);

    this.velocityVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      simVel,
      dtVelocity
    );
    this.positionVariable = this.gpuCompute.addVariable(
      "texturePosition",
      simPos,
      dtPosition
    );

    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable
    ]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [
      this.positionVariable,
      this.velocityVariable
    ]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms["delta"] = { value: 0.0 };
    this.velocityUniforms["time"] = { value: 0.0 };
    this.velocityUniforms["delta"] = { value: 0.0 };
    this.velocityUniforms["gravity"] = { value: -9.8 };

    let error = this.gpuCompute.init();
    if (error !== null) {
      console.error(error);
    }
  }

  fillPositionTexture(texture) {
    let theArray = texture.image.data;
    for (let k = 0; k < theArray.length; k += 4) {
      // theArray[k+0] = (Math.random() - 0.5)*40;
      // theArray[k+1] = 0;
      // theArray[k+2] = (Math.random() - 0.5)*10;
      theArray[k + 0] = 0;
      theArray[k + 1] = 0;
      theArray[k + 2] = 0;
      theArray[k + 3] = 1;
    }
  }

  fillVelocityTexture(texture) {
    let theArray = texture.image.data;
    for (let k = 0; k < theArray.length; k += 4) {
      theArray[k + 0] = 0;
      theArray[k + 1] = 0;
      theArray[k + 2] = 0;
      theArray[k + 3] = 1;
    }
  }

  initSnow(vert, frag) {
    let refGeometry = new THREE.CircleBufferGeometry(1, 6);
    let geometry = new THREE.InstancedBufferGeometry();
    geometry.index = refGeometry.index;
    geometry.attributes = refGeometry.attributes;

    let particleCount = this.WIDTH * this.WIDTH;

    // Instanced attributes
    //let offsets = [];
    let colors = [];
    for (let i = 0; i < particleCount; i++) {
      //offsets.push( (Math.random() - 0.5)*40, 0, (Math.random() - 0.5)*10 );
      colors.push(Math.random(), Math.random(), Math.random(), 1.0);
    }
    geometry.addAttribute(
      "color",
      new THREE.InstancedBufferAttribute(new Float32Array(colors), 4)
    );

    this.snowUniforms = {
      texturePosition: { value: null },
      textureVelocity: { value: null }
    };

    let material = new THREE.RawShaderMaterial({
      uniforms: this.snowUniforms,
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.DoubleSide
    });

    this.snowMesh = new THREE.Mesh(geometry, material);
    this.snowMesh.position.copy(this.holePosition);
    this.add(this.snowMesh);
  }
}
