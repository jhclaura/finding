// ref source: AudioHandler.js from Felix Turner

export default class AudioHandler {
  constructor() {
    // this.audioContext = context;
    this.levelCount = 32 //should be factor of 512(bin count)

    this.beatCutOff = 0
    this.BEAT_HOLD_TIME = 40 //num of frames to hold a beat
    this.BEAT_DECAY_RATE = 0.98
    this.BEAT_MIN = 0.15 //a volume less than this is no beat (0.15)
    this.beatTime = 0
    this.msecsAvg = 633 //time between beats (msec)
  }

  init() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new window.AudioContext()
    } catch (e) {
      return
    }
    this.waveData = []
    this.levelsData = []
    this.isPlayingAudio = false

    this.filter = this.audioContext.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 140
    this.filter.Q.value = 8
    //console.log(this.filter.frequency.value);

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.smoothingTimeConstant = 0.8 //0<->1. 0 is no time smoothing
    this.analyser.fftSize = 1024

    this.filter.connect(this.analyser)
    this.analyser.connect(this.audioContext.destination)
    this.binCount = this.analyser.frequencyBinCount // 512

    this.binsPerLevel = Math.floor(this.binCount / this.levelCount) //number of bins in each level
    console.log('binsPerLevel: ' + this.binsPerLevel)

    this.freqByteData = new Uint8Array(this.binCount)
    this.timeByteData = new Uint8Array(this.binCount)

    this.levelHistory = [] //last 256 ave norm levels
    for (let i = 0; i < 256; i++) {
      this.levelHistory.push(0)
    }
  }

  initSound() {
    this.source = this.audioContext.createBufferSource()
    //this.source.connect(this.analyser);
    this.source.connect(this.filter)
  }

  stopSound() {
    this.isPlayingAudio = false
    if (this.source) {
      this.source.stop(0)
      this.source.disconnect()
    }
  }

  startSound() {
    this.source.buffer = this.audioBuffer
    this.source.loop = true
    this.source.start(0, 0) //?
    this.isPlayingAudio = true
  }

  loadSound(autoPlay = true, url = '../assets/audios/dancing_on_my_own.mp3') {
    this.stopSound()
    this.url = url
    this.initSound()

    // load
    let request = new XMLHttpRequest()
    request.open('GET', this.url, true)
    request.responseType = 'arraybuffer'
    request.onload = () => {
      console.log('onload')

      this.audioContext.decodeAudioData(
        request.response,
        buffer => {
          this.audioBuffer = buffer
          if (autoPlay) {
            this.startSound()
          }
        },
        e => {
          console.log(e)
        },
      )
    }
    request.send()
  }

  renderSound(url = '../assets/audios/canned_heat_audio.mp3') {
    this.url = url
    // load
    let request = new XMLHttpRequest()
    request.open('GET', this.url, true)
    request.responseType = 'arraybuffer'
    request.onload = ajaxResponseBuffer => {
      let songLength = ajaxResponseBuffer.total
      this.audioContext.decodeAudioData(
        request.response,
        buffer => {
          console.log(buffer.length)
          this.audioBuffer = buffer

          this.offlineContext = new OfflineAudioContext(2, songLength, 44100)
          this.offlineSource = this.offlineContext.createBufferSource()
          this.offlineSource.buffer = this.audioBuffer
          this.offlineSource.connect(this.offlineContext.destination)
          this.offlineSource.start()

          this.offlineContext
            .startRendering()
            .then(renderedBuffer => {
              console.log('Rendering completed successfully')
              this.channelData = renderedBuffer.getChannelData(0)
              console.log(this.channelData.length)
            })
            .catch(e => {
              console.log('Rendering failed: ' + e)
            })
        },
        e => {
          console.log(e)
        },
      )
    }
    request.send()
  }

  update() {
    // V1: while audio is playing and get data runtime
    if (!this.isPlayingAudio) return

    // get data
    this.analyser.getByteFrequencyData(this.freqByteData) //<-- bar chart
    this.analyser.getByteTimeDomainData(this.timeByteData) // <-- waveform

    // normalize waveform data
    for (let i = 0; i < this.binCount; i++) {
      this.waveData[i] = ((this.timeByteData[i] - 128) / 128) * 1 // * vol sensitivity
    }

    // normalize level data
    for (let i = 0; i < this.levelCount; i++) {
      let sum = 0
      for (let j = 0; j < this.binsPerLevel; j++) {
        sum += this.freqByteData[i * this.binsPerLevel + j]
      }
      this.levelsData[i] = (sum / this.binsPerLevel / 256) * 1 // * vol sensitivity, freqData maxs at 256
    }

    // get average level
    let sum = 0
    for (let i = 0; i < this.levelCount; i++) {
      sum += this.levelsData[i]
    }

    this.level = sum / this.levelCount
    console.log(this.level)

    // beat detection
    if (this.level > this.beatCutOff && this.level > this.BEAT_MIN) {
      // OnBeat()
      console.log('on beat!')
      this.beatCutOff = this.level * 1.1
      this.beatTime = 0
    } else {
      if (this.beatTime <= this.BEAT_HOLD_TIME) {
        this.beatTime++
      } else {
        this.beatCutOff *= this.BEAT_DECAY_RATE
        this.beatCutOff = Math.max(this.beatCutOff, this.BEAT_MIN)
      }
    }

    this.bpmTime = (new Date().getTime() - this.bpmStart) / this.msecsAvg
  }
}
