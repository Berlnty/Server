// make connection
var socket=io.connect('http://192.168.1.73:3000');


//query dom
var id = document.getElementById('id'),
      room_name = document.getElementById('room_name'),
      btn = document.getElementById('create'),
      btn2 = document.getElementById('join'),
      type = document.getElementById('type'),
      room_id = document.getElementById('room_id'),
       output = document.getElementById('output'),
        datetime=null;


//emite events
//create
btn.addEventListener('click', function(){
  var currentdate = new Date();
  datetime =  currentdate.getFullYear()+ "-"+ (currentdate.getMonth()+1) +"-"+currentdate.getDate()  + " " + currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();
  socket.emit('create', {
     user_id: id.value,
      type: type.value,
      room_name:room_name.value,
      datetime:datetime
  });
});
//join
btn2.addEventListener('click', function(){
  var currentdate = new Date();
  datetime =  currentdate.getFullYear()+ "-"+ (currentdate.getMonth()+1) +"-"+currentdate.getDate()  + " " + currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();
  socket.emit('join', {
      user_id: id.value,
      room_id:room_id.value,
      datetime:datetime
  });
});

//listen for addEventListner

socket.on('message',function(data){
  output.innerHTML+='<p>'+data+'</p>';
});
socket.on('enter',function(result){
  output.innerHTML="";
  for(var i=0;i<result.length;i++)
  {
    output.innerHTML+="<p><strong>"+result[i].name+"</strong> :id ="+result[i].id+" , created by "+result[i].username+" ,at "+result[i].creation_time+"</p>";
  }
});
socket.on('create',function(data){
  output.innerHTML+="<p><strong>"+data.room_name+"</strong> :id ="+data.room_id+" , created by "+data.username+" ,at "+data.datetime+"</p>";
});

