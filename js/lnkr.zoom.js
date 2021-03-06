/*	Lnkr: an interactive browser based mind map for wikipedia
	lnkr.zoom.js: 
		Functions related to the zoom and arrangement features in the UI
    
	Copyright (C) 2013  Simon Nuk

	
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


var zoom_level = 1;
var zoom_level_min = 1;
var zoom_level_max = 4;
var zoom_detail_max = 2;
var zoomScale = [1,0.75,0.55,0.4];			//px scaling for each zoom level								
var pxArrange = {leftStart: 20, topStart: 50, left: 300, top: 350};		//px offsets for arrange functions



document.getElementById('background').addEventListener("mousewheel",function(){
	
	var e = window.event
	//var mouseX = e.pageX - $(window).scrollLeft();
	//var mouseY = e.pageY - $(window).scrollTop();
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var zoom_pos_scale = 0.75;
	var zoom_pos_offsetX = 50;
	var zoom_pos_offsetY = 50;
	//alert($(window).height() + " : " + $(window).width());
	
	if (e.wheelDelta < 0) {
		if (zoom_level < zoom_level_max){
			zoom_level = zoom_level + 1;
			//zoom_out();
			$('.window').not('.noZoom').each(function() {
				$(this).offset({left: ($(this).offset().left ) * zoom_pos_scale + zoom_pos_offsetX});
				$(this).offset({top: ($(this).offset().top)  * zoom_pos_scale + zoom_pos_offsetY});
				//alert($(this).offset().left + " : " + $(this).offset().top);
			});
		}
	} else {
		if (zoom_level > zoom_level_min){
			zoom_level = zoom_level - 1;
			//zoom_in();
			$('.window').not('.noZoom').each(function() {
				$(this).offset({left: ($(this).offset().left - zoom_pos_offsetX)  / ( zoom_pos_scale)});
				$(this).offset({top:($(this).offset().top - zoom_pos_offsetY) / ( zoom_pos_scale) });
			});
		}
	}
	
	//alert(e.pageX + " : " + e.pageY );
	
	if(zoom_level==1){
		$('.window').not('.noZoom').removeClass('window_zoom2 window_zoom3').addClass('window_zoom1');
		$('.cImage').not('.noZoom').removeClass('img_zoom2 img_zoom3').addClass('img_zoom1');
	}
	else if(zoom_level==2){
		$('.window').not('.noZoom').removeClass('window_zoom1 window_zoom3').addClass('window_zoom2');
		$('.cImage').not('.noZoom').removeClass('img_zoom1 img_zoom3').addClass('img_zoom2');
	}
	else if(zoom_level==3){
		$('.window').not('.noZoom').removeClass('window_zoom4 window_zoom2').addClass('window_zoom3');
		$('.cImage').not('.noZoom').removeClass('img_zoom4 img_zoom2').addClass('img_zoom3');
	}
	else if(zoom_level==4){
		$('.window').not('.noZoom').removeClass('window_zoom3 window_zoom2').addClass('window_zoom4');
		$('.cImage').not('.noZoom').removeClass('img_zoom3 img_zoom2').addClass('img_zoom4');
	}
	

	jsPlumb.repaintEverything();
},true);


function getZoom() {
	return zoom_level;
};


/*
function zoom_in(){
	$('.window').animate({
		height:'+=20px',
		width:'+=20px',
		fontSize:'+=0.1em'
	  },0);
	
	$('.cImage').animate({
		height:'+=20px',
		width:'+=20px'
	  },0);
	  
};

function zoom_out(){
	$('.window').animate({
		height:'-=20px',
		width:'-=20px',
		fontSize:'-=0.1em'
	  },0);
	$('.cImage').animate({
		height:'-=20px',
		width:'-=20px'
	  },0);
	 
};
*/



//------------------- Background Drag ----------------------------------------------
function backgroundDragInit(){
	//map the event handlers to the DOM element
	$('#background').mousedown(backgroundDragMouseDown);
	$('#background').mouseup(backgroundDragMouseUp);
};

//global var for mouse starting position on a background drag event
var bdStartX = 0;	
var bdStartY = 0;

//global array for all window elements' starting position and ids
var bdWindowStart = [];


//Dragging starts: collect starting positions and place them in global variables
function backgroundDragMouseDown(){
	
	//capture mouse event starting position
	var e = window.event; 
	bdStartX = e.pageX;		//mouse start left/x
	bdStartY = e.pageY;		//mouse start top/y
	
	//grab the id's and starting positions for all active windows
	$('.window').each(function() {
		var windowId = $(this).attr('id');
		var bdWindowStartObj = {
				id: windowId,
				x: $('#'+windowId).position().left,
				y: $('#'+windowId).position().top
			};
		bdWindowStart.push(bdWindowStartObj);	//place the data in an object and add it to the global array
	});
	

	
	//enable the drag event
	$('#background').mousemove(backgroundDragMouseMove);
	$('#backgroundFill').css('cursor', 'move');			//change the cursor to move
};


//Dragging stop: perform cleanup tasks
function backgroundDragMouseUp(){
	
	$('#background').unbind("mousemove");			//disable the drag event
	$('#backgroundFill').css('cursor', 'default');	//change the cursor back to normal
	bdWindowStart = [];								//empty the array of start positions
	jsPlumb.repaintEverything();					//redraw the links
};


//Dragging in action: update the position of all the windows
function backgroundDragMouseMove(){
	var e = window.event;	//capture mouse event data
	
	//update the position on each window in the bdWindowStart array
	for (i = 0, l = bdWindowStart.length; i < l; i++) {
		var newXpos = bdWindowStart[i].x - (bdStartX - e.pageX);
		var newYpos = bdWindowStart[i].y - (bdStartY - e.pageY);
		$('#'+bdWindowStart[i].id).offset({left: newXpos, top: newYpos});
	}
	
	jsPlumb.repaintEverything();		//redraw the links
};



// --------------------- Arrange Windows -------------------------------------

// grid
function arrangeWindowGrid(){

	var gridWidth = 3;		//# of windows across
	var i = 0;
	//var zoomScale = [1,0.75,0.55,0.4];
	
	$('.window').each(function()
	{
		var posTop = (pxArrange.topStart + Math.floor(i/gridWidth) * pxArrange.top) * zoomScale[zoom_level-1];
		var postLeft = (pxArrange.leftStart + (i % gridWidth) * pxArrange.left) * zoomScale[zoom_level-1];
		$(this).offset({top: posTop , left: postLeft});
		i++;
	});
	
	ga('send', 'event', 'menu', 'arrange', 'grid');
};


// chronological
function arrangeWindowChrono(){

	var arrWindow = [];
	var objWindow;
	
	//find the start date of each window
	$('.window').each(function()
	{
		var wId = $(this).attr('id');
		var wStart = $(this).find('.mdStart:first').text();
		
		if (wStart == '' || wStart == null){
			wStart = $(this).find('.mdEnd:first').text();	//use the end date if no start date
			if (wStart == '' || wStart == null){
				wStart = -1;
			}
		}
		//alert(wId + ' - "' + wStart + '"');
		objWindow = {id: wId, start: wStart};
		arrWindow.push(objWindow);
	});
	
	//chrononlogical sort
	arrWindow.sort(SortByChrono);
	
	for (i = 0, l = arrWindow.length; i < l; i++) {
		var posTop = (pxArrange.topStart) * zoomScale[zoom_level-1];
		var postLeft = (pxArrange.leftStart + (i * pxArrange.left)) * zoomScale[zoom_level-1];
		$('#' + arrWindow[i].id).offset({top: posTop , left: postLeft});
	}
	
	ga('send', 'event', 'menu', 'arrange', 'chrono');
}

//sort the "weight" field in the array of links
function SortByChrono(a, b){
	var aDate = new Date(a.start);
	var bDate = new Date(b.start);
	
	return ((aDate > bDate) ? 1 : ((aDate < bDate) ? -1 : 0));
	//return ((a.start > b.start) ? 1 : ((a.start < b.start) ? -1 : 0));
};