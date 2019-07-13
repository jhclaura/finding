export default class Dialogue {

	constructor(id, top, left) {

		this.id = id;
		this.top = top;
		this.left = left;

		this.typed = new Typed(id, {
			strings: [""],
			typeSpeed: 40,
			backDelay: 500,
			startDelay: 1000,
			showCursor: false,
  			cursorChar: '<',
  			onStart: (arrayPos, self)=>{
  				console.log("Cha's dialogue starts!");
  				self.showCursor = true;
  			},
			onComplete: (self)=>{
				console.log("Cha's dialogue ends!");
				self.showCursor = false;
				self.reset();
				self.stop();
			}
		});

		this.setup();
	}

	setup()
	{
		this.Container = document.createElement('div');
		this.Container.id = id + "_type_wrap";
		this.Container.className = "type_wrap";
		document.body.appendChild(this.Container);

		this.dialogue = document.createElement('span');
		this.dialogue.id = id + "_type";
		this.Container.appendChild(this.dialogue);

		this.cursor = document.createElement('span');
		this.cursor.className = "typed-cursor typed-cursor--blink";
		this.Container.appendChild(this.cursor);

		this.updatePosition();
	}


	updatePosition(top, left)
	{
		this.top = top;
		this.left = left;
		this.updatePosition();
	}

	updatePosition()
	{
		this.dialogueContainer.style.top = this.top + "px";
		this.dialogueContainer.style.left = this.left + "px";
	}
}