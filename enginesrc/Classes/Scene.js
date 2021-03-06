function Scene(scene){
	this.layers = new Array();
	this.bgLayers = new Array();
	this.spriteLayers = new Array();
	this.transportLayers = new Array();
	this.transporters = new Array();
	this.itemLayers = new Array();
	this.items = new Array();
	this.actors = new Array();
	this.images = new Array();
	this.playerLayer;
	this.moving = false;
	this.scrollable;
	this.padding;
	this.scroll;
	this.width = mainWidth;
	this.height = sceneHeight;
	this.loader = new PxLoader();
	this.orig = scene;
	this.x = 0;
	this.spawnStart = {};
	this.spawnStart.x = scene.actors[0].x;
	this.spawnStart.y = scene.actors[0].y;
	this.grid = new Array();
	this.squareSize = 16;
	this.graph;
	this.graphCO = new Array();
	this.walkLayer;
	this.debugMoveLine;
	
	this.init = function(){
		var that = this;
		this.preloadLayers();
		this.loader.addCompletionListener(function(e) {
			that.images.push(e.resource.img);
			that.getLayers();
			that.drawPathGrid();
			that.padding = scene.largePadding;
			that.scrollable = (isset(scene.large) || !scene.large) ? true : false;
			that.persPoint = scene.persPoint;
			if(isset(scene.persThreshold)){
				that.persThreshold = new Array(scene.persThreshold[0],scene.persThreshold[1]);
			}
			that.large = scene.large;
			if(isset(scene.persPoint)){
				that.horizonLine = ((mainHeight - invHeight) - scene.persPoint.y);
			}
		});
	}

	this.drawPathGrid = function(){
		var l = new Layer('walkable',0,9999,this.width,this.height);
		this.layers.push(l);
		this.walkLayer = l.ctx;

		var ctx = l.ctx;
		var gridSize = {};
		var curGrid = {};
		var touchArray = new Array();
		var touchArrayX;
		ctx.beginPath();
		if(isset(scene.walkable) && scene.walkable.length > 0){
			for (var i = 0; i < scene.walkable.length; i++) {
				var w = scene.walkable[i];
			 	ctx.lineTo(w.x,w.y);
			}
		} else {
			ctx.lineTo(0,this.height);
			ctx.lineTo(0,0);
			ctx.lineTo(this.width,0);
			ctx.lineTo(this.width,this.height);
		}
		if(debugMode){
			ctx.fillStyle = "rgba(150,150,150,0.4)";
			ctx.fill();
		}
		gridSize.x = parseInt(this.width/this.squareSize);
		gridSize.y = parseInt(this.height/this.squareSize);
		if(debugMode){
			console.log('Creating Grid '+gridSize.x+', '+gridSize.y);
		}
		curGrid.x = 0
		curGrid.y = 0;
		for (var i = 0; i < gridSize.y; i++) {
			curGrid.y = i*this.squareSize;
			touchArrayX = new Array();
			var thisXGrid = new Array();
			for (var j = 0; j < gridSize.x; j++) {
				var s = {};
				var p;
				s.x0 = j*this.squareSize;
				s.y0 = curGrid.y;
				s.x1 = (j*this.squareSize)+this.squareSize;
				s.y1 = curGrid.y+this.squareSize;
				s.posY = i;
				s.posX = j;
				curGrid.x = j*this.squareSize;
				if(this.walkLayer.isPointInPath(s.x0,s.y0) || this.walkLayer.isPointInPath(s.x1,s.y1)){
					touchArrayX.push(1);
					s.p = 1;
				} else {
					touchArrayX.push(0);
					s.p = 0;
				}
				thisXGrid.push(s);

			}
			this.graphCO.push(thisXGrid);
			touchArray.push(touchArrayX);
		}
		this.graph = new Graph(touchArray);
	}

	this.preloadLayers = function(){
		var json = scene.imageLayers;
		for (var key in json) {
			var obj = json[key];
			if(obj.type == 'bg'){
				this.loader.addImage(obj.image);
			}
		}
		this.loader.start();
	}

	this.getLayers = function(){
		var json = scene.imageLayers;
		var count = 0;
		var l;
		for (var key in json) {
			var obj = json[key];
			if(obj.type == 'bg'){
				l = new Layer('background'+count,this.images[count],count,this.width,this.height);
				this.width = l.width;
				this.bgLayers.push(l);
			} else if(obj.type == 'sprite'){
				l = new Layer('spritelayer'+count,0,9999,this.width,this.height);
				this.spriteLayers.push(l);
			} else if(obj.type == 'transporter'){
				l = new Layer('transportlayer'+count,0,9999,this.width,this.height);
				this.transportLayers.push(l);
			} else if(obj.type == 'player'){
				l = new Layer('player',0,9999,this.width,this.height);
				this.playerLayer = l;
			} else if(obj.type == 'item'){
				l = new Layer('item'+count,0,9999,this.width,this.height);
				this.itemLayers.push(l);
			}
			this.layers.push(l);
			count++;
		}
		activeScene = this;
		this.getTransporters();
		this.getActors();
		this.getItems();
	}

	this.getTransporters = function(){
		var json = scene.transporters;
		for (var key in json) {
			var obj = json[key];
			var l = this.transportLayers[key];
			var t = new Transporter(obj,this,l);
			activeTransporters.push(t);
			this.transporters.push(t);
		}
	}

	this.getActors = function(){
		var json = scene.actors;
		for (var key in json) {
			var obj = json[key];
			if(obj.t == 'n'){
				var a = new Actor(this,obj,key);
				a.spawn(this.spriteLayers[key-1]);
				this.actors.push(a);
			} else if(obj.t == 'p') {
				var player = new Player(this,obj,0);
			}
		}
	}

	this.getItems = function(){
		var json = scene.items;
		var that = this;
		var loader = new PxLoader();
		for (var key in json) {
			var obj = json[key];
			loader.addImage(obj.i.image);
		}
		loader.start();
		loader.addCompletionListener(function(e) {
			for (var key in json) {
				var obj = json[key];
				var l = that.itemLayers[key];
				var i = new InventoryItem(obj,l);
				i.image = e.resource.img;
				i.spawn();
				activeItems.push(i);
				that.items.push(i);
			}
		});
	}

	this.move = function(){
		var dest = {x:0,y:0};
		var ifCheck;
		var scrollRightX;
		var scrollLeftX;
		if(this.moving){
			for (var i = 0; i < this.layers.length; i++) {
				var l = this.layers[i];
				if(this.scroll == 'r'){
					dest.x = -(this.width - mainWidth);
					scrollRightX = dest.x;
					ifCheck = l.x >= dest.x;
				}
				if(this.scroll == 'l'){
					dest.x = 0;
					scrollLeftX = dest.x;
					ifCheck = l.x <= dest.x;
				}
				
				this.x = dest.x;

				if(ifCheck){
					l.scroll(dest);
				} else {
					this.moving = false;
				}
			}

			if(this.large == 2){
				var s = activePlayer;
				if(!this.moving){
					s.moving = false;
				} else if(s.cX !== 0 || s.cY !== 0) {
					if(s.constructor.name == 'Player'){
						var pMovePadding = this.padding+150;
						if(this.scroll == 'r'){
							s.destX = -scrollRightX+pMovePadding;
						} else if(this.scroll == 'l'){
							s.destX = -scrollLeftX+mainWidth-pMovePadding;
						}
					}
					s.moving = true;
				}
			}
		}
	}

	this.scrollTo = function(direction){
		this.scroll = direction;
		this.moving = true;
	}

	this.show = function(){
		var that = this;
		this.loader.addCompletionListener(function() { 
			for (var i = 0; i < that.layers.length; i++) {
				$('#container').append(that.layers[i].canvas);
			};
			that.setupControls();
		});
	}

	this.hide = function(){
		for (var i = 0; i < this.layers.length; i++) {
			$('#'+this.layers[i].id).remove();
		};
	}

	this.showHotspotText = function(mousePos){
		for (var i = 0; i < Hotspot.allSceneInstances.length; i++) {
			var h = Hotspot.allSceneInstances[i];
			if(withinHspot(mousePos,h)){
				Inventory.target = h.name;
				break;
			} else {
				if(debugMode){
					Inventory.target = mousePos.x+', '+mousePos.y;
				} else {
					Inventory.target = '';
				}
			}
		}
	}

	this.findGraphPos = function(ppos){
		var gridPos;
		findPos:
		for (var i = 0; i < this.graphCO.length; i++) {
			for (var j = 0; j < this.graphCO[i].length; j++) {
				var h = this.graphCO[i][j];
				if(h.p == 1 && withinHspot(ppos,h)){
					gridPos = h;
					break findPos;
				}
			};
		};
		return gridPos;
	}

	this.findPath = function(){
		var gridStart;
		var gridEnd;
		var start;
		var end;
		var ppos = {};
		var result = new Array();
		ppos.x = activePlayer.sprite.x+(activePlayer.sprite.realW/2);
		ppos.y = activePlayer.sprite.y+(activePlayer.sprite.realH);
		if(ppos.y > sceneHeight){
			ppos.y = sceneHeight-10;
		}
		gridStart = this.findGraphPos(ppos);
		gridEnd = this.findGraphPos(playerDest);
		if(isset(gridEnd)){
			start = this.graph.nodes[gridStart.posY][gridStart.posX];
			end = this.graph.nodes[gridEnd.posY][gridEnd.posX];
			result = astar.search(this.graph.nodes, start, end);
		}
		return result;
	}

	this.nodeToXY = function(cp){
		var node2get;
		foundNode:
		for (var i = 0; i < this.graphCO.length; i++) {
			for (var j = 0; j < this.graphCO[i].length; j++) {
				var h = this.graphCO[i][j];
				if(h.posX == cp.y && h.posY == cp.x){
					node2get = h;
					break;
				}
				
			}
		}
		return node2get;
	}

	this.setupControls = function(){
		var that = this;
		$('canvas').not('#inv,#dialog,#actions,#invItems').on('click', function(e){
			mousePos.x = e.offsetX;
			mousePos.y = e.offsetY;
			playerDest = mousePos;
			if(debugMode){
				console.log('Click coordinates: '+e.offsetX+','+e.offsetY);
			}
			for (var i = 0; i < that.transporters.length; i++) {
				var s = that.transporters[i];
				s.checkClick(e);
			}
			for (var i = 0; i < that.items.length; i++) {
				var s = that.items[i];
				s.checkClick(e);
			}
			var currentPath = that.findPath();
			if(currentPath.length > 0){
				if(debugMode){
					var mc = that.findGraphPos(playerDest);
					console.log('Grid coordinates: '+mc.posX+', '+mc.posY);
				}
				
				for (var i = 0; i < currentPath.length; i++) {
					var q = that.nodeToXY(currentPath[i]);
					activePlayer.moveQueue.push(q);
				};
				
				if(debugMode){
					that.walkLayer.beginPath();
					for (var i = 0; i < activePlayer.moveQueue.length; i++) {
						var q = activePlayer.moveQueue[i];
						if(i == 0){
							that.walkLayer.moveTo(q.x0, q.y0);
						} else {
							that.walkLayer.lineTo(q.x0, q.y0);
						}
					}
					that.walkLayer.strokeStyle = '#ff0000';
					that.walkLayer.stroke();
				}

				activePlayer.moving = true;
			}
		});

		$('canvas').not('#inv,#dialog,#actions,#invItems').on('mouseout',function(e){
			Inventory.updateCanvas();
		});

		$('canvas').not('#inv,#dialog,#actions,#invItems').on('mousemove',function(e){
			mousePos.x = e.offsetX;
			mousePos.y = e.offsetY;
			that.showHotspotText(mousePos);
		});
	}

	this.init();
}