function Sprite(scene, parentA, layer){
	this.x;
	this.y;
	this.w;
	this.h;
	this.z;
	this.image;
	this.hspotTarget;
	this.name;
	this.scene = scene;
	if(isset(parentA)){
		this.layer = layer.ctx;
	};
	this.actor = parentA;
	this.scaleDiff = 1;
	this.loaded = false;
	this.loader = new PxLoader();
	
	if(parentA.constructor.name == 'Actor'){
		var x = parentA.x;
		var y = parentA.y;
		this.actor = parentA.a;
		this.actor.x = x;
		this.actor.y = y;
		this.hspotTarget = parentA;
		this.name = this.hspotTarget.a.name;
	} else if(parentA.constructor.name == 'Player') {
		// main player
		this.actor = parentA.actor;
		this.hspotTarget = parentA;
		this.actor.x = scene.spawnStart.x;
		this.actor.y = scene.spawnStart.y;
	}


	this.direction = this.actor.actions.walk.down;
	this.directionFrameLenght = this.direction.length;
	this.directionFrameIndex = 0;
	this.UpdateDelayCount = 3;
	this.UpdateDelayIndex = 0;

	this.init = function(){
		var that = this;
		this.loader.addImage(this.actor.path);
		this.loader.start();
		this.loader.addCompletionListener(function(e) {
			that.image = e.resource.img;
			that.loaded = true;
			that.draw(that.actor.x, that.actor.y);
		});
	}

	this.zHandler = function(){
		if(isset(this.scene)){
			var smallPoint = activeScene.horizonLine;
			var bt = this.getBottomPos();
			this.z = Math.abs(1-(bt.y/smallPoint))*10;
			if(isset(activeScene.persThreshold) && this.z <= activeScene.persThreshold[0] && this.z >= activeScene.persThreshold[1]){
				this.scaleDiff = this.z;
			}
		}
	}

	this.getBottomPos = function(){
		var b = {
			x:this.x+(this.w/2),
			y:this.y+this.h
		}
		return b;
	}

	this.updateDirectionFrameIndex = function(){
		if(this.UpdateDelayCount != this.UpdateDelayIndex){
			this.UpdateDelayIndex++;
			return;
		}

		if(this.directionFrameIndex >= this.directionFrameLenght - 1){
			this.directionFrameIndex = 0;
		}else{
			this.directionFrameIndex++;
		}

		this.UpdateDelayIndex = 0;
	}

	this.updateDirection = function(curDir){
		if( ! isset(curDir) ) return;

		switch (true) {
			case curDir.y < 0 && curDir.x > 0:
				this.direction = this.actor.actions.walk.up;
				break;
			case curDir.y > 0 && curDir.x < 0:
				this.direction = this.actor.actions.walk.down;
				break;
			case curDir.x > 0:
				this.direction = this.actor.actions.walk.right;
				break;
			case curDir.x < 0:
				this.direction = this.actor.actions.walk.left;
				break;
		}

	}

	this.draw = function(x, y, curDir){
		if(this.loaded){
			this.updateDirection(curDir);
			this.updateDirectionFrameIndex();

			var up = this.direction[ this.directionFrameIndex ];
			this.x = x;
			this.y = y;
			this.h = up.height;
			this.w = up.width;

			this.zHandler();

			this.realH = this.h*this.scaleDiff;
			this.realW = this.w*this.scaleDiff;

			if(!isset(this.hspotTarget.hspot)){
				this.hspotTarget.hspot = new Hotspot(this.realW,this.realH,this.x,this.y,this.name);
			} else {
				this.hspotTarget.hspot.updatePos(this.realW,this.realH,this.x,this.y);
			}
		
			this.clear();
			this.layer.drawImage(this.image, up.x, up.y, up.width, up.height, this.x, this.y, this.realW, this.realH);
		}
	}

	this.clear = function() {
		var up = this.direction[ this.directionFrameIndex ];
		this.layer.clearRect(0, 0, activeScene.width, activeScene.height);
	}

	this.init();
}