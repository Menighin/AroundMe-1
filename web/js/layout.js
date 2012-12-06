function showMenuTab (tab) {
	$(tab).animate({"left": "-10px"}, 100);
}
function hideMenuTab (tab) {
	$(tab).animate({"left": "-108px"}, 50);
}

$(function(){
	$("#nav-abas li").click(function(){ 
		if (!$(this).hasClass('current')) {
			$(".abas").animate({"left": "-530px"}, "fast");
			var div = $(this)[0].value;
			$("#aba"+div).animate({"left": "0px"}, "fast");
			$("#nav-abas li").removeClass('current');
			$(this).addClass('current');
		}
		return false;
	})
});

$(function(){
	$(".closebutton").click(function(){ 
		$(".abas").animate({"left": "-530px"}, "fast");
		$("#nav-abas li").removeClass('current');
		return false;
	})
});

function gradient(id, level)
{
	var box = document.getElementById(id);
	box.style.opacity = level;
	box.style.MozOpacity = level;
	box.style.KhtmlOpacity = level;
	box.style.filter = "alpha(opacity=" + level * 100 + ")";
	box.style.display="block";
	return;
}

function fadein(id) 
{
	var level = 0;
	while(level <= 1)
	{
		setTimeout( "gradient('" + id + "'," + level + ")", (level* 1000) + 10);
		level += 0.01;
	}
}

// Open the lightbox
function openbox(id, name, lat, lng) {
	var box = document.getElementById('box'); 
	document.getElementById('shadowing').style.display='block';
	
	//Setando hidden e href
	$("#evtID")[0].value = id;
	$("#evtPage a")[0].href = "http://www.facebook.com/" + id;
	$("#evtTrace").attr('onClick',"traceRoute (" + lat + "," + lng +");");
	
	var ajax = openAjax();
	ajax.open ("GET", "https://graph.facebook.com/" + id + "?" +
			   "fields=attending.limit(30).fields(picture.type(square),name),description,picture.type(large),start_time&access_token="	+
			   accessToken, true);
	ajax.onreadystatechange = function () {
		if (ajax.readyState == 4 && ajax.status == 200) {
			var reply = JSON.parse(ajax.responseText);
			
			//console.log(reply);
			
			//Criando cover
			var cover = '<img src="' + reply.picture.data.url + '" />';
			cover += '<div id="evtWhen"><img src="../img/when-day.png" />' + reply.start_time.substring(8,10) + 
				     '/' + reply.start_time.substring(5,7) + '/' + reply.start_time.substring(0,4);
			//console.log(reply.start_time.charCodeAt(11));
			if (reply.start_time.charCodeAt(11))
				cover += '<img src="../img/when-time.png" />' + reply.start_time.substring(11,16) + '</div>';
			
			//Editando descricao
			var desc = '<h3>Description</h3><div id="evtDescWrap"><p>' + reply.description.replace (/\x0A\x0A/g, "<br /><br />") + '</div></p>';
			desc = desc.replace (/\s\s/g, "<br />");
			
			//Editando nome
			if (name.length > 45) name = name.substring(0,45) + "...";
			
			//Criando lista de participantes
			var participants = '<h3>Attending</h3><ul id="partList">';
			if (reply.attending) 
				for (var i = 0; i < reply.attending.data.length; i++) {
					participants += '<li><a target="_blank" href="http://www.facebook.com/' + reply.attending.data[i].id + '">' +
						'<img width="36" height="36" src="' + reply.attending.data[i].picture.data.url + '" title="' + reply.attending.data[i].name + '"/></a></li>';
				}
			else {
				participants += '<li><p>Nobody is going to this event yet</p></li>';
			}
			
			participants += "</ul>";
			document.getElementById("evtTitle").innerHTML = name;
			document.getElementById("evtDesc").innerHTML = desc;
			document.getElementById("evtCover").innerHTML = cover;
			document.getElementById("evtPart").innerHTML = participants;
		}
	}
	ajax.send(null);
	
	var ajaxUser = openAjax();
	if (userID != null) {		
		ajaxUser.open ("GET", "https://graph.facebook.com/" + id + "/attending/" + userID + "?access_token=" + accessToken, true);
		ajaxUser.onreadystatechange = function () {
			if (ajaxUser.readyState == 4 && ajaxUser.status == 200) {
				var reply = JSON.parse(ajaxUser.responseText);
				if (reply.data[0]) {
					document.getElementById('evtNGoing').style.display = "block";
					document.getElementById('evtMaybe').style.display = "block";
				} else {
					var ajaxUserMaybe = openAjax();
					ajaxUserMaybe.open ("GET", "https://graph.facebook.com/" + id + "/maybe/" + userID + "?access_token=" + accessToken, true);
					ajaxUserMaybe.onreadystatechange = function () {
						if (ajaxUserMaybe.readyState == 4 && ajaxUser.status == 200) {
							var reply2 = JSON.parse(ajaxUserMaybe.responseText);
							if (reply2.data[0]) {
								document.getElementById('evtGoing').style.display = "block";
								document.getElementById('evtNGoing').style.display = "block";
							} else {
								document.getElementById('evtGoing').style.display = "block";
								document.getElementById('evtMaybe').style.display = "block";
							}
						}
					}
					ajaxUserMaybe.send(null);
				}
			}
		}
		ajaxUser.send(null)
	}
	gradient("box", 0);
	fadein("box"); 	
}

// Close the lightbox
function closebox() {
	document.getElementById('box').style.display='none';
	document.getElementById('shadowing').style.display='none';
	document.getElementById("evtPart").innerHTML = "";
	document.getElementById("evtTitle").innerHTML = "";
	document.getElementById("evtDesc").innerHTML = "";
	document.getElementById("evtCover").innerHTML = "";
	document.getElementById('evtGoing').style.display = "none";
	document.getElementById('evtNGoing').style.display = "none";
	document.getElementById('evtMaybe').style.display = "none";
}