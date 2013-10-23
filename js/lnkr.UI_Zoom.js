//UI zooming functions

//enable draggable on the entire class
//$( "#windowContainer" ).draggable();
//jsPlumb.draggable(jsPlumb.getSelector("#windowContainer"), { cancel: '.scrollBarY' });

var zoom_level = 1;
var zoom_level_min = 1;
var zoom_level_max = 4;
window.addEventListener("mousewheel",function(){
	
	var e = window.event
	//var mouseX = e.pageX - $(window).scrollLeft();
	//var mouseY = e.pageY - $(window).scrollTop();
	var mouseX = e.pageX;
	var mouseY = e.pageY;
	var zoom_pos_scale = 0.6;
	var zoom_pos_offsetX = 50;
	var zoom_pos_offsetY = 50;
	//alert($(window).height() + " : " + $(window).width());
	
	if (e.wheelDelta < 0) {
		if (zoom_level < zoom_level_max){
			zoom_level = zoom_level + 1;
			//zoom_out();
			$('.window').each(function() {
				$(this).offset({left: ($(this).offset().left ) * zoom_pos_scale + zoom_pos_offsetX});
				$(this).offset({top: ($(this).offset().top)  * zoom_pos_scale + zoom_pos_offsetY});
				//alert($(this).offset().left + " : " + $(this).offset().top);
			});
			/*
			$('.window').each(function() {
				$(this).position({left: ($(this).position().left ) * zoom_pos_scale});
				$(this).position({top: ($(this).position().top )  * zoom_pos_scale});
				//alert($(this).offset().left + " : " + $(this).offset().top);
			});*/
		}
	} else {
		if (zoom_level > zoom_level_min){
			zoom_level = zoom_level - 1;
			//zoom_in();
			$('.window').each(function() {
				$(this).offset({left: ($(this).offset().left - zoom_pos_offsetX)  / ( zoom_pos_scale)});
				$(this).offset({top:($(this).offset().top - zoom_pos_offsetY) / ( zoom_pos_scale) });
			});
			/*
			$('.window').each(function() {
				$(this).position({left: ($(this).position().left ) / zoom_pos_scale});
				$(this).position({top: ($(this).position().top )  / zoom_pos_scale});
				//alert($(this).offset().left + " : " + $(this).offset().top);
			});*/
		}
	}
	
	//alert(e.pageX + " : " + e.pageY );
	
	if(zoom_level==1){
		$('.window').removeClass('window_zoom2 window_zoom3').addClass('window_zoom1');
		$('.cImage').removeClass('img_zoom2 img_zoom3').addClass('img_zoom1');
	}
	else if(zoom_level==2){
		$('.window').removeClass('window_zoom1 window_zoom3').addClass('window_zoom2');
		$('.cImage').removeClass('img_zoom1 img_zoom3').addClass('img_zoom2');
	}
	else if(zoom_level==3){
		$('.window').removeClass('window_zoom4 window_zoom2').addClass('window_zoom3');
		$('.cImage').removeClass('img_zoom4 img_zoom2').addClass('img_zoom3');
	}
	else if(zoom_level==4){
		$('.window').removeClass('window_zoom3 window_zoom2').addClass('window_zoom4');
		$('.cImage').removeClass('img_zoom3 img_zoom2').addClass('img_zoom4');
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
	
	//TEST: write offset data to the footer
	$('#footerInfo').html("Left: " + bdStartX + ", Top: " + bdStartY);
	
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
	
	//TEST: write offset data to the footer
	$('#footerInfo').html("Left: " + (bdStartX - e.pageX) + ", Top: " + (bdStartY - e.pageY));
	
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

	//default spacing
	var pxLeftStart = 20;	//starting offset
	var pxTopStart = 80;
	var pxLeft = 350;		//incremental offset
	var pxTop = 450;
	var gridWidth = 3;		//# of windows across
	var i = 0;
	var zoomScale = [1,0.75,0.55,0.4]
	
	$('.window').each(function()
	{
		var posTop = (pxTopStart + Math.floor(i/gridWidth) * pxTop) * zoomScale[zoom_level-1];
		var postLeft = (pxLeftStart + (i % gridWidth) * pxLeft) * zoomScale[zoom_level-1];
		$(this).offset({top: posTop , left: postLeft});
		i++;
	});

};
