export default class Util {
  constructor() {
    //
  }

  vector3MoveTowards(current, target, maxDistanceDelta) {
    let toVector_x = target.x - current.x;
    let toVector_y = target.y - current.y;
    let toVector_z = target.z - current.z;

    let sqdist =
      toVector_x * toVector_x +
      toVector_y * toVector_y +
      toVector_z * toVector_z;

    if (sqdist == 0 || sqdist <= maxDistanceDelta * maxDistanceDelta) {
      current = target;
      return;
    }

    let dist = Math.sqrt(sqdist);

    current.x += (toVector_x / dist) * maxDistanceDelta;
    current.y += (toVector_y / dist) * maxDistanceDelta;
    current.z += (toVector_z / dist) * maxDistanceDelta;
  }

  quaternionLookAt(object, target) {
    let q1 = new THREE.Quaternion();
    let m1 = new THREE.Matrix4();
    let position = new THREE.Vector3();

    object.updateWorldMatrix(true, false);
    position.setFromMatrixPosition(object.matrixWorld);
    m1.lookAt(target, position, object.up);

    q1.setFromRotationMatrix(m1);

    if (object.parent) {
      m1.extractRotation(object.parent.matrixWorld);
      let q2 = new THREE.Quaternion();
      q2.setFromRotationMatrix(m1);
      q1.premultiply(q2.inverse());
    }
    return q1;
  }

  // for Camera & Light
  quaternionReverseLookAt(object, target) {
    let q1 = new THREE.Quaternion();
    let m1 = new THREE.Matrix4();
    let position = new THREE.Vector3();

    if (object.isObject3D) {
      object.updateWorldMatrix(true, false);
      position.setFromMatrixPosition(object.matrixWorld);
      m1.lookAt(position, target, object.up);
    } else if (object.isVector3) {
      position = object;
      m1.lookAt(position, target, new THREE.Vector3(0, 1, 0));
    }

    q1.setFromRotationMatrix(m1);

    if (object.isObject3D && object.parent) {
      m1.extractRotation(object.parent.matrixWorld);
      let q2 = new THREE.Quaternion();
      q2.setFromRotationMatrix(m1);
      q1.premultiply(q2.inverse());
    }
    return q1;
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  // min inclusive, max exclusive
  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // min inclusive, max exclusive
  getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  loadShader(vert_url, frag_url, onLoad, onProgress, onError) {
    let vert_loader = new THREE.FileLoader();
    vert_loader.setResponseType("text");
    vert_loader.load(
      vert_url,
      vert_text => {
        let frag_loader = new THREE.FileLoader();
        frag_loader.setResponseType("text");
        frag_loader.load(frag_url, frag_text => {
          onLoad(vert_text, frag_text);
        });
      },
      onProgress,
      onError
    );
  }

  //////////////////////////////////
  //      Animation related
  //////////////////////////////////
  pauseAllActions(actionDictionary) {
    for (let key in actionDictionary) {
      actionDictionary[key].paused = true;
    }
  }

  unPauseAllActions() {
    for (let key in actionDictionary) {
      actionDictionary[key].paused = false;
    }
  }

  activateAllActions(initialAction, actionDictionary) {
    for (let key in actionDictionary) {
      if (key == initialAction) this.setActionWeight(actionDictionary[key], 1);
      else this.setActionWeight(actionDictionary[key], 0);
      actionDictionary[key].play();
    }
  }

  // This function is needed, since animationAction.crossFadeTo() disables its start action and sets
  // the start action's timeScale to ((start animation's duration) / (end animation's duration))
  setActionWeight(action, weight) {
    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);
  }
}
