/*
	Script que controla o facebook
*/

var accessToken = null;

//var appAccessToken = '360645504021378|AX7rwsNnl0VBUwDGVUxb5p0Vwfc';   //App AroundME
var appAccessToken = '462700473780045|CoNNZdtH11hwDxK7D6DbPL2msHo';
function initializeFB() {
	// init the FB JS SDK
	var actoken;
	FB.init({
	  //appId		 : '360645504021378', // App AroundME
	  appId      : '462700473780045',
	  channeUrl  : 'http://localhost', //App AroundME
	  status     : true, // check the login status upon init?
	  cookie     : true, // set sessions cookies to allow your server to access the session?
	  xfbml      : true  // parse XFBML tags on this page?
	});

	FB.getLoginStatus(function (response) {
		if (response.authResponse) {
			accessToken = response.authResponse.accessToken;
			console.log ("Token: " + accessToken);
			for (var i = 0; i < pointInterestName.length; i++)
				findInterestsMarks(i);
			catchOwnEvents();
		} else {
			accessToken = appAccessToken;
			for (var i = 0; i < pointInterestName.length; i++)
				findInterestsMarks(i);
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

/*
	Função que localiza e marca os pontos de interesse
*/
function findInterestsMarks (i) {
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/" + pointInterestName[i] + "?access_token=" + accessToken, true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var interesting = JSON.parse(ajax.responseText);
			var marker = new google.maps.Marker ({
				position: new google.maps.LatLng (interesting.location.latitude, interesting.location.longitude),
				map: map,
				title: interesting.name,
				icon: "img/places.png"
			});
			pointInterestMarker[i] = marker;
			findInterestsEvents(i);
		}
	}
	ajax.send(null);
}

/*
	Função que localiza e cria as infoWindows com a lista de eventos nos pontos de interesse
*/
function findInterestsEvents (i) {
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
	ajax.open ("GET", "https://graph.facebook.com/" + pointInterestName[i] + "/events?access_token=" + accessToken, true);
	console.log("https://graph.facebook.com/" + pointInterestName[i] + "/events?access_token=" + accessToken);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var events = (JSON.parse(ajax.responseText)).data;
			var eventList = '<ul style="list-style-type:circle;">';
			for (var j = events.length - 1; j >= 0; j--) {
				if (events[j].start_time >= today)
					eventList += '<li><a href="#" onClick="openbox(\'Title of the Form\', 1)">' + events[j].name + '</a> - ' +
					events[j].start_time.substring(0,10) + '</li>';
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
			//console.log(i);
			ownEventMarker[i] = marker;
			infoOwnEvents(i, event);
		}
	}
	ajax.send(null);	
}

function  infoOwnEvents (i, event) {
	var description, time;
	if (event.description.length > 400) description = event.description.substring(0,400) + '<a target="_blank" href ="http://www.facebook.com/' + 
		event.id + '">...ver mais</a><br />';
	else description = event.description + '<br/><a target="_blank" href ="http://www.facebook.com/' + 
		event.id + '">...ver mais</a><br />';
	time = event.start_time.substring(8, 10) + '/' + event.start_time.substring(5, 7) + '/' + event.start_time.substring(0, 4) + 
		' - ' + event.start_time.substring(11, 16);
	var content = "<strong>" + event.name + "</strong><br /><i>" + time + "</i><br />" + description;

	var infoWindow = new google.maps.InfoWindow ({
		content: content
	});
	
	ownEventInfoWindow[i] = infoWindow;
	
	google.maps.event.addListener (ownEventMarker[i], 'click', function () { 
		ownEventInfoWindow[i].open(map, ownEventMarker[i]); 
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
function fillComboBox() {
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

	var i = select.value;
	if (i != -1) {
		var ajax = openAjax();
		ajax.open ("GET", "https://graph.facebook.com/" + pointInterestName[i] + "/events?access_token=" + accessToken, true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var events = (JSON.parse(ajax.responseText)).data;
				var eventList = '<ul style="list-style-type:circle;">';
				for (var j = events.length - 1; j >= 0; j--) {
					if (events[j].start_time >= today)
						eventList += '<li><a target="_blank" href=http://www.facebook.com/' + events[j].id + '>' + events[j].name + '</a> - ' +
						events[j].start_time.substring(0,10) + '</li>';
				}
				eventList += '</ul>';
				
				document.getElementById('listofevents').innerHTML = eventList;
				
			}
		}
		ajax.send(null);
	} else {
		document.getElementById('listofevents').innerHTML = "";
	}
	
}
