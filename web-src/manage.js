"use strict";

var hogan = require("hogan");
var settingsListTmplSrc = require("raw!./manage-settings-list.html");
var settingsListTmpl = hogan.compile(settingsListTmplSrc);
var detailTmplSrc = require("raw!./manage-detail.html");
var detailTmpl = hogan.compile(detailTmplSrc);
var modifyTmplSrc = require("raw!./manage-modify.html");
var modifyTmpl = hogan.compile(modifyTmplSrc);

var settingsListId = "settingsList";
var detailButtonId = "printerDetailButton";
var detailDispId = "detailDisp";
var editButtonId = "printerEditButton";
var modifyWorkAreaId = "modifyWorkArea"

function formDataObject(formData){
	var obj = {};
	for(var pair of formData.entries()){
		obj[pair[0]] = pair[1];
	}
	return obj;
}

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
	var disp = document.getElementById(detailDispId);
	if( disp.innerHTML !== "" ){
		disp.innerHTML = "";
		return;
	}
	var setting = getSelectedSetting();
	if( !setting ){
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
		for(var key in result.aux){
			lines.push({
				key: key,
				value: result.aux[key]
			})
		}
		disp.innerHTML = detailTmpl.render({list: lines});
	})
	.catch(function(err){
		alert("エラー：" + err.message);
	});
});

document.getElementById(editButtonId).addEventListener("click", function(event){
	var w = document.getElementById(modifyWorkAreaId);
	if( w.innerHTML !== "" ){
		w.innerHTML = "";
		return;
	}
	var setting = getSelectedSetting();
	if( !setting ){
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
		var data = {
			name: setting
		};
		for(var key in result.aux){
			data[key] = result.aux[key];
		}
		var html = modifyTmpl.render(data);
		w.innerHTML = html;
		console.log(html);
	})
	.catch(function(err){
		alert("エラー：" + err.message);
	});
});

document.getElementById(modifyWorkAreaId).addEventListener("click", function(event){
	var target = event.target;
	if( target.tagName === "BUTTON" && target.classList.contains("exec") ){
		var setting = target.getAttribute("data-setting");
		var w = document.getElementById(modifyWorkAreaId);
		var form = w.querySelector("form");
		if( !form ){
			alert("cannot find form");
			return;
		}
		var formData = new FormData(w.querySelector("form"));
		for(var pair of formData.entries()){
			console.log(pair[0], pair[1]);
		}
		fetch("./setting/" + setting, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(formDataObject(formData))
		})
		.then(function(response){
			if( !response.ok ){
				response.text().then(function(msg){
					alert("エラー：" + msg);
				});
				return; 
			}
			response.text().then(function(result){
				if( result !== "ok" && result !== "cancel" ){
					alert(result);
					return;
				}
				w.innerHTML = "";
			});
		})
		.catch(function(err){
			alert("エラー：" + err.message);
		})
	}
});