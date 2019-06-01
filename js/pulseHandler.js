export default class PulseHandler {
	constructor() {
		this.pulse = new Pulse({
			onComplete: (event, pulse) => {
				this.extrapolatedPeaks = pulse.getExtrapolatedPeaks(
					pulse.renderedBuffer,
					pulse.significantPeaks,
					pulse.beat
				);
				//console.log(pulse.beat);
				//console.log(pulse.significantPeaks);

				eventBus.emit('beatAnalyse_done');
			}
		});
	}

	load(uri = "./assets/audios/canned_heat_audio.mp3") {
		this.pulse.loadBufferFromURI(uri);
	}
}