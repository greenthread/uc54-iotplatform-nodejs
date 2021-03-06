/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
// bodyp-parse helps to send http requests 
// for more info, see: https://github.com/expressjs/body-parser
var bodyParser = require('body-parser');

// IBM IoT service
var Client = require('ibmiotf').IotfApplication;

//file system library
var fs = require('fs');

// register server side express.js
var raspberryPiServer = require('./routes/raspberryPiServer');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
// define an alias of the absolute path of node_modules/ where libraries are installed
app.use('/scripts', express.static(__dirname + '/node_modules/'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
// Print Application environment information
console.log('CF environment is ' + appEnv);

// this iot service credentials
var iotAppConfig = {
    "org" : "r7i51w",
    "id" : "b827eb403cdb",
    "auth-method" : "token",
    "auth-key" : "a-r7i51w-ssixavcvpf",
    "auth-token" : "a90Qj3XdItFQ*L6&2q"
}

var appClient = new Client(iotAppConfig);

appClient.connect();
console.log("Successfully connected to our IoT service!");

// subscribe to input events 
appClient.on("connect", function () {
  console.log("subscribe to input events");
  appClient.subscribeToDeviceEvents("iotsample-raspberrypi");
});

// get device events, we need to initialize this JSON doc with an attribute because it's called by reference
var otherSensor = {"payload":{}};
var motionSensorData = {"motionPayload":{}};

// deviceType "raspberrypi" and eventType "motionSensor" are published by client.py on RaspberryPi
appClient.on("deviceEvent", function(deviceType, deviceId, eventType, format, payload){
  if (eventType === 'motionSensor'){
    motionSensorData.motionPayload = JSON.parse(payload);
  }
  else {
    console.log('Got other events of ' + eventType + ' from ' + deviceId + ':' + JSON.stringify(payload));
  } 
});

app.get('/sensordata', raspberryPiServer.returnCurrentSensorData(motionSensorData));

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
    // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
