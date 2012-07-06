var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var selectedArray = [ ];
var POPULARITY = 'popularity';
var YEAR = 'year';
var searchType = POPULARITY;

exports.init = init;

function init() {
	$('#error').slideUp();
	$('#message').slideUp();
	searchTypeHandler();
	artistSearchHandler();
	addHandler();
	generatePlayListHandler();
	//test();
}

function searchTypeHandler() {
	$('#yearFrom').hide();
	$('#yearTo').hide();
	$('#searchPopularity a').click(function () {
		$('#yearFrom').fadeOut('fast');
		$('#yearTo').fadeOut('fast');
		searchType = POPULARITY;
	});
	$('#searchYear a').click(function () {
		$('#yearFrom').fadeIn('fast');
		$('#yearTo').fadeIn('fast');
		searchType = YEAR;
	});			
}

function artistSearchHandler() {
	$('#searchArtist').autocomplete({
	        source: function(request, response) {
	        	var result = [];
	        	var searchParam = $('#searchArtist').val();
        		var search = new models.Search(searchParam, {
        		    'localResults' : models.LOCALSEARCHRESULTS.IGNORE,
        		    'searchArtists' : true,
        		    'searchAlbums' : false,
        		    'searchTracks' : false,
        		    'searchPlaylists' : false,
        		    'pageSize' : 10,
        		    'searchType' : models.SEARCHTYPE.SUGGESTION
        		});
	        	search.localResults = models.LOCALSEARCHRESULTS.APPEND;
	        	search.observe(models.EVENT.CHANGE, function() {
	        		search.artists.forEach(function(artist) {
	        			result.push(artist.name);
	        		});
	        		response(result);
	        	});
	        	search.appendNext();	        	
	        },
	 });
}

function addHandler() {
	$('#addSelected a').click(function (){
		var data = {};
		data.searchType = searchType;
		data.artist = $('#searchArtist').val();
		data.amount = $('#amount').val();
		data.yearFrom = $('#yearFrom').val();
		data.yearTo = $('#yearTo').val();
		selectedArray.push(data);
		$('#selectedElement').empty();
		$('#selectedAmount').empty();
		$('#selectedType').empty();
		$(selectedArray).each(function(i, selected) {
			$('#selectedElement').append('<div class="element">' + selected.artist + '</div>');
			$('#selectedAmount').append('<div class="elementAmount">' + selected.amount + '</div>');
			if (selected.searchType == YEAR) {
				$('#selectedType').append('<div class="elementYear">' + selected.yearFrom + '-' + selected.yearTo + '</div>');
			} else {
				$('#selectedType').append('<div class="elementYear">' + selected.searchType + '</div>');
			}
	    });		
	});
}

function generatePlayListHandler() {
	$('#generate a').click(function () {
		$('#error').slideUp().empty();
		$('#message').slideUp().empty();
		var plName = $('#playlist').val();
		if (plName.length == 0) {
			$('#error').append('Missing playlist name').slideDown();	
		} else if (selectedArray.length == 0) {
			$('#error').append('Nothing added to generate playlist from').slideDown();
		}
		else {
			var playlist = new models.Playlist(plName);
			$(selectedArray).each(function(i, selected) {
				generate(selected, playlist);
		    });	
			$('#message').append('Playlist generated').slideDown();
		} 
	});
}

function generate(selected, playlist) {
	console.log('generating for ' + JSON.stringify(selected));
	
	var searchParam = '';
	if (selected.searchType == POPULARITY) {
		searchParam = selected.artist;
	} else if (selected.searchType == YEAR) {
		searchParam = selected.artist + ' year:' + selected.yearFrom + '-' + selected.yearTo;
	}
	
	var search = new models.Search(searchParam, {
	    'localResults' : models.LOCALSEARCHRESULTS.IGNORE,
	    'searchArtists' : true,
	    'searchAlbums' : false,
	    'searchTracks' : true,
	    'searchPlaylists' : false,
	    'pageSize' : 50,
	    'searchType' : models.SEARCHTYPE.NORMAL
	});
	search.localResults = models.LOCALSEARCHRESULTS.APPEND;
	search.observe(models.EVENT.CHANGE, function() {
		console.log('adding tracks');
		var i = 0;
		search.tracks.forEach(function(track) {
			if (i < selected.amount) {
				console.log(track);
				playlist.add(track);
				i++;
			} else {
				return;
			}
		});
	});
	search.appendNext();				
}

function test() {
	console.log('test');
	var searchParam = 'disturbed year:1987-2002';
	var search = new models.Search(searchParam, {
	    'localResults' : models.LOCALSEARCHRESULTS.IGNORE,
	    'searchArtists' : true,
	    'searchAlbums' : false,
	    'searchTracks' : true,
	    'searchPlaylists' : false,
	    'pageSize' : 50,
	    'searchType' : models.SEARCHTYPE.NORMAL
	});
	console.log(search);
	search.localResults = models.LOCALSEARCHRESULTS.APPEND;
	search.observe(models.EVENT.CHANGE, function() {
		search.tracks.forEach(function(track) {
			console.log(track);
			console.log(track.artists);
		});
	});
	search.appendNext();	  
}