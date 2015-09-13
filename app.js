var express = require('express');
var app = express();

var path = require('path');
// var users = require('./routes/users');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

// view engine setup
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(app.router); //deprecated
// Specify where the static content is
app.use(express.static(path.join(__dirname, 'public')));

/* Server routing */

// Handle route "GET /", as in "http://localhost:3000/"
app.get('/', function(req, res) {
  // Render the view called "index"
  res.render('index');
});

// Create database
db.serialize(function() {
  db.run("CREATE TABLE TENMESSAGES (NAME TEXT, MESSAGE TEXT, DATE LONG, DATES TEXT)");
  console.log("Message Database Created");
});

// Connecting the Chatroom with WebSockets
io.on('connection', function(client){

  // Notify when a user connects
  client.on('newuser', function(username){
    client.username = username;
    console.log(username + ' connected');

    // Print out the last ten messages from database
    db.each("SELECT * FROM (SELECT * FROM TENMESSAGES ORDER BY DATE DESC LIMIT 10) ORDER BY DATE ASC",
    function(err, row) {
      if(err !== null) {
        console.log(err);
      }
      else if (row != undefined){
        var messageType = 'userMessage';
        if (username == row.NAME) {
          messageType = 'myMessage';
        }

        var data = {
          nickname: row.NAME,
          message: row.MESSAGE,
          type: messageType,
          date: row.DATE,
          dateS: row.DATES
        };
        client.emit('chat message', data);
      }
    });
    
    // Print out welcome messages
    client.emit('newuser', 'Welcome, ' + username + '! You have connected to the server.');
    client.broadcast.emit('newuser', username + ' joined the chat room');

  });
  
  // Notify when a user disconnects
  client.on('disconnect', function(){
    console.log(client.username + ' disconnected');
    io.emit('disconnect', client.username + ' left the chat room');
  });
  
  // Log message on console and client side
  client.on('chat message', function(data){
      // console.log(client.username + ': ' + msg);
      data = JSON.parse(data);
      if (data.type == 'userMessage') {
          data.nickname = client.username;
          client.broadcast.emit('chat message', data);
          data.type = 'myMessage';
          client.emit('chat message', data);

          //Insert message into database
          var stmt = db.prepare("INSERT INTO TENMESSAGES VALUES (?,?,?,?)");
          stmt.run(client.username, data.message, data.date, data.dateS);
      }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


http.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});