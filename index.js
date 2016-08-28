"use strict";

var express = require("express");
var bodyParser = require("body-parser");
var cors = require("cors");
var DrawerPrinter = require("myclinic-drawer-printer");

function getConfig(config, key, defaultValue){
	return (config && key in config) ? config[key] : defaultValue;
}

exports.run = function(config){
	var app = express();
	app.use(bodyParser.urlencoded({extended: false}));
	app.use(bodyParser.json());
	app.use(express.static("static"));
	app.use(cors());
	app.post("/print", function(req, res){
		var pages = req.body.pages;
		var setting = req.body.setting;
		console.log("PRINT", setting);
		if( setting ){
			DrawerPrinter.readSetting(setting, function(err, result){
				if( err ){
					res.status(400);
					res.send("印刷設定（" + setting + "）を見つけられません");
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
		console.log("server (Print Server) listening to " + port);
	})
};