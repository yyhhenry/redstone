'use strict';
$(function(){
	//定义对象
	let ZSet;
	let Point;
	let Line;
	
	//常量
	const canvas=document.getElementById('canvas');
	const context=canvas.getContext('2d');
	const powerValue=30;
	
	//变量
	let clientWidth;
	let clientHeight;
	
	let points;
	let lines;
	let focus;
	
	let ctrl;
	let shift;
	let movePoint;
	let selectRect;
	let mousePosition;
	let getFocus;
	
	//实现对象
	ZSet=function(rev){
		if(rev==null)rev=false;
		let thisZSet=this;
		let data=new Set();
		this.clear=function(){
			rev=false;
			data=new Set();
			return thisZSet;
		}
		this.add=function(v){
			if(rev){
				data.delete(v);
			}else{
				data.add(v);
			}
			return thisZSet;
		}
		this.delete=function(v){
			if(rev){
				data.add(v);
			}else{
				data.delete(v);
			}
			return thisZSet;
		}
		this.size=function(){
			if(rev){
				return null;
			}else{
				return data.size;
			}
		}
		this.has=function(v){
			if(rev){
				return !data.has(v);
			}else{
				return data.has(v);
			}
		}
		this.forEach=function(f){
			if(!rev){
				let array=Array.from(data);
				for(let i=0;i<array.length;i++){
					f(array[i]);
				}
			}
			return thisZSet;
		}
		this.clone=function(){
			let ans=new ZSet(rev);
			this.forEach(function(value){
				if(rev){
					ans.delete(value);
				}else{
					ans.add(value);
				}
			});
			return ans;
		}
		this.and=function(zset){
			let ans=new ZSet();
			this.forEach(function(value){
				if(zset.has(value)){
					ans.add(value);
				}
			});
			return ans;
		}
		this.or=function(zset){
			let ans=zset.clone();
			this.forEach(function(value){
				ans.add(value);
			});
			return ans;
		}
		this.not=function(zset){
			let ans=new ZSet(true);
			this.forEach(function(value){
				ans.delete(value);
			});
			return ans;
		}
	}
	Point=function(x,y){
		let thisPoint=this;
		let connectedLines=new ZSet();
		let connectedPoints=new ZSet();
		points.add(this);
		let power=false;
		let value=0;
		this.click=function(){
			function dis(x1,y1,x2,y2){
				return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
			}
			if(mousePosition.x>=x-10&&mousePosition.x<=x+10&&mousePosition.y>=y-10&&mousePosition.y<=y+10){
				return dis(mousePosition.x,mousePosition.y,x,y);
			}
			return null;
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
			});
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
		this.hasLineTo=function(point){
			return connectedPoints.has(point);
		}
		this.addLine=function(line){
			if(line.getPointFrom()==thisPoint){
				connectedPoints.add(line.getPointTo());
			}else{
				connectedPoints.add(line.getPointFrom());
			}
			connectedLines.add(line);
		}
		this.deleteLine=function(line){
			if(line.getPointFrom()==thisPoint){
				connectedPoints.delete(line.getPointTo());
			}else{
				connectedPoints.delete(line.getPointFrom());
			}
			connectedLines.delete(line);
		}
		this.setPower=function(){
			power=!power;
			this.fresh();
		}
		this.move=function(_x,_y){
			x+=_x;
			y+=_y;
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
			if(focus.has(thisPoint)){
				context.shadowColor='rgb(0,0,0)';
				context.shadowBlur=20;
			}else{
				context.shadowBlur=0;
			}
			context.fillRect(x-10,y-10,20,20);
		}
	}
	Line=function(pointFrom,pointTo){
		let thisLine=this;
		if(pointFrom==pointTo||pointFrom.hasLineTo(pointTo))return;
		lines.add(this);
		let notGate=false;
		let swap=false;
		this.click=function(){
			function dis(x1,y1,x2,y2){
				return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
			}
			let len=dis(pointFrom.getX(),pointFrom.getY(),pointTo.getX(),pointTo.getY());
			let lenl=dis(pointFrom.getX(),pointFrom.getY(),mousePosition.x,mousePosition.y);
			let lenr=dis(mousePosition.x,mousePosition.y,pointTo.getX(),pointTo.getY());
			if(lenl>len+15||lenr>len+15)return;
			let p=(len+lenl+lenr)/2;
			let v=Math.sqrt(p*(p-len)*(p-lenl)*(p-lenr));
			let ptl=v*2/len;
			if(ptl<=15)return ptl;
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
			if(focus.has(thisLine)){
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
			if(notGate){
				context.lineWidth=2.5;
			}else{
				context.lineWidth=5;
			}
			context.stroke();
		}
		pointFrom.addLine(this);
		pointTo.addLine(this);
		pointFrom.fresh();
		pointTo.fresh();
	}
	
	
	//事件
	$(window).keydown(function(event){
		if(window.event.key=='Control'){
			ctrl=true;
		}else if(window.event.key=='Shift'){
			shift=true;
			focus.forEach(function(focusi){
				if(focusi.getType()=='Line'){
					focus.delete(focusi);
				}
			});
		}else if(window.event.key==' '){
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					focusi.setPower();
				}else{
					focusi.setNotGate();
				}
			});
		}else if(window.event.key=='Delete'){
			focus.forEach(function(focusi){
				if(focusi.getType()=='Line'){
					focusi.delete();
				}
			});
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					focusi.delete();
				}
			});
			focus.clear();
		}else if(window.event.key=='a'){
			if(!ctrl)return;
			focus=points.clone();
		}else if(window.event.key=='c'){
			if(!ctrl)return;
			if(focus.and(points).size()==0)return;
			window.localStorage.clipboard=graphToString(focus.and(points));
		}else if(window.event.key=='v'){
			if(!ctrl)return;
			stringToGraph(window.localStorage.clipboard);
		}else if(window.event.key=='x'){
			if(!ctrl)return;
			if(focus.and(points).size()==0)return;
			window.localStorage.clipboard=graphToString(focus);
			focus.forEach(function(focusi){
				if(focusi.getType()=='Line'){
					focusi.delete();
				}
			});
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					focusi.delete();
				}
			});
			focus.clear();
		}
	});
	$(window).keyup(function(event){
		if(window.event.key=='Control'){
			ctrl=false;
		}else if(window.event.key=='Shift'){
			shift=false;
		}
	});
	$(window).mousedown(function(event){
		if(event.button!=0)return;
		if(ctrl){
			let focusedPoint=getFocus(points);
			if(focusedPoint==null){
				focusedPoint=new Point(mousePosition.x,mousePosition.y);
			}
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					new Line(focusi,focusedPoint);
				}
			});
			focus.clear().add(focusedPoint);
			movePoint=true;
		}else if(shift){
			let focusedPoint=getFocus(points);
			if(focusedPoint!=null){
				if(focus.has(focusedPoint)){
					focus.delete(focusedPoint);
				}else{
					focus.add(focusedPoint);
				}
			}else{
				selectRect={
					x:mousePosition.x,
					y:mousePosition.y,
					width:0,
					height:0
				};
			}
		}else{
			let focusedPoint=getFocus(focus.and(points));
			if(focusedPoint!=null){
				movePoint=true;
			}else{
				focusedPoint=getFocus(points.and(focus.not()));
				if(focusedPoint!=null){
					movePoint=true;
					focus.clear().add(focusedPoint);
				}else{
					movePoint=false;
					let focusedLine=getFocus(lines);
					if(focusedLine!=null){
						focus.clear().add(focusedLine);
					}else{
						selectRect={
							x:mousePosition.x,
							y:mousePosition.y,
							width:0,
							height:0
						};
					}
				}
			}
		}
	});
	$(window).mouseup(function(event){
		if(event.button!=0)return;
		movePoint=false;
		if(selectRect!=null){
			if(selectRect.width<0){
				selectRect.x+=selectRect.width;
				selectRect.width=-selectRect.width;
			}
			if(selectRect.height<0){
				selectRect.y+=selectRect.height;
				selectRect.height=-selectRect.height;
			}
			if(!shift){
				focus.clear();
			}
			points.forEach(function(point){
				if(point.getX()>=selectRect.x&&point.getY()>=selectRect.y&&point.getX()<=selectRect.x+selectRect.width&&point.getY()<=selectRect.y+selectRect.height){
					if(!shift){
						focus.add(point);
					}else{
						if(focus.has(point)){
							focus.delete(point);
						}else{
							focus.add(point);
						}
					}
				}
			});
			selectRect=null;
		}
	});
	$(window).mousemove(function(event){
		if(movePoint){
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					focusi.move(event.clientX-mousePosition.x,event.clientY-mousePosition.y);
				}
			});
		}else if(selectRect!=null){
			selectRect.width=event.clientX-selectRect.x;
			selectRect.height=event.clientY-selectRect.y;
		}
		mousePosition.x=event.clientX;
		mousePosition.y=event.clientY;
	});
	window.onmousewheel=function(event){
		let step=-window.event.deltaY/100;
		for(let i=0;i<step;i++){
			points.forEach(function(point){
				point.moveTo((point.getX()-mousePosition.x)*0.9+mousePosition.x,(point.getY()-mousePosition.y)*0.9+mousePosition.y);
			});
		}
		for(let i=0;i<-step;i++){
			points.forEach(function(point){
				point.moveTo((point.getX()-mousePosition.x)/0.9+mousePosition.x,(point.getY()-mousePosition.y)/0.9+mousePosition.y);
			});
		}
	}
	$(window).resize(function(){
		clientWidth=$(window).width();
		clientHeight=$(window).height();
		canvas.width=clientWidth;
		canvas.height=clientHeight;
	});
	
	//绘制
	function paint(){
		context.shadowBlur=0;
		context.fillStyle='rgb(255,255,255)';
		context.fillRect(0,0,clientWidth,clientHeight);
		lines.forEach(function(line){
			line.paint(context);
		});
		points.forEach(function(point){
			point.paint(context);
		});
		if(selectRect!=null){
			context.shadowBlur=0;
			context.fillStyle='rgba(40,40,160,0.2)';
			context.fillRect(selectRect.x,selectRect.y,selectRect.width,selectRect.height);
		}
		if(ctrl){
			context.shadowBlur=0;
			let focusedPoint=getFocus(points);
			let okay=false;
			focus.forEach(function(focusi){
				if(focusi.getType()=='Point'){
					if(focusedPoint!=null&&focusi==focusedPoint||focusi.hasLineTo(focusedPoint)){
						context.strokeStyle='rgba(160,160,40,1)';
					}else{
						context.strokeStyle='rgba(40,40,160,0.4)';
						okay=true;
					}
					context.beginPath();
					context.moveTo(focusi.getX(),focusi.getY());
					if(focusedPoint!=null){
						context.lineTo(focusedPoint.getX(),focusedPoint.getY());
					}else{
						context.lineTo(mousePosition.x,mousePosition.y);
					}
					context.closePath();
					context.lineWidth=5;
					context.stroke();
				}
			});
			context.fillStyle='rgba(40,40,160,0.4)';
			if(focusedPoint!=null){
				if(!okay)context.fillStyle='rgba(160,160,40,1)';
				context.fillRect(focusedPoint.getX()-10,focusedPoint.getY()-10,20,20);
			}else{
				context.fillRect(mousePosition.x-10,mousePosition.y-10,20,20);
			}
		}
		window.requestAnimationFrame(paint);
	}
	
	//存档
	function stringToGraph(exp){
		if(exp==null||exp=='')return;
		exp=JSON.parse(exp);
		let pointsList=[];
		focus=new ZSet();
		for(let i=0;i<exp.points.length;i++){
			let point=new Point(exp.points[i].x,exp.points[i].y);
			pointsList.push(point);
			focus.add(point);
			if(exp.points[i].power)point.setPower();
		}
		for(let i=0;i<exp.lines.length;i++){
			let line=new Line(pointsList[exp.lines[i].pointFrom],pointsList[exp.lines[i].pointTo]);
			if(exp.lines[i].notGate){
				line.setNotGate();
			}
		}
	}
	function graphToString(selectedPoints){
		if(selectedPoints==null)selectedPoints=points;
		let ans={points:[],lines:[]};
		let count=0;
		selectedPoints.forEach(function(point){
			if(point.getType()!='Point')return;
			point.count=count++;
			ans.points.push({
				x:point.getX(),
				y:point.getY(),
				power:point.getPower()
			});
		});
		lines.forEach(function(line){
			if(!selectedPoints.has(line.getPointFrom()))return;
			if(!selectedPoints.has(line.getPointTo()))return;
			ans.lines.push({
				pointFrom:line.getPointFrom().count,
				pointTo:line.getPointTo().count,
				notGate:line.getNotGate()
			});
		});
		return JSON.stringify(ans);
	}
	$(window).unload(function(){
		window.localStorage.graph=graphToString();
	});
	
	//预处理
	points=new ZSet();
	lines=new ZSet();
	focus=new ZSet();
	
	ctrl=false;
	shift=false;
	movePoint=false;
	selectRect=null;
	mousePosition={};
	
	getFocus=function(zset){
		if(mousePosition.x==null)return;
		let ans=null;
		let ansValue=-1;
		zset.forEach(function(value){
			let tot=value.click();
			if(tot==null)return;
			if(ans==null||tot<ansValue){
				ans=value;
				ansValue=tot;
			}
		});
		return ans;
	}
	
	stringToGraph(window.localStorage.graph);
	focus.clear();
	$(window).resize();
	paint();
});