import Character from './character.js'
export default class DoubtDude extends Character {
  constructor(ammo, modelLoader, assetPath, tag, callback) {
    super(ammo, modelLoader, assetPath, tag)
    this.time = 0
    this.callback = callback
  }

  setupStateMachine() {
    this.fsm = new StateMachine({
      init: 'idle',
      transitions: [
        { name: 'poked', from: 'idle', to: 'scratch' },
        {
          name: 'goto',
          from: '*',
          to: s => {
            return s
          },
        },
      ],
      methods: {
        onIdle: () => {
          //
        },
        onScratch: () => {
          this.actionDictionary.scratch.reset()
          this.prepareCrossFade(
            this.actionDictionary.idle,
            this.actionDictionary.scratch,
            0.5,
          )
        },
      },
    })
  }

  onAniLoopFinished(e) {
    let aniName = e.action._clip.name
    switch (aniName) {
      case 'scratch':
        if (this.actionDictionary[aniName].weight == 1) {
          this.prepareCrossFade(
            this.actionDictionary.scratch,
            this.actionDictionary.idle,
            0.5,
          )
          //   this.setActionWeight(this.actionDictionary.idle, 1);
          //   //   this.actionDictionary.idle.time = 0;
          //   this.actionDictionary.idle.fadeIn(0.5);
          this.currentAction = 'idle'
          this.fsm.goto('idle')
        }
        break
    }
  }

  onAniFinished(e) {
    let aniName = e.action._clip.name
    // switch (aniName) {
    //   case "scratch":
    //     if (this.actionDictionary[aniName].weight == 1) {
    //       this.prepareCrossFade(
    //         this.actionDictionary.scratch,
    //         this.actionDictionary.idle,
    //         0.5
    //       );
    //       //   this.setActionWeight(this.actionDictionary.idle, 1);
    //       //   //   this.actionDictionary.idle.time = 0;
    //       //   this.actionDictionary.idle.fadeIn(0.5);
    //       this.currentAction = "idle";
    //       this.fsm.goto("idle");
    //     }
    //     break;
    // }
  }

  afterModelLoaded() {
    this.model.scale.multiplyScalar(1000)
    let ground = this.model.getObjectByName('ground')
    // let handMat = new THREE.MeshLambertMaterial({
    //   color: 0xffffff,
    //   skinning: true
    // });
    let dudeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: ground.material.map,
      skinning: true,
    })

    this.model.getObjectByName('ground').material = new THREE.MeshBasicMaterial(
      {
        color: 0xffffff,
        map: ground.material.map,
      },
    )
    // this.model.getObjectByName("armLeft").material = handMat;
    // this.model.getObjectByName("armRight").material = handMat;
    this.model.getObjectByName('doubtDude').material = dudeMat

    // this.model.position.copy(this.holePosition);

    // Animation setting
    // this.actionDictionary.scratch.loop = THREE.LoopOnce;
    // this.actionDictionary.scratch.clampWhenFinished = true;

    this.callback()
  }

  customUpdate(delta) {
    this.time += delta
  }

  poke() {
    if (this.fsm.can('poked')) {
      this.fsm.poked()
    }
  }
}
