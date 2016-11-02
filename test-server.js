"use strict";

var App = require("./index");
var express = require("express");
var bodyParser = require("body-parser");
var config = {};

var app = express();
var sub = express();
sub.use(bodyParser.urlencoded({extended: false}));
sub.use(bodyParser.json());
App.initApp(sub, config);
app.use("/printer", sub);
sub.use(express.static(App.staticDir));

var port = 8082;
app.listen(port, function(){
	console.log("printer server listening to " + port);
});
