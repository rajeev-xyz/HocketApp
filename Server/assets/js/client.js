$(document).ready(function() {
var socket = io.connect('/');
socket.on('hockettData', function(data){
      if (data != '')
      	console.log(data.text);
    });
});