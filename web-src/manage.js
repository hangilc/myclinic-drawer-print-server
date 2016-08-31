"use strict";

var hogan = require("hogan");
var settingsListTmplSrc = require("raw!./manage-settings-list.html");
var settingsListTmpl = hogan.compile(settingsListTmplSrc);
var detailTmplSrc = require("raw!./manage-detail.html");
var detailTmpl = hogan.compile(detailTmplSrc);
var modifyTmplSrc = require("raw!./manage-modify.html");
var modifyTmpl = hogan.compile(modifyTmplSrc);
var conti = require("conti");

var settingsListId = "settingsList";
var detailButtonId = "printerDetailButton";
var detailDispId = "detailDisp";
var editButtonId = "printerEditButton";
var modifyWorkAreaId = "modifyWorkArea"
var deleteButtonId = "printerDeleteButton";
var newPrinterNameInputId = "newPrinterNameInput";
var newPrinterButtonId = "newPrinterButton";

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

function contiFetch(url, opt, op, cb){
	fetch(url, opt)
	.then(function(response){
		if( response.ok ){
			response[op]()
			.then(function(result){
				cb(undefined, result);
			})
			.catch(function(err){
				cb(err.message);
			})
		} else { 
			response.text()
			.then(function(text){
				cb(text);
			})
			.catch(function(err){
				cb(err.message);
			})
		}
	})
	.catch(function(err){
		cb(err.message);
	})
}

function contiFetchJson(url, opt, cb){
	contiFetch(url, opt, "json", cb);
}

function contiFetchText(url, opt, cb){
	contiFetch(url, opt, "text", cb);
}

function fetchList(cb){
	contiFetchJson("./setting", {}, cb);
}

function fetchSetting(name, cb){
	contiFetchJson("./setting/" + name, {}, cb);
}

function updateSelect(settings, selected){
	var list = settings.map(function(item){
		return {
			label: item,
			value: item,
			selected: item === selected
		};
	})
	var html = settingsListTmpl.render({list: list});
	document.getElementById(settingsListId).innerHTML = html;
}

function updateDetail(settingData){
	var lines = [];
	["device", "output"].forEach(function(key){
		lines.push({
			key: key,
			value: settingData.devnames[key]
		})
	});
	["paperSize", "defaultSource", "copies", "orientation", "printQuality"].forEach(function(key){
		lines.push({
			key: key,
			value: settingData.devmode[key]
		})
	});
	for(var key in settingData.aux){
		lines.push({
			key: key,
			value: settingData.aux[key]
		})
	}
	var disp = document.getElementById(detailDispId);
	disp.innerHTML = detailTmpl.render({list: lines});
}

fetchList(function(err, list){
	if( err ){
		alert(err);
		return;
	}
	updateSelect(list);
})

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
	fetchSetting(setting, function(err, result){
		if( err ){
			alert(err);
			return;
		}
		updateDetail(result);
	})
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
	fetchSetting(setting, function(err, result){
		var data = {
			name: setting
		};
		for(var key in result.aux){
			data[key] = result.aux[key];
		}
		var html = modifyTmpl.render(data);
		w.innerHTML = html;
	});
});

function modifySetting(name, data, cb){
	contiFetchText("./setting/" + name, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	}, function(err, result){
		if( err ){
			cb(err);
			return;
		}
		cb();
	})
}

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
		modifySetting(setting, formDataObject(formData), function(err){
			if( err && err !== "cancel" ){
				alert(err);
				return;
			}
			w.innerHTML = "";
		})
	}
});

function deleteSetting(name, done){
	contiFetchText("./setting/" + name, {
		method: "DELETE"
	}, done);
}

document.getElementById(deleteButtonId).addEventListener("click", function(event){
	event.preventDefault();
	var setting = getSelectedSetting();
	if( !setting ){
		return;
	}
	if( !confirm("印刷設定（" + setting + "）を本当に削除していいですか？") ){
		return;
	}
	deleteSetting(setting, function(err){
		if( err && err !== "cancel" ){
			alert(err);
			return;
		}
	})
	fetch("./setting/" + setting, {
		method: "DELETE"
	})
	// .then(function(response){
	// 	if( !response.ok ){
	// 		response.text().then(function(text){
	// 			alert("エラー：" + text);
	// 		});
	// 		return;
	// 	}
	// 	response.text().then(function(result){
	// 		if( result !== "ok" ){
	// 			alert(result);
	// 			return;
	// 		}
	// 	});
	// })
	// .catch(function(err){
	// 	alert("エラー：" + err.message);
	// });
});

function createSetting(name, done){
	contiFetchText("./setting/" + name, {
		method: "POST"
	}, done);
}

document.getElementById(newPrinterButtonId).addEventListener("click", function(event){
	var nameInput = document.getElementById(newPrinterNameInputId);
	var name = nameInput.value;
	createSetting(name, function(err){
		if( err && err !== "cancel" ){
			alert(err);
			return;
		}
		nameInput.value = "";
	})
	// fetch("./setting/" + name, {
	// 	method: "POST"
	// })
	// .then(function(response){
	// 	if( !response.ok ){
	// 		response.text().then(function(msg){
	// 			alert("エラー：" + msg);
	// 		});
	// 		return; 
	// 	}
	// 	response.text().then(function(result){
	// 		if( result !== "ok" && result !== "cancel" ){
	// 			alert(result);
	// 			return;
	// 		}
	// 		nameInput.value = "";
	// 	});
	// })
	// .catch(function(err){
	// 	alert("エラー：" + err.message);
	// })
})