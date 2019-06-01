export default class Player {
	constructor(name, color, scorePos) {
		this.name = name;
		this.color = color;
		this.scorePos = scorePos;

		this.score = 0;
		this.focusColor = 'yellow';
		this.keyIsPressed = false;
		this.currentDownKey = '';
		this.matchTable = {
			'65': '37',
			'83': '40',
			'68': '39',
			'37': '65',
			'40': '83',
			'39': '68'
		};
		this.poseTable = {
			'65': 1,
			'83': 2,
			'68': 3,
			'37': 1,
			'40': 2,
			'39': 3
		};

		this.poseURLs = [
			'./assets/images/pose_' + this.name + '.png',
			'./assets/images/pose_' + this.name + '1.png',
			'./assets/images/pose_' + this.name + '2.png',
			'./assets/images/pose_' + this.name + '3.png'
		];		
		this.currentPose;
		this.currentPoseMotion;
		this.playPoseMotion = false;

		this.init();
	}

	init() {
		let rectangleBG = new Rectangle(new Point(0,0), new Size(view.size.width/2, view.size.height));
		this.BG = new Path.Rectangle(rectangleBG);
		this.BG.fillColor = this.color;
		this.BG.pivot = this.BG.bounds.topLeft;

		this.scoreBG = new Shape.Circle(new Point(0,30), 60);
		this.scoreBG.fillColor = '#F3AE4B';
		this.scoreText = new PointText({
			point: this.scorePos,
			content: this.score,
			fillColor: 'white',
			fontFamily: 'Courier New',
			fontWeight: 'bold',
			fontSize: 25,
			justification: 'center'
		});

		this.poses = [];
		for(let i=0; i<this.poseURLs.length; i++)
		{
			let raster = new Raster({
				source: this.poseURLs[i],
				position: view.center
			});
			raster.onLoad = ()=>{
				let scaleRatio = view.size.width / raster.width;
				raster.scale(scaleRatio);
			};
			this.poses[i] = raster;
			if(i!=0)
				raster.visible = false;
		}
		this.currentPose = this.poses[0];

		this.poseMotions = new Array(3);
		for(let j=1; j<4; j++)
		{
			this.poseMotions[j-1] = [];
			for(let i=0; i<12; i++)
			{
				let _url = './assets/images/pose_' + this.name + j + '_' + i + '.png';
				let raster = new Raster({
					source: _url,
					position: view.center
				});
				raster.onLoad = ()=>{
					let scaleRatio = view.size.width / raster.width;
					raster.scale(scaleRatio);
				};
				this.poseMotions[j-1][i] = raster;			
				raster.visible = false;
			}
		}
		
		let _url = './assets/images/star.png';
		this.star = new Raster({
			source: _url,
			position: [view.size.width/4, view.size.height/2]
		});
		this.star.onLoad = ()=>{
			this.star.scale(0.6);
		};
		this.star.visible = false;
		this.starOriPos = this.star.position;

		_url = './assets/images/egg.png';
		this.egg = new Raster({
			source: _url,
			position: [view.size.width/4, view.size.height/5]
		});
		this.egg.onLoad = ()=>{
			this.egg.scale(1.3);
		};
		this.egg.visible = false;

		_url = './assets/images/instruction_' + this.name + '.png';
		this.instruction = new Raster({
			source: _url,
			position: [view.size.width/4.5, view.size.height/4*3]
		});
		this.instruction.onLoad = ()=>{
			this.instruction.scale(1);
		};

		this.keydownTime = Date.now();
	}

	updateBGPosition(x, y) {
		let xDiff = x-this.BG.position.x;
		this.star.position.x += xDiff;
		this.starOriPos = this.star.position;
		this.egg.position.x += xDiff;
		this.scoreBG.position.x += xDiff*2;
		this.instruction.position.x += xDiff;

		this.BG.position = new Point(x, y);
		console.log('updateBGPosition');
	}

	updateBG(color) {
		this.BG.fillColor = color;
	}

	updateScore(diff) {
		this.score += diff;
		if (diff>0)
		{
			if(this.star.currentTween && this.star.currentTween.running)
			{
				this.star.currentTween.stop();
				this.star.position = this.starOriPos;
			}
			this.star.visible = true;
			this.star.currentTween = this.star.tweenTo({
				'position.x': view.size.width/2,
				'position.y': 0,
				rotation: 180
			}, {
				duration: 500,
				start: true
			}).then(()=>{
				this.star.visible = false;
				this.star.position = this.starOriPos;
				this.star.rotation = 0; 
			});
		}
		else if(diff<0)
		{
			if(this.showEggTween && this.showEggTween.running)
			{
				this.showEggTween.stop();
				this.egg.position.y = view.size.height/5;
			}
			this.egg.visible = true;
			this.showEggTween = this.egg.tweenTo({
				'position.y': view.size.height/4
			}, {
				duration: 500,
				easing: 'easeOutQuint',
				start: true
			}).then(()=>{
				this.egg.visible = false;
				this.egg.position.y = view.size.height/5;
			});
		}
		if (this.score<0) this.score=0;
		this.scoreText.content = this.score;
	}

	pressKey(keyCode)
	{
		if (this.keyIsPressed)
		{
			// little movement
			// littleAltPose(keyCode);
			return false;
		}
		this.keyIsPressed = true;
		this.currentDownKey = keyCode;
		this.keydownTime = Date.now();
		this.altPoseTime = Date.now();

		if(this.currentPoseMotion)
			clearInterval(this.currentPoseMotion);

		this.currentPose.visible = false;
		this.currentPose = this.poses[this.poseTable[keyCode]];
		this.currentPose.visible = true;

		if(this.instruction.visible) this.instruction.visible = false;

		return true;
	}

	releaseKey()
	{
		this.keyIsPressed = false;

		if (this.poseTable[this.currentDownKey]==1)
		{
			this.playPoseMotions(0);
		}
		else if (this.poseTable[this.currentDownKey]==2)
		{
			this.playPoseMotions(1);
		}
		else if (this.poseTable[this.currentDownKey]==3)
		{
			this.playPoseMotions(2);
		}

		this.currentDownKey = '';

		// this.currentPose.visible = false;
		// this.currentPose = this.poses[0];
		// this.currentPose.visible = true;
	}

	littleAltPose(keyCode)
	{
		if (Date.now()-this.altPoseTime > 80)
		{
			// this.currentPose.visible = false;
			// this.currentPose = this.poses[0];
			// this.currentPose.visible = true;
		}
	}

	playPoseMotions(index)
	{
		this.poseMotionIndex=0;
		this.currentPoseMotion = setInterval(()=>{
			if (this.poseMotionIndex<this.poseMotions[index].length)
			{
				this.currentPose.visible = false;
				this.currentPose = this.poseMotions[index][this.poseMotionIndex];
				this.currentPose.visible = true;
				this.poseMotionIndex++;
			}
			else
			{
				this.currentPose.visible = false;
				this.currentPose = this.poses[0];
				this.currentPose.visible = true;
				clearInterval(this.currentPoseMotion);
				this.currentPoseMotion = null;
			}
		}, 70);
	}

	pressDuration(compare = Date.now())
	{
		return Math.abs(compare - this.keydownTime);
	}

	checkPoseMatch()
	{
		//console.log(this.name + "'s key: " + this.currentDownKey + ", other's: " + this.otherPlayer.currentDownKey);
		if ( (this.matchTable[this.currentDownKey] == this.otherPlayer.currentDownKey)
			&& (this.otherPlayer.pressDuration()<300) && this.otherPlayer.pressDuration(this.keydownTime)<300 )
			return true;
		else
			return false;
	}
}