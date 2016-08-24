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
		var setting = req.body.setting;
		if( setting ){
			DrawerPrinter.readSetting(setting, function(err, result){
				if( err ){
					res.send("error: cannot access setting " + setting);
					return;
				}
				DrawerPrinter.printPages(pages, result);
				res.send("ok");
			});
		} else {
			var settingData = DrawerPrinter.printerDialog();
			if( settingData ){
				DrawerPrinter.printPages(pages, settingData);
				res.send("ok");
			} else {
				res.send("canceled");
			}
		}
	})
	var port = getConfig(config, "port", 8082);
	app.listen(port, function(){
		console.log("server listening to " + port);
	})
};