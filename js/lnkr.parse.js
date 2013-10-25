/*
	Functions related to parsing the link data from an article
	
	Author: Simon Nuk
*/


// ----------------- TEST functions not used in main code ----------------------------------------------

//TEST function: main
function runSearch()
{
	var dataSource = "http://en.wikipedia.org";	
	//var titleArray = ["Bubba Brooks", "Les McCann", "Montreux Jazz Festival"];
	//var titleArray = ["Cat"];
	//var titleArray = ["Bubba Brooks"];
	var titleArray = ["Leonardo da Vinci"];
	//var titleArray = ["Mona Lisa"];
	//var titleArray = ["France"];
	//var titleArray = ["United States"];
	//var titleArray = ["guitar", "Bubba Brooks", "Les McCann", "Montreux Jazz Festival", "Leonardo da Vinci", "Mona Lisa", "Cat", "Dog", "Mammal"];
	//var titleArray = ["Mammal","Dog","Cat", "Mona Lisa","Leonardo da Vinci","Montreux Jazz Festival", "Les McCann",  "Bubba Brooks",  "guitar"  ];
	
	//run the parser on each article in the array
	for (i = 0, l = titleArray.length; i < l; i++) {
		$('#searchedArticles').append(titleArray[i] + "<br>");
		searchArticle(dataSource, titleArray[i]);
	}
	
	//alert("runSearch");
};

//TEST function: dump link data to html
function testParseDumpLink(arrLink, articleTitle) {
	
	//Append the results to the body
	var outputHTML = ""; // = "<p>aaa</p>";
	for (i = 0, l = arrLink.length; i < l; i++) {
		outputHTML =  outputHTML + "<tr><td>" + articleTitle + "</td><td>" + arrLink[i].name + "</td><td>" + arrLink[i].search_name 
					+ "</td><td>" + arrLink[i].url + "</td><td>" + arrLink[i].count_link + "</td><td>" + arrLink[i].count_text 
					+ "</td><td>" + arrLink[i].count_p1 + "</td><td>" + arrLink[i].count_p2 + "</td><td>" + arrLink[i].count_infobox + "</td><td>"
					+ arrLink[i].count_navbox + "</td><td>" + arrLink[i].weight 
					+ "</td><td>" + (i+1) + "</td></tr>";
	}
	$('#resultTable').append(outputHTML);

};

//TEST function: dump article data to html
function testParseDumpArticle(wikipage) {
	
	//Append Article to the body
	var windowBody = '<p>' + $(wikipage).html() + '</p>';
	$('#htmlDump').append(windowBody);	

};

//TEST function: search for an article using the API
function searchArticle(dataSource, windowTitle)
{
	
	var startTime = new Date().getTime();
	var windowBody = "";	//add all body elements to this var
	
	//wiki search api
	var url = dataSource + "/w/api.php?action=parse&format=json&callback=?";
	
	//api call
	$.getJSON(url, { 
		page: windowTitle, 
		prop:"text|images", 
		uselang:"en"
	}, function(data) {
			
		
		//Add Title
		var articleTitle = data['parse']['title'];
		windowBody += '<h1>' + articleTitle + '</h1>';
		var apiTime = new Date().getTime();
		
		//parse the article, return array of weighted links
		var arrLink = [];
		arrLink = parseArticle(data, dataSource);
		var endTime = new Date().getTime();
		
		//dump data to test HTML page
		testParseDumpArticle($('<div>'+data.parse.text['*']+'</div>'));
		testParseDumpLink(arrLink, articleTitle);
				
		var statsRow = '<tr><td>' + articleTitle + '</td><td>' + arrLink.length + '</td><td>' + (apiTime - startTime) + '</td><td>' + (endTime - apiTime)
					+ '</td><td>' + (endTime - startTime) +  '</td></tr>';
		$('#statsTable').append(statsRow);	
	});	
};







// ----------------- Parse Functions ----------------------------------------------------


/*Parse the links in the article
	INPUTS
		-article = HTML content of the article
		-dataSource = URL of the dataSource
	OUTPUT
		-arrLink = array of hyperlinks found in the article, weighted by relevance
*/
function parseLinks(article, dataSource)
{
	/* objLink = object that stores the link's scores and weight
			-name = link's name
			-url = link's url
			-count_link = # times found as a hyperlink
			-count_text = # times found as plain text
			-count_p1 = # times found in the first paragraph
			-count_p2 = # times found between the 2nd paragraph and Table of Contents
			-count_infobox = # times found in the info box
			-count_nav_box = # times found in the nav box
			-weight = calculated weight (relevance) based on the above parameters
		
		arrLink = array of objLinks
	*/
	var objLink;
	var arrLink = [];
	
	var linkTitle = "";
	var linkURL = "";

	
	// parse article
	var articleTitle = article['parse']['title'];
	wikipage = $('<div>'+article.parse.text['*']+'</div>');
	wikipage.find('sup').remove();			//removes reference tags
	wikipage.find('.references').remove();	//removes the references section (mostly external links or ISBN)
	wikipage.find('.refbegin').remove();
	wikipage.find('a').each(function() {	//process each hyperlink
		$(this)			  
		  .attr('href', dataSource+$(this).attr('href'))	//repoint the links to external wikipedia
		  .attr('target','wikipedia');
		
		//filter out unhelpful links
		linkTitle = String($(this).attr('title'));
		linkURL = String($(this).attr('href'));
		if (linkTitle.indexOf("Edit section") < 0 && linkTitle.indexOf("(page does not exist)") < 0 && linkTitle.indexOf("(disambiguation)") < 0 
			&& linkTitle.indexOf("undefined") != 0 && linkURL.toLowerCase().indexOf(".jpg") < 0 && linkURL.toLowerCase().indexOf(".png") < 0 && linkURL.toLowerCase().indexOf(".svg") < 0 
			&& linkURL.toLowerCase().indexOf(".jpeg") < 0 && linkTitle.indexOf(":") < 0 && linkTitle != articleTitle && linkTitle != "e") {
			
			var linkFound = false;
			
			//check if link exists in the array
			for (i = 0, l = arrLink.length; i < l; i++) {
				if (arrLink[i].name == linkTitle) {
					arrLink[i].count_link++;		//link found, increment and break
					linkFound = true;
					break;
				}
			}	
			
			//add the hyperlink to the array if it was not found
			if (linkFound == false) {
				objLink = {name: linkTitle, url: $(this).attr('href'), count_link: 1, count_text: 0, count_p1: 0, count_p2: 0, count_infobox: 0, count_navbox: 0};
				arrLink.push(objLink);
			}
		}
	});
	//alert($(wikipage).html());

	
	//find other occurances of the hyperlinks as plain text
	var count_text = 0;
	var link_name = "";
	var regex;
	var subQuery = "";
	
	for (i = 0, l = arrLink.length; i < l; i++) {
		count_text = 0;
		link_name = arrLink[i].name;
		if (link_name.indexOf("(") > 0) {
			link_name = link_name.slice(0, link_name.indexOf("("));  //remove anything beyond a "(" character; text identifier likely does not have trailing (), eg "(musician)"
		}

		link_name = escapeRegExp(link_name);		//add regexp escape for special characters
		arrLink[i].search_name = link_name;

		regex = new RegExp(link_name, "gi");		//g = entire string, i = case INsensitive

		//count_text - count how many times the link_name is found in the article ----------------------------------
		count_text = wikipage.text().match(regex);
		if (count_text != null) {
			arrLink[i].count_text = count_text.length;
		} else {
			arrLink[i].count_text = 0;
		}
		
		//count_p1 - count how many times the link_name is found in the first paragraph -----------------------------
		count_text = wikipage.children('p:first').text().match(regex);
		if (count_text != null) {
			arrLink[i].count_p1 = count_text.length;
		} else {
			arrLink[i].count_p1 = 0;
		}
		
		//count_p2 - count how many times the link_name is found in the second paragraph through to TOC -----------------------------
		wikipage.children('p:first').nextUntil('h2').each( function(){	
			count_text = $(this).text().match(regex);
			if (count_text != null) {
				arrLink[i].count_p2 = arrLink[i].count_p2 + count_text.length;
			} else {
				arrLink[i].count_p2 = arrLink[i].count_p2 + 0;
			}
		});
		
		//count_infobox - count how many times the link_name is found in the infobox -------------------------------
		subQuery = wikipage.find('.infobox').text();
		if (subQuery != null) {
			count_text = subQuery.match(regex);
			if (count_text != null) {
				arrLink[i].count_infobox = count_text.length;
			} else {
				arrLink[i].count_infobox = 0;
			}
		}
		
		//count_navbox - count how many times the link_name is found in the navbox -------------------------------
		subQuery = wikipage.find('.navbox').text();
		if (subQuery != null) {
			if (count_text != null) {
				arrLink[i].count_navbox = count_text.length;
			} else {
				arrLink[i].count_navbox = 0;
			}
		}
		
	}
	
	//apply the weighting to each link in the array
	runLinkWeight(arrLink);
	
	//return the link array
	return arrLink;
};



//add an escape to each special character in the regexp
function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};



//calculate the weight of each link
function runLinkWeight(arrLink)
{
	//object for link type weighting
	var linkWeight = {
			link: 1,
			text: 0.5,
			p1: 8,
			p2: 6,
			infobox: 10,
			navbox: 8
		};
	
	//apply the weighting to each link
	for (i = 0, l = arrLink.length; i < l; i++) {
		arrLink[i].weight = (linkWeight.link * arrLink[i].count_link)
						+ (linkWeight.text * arrLink[i].count_text)
						+ (linkWeight.p1 * arrLink[i].count_p1)
						+ (linkWeight.p2 * arrLink[i].count_p2)
						+ (linkWeight.infobox * arrLink[i].count_infobox)
						+ (linkWeight.navbox * arrLink[i].count_navbox);
	}
	
	//sort the array by the weight field
	arrLink.sort(SortByWeight);
};



//sort the "weight" field in the array of links
function SortByWeight(a, b){
  return ((a.weight < b.weight) ? 1 : ((a.weight > b.weight) ? -1 : 0));
};



//Parse the infobox for MetaData
function parseMetaData(article,windowTitle,newWindowId){

	wikipage = $('<div>'+article.parse.text['*']+'</div>');
	var infobox = wikipage.find('.infobox');
	
	//find birthday
	var bday = infobox.find('.bday:first').text();							//find the first bday class
	if (bday == ''){
		bday = infobox.find("th:contains('Born'):first").next().text();		//no class, perform text search
	}
	if (bday == ''){
		bday = infobox.find("th:contains('Year'):first").next().text();		//no class, perform text search
	}
	
	//find death day
	var dday = infobox.find('.dday:first').text();							//find the first dday class
	if (dday == ''){
		dday = infobox.find("th:contains('Died'):first").next().text();		//no class, perform text search
	}
	
	//find works
	var works = infobox.find("th:contains('work'):first").next().html();		//no class, perform text search
	if (works == '' || works == null){
		works = infobox.find("th:contains('Work'):first").next().html();		//check upper case
	}
	if (works == '' || works == null){
		works = infobox.find("th:contains('Works'):first").next().html();		//check upper case
	}
	works = '<div>' + works + '</div>';
	
	/*
	$(works).find('a').each(function() {
		//replace hyperlinks with internal links
		var linkName = $(this).attr('title');
		var linkText = $(this).html();
		//alert($(this).text());
		//$(this).replaceWith('<lnk onclick="toggleLinksByName(&quot;'+windowTitle+'&quot;, &quot;'+ linkName +'&quot;, &quot;'+newWindowId+'&quot;)">' + linkText + '</lnk>');	
		$(this).replaceWith("<p>REPLACE</p>");
		alert($(this).html());
	});
	*/
	$(works).find('a').replaceWith("<p>REPLACE</p>");
	alert(works);

	return '<p>parsed data</p>' + '<p>bday: "' + bday + '"</p>'+ '<p>dday: "' + dday + '"</p>'+ '<p>works: "' + works + '"</p>';
};
