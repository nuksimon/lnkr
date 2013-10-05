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
	$('#background').mousedown(backgroundDragMouseDown);
	$('#background').mouseup(backgroundDragMouseUp);

};

var bdStartX = 0;
var bdStartY = 0;

var bdWindowStartX = 0;
var bdWindowStartY = 0;

function backgroundDragMouseDown(){
	//alert("backgroundDragMouseDown");
	
	var e = window.event; 
	//bdStartX = e.clientX;
	//bdStartY = e.clientY;
	bdStartX = e.pageX;
	bdStartY = e.pageY;
	
	bdWindowStartX = $('#window1000').position().left;
	bdWindowStartY = $('#window1000').position().top;
	
	$('#footerInfo').html("Left: " + bdStartX + ", Top: " + bdStartY);
	//alert("s");
	
	$('#background').mousemove(backgroundDragMouseMove);

};

function backgroundDragMouseUp(){
	//alert("backgroundDragMouseUp");
	
	//$('#background').mousemove(null);
	$('#background').unbind("mousemove");

};

function backgroundDragMouseMove(){
	var e = window.event;
	
	$('#footerInfo').html("Left: " + (bdStartX - e.pageX) + ", Top: " + (bdStartY - e.pageY));
	$('#window1000').offset({left: bdWindowStartX + bdStartX - e.clientX, top: bdWindowStartY + bdStartY - e.clientY});

};
