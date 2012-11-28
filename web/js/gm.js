/*
	Script que controla o google maps
*/

var map;	//Variavel que guarda o mapa
var personMarker;	//Variavel que guarda o marcador da pessoa
var pointInterestMarker = []; //Array com os marcadores dos pontos de interesse
var pointInterestName = ["ColiseuPorto", "fundacaoserralves", "casadamusica"]; //Array com os nomes dos pontos de interesse, adicione nomes aqui!
var pointInterestInfoWindow = []; //Array com as infoWindows dos pontos de interesse (index equivalente)
var ownEventMarker = [];
var ownEventInfoWindow = [];

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
}

function test() {
	var menu = document.getElementById('menu');
	console.log("oi");
	if (menu.style.width == "20px")
		menu.style.width="200px";
	else
		menu.style.width="20px";
}