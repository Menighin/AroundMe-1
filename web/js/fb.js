/*
	Script que controla o facebook
*/

function fbLogin() {
	FB.login(function(response) {
	   if (response.authResponse) {
		 console.log('Welcome!  Fetching your information.... ');
		 FB.api('/me', function(response) {
		   console.log('Good to see you, ' + response.name + '.');
		 });
	   } else {
		 console.log('User cancelled login or did not fully authorize.');
	   }
	 });
 }

var accessToken = null;
var userID = null;

//var appAccessToken = '360645504021378|AX7rwsNnl0VBUwDGVUxb5p0Vwfc';   //App AroundME
//var appAccessToken = '462700473780045|CoNNZdtH11hwDxK7D6DbPL2msHo'; //TestApp
var appAccessToken = '395956050472783|mzEeKmgXugIxeAYJfVrwGGLfBOc';
function initializeFB() {
	// init the FB JS SDK
	var actoken;
	FB.init({
	  //appId		 : '360645504021378', // App AroundME
	  //appId      : '462700473780045', //TestApp
	  appId		 : '395956050472783', //TestApp2
	  channeUrl  : 'http://localhost', //App AroundME
	  status     : true, // check the login status upon init?
	  cookie     : true, // set sessions cookies to allow your server to access the session?
	  xfbml      : true  // parse XFBML tags on this page?
	});

	FB.getLoginStatus(function (response) {
		if (response.authResponse) {
			userID = response.authResponse.userID;
			accessToken = response.authResponse.accessToken;
			console.log(accessToken);
			fillInterestsName(1);
			catchOwnEvents();
		} else {
			accessToken = appAccessToken;
			fillInterestsName(0);
		}
	});
	
};

FB.Event.subscribe('auth.login', function(response) {
		FB.getLoginStatus(function (response) {
			if (response.authResponse) {
				accessToken = response.authResponse.accessToken;
				catchOwnEvents();
			}
		})
});
FB.Event.subscribe('auth.logout', function(response) {
        window.location.reload();
});

/*
	Ajax
*/
function openAjax() {
    var ajax;
    try{
        ajax = new XMLHttpRequest(); // XMLHttpRequest para Firefox, Safari, dentre outros.
    }catch(ee){
        try{
            ajax = new ActiveXObject("Msxml2.XMLHTTP"); // Para o Internet Explorer
        }catch(e){
            try{
                ajax = new ActiveXObject("Microsoft.XMLHTTP"); // Para o Internet Explorer
            }catch(E){
                ajax = false;
            }
        }
    }
    return ajax;
}

function fillInterestsName(logged) {
	if (logged == 1) $("#aba1 select").append ("<option value = " + -1 + ">User events</option>");
	var ajax = openAjax();
	ajax.open ("GET", "http://around-me.herokuapp.com/landmarks.json", true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var names = JSON.parse(ajax.responseText);
			for (var i = 0; i < names.length; i++) {
				$("#aba1 select").append ("<option value = " + i + ">" + names[i].name + "</option>")
				pointInterestName[i] = names[i].username.toLowerCase();
				
			}
			for (var i = 0; i < pointInterestName.length; i++)
				findInterestsMarks(i);
		}
	}
	ajax.send(null);
}

/*
	Função que localiza e marca os pontos de interesse
*/
function findInterestsMarks (i) {
	var ajax = openAjax();
	ajax.open ("GET", "http://around-me.herokuapp.com/landmarks/" + pointInterestName[i] + ".json", true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var interesting = JSON.parse(ajax.responseText);
			var marker = new google.maps.Marker ({
				position: new google.maps.LatLng (interesting.location_latitude, interesting.location_longitude),
				map: map,
				title: interesting.name,
				icon: "img/places.png"
			});
			pointInterestMarker[i] = marker;
			findInterestsEvents(i, interesting.location_latitude, interesting.location_longitude);
		}
	}
	ajax.send(null);
}
function toTitleCase(str)
{
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
/*
	Função que localiza e cria as infoWindows com a lista de eventos nos pontos de interesse
*/
function findInterestsEvents (i, lat, lng) {
	var date = new Date();
	var today = "";
	today += date.getFullYear();
	if (date.getMonth() + 1 > 9)
		today += '-' + (date.getMonth() + 1);
	else
		today += '-0' + (date.getMonth() + 1);
	if (date.getDate() > 9)
		today += '-' + date.getDate();
	else
		today += '-0' + date.getDate();
	today+="T00:01:00+0100";
	var ajax = openAjax();
	ajax.open ("GET", "http://around-me.herokuapp.com/landmarks/" + pointInterestName[i] + "/events", true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var events = (JSON.parse(ajax.responseText));
			var eventList = '<ul>';
			for (var j = events.length - 1; j >= 0; j--) {
				if (events[j].start_time >= today) {
					var evtName = toTitleCase(events[j].name);
					if (evtName.length > 40) evtName = evtName.substring(0, 40) + '...';
					var evtDate = events[j].start_time.substring(0,10);
					eventList += '<li class="listevent" onClick="openbox(' + events[j].fb_id + ', \'' + evtName + '\',' + lat + ',' + lng + ')"><a>' + evtName + '</a>' +
					'<span>' + evtDate.substring(8,10) + '/' + evtDate.substring(5,7) + '/' + evtDate.substring(0,4) + '</span></li>';
				}
			}
			eventList += '</ul>';
			
			var infoWindow = new google.maps.InfoWindow ({
				content: eventList
			});
			
			pointInterestInfoWindow[i] = infoWindow;
			
			google.maps.event.addListener (pointInterestMarker[i], 'click', function () { 
                pointInterestInfoWindow[i].open(map, pointInterestMarker[i]); 
            });
		}
	}
	ajax.send(null);
}

/*
* User events
*/
function catchOwnEvents () {
	var events = [];
	var control = 0;
	
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/me/events?access_token=" + accessToken, false);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			events[0] = JSON.parse (ajax.responseText);
			
			ajax.open("GET", "https://graph.facebook.com/me/events/not_replied?access_token=" + accessToken, true);
			ajax.onreadystatechange = function () {
				if (ajax.readyState == 4 && ajax.status == 200) {
					events[1] = JSON.parse(ajax.responseText);
						var k = 0;
						for (var j = 0; j < events.length; j++) {
							for (var i = 0; i < events[j].data.length; i++) {
								findOwnEvents(events[j].data[i].id, k);
								k++;
							}
						}
				}
			}
			ajax.send(null);
		}
	}
	ajax.send(null);
}

function findOwnEvents (id, i) {
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/" + id + "?access_token=" + accessToken, true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var eventLocation = JSON.parse (ajax.responseText);
			if (eventLocation.venue && eventLocation.venue.id) 
				markOwnEvents(eventLocation.venue.id, eventLocation, i);
		}
	}
	ajax.send(null);
}

function markOwnEvents (id, event, i) {
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/" + id + "?access_token=" + accessToken, true);
	ajax.onreadystatechange = function () {
		if (ajax.status == 200 && ajax.readyState == 4) {
			var place = JSON.parse (ajax.responseText);
			var marker = new google.maps.Marker ({
				position: new google.maps.LatLng (place.location.latitude, place.location.longitude),
				map: map,
				title: event.name,
				icon: "img/ownevents.png"
			});

			if (hasAlreadyRed(place.location.latitude, place.location.longitude))
				marker.setMap(null)
			ownEventMarker[i] = marker;
			infoOwnEvents(i, event, place.location.latitude, place.location.longitude);
		}
	}
	ajax.send(null);	
}

function hasAlreadyRed (lat, lng) {
	for (var i = 0; i < pointInterestMarker.length; i++) {
		var diffLat = Math.abs(pointInterestMarker[i].getPosition().lat() - lat);
		var diffLng = Math.abs(pointInterestMarker[i].getPosition().lng() - lng);
		if (diffLat < 0.00001 && diffLng < 0.00001) {
			return true;
		}
	}
	return false;
}

function  infoOwnEvents (i, event, lat, lng) {
	google.maps.event.addListener (ownEventMarker[i], 'click', function () { 
		var evtName = toTitleCase(event.name);
		openbox(event.id, evtName, lat, lng);
	});
}

function hideShowUserEvents (check) {
	if (!check.checked)
		for (var i = 0; i < ownEventMarker.length; i++) {
			if (ownEventMarker[i])
				ownEventMarker[i].setMap(null);
		}
	else
		for (var i = 0; i < ownEventMarker.length; i++) {
			if (ownEventMarker[i])
				ownEventMarker[i].setMap(map);
		}
}

/*
* Listando eventos
*/
function fillComboBox(logged) {
	if (logged == 1) $("#aba1 select").append ("<option value = " + -1 + ">User events</option>");
	for (var i = 0; i < pointInterestName.length; i++)
		$("#aba1 select").append ("<option value = " + i + ">" + pointInterestName[i] + "</option>");
}

function listEvents (select) {
	var date = new Date();
	var today = "";
	today += date.getFullYear();
	if (date.getMonth() + 1 > 9)
		today += '-' + (date.getMonth() + 1);
	else
		today += '-0' + (date.getMonth() + 1);
	if (date.getDate() > 9)
		today += '-' + date.getDate();
	else
		today += '-0' + date.getDate();
	today+="T00:01:00+0100";
	
	var events = [];
	var i = select.value;
	if (i >= 0) {
		var ajax = openAjax();
		ajax.open ("GET", "https://graph.facebook.com/" + pointInterestName[i] + "/events?access_token=" + accessToken, true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var events = (JSON.parse(ajax.responseText)).data;
				var eventList = '<div id="listWrapper"><div id="list"><ul style="list-style-type:circle;">';
				for (var j = events.length - 1; j >= 0; j--) {
					if (events[j].start_time >= today) {
						var evtName = toTitleCase(events[j].name);
						if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
						eventList += '<li class="listevent" onClick="openbox(' + events[j].id + ', \'' + evtName + '\')"><a>' + evtName + '</a>' +
							'<span>' + events[j].start_time.substring(8,10) + '/' + events[j].start_time.substring(5,7) + '/' + 
							events[j].start_time.substring(0,4) + '</span></li>';
					}
				}
				eventList += '</ul></div></div>';
				document.getElementById('listofevents').innerHTML = eventList;
				
			}
		}
		ajax.send(null);
	} else if (i == -1) {
		var ajax = openAjax();
		ajax.open ("GET", "https://graph.facebook.com/me/events?access_token=" + accessToken, false);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				events[0] = JSON.parse (ajax.responseText);
				
				var eventList = '<div id="listWrapper"><div id="list"><h3>Replied:</h3><ul style="list-style-type:circle;">';
				for (var i = events[0].data.length - 1; i >= 0; i--) {
					var evtName = toTitleCase(events[0].data[i].name);
					if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
					eventList += '<li class="listevent" onClick="openbox(' + events[0].data[i].id + ', \'' + evtName + '\')"><a style="color: #00a">' + evtName + '</a>' +
								 '<span>' + events[0].data[i].start_time.substring(8,10) + '/' + events[0].data[i].start_time.substring(5,7) + '/' + 
								  events[0].data[i].start_time.substring(0,4) + '</span></li>';
				}
				eventList += '</ul><br />';
				
				
				ajax.open("GET", "https://graph.facebook.com/me/events/not_replied?access_token=" + accessToken, true);
				ajax.onreadystatechange = function () {
					if (ajax.readyState == 4 && ajax.status == 200) {
						events[1] = JSON.parse(ajax.responseText);
						eventList += '<h3>Not replied:</h3><ul style="list-style-type:circle;">';
						for (var i = events[1].data.length - 1; i >= 0; i--) {
							var evtName = toTitleCase(events[1].data[i].name);
							if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
							eventList += '<li class="listevent" onClick="openbox(' + events[1].data[i].id + ', \'' + evtName + '\')"><a style="color: #00a">' + evtName + '</a>' +
								 '<span>' + events[1].data[i].start_time.substring(8,10) + '/' + events[1].data[i].start_time.substring(5,7) + '/' + 
								  events[1].data[i].start_time.substring(0,4) + '</span></li>';
						}
						eventList += '</ul></div></div>';
				
						document.getElementById('listofevents').innerHTML = eventList;
					}
				}
				ajax.send(null);
			}
		}
		ajax.send(null);
	} else {
		document.getElementById('listofevents').innerHTML = "";
	}
	
}

/*
* Events handler
*/
function participateEvent (going) {
	if (going == 1) {
		$.ajax({
			url: "https://graph.facebook.com/" + $("#evtID")[0].value + "/attending",
			type: "POST",
			data: {
				access_token: accessToken,
			}
		}).done (function (msg) {
			if (msg == "true") {
				$("#evtGoing")[0].style.display = "none";
				$("#evtMaybe")[0].style.display = "block";
				$("#evtNGoing")[0].style.display = "block";
			}
		});
	} else if (going == 2) {
		$.ajax({
			url: "https://graph.facebook.com/" + $("#evtID")[0].value + "/attending",
			type: "POST",
			data: {
				access_token: accessToken,
			}
		}).done (function (msg) {
			if (msg == "true") {
				$("#evtGoing")[0].style.display = "block";
				$("#evtMaybe")[0].style.display = "none";
				$("#evtNGoing")[0].style.display = "block";
			}
		});
	} else if (going == 3) {
		$.ajax({
			url: "https://graph.facebook.com/" + $("#evtID")[0].value + "/declined",
			type: "POST",
			data: {
				access_token: accessToken,
			}
		}).done (function (msg) {
			if (msg == "true") {
				$("#evtGoing")[0].style.display = "block";
				$("#evtMaybe")[0].style.display = "block";
				$("#evtNGoing")[0].style.display = "none";
			}
		});
	}
}
