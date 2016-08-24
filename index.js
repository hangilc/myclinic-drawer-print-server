"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var DrawerPrinter = require("myclinic-drawer-printer");

function getConfig(config, key, defaultValue){
	return (config && key in config) ? config[key] : defaultValue;
}

exports.run = function(config){
	var app = express();
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());
	app.use(express.static("static"));
	app.post("/print", function(req, res){
		var pages = req.body.pages;
		console.log("pages", pages);
		res.send('ok');
	})
	var port = getConfig(config, "port", 8082);
	app.listen(port, function(){
		console.log("server listening to " + port);
	})
};