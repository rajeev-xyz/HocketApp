var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    package = require('./package.json'),
    gestureMap = require('./GestureMap.json'),
    AWS = require('aws-sdk'),
    awsConfig = require('aws-config'),
    config = require('./config'),
    firebase = require('firebase'),
    fs = require('fs');

//firebase configuration
  var config = {
    apiKey: "AIzaSyAiUcPwqpIEF0clTiJ-zdLzCYkXsOysPh4",
    authDomain: "chayan-8f006.firebaseapp.com",
    databaseURL: "https://chayan-8f006.firebaseio.com",
    projectId: "chayan-8f006",
    storageBucket: "chayan-8f006.appspot.com",
    messagingSenderId: "917721324787"
  };
  firebase.initializeApp(config);



//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://hockett.herokuapp.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}
//io.set('origins', 'http://localhost:8100');
var id, text;
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static('assets'));


//Mongo DB Setup
//mongoose.Promise = global.Promise;
mongoose.connect(package.config.DBUri);
mongoose.connection.on('error', function(err) {
    console.log('Could not connect to database' + package.config.DBUri);
});

//Polly setup
AWS.config = awsConfig({
    region: 'us-east-1',
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    maxRetries: 3,
    timeout: 15000
});

var Polly = new AWS.Polly();

//search Schema
var gestureSchema = new mongoose.Schema({
    id: String,
    //finger param
    f1: Number,
    f2: Number,
    f3: Number,
    f4: Number,
    f5: Number,
    palmUp: Number,
    glovesId: String
}, {
    timestamps: true
});
var GData = mongoose.model('GestureData', gestureSchema);

app.get('/', function(req, res) {
    res.render('login');
});

app.post('/login', function(req, res) {
    var username = req.body.inputEmail;
    var password = req.body.inputPassword;
    //res.render('home');
    res.redirect('/hockett/show/123');
});

app.get('/about', function(req, res) {
    res.render('home');
});

//information from arduino

app.get('/hockett/upload/:id', function(req, res) {
    var id = req.params.id || 123;
    var f1 = req.query.f1 || 1;
    var f2 = req.query.f2 || 1;
    var f3 = req.query.f3 || 1;
    var f4 = req.query.f4 || 1;
    var f5 = req.query.f5 || 1;
    var palmUp = req.query.p || 1;

    console.log("Uploading data " + JSON.stringify(f1 + ':' + f2 + ':' + f3 + ':' + f4 + ':' + f5));
    //save in mongodb
    var gData = new GData({
        id: id,
        f1: f1,
        f2: f2,
        f3: f3,
        f4: f4,
        f5: f5,
        palmUp: palmUp
    });
    gData.save(function(err, rec) {
        if (err)
            console.log("Error in saving gesture data");
        else
            console.log("Gesture data saved");
    });
    var value = gestureMap["" + f1 + f2 + f3 + f4 + f5  +palmUp];
    if (value == undefined) {
        res.send("0");
    } else {
        //emit event 
        id= id;
        text = value;
        // A post entry.
         var postData = {
           uid:value.split(' ').join('-')
         };

         // Get a key for a new Post.
         var newPostKey = firebase.database().ref().child('data').push().key;

         // Write the new post's data simultaneously in the posts list and the user's post list.
         var updates = {};
        // updates['/data/' + newPostKey] = postData;
         updates['/data/'] = postData;

         firebase.database().ref().update(updates);

        
        res.send("1");//undo
    }

});

app.get('/hockett/show/:id', function(req, res) {
    GData.find({
        id: req.params.id
    }, function(err, gData) {
        if (err) {
            console.log(err);
            return res.send('Error in getting data from database');
        } else {
            res.render('showGData', {
                gData: gData,
                gestureMap: gestureMap
            });
        }
    });
});

app.get('/hockett/get/:id', function(req, res) {
    GData.find({
        id: req.params.id
    }, function(err, gData) {
        if (err) {
            console.log(err);
            return res.send('Error in getting data from database');
        } else {
            var currRec = gData[gData.length - 1];
            var bitKey = "" + currRec.f1 + currRec.f2 + currRec.f3 + currRec.f4 + currRec.f5 + currRec.palmUp;
            var value = gestureMap[bitKey];
            if (value == undefined) {
                value = "Please wait";
            }
            return res.send({
                        id: bitKey,
                        text: value
                    });
            //call aws polly to get mp3
            var pollyCallback = function(err, data) {
                if (err) {
                    console.log(err, err.stack); // an error occurred
                    return;
                } else {
                    console.log(data); // successful response

                    // Generate a unique name for this audio file, the file name is: PollyVoiceTimeStamp.mp3
                    var filename = req.params.id + "_" + (new Date).getTime() + ".mp3";
                    fs.writeFile('./audioFiles/' + filename, data.AudioStream, function(err) {
                        if (err) {
                            console.log('An error occurred while writing the file.');
                            console.log(err);
                        }
                        console.log('Finished writing the file to the filesystem ' + '/audioFiles/' + filename)

                        // Send the audio file
                        res.setHeader('content-type', 'audio/mpeg');
                        res.download('audioFiles/' + filename);
                    });
                }
            };

            var pollyParameters = {
                OutputFormat: 'mp3',
                Text: unescape(value),
                VoiceId: 'Raveena',
            };

            // Make a request to AWS Polly with the text and voice needed, when the request is completed push callback to pollyCallback
            //Polly.synthesizeSpeech(pollyParameters, pollyCallback);

        }
    });
});
/*
app.get('/hockett/msg', function(req, res){
    var tempId = id;
    var tempText = text;
    id = '';
    text = '';
    res.send({id: tempId, text:tempText});
});
*/
io.on("connection", function(socket){
  console.log('connection established');
  setInterval(function(){ 
     socket.emit('hockettData', {id:id,text:text});
        },1000);
  socket.on('clearMsg', function(){
    id = '';
    text = '';
  })
});

//Starts server
var PORT = process.env.PORT || package.config.PORT;
http.listen(PORT, function() {
    console.log('Started on port ' + PORT);
});