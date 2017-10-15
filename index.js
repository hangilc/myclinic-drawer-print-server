"use strict";

var DrawerPrinter = require("myclinic-drawer-printer");

exports.staticDir = __dirname + "/static";

function setupSettingDir(pathname){
	if( pathname ){
		DrawerPrinter.setSettingDir(pathname);
	}
}

exports.initApp = function(app, config){
	setupSettingDir(config["setting-dir"]);
	app.post("/print", function(req, res){
		var pages = req.body.pages;
		var setting = req.body.setting;
		if( setting ){
			DrawerPrinter.readSetting(setting, function(err, result){
				if( err ){
					res.status(400);
					res.send("印刷設定（" + setting + "）を見つけられません");
					return;
				}
				var err = DrawerPrinter.printPages(pages, result);
				if( !err ){
					res.send("ok");
				} else {
					res.send("error: " + err);
				}
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
		DrawerPrinter.readSetting(setting, function(err, result){
			if( err ){
				res.status(400).send("印刷設定（" + setting + "）を見つけられません");
				return;
			}
			var settingData = result;
			if( req.body["change-printer"] ){
				var dialogSetting = DrawerPrinter.printerDialog(result);
				if( dialogSetting ){
					settingData.devmode = dialogSetting.devmode;
					settingData.devnames = dialogSetting.devnames;
				}
			}
			["scale", "dx", "dy"].forEach(function(key){
				settingData.aux[key] = req.body[key];
			});
			DrawerPrinter.saveSetting(setting, settingData, function(err){
				if( err ){
					res.send(400).send(err);
					return;
				}
				res.send("ok");
			})
		})
	});
	app.post("/setting/:name", function(req, res){
		var setting = req.params.name;
		var settingData = DrawerPrinter.printerDialog();
		if( !settingData ){
			res.send("cancel");
			return;
		}
		DrawerPrinter.saveSetting(setting, settingData, function(err){
			if( err ){
				res.send(400).send(err);
				return;
			}
			res.send("ok");
		})
	});
	app.delete("/setting/:name", function(req, res){
		var setting = req.params.name;
		DrawerPrinter.deleteSetting(setting, function(err){
			if( err ){
				res.send(400).send(err);
				return;
			}
			res.send("ok");
		});
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
};
