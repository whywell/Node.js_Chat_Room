$(document).ready(function() {

	var socket = io();

	// Upon joining, emit the username

	var username = prompt("Please enter your name:");
	if (username == null || username == undefined || username == '') {
		username = 'Anonymous User';
	} 
	socket.emit('newuser', username);

	// jQuery function to scroll all the way down
	var scrollDown = function() {
		$('ul').animate({
             scrollTop: $('ul')[0].scrollHeight}, 1
        );
	}

	// When another user connects, display a related message
	socket.on('newuser', function(msg){
		$('#messages').append('<li class="system">' + msg + '</li>');
		scrollDown();
	});

	// When user submits a message, emit it to the server
	$('form').submit(function(){
		var d = new Date();
		var dateOptions = {
			weekday: "long", year: "numeric", month: "short", 
			day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
		};
		
		var data = {
			message: $('#m').val(),
			type: 'userMessage',
			date: d,
			dateS: d.toLocaleTimeString("en-us", dateOptions)
		};

		socket.emit('chat message', JSON.stringify(data));
		$('#m').val('');
		return false;
	});

	// When the server sends a message, display it
	socket.on('chat message', function(data){ 
		$('#messages').append('<li class="' + data.type + '"><span class="'+ data.type+'">' + data.nickname + ': </span>' 
			+ data.message + '<br/><span class="date">' +data.dateS + '</span></li>');
		scrollDown();
	});

	// When a user leaves, display a related message
	socket.on('disconnect', function(msg){
		$('#messages').append($('<li class="system">').text(msg));
		scrollDown();
	});

});

