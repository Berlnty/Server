var express= require('express');
var socket=require('socket.io');
var mysql = require('mysql');
var body_parser=require('body-parser');
var hashInt = require("hash-int");
var url =require('url');
var session = require('express-session');
var cookieParser = require('cookie-parser');

//create empty array
function makeArray(w, h,callback) {
    var arr = [];
    for(var i = 0; i < h; i++) {
        arr[i] = [];
        for(var j = 0; j < w; j++) arr[i][j] = 0;
    }
    callback(null,arr);
}

//mysql server
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "os_project"
});

con.connect(function(err) {
    if (err)console.log('there is no database connection');
});

//server
var app=express();

app.set('view engine','ejs');
//sessions
app.set('trust proxy', 1) ;
app.use(cookieParser());
app.use(session({
    secret: 'max',
    resave: false,
    saveUninitialized: false
}));

var urlencodedParser = body_parser.urlencoded({ extended: false });
var rooms=new Map();

var server= app.listen(3000,'192.168.1.73',function(){
  console.log('server is running');
});

app.use(express.static('public'));

app.get('/',function (req,res) {
   res.render('index');
});

app.post('/login',urlencodedParser,function (req,res) {

    req.session.user_name=req.body.user_name;
    req.session.user_id=req.body.user_id;
    req.session.type=req.body.type;
    console.log(req.session.user_name);
    res.redirect('/rooms');
});

app.get('/login',function (req,res) {
    console.log(req.session.user_name);
    res.render('login',{id:1,name:req.session.user_name,pass:req.session.password});
});

app.get('/rooms',function (req,res) {
    var rooms_Data=[],i=0;
    var keys=rooms.keys();
    while(rooms.size>i)
    {
        var room_key=keys.next().value;
        rooms_Data.push({room_key:room_key,room_name:rooms.get(room_key).name,creator_name:rooms.get(room_key).creator_name});
        ++i;
    }
    res.render('rooms',{rooms:rooms_Data});
});


app.post('/room',urlencodedParser,function (req,res) {
    var sql="insert into rooms(creator_id,name) values(?,?)";
    con.query(sql,[req.session.user_id,req.body.room_name],function (err,result) {
        if(err) console.log(err.message);
        else
            {
            var room_id = result.insertId;
            var new_room = hashInt(room_id);
            makeArray(500,500,function (err,result) {
                rooms.set(new_room.toString(),{creator: req.session.user_id,creator_name:req.session.user_name, name: req.body.room_name,data:result});
            });
        }
        res.redirect('/room?room='+new_room);
    });
});

app.get('/room',function (req,res) {
    var sql="insert ignore into room_user(user_id,room_id) values(?,?)";
    con.query(sql,[req.session.user_id,req.query.room],function (err,result) {
       if(err) console.log(err.message);
       res.render('room');
    });
});






//socket setup
var io=socket(server);


io.on('connection',function(socket){

  var url_parts = url.parse(socket.request.headers.referer, true);
  var query = url_parts.query;
  var id = query.room;

  if(rooms.has(id))
  socket.join(id.toString(),function () {
    // io.sockets.in(id.toString()).emit('message','a user has joined the room');
     console.log(rooms.get(id.toString()).data);
      socket.emit('enter',{image:rooms.get(id.toString()).data});
  });
  else socket.disconnect();

    socket.on('mouse', function(ev) {
    //    console.log("Received: 'mouse' " + ev.pageX + " " + ev.pageY+" "+ev.type);
            var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
            rooms.get(room_name.toString()).data[ev.pageX][ev.pageY]=ev.color;
            io.sockets.in(room_i).emit('mouse', {ev});
        }
    );

  socket.on('close',function () {
      var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
      var users=io.sockets.Clients(room_name);
      rooms.delete(room_name);

      if(user_id==rooms[room_name].creator)
      {
          for(var i = 0; i < users.length; i++)
          {
              io.sockets.socket(users[i]).disconnect();
          }
      }
    });

  socket.on('leave',function()
  {
      socket.disconnect();
  });

  socket.on('disconnect',function () {
      //room name
      var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
      //my id
      if(io.sockets.clients(room_name).length<=1)
      {
          rooms.delete(room_name);
      }
      alert('Server disconnected! Check your net connection');
      window.location = "l";
  });
});
