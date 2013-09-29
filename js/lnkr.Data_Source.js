//populates the dropdown data source list
function getSourceList(){
	$.ajax({
	   url:'lnkr_db_api.php',
	   type: 'get',
	   data: 't=getSourceList',
	   datatype:'html',

	   success:function(data){
			//alert(data);
		  $('#dropSource').html(data); 
		  updateAutocomplete();
	   },
	   error:function(){
		  // code for error
		alert("error");
	   }
	 });
	
};



//update the search autocomplete list
function updateAutocomplete() {
	//alert();
	var wikiSource = $('#dropSource option:selected').text();		//get the source from the drop menu
	 //alert(wikiSource);
	 $('#searchFormText').autocomplete(wikiSource + "/w/api.php",  {
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

