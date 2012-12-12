/*
	Script que controla o facebook
*/

var accessToken = null;
var userID = null;

var appAccessToken = '360645504021378|AX7rwsNnl0VBUwDGVUxb5p0Vwfc';   //App AroundME
//var appAccessToken = '462700473780045|CoNNZdtH11hwDxK7D6DbPL2msHo'; //TestApp
//var appAccessToken = '395956050472783|mzEeKmgXugIxeAYJfVrwGGLfBOc';
function initializeFB() {
	// init the FB JS SDK
	var actoken;
	FB.init({
	  appId		 : '360645504021378', // App AroundME
	  //appId      : '462700473780045', //TestApp
	  //appId		 : '395956050472783', //TestApp2
	  channeUrl  : 'http://gnomo.fe.up.pt/~ext12167/LDSO', //App AroundME
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

//Quando usuário faz o login, mostra seus eventos sem reload
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
* Preenche dinamicamente combobox no menu para listar os pontos de interesse
*/
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
* Função que localiza e marca os pontos de interesse
*/
function findInterestsMarks (i) {
	var ajax = openAjax();
	ajax.open ("GET", "http://around-me.herokuapp.com/landmarks/" + pointInterestName[i] + ".json", true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var interesting = JSON.parse(ajax.responseText);
			if (interesting.location_latitude && interesting.location_longitude) {
				var marker = new google.maps.Marker ({
					position: new google.maps.LatLng (interesting.location_latitude, interesting.location_longitude),
					map: map,
					title: interesting.name,
					icon: "img/places.png"
				});
				console.log('red marked - ' + pointInterestName[i]);
				pointInterestMarker[i] = marker;
				findInterestsEvents(i, interesting.location_latitude, interesting.location_longitude);
			}
		}
	}
	ajax.send(null);
}

/*
* Função para passar texto para Title Case
*/
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
	var hasEvent = false;
	//Gerando data de hoje para comparar
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
	ajax.open ("GET", "http://around-me.herokuapp.com/landmarks/" + pointInterestName[i] + "/events.json", true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var events = (JSON.parse(ajax.responseText));
			var eventList = '<ul>';
			for (var j = events.length - 1; j >= 0; j--) {
				if (events[j].start_time >= today) {
					hasEvent = true;
					var evtName = toTitleCase(events[j].name);
					evtName = evtName.replace ("'", "");
					if (evtName.length > 40) evtName = evtName.substring(0, 40) + '...';
					var evtDate = events[j].start_time.substring(0,10);
					eventList += '<li class="listevent" onClick="openbox(' + events[j].id + ', ' + events[j].fb_id + ', \'' + evtName + '\',' + lat + ',' + lng + ')"><a>' + evtName + '</a>' +
					'<span>' + evtDate.substring(8,10) + '/' + evtDate.substring(5,7) + '/' + evtDate.substring(0,4) + '</span></li>';
				}
			}
			
			if (!hasEvent)
				eventList += '<li>There is no future events on this place</li>';
			
			eventList += '</ul>';
			
			//Balão do google maps com a lista de eventos do ponto de interesse
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
* Pega a lista de eventos replied e not_replied do usuário
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

/*
* Busca a página do evento do usuário para posteriormente encontrar sua localização
*/
function findOwnEvents (id, i) {
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/" + id + "?access_token=" + accessToken, true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var eventLocation = JSON.parse (ajax.responseText);
			if (eventLocation.venue && eventLocation.venue.id) //Se o evento tiver uma latitude e longitude, marca no mapa
				markOwnEvents(eventLocation.venue.id, eventLocation, i);
		}
	}
	ajax.send(null);
}

/*
*	Marca localização dos eventos do usuário
*/
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
			
			//Se já tiver um marcador vermelho próximo, retira o azul (caso o usuário vá a um evento de um ponto de interesse seria um problema
			if (hasAlreadyRed(place.location.latitude, place.location.longitude))
				marker.setMap(null)
			ownEventMarker[i] = marker;
			infoOwnEvents(i, event, place.location.latitude, place.location.longitude);
		}
	}
	ajax.send(null);	
}


/*
* Checa se há um ponto de interesse no local
*/ 
function hasAlreadyRed (lat, lng) {
	for (var i = 0; i < pointInterestMarker.length; i++) {
		if (pointInterestMarker[i]) {
			var diffLat = Math.abs(pointInterestMarker[i].getPosition().lat() - lat);
			var diffLng = Math.abs(pointInterestMarker[i].getPosition().lng() - lng);
			if (diffLat < 0.00001 && diffLng < 0.00001) {
				return true;
			}
		}
	}
	return false;
}

/*
*	Adiciona o listener para abrir o Light Box com infos do evento do usuário selecionado
*/
function  infoOwnEvents (i, event, lat, lng) {
	google.maps.event.addListener (ownEventMarker[i], 'click', function () { 
		var evtName = toTitleCase(event.name);
		openbox(-1, event.id, evtName, lat, lng);
	});
}

/*
* Esconder / Mostrar marcadores azuis
*/
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
	if (i >= 0) { //Pontos de interesse
		var ajax = openAjax();
		ajax.open ("GET", "http://around-me.herokuapp.com/landmarks/" + pointInterestName[i] + "/events.json", true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var events = JSON.parse(ajax.responseText);
				var eventList = '<div id="listWrapper"><div id="list"><ul">';
				for (var j = events.length - 1; j >= 0; j--) {
					if (events[j].start_time >= today) {
						var evtName = toTitleCase(events[j].name);
						evtName = evtName.replace ("'", "");
						if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
						eventList += '<li class="listevent" onClick="openbox(' + events[j].id + ', ' + events[j].fb_id + ', \'' + evtName + '\')"><a>' + evtName + '</a>' +
							'<span>' + events[j].start_time.substring(8,10) + '/' + events[j].start_time.substring(5,7) + '/' + 
							events[j].start_time.substring(0,4) + '</span></li>';
					}
				}
				eventList += '</ul></div></div>';
				document.getElementById('listofevents').innerHTML = eventList;
				
			}
		}
		ajax.send(null);
	} else if (i == -1) { //User events
		var ajax = openAjax();
		ajax.open ("GET", "https://graph.facebook.com/me/events?access_token=" + accessToken, false);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				events[0] = JSON.parse (ajax.responseText);
				
				var eventList = '<div id="listWrapper"><div id="list"><h3>Replied:</h3><ul>';
				for (var i = events[0].data.length - 1; i >= 0; i--) {
					var evtName = toTitleCase(events[0].data[i].name);
					evtName = evtName.replace ("'", "");
					if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
					eventList += '<li class="listevent" onClick="openbox(-1,' + events[0].data[i].id + ', \'' + evtName + '\')"><a style="color: #00a">' + evtName + '</a>' +
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
							evtName = evtName.replace ("'", "");
							if (evtName.length > 30) evtName = evtName.substring(0, 30) + '...';
							eventList += '<li class="listevent" onClick="openbox(-1, ' + events[1].data[i].id + ', \'' + evtName + '\')"><a style="color: #00a">' + evtName + '</a>' +
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
	} else { //Branco
		document.getElementById('listofevents').innerHTML = "";
	}
	
}

/*
* Função para realizar POSTs quando o usuário clica em ir/não ir/talvez a um evento
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
				$("#evtInvite")[0].style.display = "block";
			}
		});
	} else if (going == 2) {
		$.ajax({
			url: "https://graph.facebook.com/" + $("#evtID")[0].value + "/maybe",
			type: "POST",
			data: {
				access_token: accessToken,
			}
		}).done (function (msg) {
			if (msg == "true") {
				$("#evtGoing")[0].style.display = "block";
				$("#evtMaybe")[0].style.display = "none";
				$("#evtNGoing")[0].style.display = "block";
				$("#evtInvite")[0].style.display = "block";
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
				$("#evtInvite")[0].style.display = "none";
			}
		});
	}
}

/*
*	Gera lista de usuário attending aos eventos
*/
function generateParticipants (id, fb_id) {
	if (!userID) { //Quando usuário não está logado
		var ajaxAttending = openAjax();
		ajaxAttending.open ("GET", "https://graph.facebook.com/" + fb_id + "?" +
			"fields=attending.limit(101).fields(picture.type(square),name)&access_token=" + accessToken, true);
		ajaxAttending.onreadystatechange = function () {
			if (ajaxAttending.readyState == 4 && ajaxAttending.status == 200) {
				var replyAtt = JSON.parse(ajaxAttending.responseText);
				var npart = replyAtt.attending.data.length < 100 ? replyAtt.attending.data.length : '100+';
				var participants = '<h3>Attending (' + npart + ')</h3><ul id="partList">';
				if (replyAtt.attending) {
					for (var i = 0; i < replyAtt.attending.data.length; i++) {
						participants += '<li><a target="_blank" href="http://www.facebook.com/' + replyAtt.attending.data[i].id + '">' +
							'<img width="36" height="36" src="' + replyAtt.attending.data[i].picture.data.url + '" title="' + replyAtt.attending.data[i].name + '"/></a></li>';
					}
				}
				else {
					participants += '<li><p>Nobody is going to this event yet</p></li>';
				}
				participants += "</ul>";
				document.getElementById("evtPart").innerHTML = participants;
			}
		}
		ajaxAttending.send(null);
		
	} else { //Quando usuário está logado
		var friends = "";
		var others = "";
		var control = 0;
		var npart = 0;
		
		//Pegando os amigos primeiro
		var ajaxFriends = openAjax();
		ajaxFriends.open ("GET", "https://graph.facebook.com/fql?q=select name, pic_square, uid from user where uid IN (select uid from event_member where eid = " + fb_id + 
			" and rsvp_status = 'attending' and uid IN (SELECT uid2 from friend where uid1 = me()));" +
			"&access_token=" + accessToken, true);
		ajaxFriends.onreadystatechange = function () {
			if (ajaxFriends.readyState != 4) {
				$('#partList').css({'background-color' : 'red'});
			}
			else if (ajaxFriends.readyState == 4) {
				$('#partList').css({'background-color' : 'white'});
				if (ajaxFriends.status == 200) {
					var replyF = JSON.parse(ajaxFriends.responseText);
					for (var i = 0; i < replyF.data.length; i++) {
						friends += '<li><a target="_blank" href="http://www.facebook.com/' + replyF.data[i].uid + '">' +
							'<img width="36" height="36" src="' + replyF.data[i].pic_square + '" title="' + replyF.data[i].name + '"/></a></li>';
					}
					control++;
					npart += replyF.data.length;
					buildParticipantsList (friends, others, control, npart);
				}
			}
		}
		ajaxFriends.send(null);
		
		//Pegando resto do pessoal
		var ajaxAttending = openAjax();
		ajaxAttending.open ("GET", "https://graph.facebook.com/" + fb_id + "?" +
			"fields=attending.limit(101).fields(picture.type(square),name)&access_token=" + accessToken, true);
		ajaxAttending.onreadystatechange = function () {
			if (ajaxAttending.readyState == 4 && ajaxAttending.status == 200) {
				var replyAtt = JSON.parse(ajaxAttending.responseText);
				if (replyAtt.attending) {
					for (var i = 0; i < replyAtt.attending.data.length; i++) {
						others += '<li><a target="_blank" href="http://www.facebook.com/' + replyAtt.attending.data[i].id + '">' +
							'<img width="36" height="36" src="' + replyAtt.attending.data[i].picture.data.url + '" title="' + replyAtt.attending.data[i].name + '"/></a></li>';
					}
					npart += replyAtt.attending.data.length;
				}
				control++;
				buildParticipantsList (friends, others, control, npart);
			}
		}
		ajaxAttending.send(null);
	}
}

//Montando lista de amigos
function buildParticipantsList (friends, others, ctrl, npart) {
	if (ctrl == 2) {
		$('#evtPart img').css({'display' : 'none'});
		var countpart = npart < 100 ? npart : '100+';
		$('#evtPart h3').html("Attending (" + countpart + ")");
		if (!friends && !others)
			$('#partList').append('<li><p>Nobody is going to this event yet</p></li>');
		else {
			if (friends) $('#partList').append(friends);
			if (others) $('#partList').append(others);
		}
	}
}

/*
*	Busca dinamica de amigos para convidá-los
*/
function dynamicSearch (str) {
	if (str.length >= 3) {
		var ajax = openAjax();
		ajax.open ("GET", 'https://graph.facebook.com/fql?q=SELECT name, uid, pic_square from user WHERE ' +
			'strpos(lower(name), lower("' + str + '")) >= 0 AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())&access_token=' + accessToken, true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var reply = JSON.parse(ajax.responseText);
				var names = "";
				for (var i = 0; i < reply.data.length; i++) {
					var li = '<li class="friendsList">' + 
						'<a target="_blank" href="http://www.facebook.com/' + reply.data[i].uid + '">' + 
						'<img width="36" height="36" src="' + reply.data[i].pic_square + '" /></a>' + 
						'<a class="aName" target="_blank" href="http://www.facebook.com/' + 
						reply.data[i].uid + '">' + reply.data[i].name + 
						'</a><div onclick="addFriendInvite(\'' + reply.data[i].uid+ '\', \'' + reply.data[i].name + '\');" class="inviteIcon">+</div></li>'; 
					names += li;
				}
				if (names != "")
					$('#liveSearch').html(names);
				else
					$('#liveSearch').html('<span style="color: #aaa; font-family: sans-serif; font-size: 12px">You don\'t have friends with that name.</span>');
			}
		}
		ajax.send(null);	
	} else {
		var n = 3 - str.length;
		$('#liveSearch').html('<span style="color: #aaa; font-family: sans-serif; font-size: 12px">Type more ' + n + ' characters...</span>');
	}
}

/*
*	Adicionando e removendo amigos a lista de convidados
*/
function addFriendInvite(uid, name) {
	var repeated = false;
	//Não adicionar repetido
	$('#toInvite li').each(function(index) {
		if (uid == this.firstElementChild.value)
			repeated = true;
	});
	if (repeated) return;
	var li = '<li class="toInviteFriend">' + name + '<input type="hidden" value="' + uid + 
		'"/><a onclick="removeFriendInvite(this.parentNode);">x</a></li>';
	$('#toInvite').append(li);
}
function removeFriendInvite(li) {
	$(li).remove();
}
/*
*	Finalmente convidando
*/
function inviteList(evtID) {
	var param = "";
	$('#toInvite li').each(function(index) {
		if (param == "")
			param += this.firstElementChild.value;
		else 
			param += "," + this.firstElementChild.value;
	});
	if (param != "") {
		$.ajax({
			url: "https://graph.facebook.com/" + evtID + "/invited?users=" + param,
			type: "POST",
			data: {
				access_token: accessToken,
			}
		}).done (function (msg) {
			if (msg == "true")
				$('#toInvite').html("");
		});
	}
}