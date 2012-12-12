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
		setTimeout("gradient('" + id + "'," + level + ")", (level* 1000) + 10);
		level += 0.01;
	}
}

// Open the lightbox
function openbox(id, fb_id, name, lat, lng) {
	var box = document.getElementById('box'); 
	document.getElementById('shadowing').style.display='block';
	
	//Setando hidden e href
	$("#evtInvite").attr('onClick', 'openInviteBox("' + fb_id + '")');
	$("#evtID")[0].value = fb_id;
	$("#evtPage a")[0].href = "http://www.facebook.com/" + fb_id;
	if (lat && lng)
		$("#evtTrace").attr('onClick',"traceRoute (" + lat + "," + lng +");");
	else 
		$("#evtTrace").css ({'display' : 'none'});

	var ajax = openAjax();
	if (id == -1) {	//Se for um evento do usuário
		//Busca direto ao facebook
		ajax.open ("GET", "https://graph.facebook.com/" + fb_id + "?" +
				   "fields=attending.limit(101).fields(picture.type(square),name),description,picture.type(large),start_time&access_token="	+
				   accessToken, true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var reply = JSON.parse(ajax.responseText);
				
				//Criando cover
				var cover = '<div id="evtCoverImg"><img src="' + reply.picture.data.url + '" /></div>';
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
				
				generateParticipants (id, fb_id);
				document.getElementById("evtTitle").innerHTML = name;
				document.getElementById("evtDesc").innerHTML = desc;
				document.getElementById("evtCover").innerHTML = cover;
			}
		}
		ajax.send(null);
	} else { //Evento de ponto de interesse
		//Busca do server
		ajax.open ("GET", "http://around-me.herokuapp.com/events/" + id + ".json", true);
		ajax.onreadystatechange = function () {
			if (ajax.readyState == 4 && ajax.status == 200) {
				var reply = JSON.parse(ajax.responseText);
				
				//Criando cover
				var cover = '<img src="' + reply.picture_url + '" />';
				cover += '<div id="evtWhen"><img src="../img/when-day.png" />' + reply.start_time.substring(8,10) + 
						 '/' + reply.start_time.substring(5,7) + '/' + reply.start_time.substring(0,4);
				//console.log(reply.start_time.charCodeAt(11));
				if (reply.start_time.charCodeAt(11))
					cover += '<img src="../img/when-time.png" />' + reply.start_time.substring(11,16) + '</div>';
				
				//Editando descricao
				var desc;
				if (reply.description) {
					desc = '<h3>Description</h3><div id="evtDescWrap"><p>' + reply.description.replace (/\x0A\x0A/g, "<br /><br />") + '</p></div>';
					desc = desc.replace (/\s\s/g, "<br />");
				} else {
					desc = '<h3>Description</h3><div id="evtDescWrap"><p>There is no description for this event.</p></div>';
				}
				
				//Editando nome
				if (name.length > 45) name = name.substring(0,45) + "...";
				
				//Criando lista de participantes				
				generateParticipants (id, fb_id);
				
				document.getElementById("evtTitle").innerHTML = name;
				document.getElementById("evtDesc").innerHTML = desc;
				document.getElementById("evtCover").innerHTML = cover;
			}
		}
		ajax.send(null);
	}
	
	var ajaxUser = openAjax();
	if (userID != null) {		
		ajaxUser.open ("GET", "https://graph.facebook.com/" + fb_id + "/invited/" + userID + "?access_token=" + accessToken, true);
		ajaxUser.onreadystatechange = function () {
			if (ajaxUser.readyState == 4 && ajaxUser.status == 200) {
				var reply = JSON.parse(ajaxUser.responseText).data;
				if (!reply[0]) {
					document.getElementById('evtGoing').style.display = "block";
					document.getElementById('evtMaybe').style.display = "block";
				}
				else if (reply[0].rsvp_status == "attending") {
					document.getElementById('evtNGoing').style.display = "block";
					document.getElementById('evtMaybe').style.display = "block";
					$("#evtInvite")[0].style.display = "block";
				} else if (reply[0].rsvp_status == "unsure") {
					document.getElementById('evtGoing').style.display = "block";
					document.getElementById('evtNGoing').style.display = "block";
					$("#evtInvite")[0].style.display = "block";
				} else if (reply[0].rsvp_status == "declined" || reply[0].rsvp_status == "not_replied") {
					document.getElementById('evtGoing').style.display = "block";
					document.getElementById('evtMaybe').style.display = "block";
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
	document.getElementById("evtPart").innerHTML = '<h3>Attending ()</h3><ul id="partList"></ul><img style="display: block; margin: 0 auto;" src="img/loading.gif" />';
	document.getElementById("evtTitle").innerHTML = "";
	document.getElementById("evtDesc").innerHTML = "";
	document.getElementById("evtCover").innerHTML = "";
	document.getElementById('evtGoing').style.display = "none";
	document.getElementById('evtNGoing').style.display = "none";
	document.getElementById('evtMaybe').style.display = "none";
	document.getElementById('evtInvite').style.display = "none";
}

function openInviteBox (evtID) {
	$('#btnInviteList').attr('onclick', 'inviteList("' + evtID + '");');
	document.getElementById('shadowingmore').style.display='block';
	gradient("inviteBox", 0);
	fadein("inviteBox"); 
}

function closeInviteBox() {
	$('#inviteBox').css({'display' : 'none'});
	$('#shadowingmore').css({'display' : 'none'});
	$('#toInvite').html("");
	$("#liveSearch").html('<span style="color: #aaa; font-family: sans-serif; font-size: 12px">Type more 3 characters...</span>');
	$("#inviteBox :input").attr('value', '');
}