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
	let focus=new Set();
	let ctrl=false;
	let shift=false;
	Point=function(x,y){
		let thisPoint=this;
		let connectedLines=new Set();
		let connectedPoints=new Set();
		points.add(this);
		let power=false;
		let value=0;
		this.click=function(event){
			function dis(x1,y1,x2,y2){
				return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
			}
			if(event.clientX>=x-10&&event.clientX<=x+10&&event.clientY>=y-10&&event.clientY<=y+10){
				return dis(event.clientX,event.clientY,x,y);
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
			let cnt=connectedLines.size;
			function test(){
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
			if(cnt==0){
				test();
			}
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
					test();
				}
			});
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
		if(pointFrom.hasLineTo(pointTo)){
			return;
		}
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
			context.lineWidth=5;
			context.stroke();
		}
		pointFrom.addLine(this);
		pointTo.addLine(this);
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
		}else if(event.key==' '){
			let _focus=Array.from(focus);
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Point'){
					focusi.setPower();
				}else{
					focusi.setNotGate();
				}
			}
		}else if(event.key=='Delete'){
			let _focus=Array.from(focus);
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Line'){
					focusi.delete();
				}
			}
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Point'){
					focusi.delete();
				}
			}
			focus=new Set();
		}else if(event.key=='Shift'){
			shift=false;
		}else if(ctrl&&event.key=='a'){
			focus=new Set(Array.from(points));
		}else if(ctrl&&event.key=='c'){
			window.localStorage.clipboard=graphToString(focus);
		}else if(ctrl&&event.key=='v'){
			stringToGraph(window.localStorage.clipboard);
		}else if(ctrl&&event.key=='x'){
			window.localStorage.clipboard=graphToString(focus);
			let _focus=Array.from(focus);
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Line'){
					focusi.delete();
				}
			}
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Point'){
					focusi.delete();
				}
			}
			focus=new Set();
		}
	});
	let movePoint=false;
	let selectRect=null;
	let place={x:0,y:0};
	$(window).mousedown(function(event){
		place.x=event.clientX;
		place.y=event.clientY;
		if(ctrl){
			if(focus.size==0){
				focus=new Set([new Point(event.clientX,event.clientY)]);
			}else{
				let _focus=Array.from(focus);
				let _points=Array.from(points);
				let ans=null;
				for(let i=0;i<_points.length;i++){
					let point=_points[i];
					if(!focus.has(ans)&&point.click(event)!=null){
						ans=point;
					}
				}
				if(ans==null){
					ans=new Point(event.clientX,event.clientY);
				}
				for(let i=0;i<_focus.length;i++){
					let focusi=_focus[i];
					if(focusi.getType()=='Point'){
						new Line(focusi,ans);
					}
				}
				focus=new Set([ans]);
			}
			movePoint=true;
		}else if(shift){
			let _points=Array.from(points);
			let ans=null;
			let ansValue=-1;
			for(let i=0;i<_points.length;i++){
				let point=_points[i];
				let tot=point.click(event);
				if(tot==null)continue;
				if(ans==null||tot<ansValue){
					ans=point;
					ansValue=tot;
				}
			}
			if(ans!=null){
				if(focus.has(ans)){
					focus.delete(ans);
				}else{
					focus.add(ans);
				}
			}else{
				selectRect={
					x:event.clientX,
					y:event.clientY,
					width:0,
					height:0
				};
			}
		}else{
			movePoint=false;
			let _focus=Array.from(focus);
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Point'){
					if(focusi.click(event)!=null){
						movePoint=true;
					}
				}
			}
			if(!movePoint){
				let _points=Array.from(points);
				let ans=null;
				let ansValue=-1;
				for(let i=0;i<_points.length;i++){
					let point=_points[i];
					let tot=point.click(event);
					if(tot==null)continue;
					if(ans==null||tot<ansValue){
						ans=point;
						ansValue=tot;
					}
				}
				if(ans==null){
					let _lines=Array.from(lines);
					for(let i=0;i<_lines.length;i++){
						let line=_lines[i];
						let tot=line.click(event);
						if(tot==null)continue;
						if(ans==null||tot<ansValue){
							ans=line;
							ansValue=tot;
						}
					}
				}
				if(ans!=null){
					focus=new Set([ans]);
					movePoint=true;
				}else{
					focus=new Set();
				}
			}
			if(!movePoint){
				selectRect={
					x:event.clientX,
					y:event.clientY,
					width:0,
					height:0
				};
			}
		}
	});
	$(window).mouseup(function(event){
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
				focus=new Set();
			}
			let _points=Array.from(points);
			for(let i=0;i<_points.length;i++){
				let point=_points[i];
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
			}
			selectRect=null;
		}
	});
	$(window).mousemove(function(event){
		if(movePoint){
			let _focus=Array.from(focus);
			for(let i=0;i<_focus.length;i++){
				let focusi=_focus[i];
				if(focusi.getType()=='Point'){
					focusi.move(event.clientX-place.x,event.clientY-place.y);
				}
			}
		}else if(selectRect!=null){
			selectRect.width=event.clientX-selectRect.x;
			selectRect.height=event.clientY-selectRect.y;
		}
		place.x=event.clientX;
		place.y=event.clientY;
	});
	window.requestAnimationFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame;
	function paint(){
		context.shadowBlur=0;
		context.fillStyle='rgb(255,255,255)';
		context.fillRect(0,0,clientWidth,clientHeight);
		let _lines=Array.from(lines);
		let _points=Array.from(points);
		for(let i=0;i<_lines.length;i++){
			let line=_lines[i];
			line.paint(context);
		}
		for(let i=0;i<_points.length;i++){
			let point=_points[i];
			point.paint(context);
		}
		if(selectRect!=null){
			context.shadowBlur=0;
			context.fillStyle='rgba(40,40,160,0.2)';
			context.fillRect(selectRect.x,selectRect.y,selectRect.width,selectRect.height);
		}
		window.requestAnimationFrame(paint);
	}
	paint();
	function stringToGraph(exp){
		if(exp==null||exp=='')return;
		exp=JSON.parse(exp);
		let pointsList=[];
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
		focus=new Set(pointsList);
	}
	function graphToString(selectedPoints){
		if(selectedPoints==null)selectedPoints=points;
		let ans='';
		let arrayOfPoints=Array.from(selectedPoints);
		let arrayOfLines=Array.from(lines);
		ans+=`
		{
			"points":[
		`;
		let firstPoint=true;
		for(let i=0;i<arrayOfPoints.length;i++)if(arrayOfPoints[i].getType()=='Point'){
			arrayOfPoints[i].count=i;
			ans+=`
				${firstPoint?'':','}{
					"x":${arrayOfPoints[i].getX()},
					"y":${arrayOfPoints[i].getY()},
					"power":${arrayOfPoints[i].getPower()}
				}
			`;
			firstPoint=false;
		}
		ans+=`
			],
			"lines":[
		`;
		function findPoint(point){
			return point.count;
		}
		let firstLine=true;
		for(let i=0;i<arrayOfLines.length;i++){
			if(selectedPoints.has(arrayOfLines[i].getPointFrom())&&selectedPoints.has(arrayOfLines[i].getPointTo())){
				ans+=`
					${firstLine?'':','}{
						"pointFrom":${findPoint(arrayOfLines[i].getPointFrom())},
						"pointTo":${findPoint(arrayOfLines[i].getPointTo())},
						"notGate":${arrayOfLines[i].getNotGate()}
					}
				`;
				firstLine=false;
			}
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
	stringToGraph(window.localStorage.graph);
	window.onmousewheel=function(event){
		let step=-event.deltaY/100;
		for(let i=0;i<step;i++){
			points.forEach(function(point){
				point.moveTo((point.getX()-event.clientX)*0.9+event.clientX,(point.getY()-event.clientY)*0.9+event.clientY);
			});
		}
		for(let i=0;i<-step;i++){
			points.forEach(function(point){
				point.moveTo((point.getX()-event.clientX)/0.9+event.clientX,(point.getY()-event.clientY)/0.9+event.clientY);
			});
		}
	}
});