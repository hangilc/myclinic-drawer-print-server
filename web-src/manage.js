"use strict";

var hogan = require("hogan");
var settingsListTmplSrc = require("raw!./manage-settings-list.html");
var settingsListTmpl = hogan.compile(settingsListTmplSrc);
var detailTmplSrc = require("raw!./manage-detail.html");
var detailTmpl = hogan.compile(detailTmplSrc);

var settingsListId = "settingsList";
var detailButtonId = "printerDetailButton";
var detailDispId = "detailDisp";

function getSelectedSetting(){
	var opt = document.getElementById(settingsListId).querySelector("option:checked");
	if( !opt ){
		return null;
	}
	return opt.getAttribute("value");
}

fetch("./setting")
.then(function(response){
	if( !response.ok ){
		response.text().then(function(text){
			alert("エラー：" + text);
		});
		return;
	}
	return response.json();
})
.then(function(result){
	var list = result.map(function(item){
		return {
			label: item,
			value: item
		};
	});
	var html = settingsListTmpl.render({list: list});
	document.getElementById(settingsListId).innerHTML = html;
})
.catch(function(err){
	alert("エラー：" + err.message);
});

document.getElementById(detailButtonId).addEventListener("click", function(event){
	var setting = getSelectedSetting();
	if( !setting ){
		return;
	}
	var disp = document.getElementById(detailDispId);
	if( disp.innerHTML !== "" ){
		disp.innerHTML = "";
		return;
	}
	fetch("./setting/" + setting)
	.then(function(response){
		if( !response.ok ){
			response.text().then(function(text){
				alert("エラー：" + text);
			});
			return;
		}
		return response.json();
	})
	.then(function(result){
		var lines = [];
		["device", "output"].forEach(function(key){
			lines.push({
				key: key,
				value: result.devnames[key]
			})
		});
		["paperSize", "defaultSource", "copies", "orientation", "printQuality"].forEach(function(key){
			lines.push({
				key: key,
				value: result.devmode[key]
			})
		});
		for(var key in result){
			if( key === "devmode" || key === "devnames" ){
				continue;
			}
			lines.push({
				key: key,
				value: result[key]
			})
		}
		disp.innerHTML = detailTmpl.render({list: lines});
	})
	.catch(function(err){
		alert("エラー：" + err.message);
	});
});