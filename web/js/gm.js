/*
	Script que controla o google maps
*/

var map;	//Variavel que guarda o mapa
var personMarker;	//Variavel que guarda o marcador da pessoa
var pointInterestMarker = []; //Array com os marcadores dos pontos de interesse
var pointInterestName = []; //Array com os nomes dos pontos de interesse, adicione nomes aqui!
var pointInterestInfoWindow = []; //Array com as infoWindows dos pontos de interesse (index equivalente)
var ownEventMarker = [];
var ownEventInfoWindow = [];
var directionDisplay;
var directionsService = new google.maps.DirectionsService();
var trajetoriaExistente=false;
var ultimaLatitude;
var ultimaLongitude;
var aba2=document.getElementById("aba2");
var lastTravelMode;
var radioValue;

function initializeGM() {
        var mapOptions = {
			zoom: 13,
			panControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},
			zoomControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT
			},
			mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(document.getElementById('map'),mapOptions);

        // Try HTML5 geolocation
        if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

				personMarker = new google.maps.Marker({
					position: pos, 
					map: map, 
					draggable:true,
					title:"You",
					icon: "img/person.png"
				});

				map.setCenter(pos);
			});
			
			map.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('top'));
			map.controls[google.maps.ControlPosition.LEFT].push(document.getElementById('menu'));
			
		}
		
		var render = {
			map: map,
			suppressMarkers: true
		};
		directionsDisplay = new google.maps.DirectionsRenderer(render);
		
}

function updateTrajetoria(value) {

	radioValue=value;
	var permiteTrajectoria=false;
	
	if(trajetoriaExistente==false) ;
	
	else{		

		if (value==1 && lastTravelMode =='walking'){
			
			lastTravelMode='driving';
			permiteTrajectoria=true;
			
		
		} 
		else if(value==2 && lastTravelMode =='driving'){		
			
			lastTravelMode='walking';
			permiteTrajectoria=true;
			
		
		}
		
		if(permiteTrajectoria==true){
			
			var start = personMarker.getPosition();			
			var end = new google.maps.LatLng (ultimaLatitude, ultimaLongitude);
	
			var travelMode;
	
			if ($('#routeDriving').is(':checked')) {
				travelMode = google.maps.DirectionsTravelMode.DRIVING;
				lastTravelMode='driving';
			}
			else {		
				travelMode = google.maps.DirectionsTravelMode.WALKING;
				lastTravelMode='walking';
			}
	
			var request = {
				origin: start,
				destination: end,
				travelMode: travelMode
			};
	
			directionsService.route(request, function(response, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					
					directionsDisplay.setDirections(response);
					
					trajetoriaExistente=true;
					ultimaLatitude=ultimaLatitude;
					ultimaLongitude=ultimaLongitude;
				
					var distancia=response.routes[0].legs[0].distance.text;
					var duracao= response.routes[0].legs[0].duration.text;
					
					$("#aba2route").html('<br><font size="3" color="#3050F8"> <li><p> Route Distance: &nbsp <font color="#000080 "><b>' +distancia+'</font>');
					$("#aba2route").append('<font size="3" color="#3050F8"> <li><p> Route Time:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp <font color="#000080 "><b>' +duracao+'</font>');
				
					if (radioValue==2){				
						document.getElementById('routeDriving').checked = false;
						document.getElementById('routeWalking').checked = true;
					}
					else if(radioValue==1){				
						document.getElementById('routeDriving').checked = true;
						document.getElementById('routeWalking').checked = false;
					}
					closebox();
				}	
			});
		}
		else alert('Travel mode already in use');
	}			
}


function traceRoute (lat, lng) {

	var start = personMarker.getPosition();
    var end = new google.maps.LatLng (lat, lng);
	
    var travelMode;
	
	if ($('#routeDriving').is(':checked')){
		
		travelMode = google.maps.DirectionsTravelMode.DRIVING;
		lastTravelMode='driving';
		
		}
		
	else{		
		travelMode = google.maps.DirectionsTravelMode.WALKING;
		lastTravelMode='walking';
		
		}
	
    var request = {
        origin: start,
        destination: end,
        travelMode: travelMode
    };
	
    directionsService.route(request, function(response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
					
			trajetoriaExistente=true;
			ultimaLatitude=lat;
			ultimaLongitude=lng;
			
			var distancia=response.routes[0].legs[0].distance.text;
			var duracao= response.routes[0].legs[0].duration.text;
			
			document.getElementById("evtCover").innerHTML += '<br><font size="3" color="#3050F8"> <li><p> Route Distance: &nbsp <font color="#000080 "><b>' +distancia+'</font>';
			document.getElementById("evtCover").innerHTML += '<br><font size="3" color="#3050F8"> <li><p> Route Time:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp <font color="#000080 "><b>' +duracao+'</font>';
						
			$("#aba2route").html('<br><font size="3" color="#3050F8"> <li><p> Route Distance: &nbsp <font color="#000080 "><b>' +distancia+'</font>');
			$("#aba2route").append('<font size="3" color="#3050F8"> <li><p> Route Time:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp <font color="#000080 "><b>' +duracao+'</font>');
			
			setTimeout(function() {closebox();},5000);
			
			google.maps.event.addListener (personMarker, 'dragend', function (evt) {
				traceRoute (ultimaLatitude, ultimaLongitude);
			});
			
        }
    });
}

function checkRadius(radius) {
	var R = 6371;
	var latPerson = personMarker.getPosition().lat() * Math.PI / 180;
	var lngPerson = personMarker.getPosition().lng() * Math.PI / 180;
	
	//Vermelhos
	for (var i = 0; i < pointInterestMarker.length; i++) {
		if (pointInterestMarker[i]) {
			var latMark = pointInterestMarker[i].getPosition().lat() * Math.PI / 180;
			var lngMark = pointInterestMarker[i].getPosition().lng() * Math.PI / 180;

			var dLat = latPerson - latMark;
			var dLng = lngPerson - lngMark;

			var a = Math.pow(Math.sin(dLat/2), 2) + 
					Math.pow(Math.sin(dLng/2), 2)*Math.cos(latMark)*Math.cos(latPerson);
			var c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			var d = c * R;
			if (d > radius && radius != 0)
				pointInterestMarker[i].setMap(null);
			else 
				pointInterestMarker[i].setMap(map);
		}
	}
	
	//Azuis
	for (var i = 0; i < ownEventMarker.length; i++) {
		if (ownEventMarker[i]) {
			var latMark = ownEventMarker[i].getPosition().lat() * Math.PI / 180;
			var lngMark = ownEventMarker[i].getPosition().lng() * Math.PI / 180;

			var dLat = latPerson - latMark;
			var dLng = lngPerson - lngMark;

			var a = Math.pow(Math.sin(dLat/2), 2) + 
					Math.pow(Math.sin(dLng/2), 2)*Math.cos(latMark)*Math.cos(latPerson);
			var c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

			var d = c * R;
			if (d > radius && radius != 0)
				ownEventMarker[i].setMap(null);
			else 
				ownEventMarker[i].setMap(map);
		}
	}
	
	google.maps.event.addListener (personMarker, 'dragend', function (evt) {
       checkRadius (radius);
    });
	
}
