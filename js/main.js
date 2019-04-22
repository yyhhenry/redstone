'use strict';
$(function(){
	let canvas=document.getElementById('canvas');
	let context=canvas.getContext('2d');
	let clientWidth;
	let clientHeight;
	function onresize(){
		clientWidth=$(window).width();
		clientHeight=$(window).height();
		canvas.width=clientWidth;
		canvas.height=clientHeight;
	}
	onresize();
	$(window).resize(onresize);
	let Point;
	let Line;
	let points=new Set();
	let lines=new Set();
	let powerValue=30;
	let tick=1000;
	let focus=null;
	let ctrl=false;
	let shift=false;
	Point=function(x,y){
		let thisPoint=this;
		let connectedLines=new Set();
		points.add(this);
		let power=false;
		let value=0;
		this.click=function(event){
			return (event.clientX>=x-10&&event.clientX<=x+10&&event.clientY>=y-10&&event.clientY<=y+10);
		}
		this.getType=function(){
			return 'Point';
		}
		this.getX=function(){
			return x;
		}
		this.getY=function(){
			return y;
		}
		this.getPower=function(){
			return power;
		}
		this.getValue=function(){
			return value;
		}
		this.fresh=function(f){
			let newValue=0;
			if(power)newValue=powerValue;
			let cnt=connectedLines.size;
			connectedLines.forEach(function(line){
				if(line.getNotGate()){
					if(line.getPointTo()==thisPoint&&line.getPointFrom().getValue()==0){
						newValue=Math.max(newValue,powerValue);
					}
				}else{
					if(line.getPointTo()==thisPoint){
						newValue=Math.max(newValue,line.getPointFrom().getValue()-1);
					}else{
						newValue=Math.max(newValue,line.getPointTo().getValue()-1);
					}
				}
				cnt--;
				if(cnt==0){
					if(newValue!=value){
						value=newValue;
						connectedLines.forEach(function(line){
							if(line.getNotGate()){
								if(line.getPointFrom()==thisPoint){
									setTimeout(line.getPointTo().fresh,0);
								}
							}else{
								if(line.getPointFrom()==thisPoint){
									setTimeout(line.getPointTo().fresh,0);
								}else{
									setTimeout(line.getPointFrom().fresh,0);
								}
							}
						});
					}
				}
			});
		}
		this.addLine=function(line){
			connectedLines.add(line);
		}
		this.deleteLine=function(line){
			connectedLines.delete(line);
		}
		this.setPower=function(){
			power=!power;
			this.fresh();
		}
		this.moveTo=function(_x,_y){
			x=_x;
			y=_y;
		}
		this.delete=function(){
			connectedLines.forEach(function(line){
				line.delete();
			});
			points.delete(thisPoint);
		}
		this.paint=function(context){
			if(power){
				context.fillStyle='rgb(200,40,40)';
			}else if(value>0){
				context.fillStyle='rgb(100,60,180)';
			}else{
				context.fillStyle='rgb(128,128,128)';
			}
			if(focus==thisPoint){
				context.shadowColor='rgb(0,0,0)';
				context.shadowBlur=20;
			}else{
				context.shadowBlur=0;
			}
			context.fillRect(x-10,y-10,20,20);
		}
		this.has=function(point){
			let edges=Array.from(connectedLines);
			for(let i=0;i<edges.length;i++){
				if(edges[i].getPointFrom()==point)return true;
				if(edges[i].getPointTo()==point)return true;
			}
			return false;
		}
	}
	Line=function(pointFrom,pointTo){
		let thisLine=this;
		pointFrom.addLine(this);
		pointTo.addLine(this);
		lines.add(this);
		let notGate=false;
		let swap=false;
		this.click=function(event){
			function dis(x1,y1,x2,y2){
				return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
			}
			let len=dis(pointFrom.getX(),pointFrom.getY(),pointTo.getX(),pointTo.getY());
			let lenl=dis(pointFrom.getX(),pointFrom.getY(),event.clientX,event.clientY);
			let lenr=dis(event.clientX,event.clientY,pointTo.getX(),pointTo.getY());
			if(lenl+lenr-len<5)return lenl+lenr-len;
			return null;
		}
		this.getType=function(){
			return 'Line';
		}
		this.getPointFrom=function(){
			return pointFrom;
		}
		this.getPointTo=function(){
			return pointTo;
		}
		this.delete=function(){
			pointFrom.deleteLine(thisLine);
			pointTo.deleteLine(thisLine);
			lines.delete(thisLine);
			pointFrom.fresh();
			pointTo.fresh();
		}
		this.getNotGate=function(){
			return notGate;
		}
		this.setNotGate=function(){
			if(notGate){
				let p=pointFrom;
				pointFrom=pointTo;
				pointTo=p;
				if(!swap){
					swap=true;
					pointFrom.fresh();
					pointTo.fresh();
					return;
				}else{
					swap=false;
				}
			}
			notGate=!notGate;
			pointFrom.fresh();
			pointTo.fresh();
		}
		this.paint=function(context){
			let midx=(pointFrom.getX()+pointTo.getX())/2;
			let midy=(pointFrom.getY()+pointTo.getY())/2;
			if(focus==thisLine){
				context.shadowColor='rgb(0,0,0)';
				context.shadowBlur=20;
			}else{
				context.shadowBlur=0;
			}
			context.beginPath();
			context.moveTo(pointFrom.getX(),pointFrom.getY());
			if(pointFrom.getValue()>0){
				context.strokeStyle='rgb(100,60,180)';
			}else{
				context.strokeStyle='rgb(128,128,128)';
			}
			context.lineTo(midx,midy);
			context.closePath();
			if(notGate){
				context.lineWidth=10;
			}else{
				context.lineWidth=5;
			}
			context.stroke();
			
			context.beginPath();
			context.moveTo(midx,midy);
			if(notGate){
				if(pointFrom.getValue()>0){
					context.strokeStyle='rgb(128,128,128)';
				}else{
					context.strokeStyle='rgb(100,60,180)';
				}
			}else{
				if(pointTo.getValue()>0){
					context.strokeStyle='rgb(100,60,180)';
				}else{
					context.strokeStyle='rgb(128,128,128)';
				}
			}
			context.lineTo(pointTo.getX(),pointTo.getY());
			context.closePath();
			context.lineWidth=5;
			context.stroke();
		}
		pointFrom.fresh();
		pointTo.fresh();
	}
	$(window).keydown(function(event){
		if(event.key=='Control'){
			ctrl=true;
		}else if(event.key=='Shift'){
			shift=true;
		}
	});
	$(window).keyup(function(event){
		if(event.key=='Control'){
			ctrl=false;
		}else if(event.key=='Shift'){
			shift=false;
		}else if(event.key==' '){
			if(focus!=null){
				if(focus.getType()=='Point'){
					focus.setPower();
				}else{
					focus.setNotGate();
				}
			}
		}else if(event.key=='Delete'){
			if(focus!=null){
				focus.delete();
				focus=null;
			}
		}
	});
	$(window).click(function(event){
		if(shift){
			if(focus!=null&&focus.getType()=='Point'){
				focus.moveTo(event.clientX,event.clientY);
			}
		}else if(ctrl){
			if(focus==null){
				focus=new Point(event.clientX,event.clientY);
			}else{
				let pointFrom=focus;
				focus=null;
				let cnt=points.size;
				points.forEach(function(point){
					if(focus==null&&point!=pointFrom&&point.click(event)){
						focus=point;
					}
					cnt--;
					if(cnt==0){
						if(focus==null){
							focus=new Point(event.clientX,event.clientY);
							new Line(pointFrom,focus);
						}else if(!pointFrom.has(focus)){
							new Line(pointFrom,focus);
						}
					}
				});
			}
		}else{
			focus=null;
			points.forEach(function(point){
				if(focus!=null&&focus.getType()=='Point')return;
				if(point.click(event)){
					focus=point;
				}
			});
			let linedis=10;
			lines.forEach(function(line){
				if(focus!=null&&focus.getType()=='Point'){
					return;
				}
				let tl=line.click(event);
				if(tl!=null){
					if(focus!=null){
						if(tl<linedis){
							linedis=tl;
							focus=line;
						}
					}else{
						focus=line;
						linedis=tl;
					}
				}
			});
		}
	});
	window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame;
	function paint(){
		context.shadowBlur=0;
		context.fillStyle='rgb(255,255,255)';
		context.fillRect(0,0,clientWidth,clientHeight);
		let cnt=lines.size;
		if(cnt==0){
			points.forEach(function(points){
				points.paint(context);
			});
		}
		lines.forEach(function(line){
			line.paint(context);
			cnt--;
			if(cnt==0){
				points.forEach(function(points){
					points.paint(context);
				});
			}
		});
		window.requestAnimationFrame(paint);
	}
	paint();
	function stringToGraph(exp){
		exp=JSON.parse(exp);
		points=new Set();
		lines=new Set();
		focus=null;
		let pointsList=[]
		for(let i=0;i<exp.points.length;i++){
			pointsList.push(new Point(exp.points[i].x,exp.points[i].y));
			if(exp.points[i].power)pointsList[i].setPower();
		}
		for(let i=0;i<exp.lines.length;i++){
			let line=new Line(pointsList[exp.lines[i].pointFrom],pointsList[exp.lines[i].pointTo]);
			if(exp.lines[i].notGate){
				line.setNotGate();
			}
		}
	}
	function graphToString(){
		let ans='';
		let arrayOfPoints=Array.from(points);
		let arrayOfLines=Array.from(lines);
		ans+=`
		{
			"points":[
		`;
		for(let i=0;i<arrayOfPoints.length;i++){
			ans+=`
				{
					"x":${arrayOfPoints[i].getX()},
					"y":${arrayOfPoints[i].getY()},
					"power":${arrayOfPoints[i].getPower()}
				}${i==arrayOfPoints.length-1?'':','}
			`;
		}
		ans+=`
			],
			"lines":[
		`;
		function findPoint(point){
			for(let i=0;i<arrayOfPoints.length;i++){
				if(arrayOfPoints[i]==point){
					return i;
				}
			}
		}
		for(let i=0;i<arrayOfLines.length;i++){
			ans+=`
				{
					"pointFrom":${findPoint(arrayOfLines[i].getPointFrom())},
					"pointTo":${findPoint(arrayOfLines[i].getPointTo())},
					"notGate":${arrayOfLines[i].getNotGate()}
				}${i==arrayOfLines.length-1?'':','}
			`;
		}
		ans+=`
			]
		}
		`;
		return ans;
	}
	$(window).unload(function(){
		window.localStorage.graph=graphToString();
	});
	if(window.localStorage.graph==null){
		window.localStorage.graph=`
		{
			"points":[
		
				{
					"x":252,
					"y":221,
					"power":false
				},
			
				{
					"x":155,
					"y":218,
					"power":false
				},
			
				{
					"x":254,
					"y":128,
					"power":false
				},
			
				{
					"x":250,
					"y":328,
					"power":false
				},
			
				{
					"x":733,
					"y":66,
					"power":false
				},
			
				{
					"x":929,
					"y":69,
					"power":false
				},
			
				{
					"x":750,
					"y":155,
					"power":false
				},
			
				{
					"x":747,
					"y":265,
					"power":false
				},
			
				{
					"x":745,
					"y":334,
					"power":false
				},
			
				{
					"x":866,
					"y":382,
					"power":false
				},
			
				{
					"x":742,
					"y":432,
					"power":false
				},
			
				{
					"x":983,
					"y":382,
					"power":false
				},
			
				{
					"x":755,
					"y":499,
					"power":false
				},
			
				{
					"x":755,
					"y":649,
					"power":false
				},
			
				{
					"x":842,
					"y":154,
					"power":false
				},
			
				{
					"x":942,
					"y":207,
					"power":false
				},
			
				{
					"x":842,
					"y":266,
					"power":false
				},
			
				{
					"x":837,
					"y":499,
					"power":false
				},
			
				{
					"x":940,
					"y":495,
					"power":false
				},
			
				{
					"x":1029,
					"y":560,
					"power":false
				},
			
				{
					"x":840,
					"y":647,
					"power":false
				},
			
				{
					"x":937,
					"y":648,
					"power":false
				},
			
				{
					"x":619,
					"y":130,
					"power":false
				},
			
				{
					"x":620,
					"y":333,
					"power":false
				},
			
				{
					"x":317,
					"y":128,
					"power":false
				},
			
				{
					"x":321,
					"y":331,
					"power":false
				},
			
				{
					"x":22,
					"y":215,
					"power":false
				},
			
				{
					"x":404,
					"y":126,
					"power":false
				},
			
				{
					"x":485,
					"y":332,
					"power":false
				},
			
				{
					"x":482,
					"y":125,
					"power":false
				}
			
			],
			"lines":[
		
				{
					"pointFrom":0,
					"pointTo":1,
					"notGate":false
				},
			
				{
					"pointFrom":2,
					"pointTo":1,
					"notGate":true
				},
			
				{
					"pointFrom":0,
					"pointTo":2,
					"notGate":true
				},
			
				{
					"pointFrom":0,
					"pointTo":3,
					"notGate":false
				},
			
				{
					"pointFrom":3,
					"pointTo":1,
					"notGate":false
				},
			
				{
					"pointFrom":4,
					"pointTo":5,
					"notGate":true
				},
			
				{
					"pointFrom":8,
					"pointTo":9,
					"notGate":true
				},
			
				{
					"pointFrom":9,
					"pointTo":11,
					"notGate":true
				},
			
				{
					"pointFrom":6,
					"pointTo":14,
					"notGate":true
				},
			
				{
					"pointFrom":14,
					"pointTo":15,
					"notGate":true
				},
			
				{
					"pointFrom":7,
					"pointTo":16,
					"notGate":true
				},
			
				{
					"pointFrom":12,
					"pointTo":17,
					"notGate":true
				},
			
				{
					"pointFrom":17,
					"pointTo":18,
					"notGate":true
				},
			
				{
					"pointFrom":18,
					"pointTo":19,
					"notGate":true
				},
			
				{
					"pointFrom":13,
					"pointTo":20,
					"notGate":true
				},
			
				{
					"pointFrom":20,
					"pointTo":21,
					"notGate":true
				},
			
				{
					"pointFrom":12,
					"pointTo":21,
					"notGate":true
				},
			
				{
					"pointFrom":13,
					"pointTo":18,
					"notGate":true
				},
			
				{
					"pointFrom":21,
					"pointTo":19,
					"notGate":true
				},
			
				{
					"pointFrom":10,
					"pointTo":9,
					"notGate":true
				},
			
				{
					"pointFrom":16,
					"pointTo":15,
					"notGate":true
				},
			
				{
					"pointFrom":24,
					"pointTo":2,
					"notGate":true
				},
			
				{
					"pointFrom":25,
					"pointTo":3,
					"notGate":true
				},
			
				{
					"pointFrom":23,
					"pointTo":28,
					"notGate":false
				},
			
				{
					"pointFrom":28,
					"pointTo":24,
					"notGate":true
				},
			
				{
					"pointFrom":27,
					"pointTo":24,
					"notGate":true
				},
			
				{
					"pointFrom":29,
					"pointTo":27,
					"notGate":true
				},
			
				{
					"pointFrom":22,
					"pointTo":29,
					"notGate":false
				},
			
				{
					"pointFrom":29,
					"pointTo":25,
					"notGate":true
				},
			
				{
					"pointFrom":28,
					"pointTo":25,
					"notGate":true
				},
			
				{
					"pointFrom":26,
					"pointTo":1,
					"notGate":false
				}
			
			]
		}
		`;
	}
	stringToGraph(window.localStorage.graph);
});