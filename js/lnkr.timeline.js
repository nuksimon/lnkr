var timeline;
var data;
var options;



google.load("visualization", "1");

// Set callback to run when API is loaded
google.setOnLoadCallback(drawVisualization);




// Called when the Visualization API is loaded.
function drawVisualization() {
	// Create and populate a data table.
	data = new google.visualization.DataTable();
	data.addColumn('datetime', 'start');
	data.addColumn('datetime', 'end');
	data.addColumn('string', 'content');

	data.addRows([
		[new Date(1939,8,1), , 'German Invasion of Poland'],
		[new Date(1940,4,10), , 'Battle of France and the Low Countries'],
		[new Date(1940,7,13), , 'Battle of Britain - RAF vs. Luftwaffe'],
	]);

	// specify options
	options = {
		'width':  '100%',
		'height': 'auto',
		'start': new Date(1400, 6, 1),
		'end': new Date(1946, 6, 1),
		'editable': false,
		'animate': false,
		'style': 'dot'
	};

	// Instantiate our timeline object.
	timeline = new links.Timeline(document.getElementById('mytimeline'));

	// Draw our timeline with the created data and options
	timeline.draw(data, options);
};



function timelineAdd(content, strStart) {
	var range = timeline.getVisibleChartRange();
	var start = new Date(strStart);

	timeline.addItem({
		'start': start,
		'content': content
	});

	var count = data.getNumberOfRows();
	timeline.setSelection([{
		'row': count-1
	}]);
}
