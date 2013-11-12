/*	Lnkr: an interactive browser based mind map for wikipedia
	lnkr.dataSource.js: 
		Functions related to loading the datasources (mediawiki API configs)
    
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



/*array of Data Source objects
	-name = english name ex: Wikipedia (EN)
	-url = website url ex: http://en.wikipedia.org
	-api = additional url string to the api ex: /w/api.php
*/
var arrSource = [];


//populates the dropdown data source list by reading an xml file.  adds the contents to an array
function getSourceList(){
	$.ajax({
	   url:'lnkr_data_source.xml',
	   type: 'GET',
	   datatype:'xml',
	   success:function(xml){
			//pull the data for each source element
			$(xml).find('source').each(function(){
				var name = $(this).find('name').text();
				var url = $(this).find('url').text();
				var api = $(this).find('api').text();
				//alert(name + "\n" + url + "\n" + api);
				
				//add the source to the drop down menu
				var option = '<option>' +name+ '</option>';
				$('#dropSource').append(option);
				
				//add the soucre to the array 
				var objSource = {name: name, url: url, api: api};
				arrSource.push(objSource);
			});

		  updateAutocomplete();
	   },
	   error:function(){
		  // code for error
		alert("error parsing xml: getSourceList()");
	   }
	 });
	
};

//get the url for a given source name
function getSourceURL(sourceName){
	for (i = 0, l = arrSource.length; i < l; i++) {
		if (arrSource[i].name == sourceName){
			return arrSource[i].url;
		}
	}
};

//get the api for a given source name
function getSourceAPI(sourceName){
	for (i = 0, l = arrSource.length; i < l; i++) {
		if (arrSource[i].name == sourceName){
			return arrSource[i].api;
		}
	}
};

//get the api for a given source url
function getSourceAPIfromURL(sourceURL){
	for (i = 0, l = arrSource.length; i < l; i++) {
		if (arrSource[i].url == sourceURL){
			return arrSource[i].api;
		}
	}
};




//update the search autocomplete list
function updateAutocomplete() {

	//get the source from the drop menu
	var dataSourceName = $('#dropSource option:selected').text();		
	var dataSourceURL = getSourceURL(dataSourceName);
	var dataSourceAPI = getSourceAPI(dataSourceName);
	
	 $('#searchFormText').autocomplete(dataSourceURL + dataSourceAPI,  {
		dataType: "jsonp", 
		parse: function(data) { 
		  var rows = new Array(); 
		  var matches = data[1];
		  for( var i = 0; i < matches.length; i++){ 
			rows[i] = { data:matches[i], value:matches[i], result:matches[i] }; 
		  } 
		  return rows;
		},
		formatItem: function(row) { return row; }, 
		extraParams: {
		  action: "opensearch", 
		  format: "json", 
		  search: function () { return $('#searchFormText').val() } }, 
		 max: 10 
	   }
	 );
};

