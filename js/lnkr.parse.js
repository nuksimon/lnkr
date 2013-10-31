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

//case insenstive contains selector
//http://css-tricks.com/snippets/jquery/make-jquery-contains-case-insensitive/
$.expr[":"].containsCi = $.expr.createPseudo(function(arg) {
    return function( elem ) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});


/*Parse the links in the article
	INPUTS
		-article = HTML content of the article
		-dataSource = URL of the dataSource
	OUTPUT
		-arrLink = array of hyperlinks found in the article, weighted by relevance
*/
function parseLinks(article, dataSource, windowTitle, windowId)
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
		
		//add the internal link 
		arrLink[i].lnk = buildLnk(arrLink[i].name, windowId, arrLink[i].name);
		
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

	var metadata = [];	//array of tag-value pairs
	var objMetadata;	//{tag, val}
	var tagVal;
	
	wikipage = $('<div>'+article.parse.text['*']+'</div>');
	var infobox = wikipage.find('.infobox:first');
	
	//find start (birthday)
	var bday = infobox.find('.bday:first').text();							//find the first bday class
	if (bday == ''){
		bday = infobox.find("th:containsCi('Born'):first").next().text();		//no class, perform text search
	}
	if (bday == ''){
		bday = infobox.find("th:containsCi('Publication date'):first").next().text();		//books
	}
	if (bday == ''){
		bday = infobox.find("th:containsCi('Release'):first").next().text();		//movie/album
	}
	
	
	//find end (death day)
	var dday = infobox.find('.dday:first').text();							//find the first dday class
	if (dday == ''){
		dday = infobox.find("th:containsCi('Died'):first").next().text();		//no class, perform text search
	}
	
	//check for Year
	if (bday == ''){
		var year = infobox.find("th:containsCi('Year'):first").next().text();		//no class, perform text search
		year = year.replace(/\u2013|\u2014/g, "-");			//change "en" and "em" dashes to hyphens "-"
		var reYY = new RegExp(/\d+-\d+/);
		var reNum = new RegExp(/\d+/);
		
		if (reYY.test(year)){								//"yyyy-yyyy" range format
			bday = year.replace(/-.*/g, "");
			dday = year.replace(/.*-/g, "");
		}
		else {												//"yyyy" format
			bday = year;
		}
	}
	
	
	//cleanup start and end
	bday = bday.replace(/c(\.|a|a\.)\s/g, "");			//removes the "c(a.) " at the start of some dates
	dday = dday.replace(/c(\.|a|a\.)\s/g, "");
	
	bday = bday.replace(/before /g, "");			//removes the "before" at the start of some dates
	dday = dday.replace(/before /g, "");
	
	bday = bday.replace(/ \(.*/g, "");			//removes everything after the space+bracket (" (")
	dday = dday.replace(/ \(.*/g, "");

	bday = convertTextDateToNumber(bday);		//check for "text" dates, i.e. '20 January 1998'
	dday = convertTextDateToNumber(dday);
	
	//alert(bday + " _ " + dday);
	
	bday = bday.replace(/\s.*/g, "");			//removes everything after the space (" ")
	dday = dday.replace(/\s.*/g, "");		
	
	bday = bday.replace(/,.*/g, "");			//removes everything after the comma (",")
	dday = dday.replace(/,.*/g, "");

	
	
	
	if (bday != '' && bday != null){
		//var bdayDate = new Date(bday);
		objMetadata = {tag: 'Start', val: bday};
		metadata.push(objMetadata);
	}
	if (dday != '' && dday != null){
		objMetadata = {tag: 'End', val: dday};
		metadata.push(objMetadata);
	}
	
	
	//find tags
	metadata = findTag('Known for', ['work','known'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Origin', ['origin'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Members', ['members','starring','founder'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Author', ['author'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Artist', ['artist'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Associated acts', ['associated acts'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Genre', ['genre','style','movement'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Label', ['label'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Publisher', ['publisher'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Directed by', ['directed'], metadata, infobox, windowTitle, newWindowId);
	metadata = findTag('Produced by', ['produced'], metadata, infobox, windowTitle, newWindowId);
	
	
	return metadata;
};

//perform text search on an array of key words.  push the results to the metadata array
function findTag(tagName, arrSearch, metadata, data, windowTitle, windowId){
/*	tagName 	= tag's name in window
	arrSearch 	= array of keywords to search for
	metadata 	= array of tag-value pairs
	data 		= html element to search
	windowTitle = title of main window (for lnk build)
	windowId 	= id of main window (for lnk build)
*/

	var tagVal;
	for (i = 0, l = arrSearch.length; i < l; i++) {
		tagVal = data.find("th:containsCi("+arrSearch[i]+"):first").next().html();	//look for the search term	

		if (tagVal != '' && tagVal != null){						//tag found; update lnk, push to array and exit loop (skip the rest of the search terms)
			tagVal = internalLinks(tagVal, windowId);
			metadata.push({tag: tagName, val: tagVal});
			break;
		}
	}
	return metadata;
};


//turn hyperlinks into internal links
function internalLinks(el, windowId)
{
	el = $('<div>' + el + '</div>');
	el.find('a').each(function() {
		//replace hyperlinks with internal links
		var linkName = $(this).attr('title');
		var linkText = $(this).html();	
		$(this).replaceWith(buildLnk(linkName, windowId, linkText));
	});
	return el.html();
};


//build the <lnk> element
function buildLnk(linkName, windowId, linkText)
{
	return '<lnk onclick="toggleLinksByName(&quot;'+ linkName +'&quot;, &quot;'+windowId+'&quot;)">' + linkText + '</lnk>';
};





//----------- Date functions --------------------------------------------------------

//cred: http://stackoverflow.com/questions/3569126/is-there-anything-in-javascript-that-can-convert-august-to-8
function convertMonthNameToNumber(monthName) {
    var myDate = new Date(monthName + " 1, 2000");
    var monthDigit = myDate.getMonth();
    monthDigit = isNaN(monthDigit) ? 0 : (monthDigit + 1);				//return 0 if it the convert fails
	monthDigit = (monthDigit >= 10) ? monthDigit : ('0' + monthDigit);	//zero pad to 2 digits
	return monthDigit;
}

//check if the date is text ('20 January 1998') and convert to number ('1998-01-20') else return original
function convertTextDateToNumber(checkDate){

	var reTextDateDMY = new RegExp(/[0-9]+( |.[0-9]+ )[a-z]+ [0-9]+/gi);			//dd Month yyyy  i.e. '20 January 1998'
	//var reTextDateDDMY = new RegExp(/[0-9]+.[0-9]+ [a-z]+ [0-9]+/gi);	//dd-dd Month yyyy  i.e. '20-21 January 1998'
	var reTextDateMDY = new RegExp(/[a-z]+ [0-9]+, [0-9]+/gi);			//Month dd, yyyy i.e. 'January 20, 1998'
	var reNum = new RegExp(/\d+/);										//filter the first group of #s
	
	//dd Month yyyy
	if (reTextDateDMY.test(checkDate)){	
		var reYear = new RegExp(/\s\d+/);							//gets the year (#s after a space)
		var reTextMonth = new RegExp(/[a-z]+/i);					//gets the text month (first alphas)
		var reDay = new RegExp(/\d+\s/);							//gets the day (first #s)
	
		var tempDate = reYear.exec(checkDate);
		tempDate += "-" + convertMonthNameToNumber(reTextMonth.exec(checkDate));	//turns the text month to a number
		tempDate += "-" + reDay.exec(checkDate);
		checkDate = tempDate.replace(/\s/g, "");									//clean up any spaces
		//alert('1: "' +checkDate+'"');
	}
	//Month dd, yyyy
	else if (reTextDateMDY.test(checkDate)){
		var reYear = new RegExp(/,\s\d+/);							//gets the year (#s after a comma+space)
		var reTextMonth = new RegExp(/[a-z]+/i);					//gets the text month (first alphas)
		var reDay = new RegExp(/[a-z]\s\d+/);							//gets the day (#s after alpha+space)
		
		var tempDate = reNum.exec(reYear.exec(checkDate));						
		tempDate += "-" + convertMonthNameToNumber(reTextMonth.exec(checkDate));	//turns the text month to a number
		tempDate += "-" + reNum.exec(reDay.exec(checkDate));
		checkDate = tempDate.replace(/\s/g, "");
		//alert('2: "'+checkDate+'"');
	}
	
	return checkDate;
}