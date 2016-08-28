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
	});
	app.get("/setting/:name", function(req, res){
		var setting = req.params.name;
		DrawerPrinter.readSetting(setting, function(err, result){
			if( err ){
				res.status(400).send("印刷設定（" + setting + "）を見つけられません");
				return;
			}
			res.json(DrawerPrinter.parseSetting(result));
		})
	});
	app.put("/setting/:name", function(req, res){
		var setting = req.params.name;
		console.log("BODY", req.body);
		res.send("ok");
	});
	app.get("/setting", function(req, res){
		DrawerPrinter.listSettings(function(err, result){
			if( err ){
				res.status(400).send(err + "");
				return;
			}
			res.json(result);
		})
	});
	var port = getConfig(config, "port", 8082);
	app.listen(port, function(){
		console.log("server (Print Server) listening to " + port);
	})
};