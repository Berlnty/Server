var express = require('express');
var app = express();
var bodyParser = require('body-parser');
let http = require('http').Server(app);
var mysql = require('mysql');
var fs=require('fs');
var cors=require('cors');
var hashInt = require("hash-int");
var url =require('url');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var rooms=[];
app.use(bodyParser.json());
//mysql server
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "os_project"
});

// Set up the server

var server = app.listen(3000,'127.0.0.1');

con.connect(function(err) {
    if (err)console.log('there is no database connection');
});
//sessions
app.set('trust proxy', 1) ;
app.use(cookieParser());
app.use(session({
    secret: 'max',
    resave: false,
    saveUninitialized: false
}));


app.use(cors());
//create empty array
function makeArray(w, h,callback) {
    var arr = [];
    for(var i = 0; i < h; i++) {
        arr[i] = [];
        for(var j = 0; j < w; j++) arr[i][j] = 0;
    }
    callback(null,arr);
}

app.get('/login', function(req, res) {
 let user=req.query.user;
 let pass=req.query.pass;
 let sql="SELECT `id`, `username`, `type`,`note_book` FROM `users` WHERE `username`='"+user+"' AND  `password`='"+pass+"';";

 let check=false;
 let data;
  con.query(sql,function(err,result){
					
                  if(err) console.log(sql);
				  
                else if(result.length >0) {
					check=true;
				
                    req.session.user_name=result[0].username;
                    req.session.user_id=result[0].id;
                    req.session.type=result[0].type;
                    req.session.notebook=result[0].note_book;

					res.json({"check": check,"data":result});
				
				}
				else res.json({"check": check});
});
 
 //res.json({"check": check,"data":data});
 
});

app.get('/register', function(req, res) {
 let user=req.query.user;
 let pass=req.query.pass;
 let type=req.query.type;
 let sql;
  let check=false;
 let data;
 sql=	"SELECT `id`, `username`, `type`,`note_book` FROM `users` WHERE `username`='"+user+"';";
  con.query(sql,function(err,result){
	    if(err) console.log(sql);
	  else if (result.length >0){
		  return res.json({"check": false,"data":"user name is already taken"});
		  
		  
	  }
	  else{
		  sql=" INSERT INTO `users`(`username`, `password`, `type`) VALUES ('"+user+"','"+pass+"','"+type+"');";

  con.query(sql,function(err,result){
					
                 if(err) console.log(sql);
				  
                else  {
				sql=	"SELECT `id`, `username`, `type`,`note_book` FROM `users` WHERE `username`='"+user+"' AND  `password`='"+pass+"';";
				 con.query(sql,function(err,result){
					   if(err) console.log(sql);
					   else if (result.length >0){
						   check=true;
						res.json({"check": check,"data":result});
				 }
				
				else res.json({"check": check});
					 
					 
				 });
  

				}

  });
		  
		  
	  }
  });
 
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
    res.json({rooms:rooms_Data});
});

//create room button
app.post('/room',function (req,res) {
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
//join room
app.get('/room',function (req,res) {
    var sql="insert ignore into room_user(user_id,room_id) values(?,?)";
    con.query(sql,[req.session.user_id,req.query.room],function (err,result) {
       if(err){
            console.log(err.message);
            res.json({'check':false});
       }
      else res.json({'check':true});
    });
});
app.get('/personal_rooms', function(req,res){
	let userid=req.query.userid;
	let sql="SELECT  `name` ,`joining_date` FROM `rooms` INNER JOIN `room_user` ON  `user_id`='"+userid+"' AND  `id`= `room_id`;";
	con.query(sql,function(err,result){
					
                  if(err) {
					  console.log(sql);
				  	res.json({"data":""});
					}
				  
                else 	res.json({"data":result});
	});
})

app.get('/user_data',function(req,res){
	let userid=req.query.userid;
	let sql="SELECT `username` FROM `users` WHERE `id` ='"+userid+"';";
	con.query(sql,function(err,result){
					
                  if(err) {
					  console.log(sql);
				  res.json({"username":""});
					}
				  
                else 	res.json({"username":result});
	});
	
	
});
app.get('/edit_user_data',function(req,res){
	let userid=req.query.userid;
	let username=req.query.username;
	let userpass=req.query.pass;
	let sql="UPDATE `users` SET `username`='"+username+"',`password`='"+userpass+"' WHERE `id`='"+userid+"';";
	con.query(sql,function(err,result){
					
                  if(err) {
					  console.log(sql);
				  res.json({"check":false});
					}
				  
                else 	{
					sql="SELECT `username` FROM `users` WHERE `id` ='"+userid+"';";
					 if(err) {
					  console.log(sql);
				  res.json({'check':true,'username':""});
					}
					else    res.json({'check':true,'username':result});
					
				}
	});
	
	
});




var io = require('socket.io')(server);

io.sockets.on('connection',

  function (socket) {

    var url_parts = url.parse(socket.request.headers.referer, true);
    var query = url_parts.query;
    var id = query.room;
   // console.log("We have a new client: " + socket.id);
    if(rooms.has(id))
    socket.join(id.toString(),function () {
      // io.sockets.in(id.toString()).emit('message','a user has joined the room');
      // console.log(rooms.get(id.toString()).data);
        socket.emit('enter',{image:rooms.get(id.toString()).data});
    });
    else socket.disconnect();
 
     /*  socket.on('room', function(room) {
        socket.join(room);
		
});*/

socket.on('new message',function(data){
    var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
  io.sockets.in(room_name).emit('chat message',data);
  //socket.in(data.room_id).emit('chat message',data);
  console.log("Server Recieve message");
});

socket.on('typing',function(data){
    var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
  
  //socket.in(data.room_id).broadcast('User typing',data);
   console.log("server enter typing with room id " +data.room_id);
   socket.broadcast.to(room_name).emit('User typing',data);

});



socket.on('mouse', function(ev) {
    //    console.log("Received: 'mouse' " + ev.pageX + " " + ev.pageY+" "+ev.type);
            var room_name=Object.keys(io.sockets.adapter.sids[socket.id])[0];
            rooms.get(room_name.toString()).data[ev.pageX][ev.pageY]=ev.color;
            io.sockets.in(room_i).emit('mouse', {ev});
        }
    );



     socket.on('save',function(data){
        var sql="insert into board(room_id,date) values ('"+data.room_id+"','"+data.date+"')";
		console.log("save");
        con.query(sql,function (err,result) {
            if(err) console.log(sql);
            else
                fs.writeFile("C:\\Users\\ALAA\\Documents\\firstApp\\www\\img\\"+result.insertId+'.jpg',data.image,'base64',function (err) {
                    if(err)
                    {
                        var sql="delete from board where id='"+result.insertId+"';";
                        con.query(sql,function(err,result){
                            io.sockets.emit('message',"couldn't save the image");
                        });
                        console.log(err);
                    }
                    else
                        io.sockets.emit('message',"saved");

                });
        });
 });



	   socket.on('load_next',function(data){
        var sql = "select date,id from board where room_id='"+data.room_id+"' and id >'"+data.id+"' order by id ASC limit 1";
        con.query(sql, function (err,result) {
            if(err)
                console.log(sql);
            else
                if(result.length>0)
                    io.sockets.emit('load',
                        {
                            image:result[0].id,
                            date:result[0].date
                        });
                else io.sockets.emit('message',"there're no more shots");
        });
    });

	    socket.on('load_pre',function(data){
        var sql = "select date,id from board where room_id='"+data.room_id+"' and id <'"+data.id+"' order by id DESC limit 1";
        con.query(sql, function (err,result) {
            if(err)
                console.log(sql);
            else
            if(result.length>0)
                io.sockets.emit('load',
                    {
                        image:result[0].id,
                        date:result[0].date
                    });
            else io.sockets.emit('message',"there're no more shots");
        });
    });


	

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
      //  window.location = "l";
      //leaving room
    });
  });
  
