var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var views = sp.require('sp://import/scripts/api/views');
var genreArray = [];
var selectedArray = [];
var POPULARITY = 'popularity';
var YEAR = 'year';
var GENRE = 'genre';
var ARTIST = 'artist';
var WILDCARD = 'wildcard';

var searchCategory = ARTIST;
var searchType = POPULARITY;

exports.init = init;

function init() {
	$('#error').hide();
	$('#message').hide();
	
	loadGenreData();
	searchArtistHandler();
	addHandler();
	createPlayListHandler();
	generateHandler();
	categoryMenuHandler();
	searchTypeMenuHandler();
	clearHandler();
	$('#playlist').val('SmartList');
}

function categoryMenuHandler() {
	$('#searchArtist a').parent().addClass('selected');
	$('#searchArtist a').click(function() {
		searchArtistHandler();
		searchCategory = ARTIST;
		console.log($('#searchCategory li'));
		$('#searchCategory li').removeClass('selected');
		$(this).parent().addClass('selected');
	});
	$('#searchWildcard a').click(function() {
		searchArtistHandler();
		searchCategory = WILDCARD;
		console.log(searchCategory);
		$('#searchCategory li').removeClass('selected');
		$(this).parent().addClass('selected');
	});
	$('#searchGenre a').click(function() {
		searchGenreHandler();
		searchCategory = GENRE;
		$('#searchCategory li').removeClass('selected');
		$(this).parent().addClass('selected');
	});
}

function searchTypeMenuHandler() {
	$('#yearFrom').hide();
	$('#yearTo').hide();
	$('#searchPopularity a').parent().addClass('selected');
	$('#searchPopularity a').click(function() {
		$('#yearFrom').fadeOut('fast');
		$('#yearTo').fadeOut('fast');
		searchType = POPULARITY;
		$('#searchType li').removeClass('selected');
		$(this).parent().addClass('selected');		
	});
	$('#searchYear a').click(function() {
		$('#yearFrom').fadeIn('fast');
		$('#yearTo').fadeIn('fast');
		searchType = YEAR;
		$('#searchType li').removeClass('selected');
		$(this).parent().addClass('selected');			
	});
}

function loadGenreData() {
	console.log('loading');
	$.get("data/genre.txt", {}, function(data) {
		genreArray = data.split("\n");
	});
}

function searchGenreHandler() {
	$('#searchField').autocomplete({
		source : genreArray
	});
}

function searchArtistHandler() {
	$('#searchField').autocomplete({
		source : function(request, response) {
			console.log('searching...');
			var result = [];
			var searchParam = $('#searchField').val();
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
		}
	});
}

function addHandler() {
	$('#add a').click(function() {
		$('#message').empty().hide();
		$('#error').empty().hide();
		var isValid = true;
		var data = {};
		data.searchCategory = searchCategory;
		data.searchType = searchType;
		data.search = $('#searchField').val();
		data.amount = $('#amount').val();

		if (data.search.length < 1) {
			isValid = false;
			$('#error').append('Search parameter missing <br />');
		}
		if (data.amount.length < 1) {
			isValid = false;
			$('#error').append('Number of tracks missing <br />');
		}

		if (searchType == YEAR) {
			data.yearFrom = $('#yearFrom').val();
			data.yearTo = $('#yearTo').val();
			if (data.yearFrom.length < 1) {
				isValid = false;
				$('#error').append('From year missing <br />');
			}
			if (data.yearTo.length < 1) {
				isValid = false;
				$('#error').append('To year missing <br />');
			}
			if (parseInt(data.yearTo) < parseInt(data.yearFrom)) {
				isValid = false;
				$('#error').append('From year is larger than To year <br />');
			}
		}
		if (isValid) {
			selectedArray.push(data);
			DisplayRules();
			$('#message').append('Rule added').fadeIn();
		} else {
			$('#error').fadeIn();
		}
	});
}

function removeHandler() {
	$('.remove').click(function() {
		var row_idx = $(this).parent().prevAll().length - 1;
		console.log(row_idx);
		selectedArray.splice(row_idx, 1);
		DisplayRules();
	});
}

function DisplayRules() {
	$('#rules').find('tr:gt(0)').remove();
	$(selectedArray).each(
			function(i, selected) {
				if (selected.searchType == YEAR) {
					$('#rules').append(
						'<tr class=selectedData>' + '<td class="element">'
						+ selected.search + '</td>'
						+ '<td class="elementAmount">'
						+ selected.amount + '</td>'
						+ '<td class="elementCategory">'
						+ selected.searchCategory + '</td>'
						+ '<td class="elementType">'
						+ selected.yearFrom + '-' + selected.yearTo
						+ '</td>'
						+ '<td class="remove"><a href="#">remove</a></td>'
						+ '</tr>');
				} else {
					$('#rules').append(
						'<tr class=selectedData>' + '<td class="element">'
						+ selected.search + '</td>'
						+ '<td class="elementAmount">'
						+ selected.amount + '</td>'
						+ '<td class="elementCategory">'
						+ selected.searchCategory + '</td>'
						+ '<td class="elementType">'
						+ selected.searchType + '</td>'
						+ '<td class="remove"><a href="#">remove</a></td>'
						+ '</tr>');
				}
			});
	removeHandler();
}

function generateHandler() {
	$('#generate a').click(function() {
		$('#message').empty().hide();
		$('#error').empty().hide();
		$('#tracks').empty();
		var playlist = new models.Playlist();
		$(selectedArray).each(function(i, selected) {
			createPlayList(selected, playlist);
		});
		var playlistView = new views.List(playlist);
		$('#tracks').append(playlistView.node);
		$('#message').append('playlist generated').fadeIn();
	});
}

function createPlayListHandler() {
	$('#create a').click(function() {
		validateAndcreatePlayList();
	});
}

function validateAndcreatePlayList() {
	$('#message').empty().hide();
	$('#error').empty().hide();
	var plName = $('#playlist').val();
	if (plName.length == 0) {
		$('#error').append('Missing playlist name').fadeIn();
	} else if (selectedArray.length == 0) {
		$('#error').append('No rules added')
				.fadeIn();
	} else {
		var playlist = new models.Playlist(plName);
		$(selectedArray).each(function(i, selected) {
			createPlayList(selected, playlist);
		});
		$('#message').append('Playlist created').fadeIn();
	}
}

function createPlayList(selected, playlist) {
	console.log('generating for ' + JSON.stringify(selected));
	var searchParam = '';

	if (selected.searchCategory == ARTIST
			|| selected.searchCategory == WILDCARD) {
		if (selected.searchType == POPULARITY) {
			searchParam = 'artist:"' + selected.search + '"';
		} else if (selected.searchType == YEAR) {
			searchParam = 'artist:"' + selected.search + '" year:'
					+ selected.yearFrom + '-' + selected.yearTo;
		}
	} else if (selected.searchCategory == GENRE) {
		if (selected.searchType == POPULARITY) {
			searchParam = 'genre:"' + selected.search + '"';
		} else if (selected.searchType == YEAR) {
			searchParam = 'genre:"' + selected.search + '" year:'
					+ selected.yearFrom + '-' + selected.yearTo;
		}
	}
	console.log(searchParam);
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
				if (selected.searchCategory == ARTIST) {
					if (track.artists.length == 1
							&& track.artists[0].data.name == selected.search) {
						playlist.add(track);
					}
				} else {
					playlist.add(track);
				}
				i++;
			} else {
				return;
			}
		});
	});
	search.appendNext();
}

function clearHandler() {
	$('#clear a').click(function() {
		genreArray = [];
		selectedArray = [];
		$('#rules').find('tr:gt(0)').remove();
		$('#tracks').empty();
		$('#message').empty().hide();
		$('#error').empty().hide();		
	});
}