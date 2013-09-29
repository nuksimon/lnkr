var newWindowCount = 1000;

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
				Connector : [ "Bezier", { curviness:10 } ],
				//DragOptions : { cursor: "pointer"},
				PaintStyle : { strokeStyle:color, lineWidth:5 },
				EndpointStyle : { radius:2, fillStyle:color },
				HoverPaintStyle : {strokeStyle:"#ec9f2e" },
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
			jsPlumb.connect({source:"window1", target:"window6", anchor:"AutoDefault", detachable:false, reattach:true});


			jsPlumb.connect({source:"window6", target:"window5", anchor:"AutoDefault", detachable:false, reattach:true});
			jsPlumb.connect({source:"window1", target:"window5", anchor:"AutoDefault", detachable:false, reattach:true});
			
			//enable draggable on the entire class
			jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
			
			
			//$( ".window" ).resizable();
		}
	};
	
})();




//action from Search box to get a new article
function createWindowFromSearch()
{
	//get the data source and id from the drop menu
	var dataSourceId = $('#dropSource option:selected').attr('value');	
	var dataSource = $('#dropSource option:selected').text();	

	//get the article title from the search box
	var windowTitle = document.getElementById('searchFormText').value;

	//create the new window
	createWindow(dataSourceId, dataSource, windowTitle);
}




//makes a new window with an article
function createWindow(dataSourceId, dataSource, windowTitle)
{
	//setup the new window object for the DOM
	var newWindowId = 'window' + newWindowCount;
	var newWindow=document.createElement('div');	//movable window object
	newWindow.className = 'window  window_zoom' + zoom_level;
	newWindow.id = newWindowId;
	newWindow.onmouseover= function() {hoverLinkStart($(this));};
	newWindow.onmouseout= function() {hoverLinkStop($(this));};
	var windowBody = "";	//add all body elements to this var
	
	
	//add the new window to the DOM
	document.body.appendChild(newWindow);
	jsPlumb.draggable(jsPlumb.getSelector('.window'), { cancel: '.scrollBarY' });	//refresh the draggable property
	newWindowCount = newWindowCount + 1				//increment window counter
	
	//Add Buttons
	windowBody += '<div class="cButton">';
	windowBody += '<img onclick="display1($(this).parents(&quot;.window&quot;));" class="cButtonD1" src="img/circle-icon.png" />';
	windowBody += '<img onclick="display2($(this).parents(&quot;.window&quot;));" class="cButtonD2" src="img/circle-icon.png" />';
	windowBody += '<img onclick="display3($(this).parents(&quot;.window&quot;));" class="cButtonD3" src="img/circle-icon.png" />';
	windowBody += '<img class="cButtonClose" onclick="closeWindow($(this).parents(&quot;.window&quot;));" src="img/Button_Icon_Red.svg.png" />';
	windowBody += '</div>';
	
	//Add Image container
	windowBody += '<div class="cImage display2">';
	windowBody += '<img class="loadWheel img_zoom' + zoom_level +'" src="img/load_wheel.gif" />';
	windowBody += '</div>';
	
	//Add Title container
	windowBody += '<h1> Loading... </h1>';
	
	//Add Data Source info
	windowBody += '<div class="debugId dataSource">' + dataSource + '</div>';
	windowBody += '<div class="debugId dataSourceId">' + dataSourceId + '</div>';
	
	//Add test info
	windowBody += '<p class="debugId">Data Source Id: ' + dataSourceId + '</p>';
	windowBody += '<p class="debugId">Article Name: ' + windowTitle + '</p>';	
	windowBody += '<p class="debugId">Window Id: ' + newWindow.id + '</p>';
	
	//Add container for Summary and Links
	windowBody += '<div class="display3">';
	windowBody += 	'<h2 onclick="displaySummary($(this).parents(&quot;.window&quot;))">Summary:</h2>';		//Summary
	windowBody += 	'<div class="cSummary scrollBarY">';
	windowBody += 	'</div>';
	windowBody += 	'<h2 onclick="displayLinks($(this).parents(&quot;.window&quot;))">Links:</h2>';			//Links
	windowBody += 	'<div class="cLinks scrollBarY">';
	windowBody += 	'</div>';
	windowBody += '</div>';		//close container for Summary and Links
	
	
	//Append to the Window Element
	$('#'+newWindowId).append(windowBody);
	
	
	//wiki search api
	var url = dataSource + "/w/api.php?action=parse&format=json&callback=?";
	
	//get the full article
	$.getJSON(url, { 
		page: windowTitle, 
		prop:"text|images", 
		uselang:"en",
		section:0
	}, function(data) {
		
		
		//Add Title
		$('#'+newWindowId).find('h1').text(data['parse']['title']);
		$('#'+newWindowId).find('.loadWheel').remove();				//remove the loading wheel
			
		// Add Image
		var imgHTML = $('<div>'+data.parse.text['*']+'</div>').find('img');		
		$(imgHTML).each( function(){
			//take the first "large" image (i.e. skip the wikipeadia icons)			
			if( $(this).attr('width') >= 60 ) {
				windowBody = '<img class="cImage img_zoom' + zoom_level +'" src="http:' + $(this).attr('src') + '" />';
				$('#'+newWindowId).find('.cImage').append(windowBody);
				return false;
			};
		});
		
	
		//get the article id from the database, process links
		//getArticleId(dataSourceId, windowTitle, newWindow.id);
		
		// parse first paragraph
		wikipage = $('<div>'+data.parse.text['*']+'</div>').children('p:first');
		wikipage.find('sup').remove();			//removes reference tags
		wikipage.find('a').each(function() {
			$(this)			  
			  .attr('href', dataSource+$(this).attr('href'))	//repoint the links to external wikipedia
			  .attr('target','wikipedia');
		});
		//alert($(wikipage).html());
	
		//append to the Summary container
		windowBody = '<p>' + $(wikipage).html() + '</p>';
		$('#'+newWindowId).find('.cSummary').append(windowBody);	
		
		
		//parse the links
		var arrLink = [];
		arrLink = parseArticle(data, dataSource);
		
		//Append the link results to the body
		var outputHTML = "<table border=1 >"; 
		outputHTML += "<tr><th>rank</th><th>weight</th><th>name</th></tr>";
		for (i = 0, l = Math.min(arrLink.length,10); i < l; i++) {
			outputHTML += '<tr onclick="toggleLinksByName(&quot;'+windowTitle+'&quot;, &quot;'+ arrLink[i].name +'&quot;, &quot;'+newWindowId+'&quot;)"><td>' 
						+ (i+1) + "</td><td>" + arrLink[i].weight + "</td>"
						+ '<td class="linkName">' + arrLink[i].name + "</td></tr>";
			drawLinksByName(arrLink[i].name, newWindowId, false);			//connect internal links to existing windows
		}
		outputHTML += "</table>";
		$('#'+newWindowId).find('.cLinks').append(outputHTML);
		
		
		drawExternalLinksByName(windowTitle, newWindowId);	//connect external links to this window
	});
	

};


//------------------------- Buttons ----------------------------------------------------


function closeWindow(el)
{
	jsPlumb.detachAllConnections(el.attr('id'));
	el.remove();
}



//---------------- Display UI control ---------------------------------------------

//--- Change the display type for a given element
function display1(el)
{
	//Title only (display1)
	el.find('.display2').css('display', 'none');
	el.find('.display3').css('display', 'none');
	jsPlumb.repaint(el);
};
function display2(el)
{
	//Title (display1) & image (display2)
	el.find('.display2').css('display', 'inline');
	el.find('.display3').css('display', 'none');
	jsPlumb.repaint(el);
};
function display3(el)
{
	//all
	el.find('.display2').css('display', 'inline');
	el.find('.display3').css('display', 'inline');
	jsPlumb.repaint(el);
};

//--- Change the display type for all elements
function display1_all()
{
	//Title only (display1)
	$(document).find('.display2').css('display', 'none');
	$(document).find('.display3').css('display', 'none');
	jsPlumb.repaintEverything();
};
function display2_all()
{
	//Title (display1) & image (display2)
	$(document).find('.display2').css('display', 'inline');
	$(document).find('.display3').css('display', 'none');
	jsPlumb.repaintEverything();
};
function display3_all()
{
	//all
	$(document).find('.display2').css('display', 'inline');
	$(document).find('.display3').css('display', 'inline');
	jsPlumb.repaintEverything();
};



function displaySummary(el)
{
	//toggle Summary
	if(el.find('.cSummary').css('display') == 'none'){
		el.find('.cSummary').css('display', 'block');
	} else {
		el.find('.cSummary').css('display', 'none');
	}
};

function displayLinks(el)
{
	//toggle Links
	if(el.find('.cLinks').css('display') == 'none'){
		el.find('.cLinks').css('display', 'block');
	} else {
		el.find('.cLinks').css('display', 'none');
	}
};


//------------------------ link hover graphics ----------------------------
function hoverLinkStart(el)
{
	//turn on hover colours
	jsPlumb.select({source:el.attr('id')}).setHover(true);
	jsPlumb.select({target:el.attr('id')}).setHover(true);
};

function hoverLinkStop(el)
{
	//turn off hover colours
	jsPlumb.select().setHover(false);
};


//---------------- link processing -------------------------------------

//return the articleID from the db and append it to the window
//also get the links and append to the window
function getArticleId(source_id, name, window_id){
	$.ajax({
	   url:'lnkr_db_api.php',
	   type: 'get',
	   data: 't=getArticleId&s=' + source_id + '&n=' + name,
	   datatype:'html',

	   success:function(data){			
			var ArticleData = '<div id=' +data+ ' class=article>';
			ArticleData += '<p class="debugId">Article Id: ' + data + '</p>';			//print for testing only
			$('#'+window_id).append(ArticleData); 
			
			//add the links
			getLinks(parseInt(data), window_id);
	   },
	   error:function(){
		  // code for error
		alert("error");
	   }
	 });
	
};


//return the links for an articleID from the db and append it to the window
function getLinks(article_id, window_id){
	$.ajax({
	   url:'lnkr_db_api.php',
	   type: 'get',
	   data: 't=getLinks&q=' + article_id,
	   datatype:'html',

	   success:function(data){
			//write the link data to the window
			$('#'+window_id).find('.cLinks').append(data); 
			
			//draw the links
			drawLinks(article_id, window_id);
			drawExternalLinks(article_id, window_id);
	   },
	   error:function(){
		  // code for error
		alert("error");
	   }
	 });
	
};



//toggle links on click using the article name.  create a new window if it does not exist
function toggleLinksByName(articleName, destArticleName, window_id){
		
	var foundArticle = false;		//flag - have we found the article on the screen?
	foundArticle = drawLinksByName(destArticleName, window_id, true);		//draw the links between the article, toggle if necessary
	
	if (foundArticle == false){
		//article does not exist on the screen, we should add it to the screen
		var dataSource = $('#'+window_id).find('.dataSource').text();
		var dataSourceId = $('#'+window_id).find('.dataSourceId').text();
		createWindow(dataSourceId, dataSource, destArticleName);
	}
	
};


//draw the links on a new article
function drawLinksByName(destArticleName, window_id, flagDetatch){
		
	var foundArticle = false;					//flag - have we found the article on the screen?
	$('.window').find('h1').each(function()		//find the article name for the destination article
	{
		var destWindow_id = $(this).parent().attr('id');	//link destination Window ID
		var destArticleName_i = $(this).text();				//link destination article name found in search
		var foundConnected = false;			//flag - did we find that the articles were already connected?
		
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



//draw links from existing articles to the new article
function drawExternalLinksByName(articleName, window_id){
	
	$('.window').find('.linkName').each(function()		//get the article name for each open window
	{
		var iArticleName = $(this).text();			//iterating Article Name
		var iWindow_id = $(this).parents('.window').attr('id');	//iterating Window
		
		if(iWindow_id != window_id){		//not a self match
			if(iArticleName == articleName){
				//found a match between source and destination links, draw the connection
				jsPlumb.connect({source:window_id, target:iWindow_id, anchor:"AutoDefault", detachable:false, reattach:true});
			}
		}
	});

	//enable draggable on the entire class
	jsPlumb.draggable(jsPlumb.getSelector(".window"), { cancel: '.scrollBarY' });
};
