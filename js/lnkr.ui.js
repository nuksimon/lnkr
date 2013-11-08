var newWindowCount = 1000;	//starting window counter
var maxLinks = 10;			//max number of links to include in the link table

jsPlumb.bind("ready", function() {

	document.onselectstart = function () { return false; };				

	jsPlumb.setRenderMode(jsPlumb.SVG);
	jsPlumbDemo.init();
});


;(function() {
	
	window.jsPlumbDemo = {
			
		init : function() {			

			var color = "gray";

			jsPlumb.importDefaults({
				// notice the 'curviness' argument to this Bezier curve.  the curves on this page are far smoother
				// than the curves on the first demo, which use the default curviness value.			
				Connector : [ "Bezier", { curviness:2 } ],
				//DragOptions : { cursor: "pointer"},
				PaintStyle : { strokeStyle:color, lineWidth:2 },
				EndpointStyle : { radius:2, fillStyle:color },
				HoverPaintStyle : {strokeStyle:"#ec9f2e", lineWidth:5 },
				EndpointHoverStyle : {fillStyle:"#ec9f2e" },			
				Anchors :  [ "BottomCenter", "TopCenter", "LeftMiddle", "RightMiddle" ]
			});
			
				
			// declare some common values:
			var arrowCommon = { foldback:0.7, fillStyle:color, width:14 },
				// use three-arg spec to create two different arrows with the common values:
				overlays = [
					[ "Arrow", { location:0.7 }, arrowCommon ],
					[ "Arrow", { location:0.3, direction:-1 }, arrowCommon ]
				];
			
			//setup the demo connections
			/*
			jsPlumb.connect({source:"window1", target:"window6", anchor:"AutoDefault", detachable:false, reattach:true});
			jsPlumb.connect({source:"window6", target:"window5", anchor:"AutoDefault", detachable:false, reattach:true});
			jsPlumb.connect({source:"window1", target:"window5", anchor:"AutoDefault", detachable:false, reattach:true});
			*/
			
			//enable draggable on the entire class
			jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
			
			
			//$( ".window" ).resizable();
		}
	};
	
})();



//handle enter key on search
$(document).keypress(function(e) {
    if(e.which == 13) {
        $('#searchFormButton').click();
    }
});
function notEnterKey(e){
	//false if it is the enter key (overrides the submit form)
	if(e.which == 13) { return false;} 
	else { return true;}
};



//action from Search box to get a new article
function createWindowFromSearch()
{
	//get the data source from the drop menu
	var dataSourceName = $('#dropSource option:selected').text();	
	var dataSource = getSourceURL(dataSourceName);
	
	//get the article title from the search box
	var windowTitle = document.getElementById('searchFormText').value;

	//create the new window (sourceWindowId = 0 when from search)
	createWindow(dataSource, windowTitle, 0);
}




//makes a new window with an article
function createWindow(dataSource, windowTitle, sourceWindowId)
{
	/*
		dataSource = Data Source URL, eg: http://en.wikipedia.org
		windowTitle = Window/Article name from search or link
		sourceWindowId = WindowId of the window you clicked the link from. 0 if from Search
	*/
	
	//setup the new window object for the DOM
	var newWindowId = 'window' + newWindowCount;
	var newWindow=document.createElement('div');	//movable window object
	newWindow.className = 'window  window_zoom' + zoom_level;
	newWindow.id = newWindowId;
	newWindow.onmouseover= function() {hoverWindowStart($(this));};
	newWindow.onmouseout= function() {hoverWindowStop($(this));};
	var windowBody = "";	//add all body elements to this var
	
	
	//find an available position on the screen
	var windowPos = findWindowPosition(sourceWindowId);
	newWindow.style.left = windowPos.left+"px";
	newWindow.style.top = windowPos.top+"px";
	
	
	
	//add the new window to the DOM
	document.body.appendChild(newWindow);
	jsPlumb.draggable(jsPlumb.getSelector('.window'), { cancel: '.scrollBarY' });	//refresh the draggable property
	newWindowCount = newWindowCount + 1				//increment window counter
	
	
	//Build the window body in HTML and Append to the Window Element
	windowBody = formatWindow(dataSource, windowTitle, newWindow.id);
	$('#'+newWindowId).append(windowBody);
	
	
	
	//-------------------------------
	
	//wiki search api
	//ex: url = "http://en.wikipedia.org" + "/w/api.php" + "?action=parse&format=json&callback=?";
	var url = dataSource + getSourceAPIfromURL(dataSource) + "?action=parse&format=json&callback=?";
	
	//get the full article
	$.getJSON(url, { 
		page: windowTitle, 
		prop:"text|images", 
		uselang:"en",
		section:0,
		redirects:true
	}, function(data) {
		
		
		//Add Title
		$('#'+newWindowId).find('h1').text(data['parse']['title']);
		$('#'+newWindowId).find('.loadWheel').remove();				//remove the loading wheel
			
		// Add Image
		var imgHTML = $('<div>'+data.parse.text['*']+'</div>').find('img');		
		$(imgHTML).each( function(){
			//take the first "large" image (i.e. skip the wikipeadia icons)			
			if( $(this).attr('width') >= 60 ) {
				windowBody = '<img class="cImage img_zoom' + zoom_level +'" src="http:' + $(this).attr('src') + '" title="' + windowTitle +'"/>';
				$('#'+newWindowId).find('.cImage').append(windowBody);
				return false;
			};
		});
		
	
		
		// parse first paragraph
		wikipage = $('<div>'+data.parse.text['*']+'</div>').children('p:first');
		if ($(wikipage).find('#coordinates').length > 0){								//p:first is used by the coords, take the next
			wikipage = $('<div>'+data.parse.text['*']+'</div>').children('p:nth(1)');
		}
		wikipage.find('sup').remove();			//removes reference tags
		wikipage.find('.error').remove();		//removes cite error message
		wikipage.find('a').each(function() {
			//replace hyperlinks with internal links <lnk>
			var linkName = $(this).attr('title');
			var linkText = $(this).html();
			$(this).replaceWith(buildLnk(linkName, newWindowId, linkText));
		});
	
		//append to the Summary container
		windowBody = '<p>' + $(wikipage).html() + '</p>';
		$('#'+newWindowId).find('.cSummary').append(windowBody);	
		
		//get the source url and append to the Summary
		var titleURL = windowTitle.replace(/\s/g, "_");		//turn spaces into underscores for the url
		windowBody = '<br><p>Source: <a href="' + dataSource + '/wiki/' + titleURL + '" target="_blank">' + dataSource + '</p>';
		$('#'+newWindowId).find('.cSummary').append(windowBody);
		
		
		//parse the Links and append
		var arrLink = [];
		arrLink = parseLinks(data, dataSource, newWindowId);			//array of link objects
		var outputHTML = formatLinks(arrLink);							//turn into a table
		$('#'+newWindowId).find('.cLinks').append(outputHTML);
		
		//parse the MetaData and append
		var metaData = [];
		metaData = parseMetaData(data, newWindowId)
		outputHTML = formatMetadata(metaData);
		$('#'+newWindowId).find('.cMetaData').append(outputHTML);
		
		
		
		//Draw internal links to existing windows
		for (i = 0, l = Math.min(arrLink.length, maxLinks); i < l; i++) {
			drawLinksByName(arrLink[i].name, newWindowId, false);			
		}
		//Draw external links to this window
		drawExternalLinksByName(windowTitle, newWindowId);	
		
		//add to the timeline
		var startDate = $.grep(metaData, function(e){ return e.tag == 'Start'; });
		var endDate = $.grep(metaData, function(e){ return e.tag == 'End'; });
		if (startDate.length == 0){
			startDate = '';
		} else {
			startDate = startDate[0].val;
		}
		if (endDate.length == 0){
			endDate = '';
		} else {
			endDate = endDate[0].val;
		}
		
		
		timelineAdd(windowTitle, startDate, endDate);

	});
};


//------------------------- Position ---------------------------------------------------

function findWindowPosition(sourceWindowId)
{
	//default value from search
	var windowPos = {
			left: 20,
			top: 80
		};
	
	var pxLeft = 300;
	var pxTop = 450;
	var spaceLeft = new Array(pxLeft, pxLeft, 0, -1*pxLeft, -1*pxLeft, -1*pxLeft, 0, pxLeft);
	var spaceTop = new Array(0, pxTop, pxTop, pxTop, 0, -1*pxTop, -1*pxTop, -1*pxTop);
	
	
	if (sourceWindowId != 0){
		//get the position from the source
		var pos = $('#'+sourceWindowId).position();
		windowPos.left = pos.left + spaceLeft[0];
		windowPos.top = pos.top + spaceTop[0];
		
		//check if the spot is filled, try the next spot if it is
		var i = 1
		while (isWindowOverlap(windowPos.top,windowPos.left) == true && i < 8){
			windowPos.left = Math.max(pos.left + spaceLeft[i],0);
			windowPos.top = Math.max(pos.top + spaceTop[i],0);
			i++;
		}
	}
	return windowPos;
};

//check all windows to see if they overlap with the coordinates
function isWindowOverlap(top,left)
{
	//area to check for existing windows
	var sizeLeft = 290;
	var sizeTop = 380;
	
	var overlap = false
	
	$('.window').each(function()
	{
		var pos = $(this).position();
		//alert(left + ", " + top + "\n" + pos.left + ", " + pos.top);
		//search in the rectangle (sizeLeft x sizeTop) below the top left corner
		if( (left >= pos.left && left <= pos.left + sizeLeft && top >= pos.top && top <= pos.top + sizeTop) ||
			(pos.left >= left && pos.left <= left + sizeLeft && pos.top >= top && pos.top <= top + sizeTop) ) {
				overlap = true;  //windows overlap 
			}
	});
	
	return overlap;
};



//------------------------- Buttons ----------------------------------------------------

function closeWindow(el)
{	//close the active window and remove from timeline
	deleteTimelineIndex($(el).find('h1:first').text());	//pass the windowTitle
	
	jsPlumb.detachAllConnections(el.attr('id'));
	el.remove();
};


function closeBrowserAlert(){
	//alert('click');
	$('#browserAlert').remove();
};

//hide the given window (only used for About window)
function hideWindow(elId){
	$(elId).css('display', 'none');
};

function showWindow(elId){
	$(elId).css('display', 'inline');
	//alert();
};


//---------------- Display UI control ------------------------------------------------

//--- Change the display type for A GIVEN element
function display1(el)
{	//Title only (display1)
	el.find('.display1').css('display', 'block');
	el.find('.display2').css('display', 'none');
	el.find('.display3').css('display', 'none');
	jsPlumb.repaint(el);
};
function display2(el)
{	//Title (display1) & image (display2)
	el.find('.display1').css('display', 'block');
	el.find('.display2').css('display', 'inline');
	el.find('.display3').css('display', 'none');
	jsPlumb.repaint(el);
};
function display3(el)
{	//all
	el.find('.display1').css('display', 'block');
	el.find('.display2').css('display', 'inline');
	el.find('.display3').css('display', 'inline');
	jsPlumb.repaint(el);
};
function display4(el)
{	//image only
	el.find('.display1').css('display', 'none');
	el.find('.display2').css('display', 'inline');
	el.find('.display3').css('display', 'none');
	jsPlumb.repaint(el);
};


//--- Change the display type for ALL elements
function display1_all()
{	//Title only (display1)
	$(document).find('.display1').css('display', 'block');
	$(document).find('.display2').css('display', 'none');
	$(document).find('.display3').css('display', 'none');
	jsPlumb.repaintEverything();
};
function display2_all()
{	//Title (display1) & image (display2)
	$(document).find('.display1').css('display', 'block');
	$(document).find('.display2').css('display', 'inline');
	$(document).find('.display3').css('display', 'none');
	jsPlumb.repaintEverything();
};
function display3_all()
{	//all
	$(document).find('.display1').css('display', 'block');
	$(document).find('.display2').css('display', 'inline');
	$(document).find('.display3').css('display', 'inline');
	jsPlumb.repaintEverything();
};
function display4_all()
{	//image only (display2)
	$(document).find('.display1').css('display', 'none');
	$(document).find('.display2').css('display', 'inline');
	$(document).find('.display3').css('display', 'none');
	jsPlumb.repaintEverything();
};


//--- Toggle the info sections
function displaySummary(el)
{	//toggle Summary
	if(el.find('.cSummary').css('display') == 'none'){
		el.find('.cSummary').css('display', 'block');
	} else {
		el.find('.cSummary').css('display', 'none');
	}
};
function displayLinks(el)
{	//toggle Links
	if(el.find('.cLinks').css('display') == 'none'){
		el.find('.cLinks').css('display', 'block');
	} else {
		el.find('.cLinks').css('display', 'none');
	}
};
function displayMetaData(el)
{	//toggle MetaData
	if(el.find('.cMetaData').css('display') == 'none'){
		el.find('.cMetaData').css('display', 'block');
	} else {
		el.find('.cMetaData').css('display', 'none');
	}
};



//------------------------ Window hover graphics ----------------------------
function hoverWindowStart(el)
{
	//turn on link hover colours
	jsPlumb.select({source:el.attr('id')}).setHover(true);
	jsPlumb.select({target:el.attr('id')}).setHover(true);
	
	//display the buttons
	$(el).find('.cButton').css('display', 'inline');
	
	//display the details
	$(el).find('.display3').css('display', 'inline');
	
	//turn on timeline hover colours
	var windowTitle = $(el).find('h1:first').text();
	var timelineElement = getTimelineElementContainer(windowTitle);
	$(timelineElement).addClass('timeline-hover');
};

function hoverWindowStop(el)
{
	//turn off hover colours
	jsPlumb.select().setHover(false);
	
	//hide the buttons
	$(el).find('.cButton').css('display', 'none');
	
	//hide the details
	$(el).find('.display3').css('display', 'none');
	
	//turn off timeline hover colours
	var windowTitle = $(el).find('h1:first').text();
	var timelineElement = getTimelineElementContainer(windowTitle);
	$(timelineElement).removeClass('timeline-hover');
};

//return the timeline element container
function getTimelineElementContainer(windowTitle){
	var timelineElement = $('.timeline-event').find('div:matchCi('+windowTitle+'):first');
	if (timelineElement.text() == ''){
		timelineElement = $('.timeline-event-dot-container').find('div:matchCi('+windowTitle+'):first').parent();
	}
	return timelineElement;
};

//custom jquery selector:  exact match (case insensitive) 
$.expr[":"].matchCi = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) == 0;
    };
});




//---------------------- link processing ----------------------------------------

function toggleLinksByName(destArticleName, window_id){
/*	FUNCTION:
	toggle link drawing on click using the article name.  
	create a new window if it does not exist

	INPUT:
	articleName
	destArticleName = title of the destination article we are searching for
	window_id = id of the source window
	
	OUTPUT:
	foundArticle = boolean did we find the article
*/		
	var foundArticle = false;		//flag - have we found the article on the screen?
	foundArticle = drawLinksByName(destArticleName, window_id, true);		//draw the links between the article, toggle if necessary
	
	if (foundArticle == false){
		//article does not exist on the screen, we should add it to the screen and draw links
		var dataSource = $('#'+window_id).find('.dataSource').text();
		createWindow(dataSource, destArticleName, window_id);
		drawLinksByName(destArticleName, window_id, true);	//required for hyperlinks, but not weighted links
	}
	
};



function drawLinksByName(destArticleName, window_id, flagDetatch){
/*	FUNCTION:
	search all open windows for the destArticleName 
	draw a link between the articles on a match

	INPUT:
	destArticleName = title of the destination article we are searching for
	window_id = id of the source window
	flagDetach = True allows link toggle, False forces a connection
	
	OUTPUT:
	foundArticle = boolean did we find the article
*/
	var foundArticle = false;					//flag - have we found the article on the screen?
	$('.window').find('h1').each(function()		//find the article name for the destination article in all open windows
	{
		var destWindow_id = $(this).parents('.window').attr('id');	//link destination Window ID
		var destArticleName_i = $(this).text();				//link destination article name found in search
		var foundConnected = false;					//flag - did we find that the articles were already connected?
		
		//match
		if(destArticleName_i == destArticleName){
			//check if source/target connection exists, then detach
			var connectionList = jsPlumb.getConnections({source:window_id, target:destWindow_id});
			$(connectionList).each(function()
			{
				if (flagDetatch == true){
					jsPlumb.detach(this);
				}
				foundConnected = true;
			});
			//check if target/source connection exists, then detach
			connectionList = jsPlumb.getConnections({source:destWindow_id, target:window_id});
			$(connectionList).each(function()
			{
				if (flagDetatch == true){
					jsPlumb.detach(this);
				}
				foundConnected = true;
			});
			
			//connect the windows if they were not previously connected
			if (foundConnected == false){
				jsPlumb.connect({source:window_id, target:destWindow_id, anchor:"AutoDefault", detachable:false, reattach:true});
				//enable draggable on the entire class
				jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
				
			}
			
			foundArticle = true;
		} else {
			//alert("FAIL sa:" + Article_id +"  da:"+destArticle_id +"  sw:"+window_id+"  dw:"+destWindow_id);
		}
	});
	
	//enable draggable on the entire class
	jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
	return foundArticle;
};



function drawExternalLinksByName(articleName, windowId){
/*	FUNCTION:
	find any links from existing articles to the new article
	draw the links

	INPUT:
	articleName = title of the source window we are connecting to
	windowId = id of the source window

	OUTPUT: none
*/	
	$('.window').find('.linkName').each(function()		//get the article name for each open window
	{
		var iArticleName = $(this).text();			//iterating Article Name
		var iWindowId = $(this).parents('.window').attr('id');	//iterating Window
		
		if(iWindowId != windowId){		//not a self match
			if(iArticleName == articleName){
				//found a match between source and destination links, draw the connection
				jsPlumb.connect({source:windowId, target:iWindowId, anchor:"AutoDefault", detachable:false, reattach:true});
			}
		}
	});

	//enable draggable on the entire class
	jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
};







//------------ format data -----------------------------------------------------

function formatMetadata(metadata)
{
	//INPUT:	array of metadata objects {tag, val}
	//OUTPUT: html table with tag-value pairs for the MetaData section
	
	var outputHTML = '<table border=1>';
	for (i = 0, l = metadata.length; i < l; i++) {
		outputHTML += '<tr><th>' + metadata[i].tag + '</th>';
		outputHTML += '<td class="md' + metadata[i].tag + '">' + metadata[i].val + '</td></tr>';
	}
	outputHTML += '</table>';
	
	return outputHTML;
};


function formatLinks(arrLink)
{
	//INPUT:	array of link objects {name, lnk, weight, ...}
	//OUTPUT: html table with link-rank-weight pairs for the Links section
	
	var outputHTML = '<table border=1>';
	outputHTML += "<tr><th>name</th><th>rank</th><th>weight</th></tr>";
	for (i = 0, l = Math.min(arrLink.length, maxLinks); i < l; i++) {
		outputHTML += '<tr><td class="linkName">' + arrLink[i].lnk + "</td>";
		outputHTML +=  "<td>" + (i+1) + "</td>";
		outputHTML +=  "<td>" + arrLink[i].weight + "</td></tr>";
	}
	outputHTML += '</table>';
	
	return outputHTML;
};


function formatWindow(dataSource, windowTitle, windowId)
{
	//builds the window skeleton in HTML

	//Add Buttons
	var windowBody = '<div class="cButton">';
	windowBody += '<img onclick="display1($(this).parents(&quot;.window&quot;));" class="buttonWindow" src="img/view_title.png" />';
	windowBody += '<img onclick="display4($(this).parents(&quot;.window&quot;));" class="buttonWindow" src="img/view_icon.png" />';
	windowBody += '<img onclick="display2($(this).parents(&quot;.window&quot;));" class="buttonWindow" src="img/view_icon_title.png" />';
	windowBody += '<img onclick="display3($(this).parents(&quot;.window&quot;));" class="buttonWindow" src="img/view_detail.png" />';
	windowBody += '<img class="cButtonClose" onclick="closeWindow($(this).parents(&quot;.window&quot;));" src="img/Button_Icon_Red.svg.png" />';
	windowBody += '</div>';
	
	//Add Image container
	windowBody += '<div class="cImage display2">';
	windowBody += '<img class="loadWheel img_zoom' + zoom_level +'" src="img/load_wheel.gif" />';
	windowBody += '</div>';
	
	//Add Title container
	windowBody += '<h1 class="display1"> Loading... </h1>';
	
	//Add Data Source info
	windowBody += '<div class="debugId dataSource">' + dataSource + '</div>';
	
	//Add test info
	windowBody += '<p class="debugId">Article Name: ' + windowTitle + '</p>';	
	windowBody += '<p class="debugId">Window Id: ' + windowId + '</p>';
	
	//Add container for Summary and Links
	windowBody += '<div class="display3">';
	windowBody += 	'<h2 onclick="displaySummary($(this).parents(&quot;.window&quot;))">Summary:</h2>';		//Summary
	windowBody += 	'<div class="cSummary scrollBarY">';
	windowBody += 	'</div>';
	windowBody += 	'<h2 onclick="displayLinks($(this).parents(&quot;.window&quot;))">Links:</h2>';			//Links
	windowBody += 	'<div class="cLinks scrollBarY">';
	windowBody += 	'</div>';
	windowBody += 	'<h2 onclick="displayMetaData($(this).parents(&quot;.window&quot;))">MetaData:</h2>';			//Meta Data
	windowBody += 	'<div class="cMetaData scrollBarY">';
	windowBody += 	'</div>';
	windowBody += '</div>';		//close container for Summary and Links
	
	return windowBody;
};