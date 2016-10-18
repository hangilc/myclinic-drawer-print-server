"use strict";

var hogan = require("hogan.js");
var settingsListTmplSrc = require("raw!./manage-settings-list.html");
var settingsListTmpl = hogan.compile(settingsListTmplSrc);
var detailTmplSrc = require("raw!./manage-detail.html");
var detailTmpl = hogan.compile(detailTmplSrc);
var modifyTmplSrc = require("raw!./manage-modify.html");
var modifyTmpl = hogan.compile(modifyTmplSrc);
var conti = require("conti");

var settingsListId = "settingsList";
var detailButtonId = "printerDetailButton";
var editWorkAreaId = "editWorkArea";
var editButtonId = "printerEditButton";
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

function getWorkAreaMode(){
	return document.getElementById(editWorkAreaId).getAttribute("data-mode");
}

function setWorkAreaMode(mode){
	document.getElementById(editWorkAreaId).setAttribute("data-mode", mode);
}

function clearWorkArea(){
	document.getElementById(editWorkAreaId).innerHTML = "";
	setWorkAreaMode("");
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

function updateDetail(name, settingData){
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
	var html = detailTmpl.render({name: name, list: lines})
	document.getElementById(editWorkAreaId).innerHTML = html;
}

fetchList(function(err, list){
	if( err ){
		alert(err);
		return;
	}
	updateSelect(list);
})

// detail button
document.getElementById(detailButtonId).addEventListener("click", function(event){
	var setting = getSelectedSetting();
	if( !setting ){
		return;
	}
	if( getWorkAreaMode() === "detail" ){
		clearWorkArea();
		return;
	}
	fetchSetting(setting, function(err, result){
		if( err ){
			alert(err);
			return;
		}
		updateDetail(setting, result);
		setWorkAreaMode("detail");
	})
});

// edit button
document.getElementById(editButtonId).addEventListener("click", function(event){
	if( getWorkAreaMode() === "edit" ){
		clearWorkArea();
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
		var data = {
			name: setting
		};
		for(var key in result.aux){
			data[key] = result.aux[key];
		}
		var html = modifyTmpl.render(data);
		document.getElementById(editWorkAreaId).innerHTML = html;
		setWorkAreaMode("edit");
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

document.getElementById(editWorkAreaId).addEventListener("click", function(event){
	var target = event.target;
	if( target.tagName === "BUTTON" && target.classList.contains("exec") ){
		var setting = target.getAttribute("data-setting");
		var w = document.getElementById(editWorkAreaId);
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

// delete
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
		fetchList(function(err, result){
			clearWorkArea();
			updateSelect(result);
		});
	})
});

function createSetting(name, done){
	contiFetchText("./setting/" + name, {
		method: "POST"
	}, done);
}

// create
document.getElementById(newPrinterButtonId).addEventListener("click", function(event){
	var nameInput = document.getElementById(newPrinterNameInputId);
	var name = nameInput.value;
	createSetting(name, function(err){
		if( err && err !== "cancel" ){
			alert(err);
			return;
		}
		nameInput.value = "";
		var settingsList, settingData;
		conti.execPara([
			function(done){
				fetchList(function(err, result){
					if( err ){
						done(err);
						return;
					}
					settingsList = result;
					done();
				});
			},
			function(done){
				fetchSetting(name, function(err, result){
					if( err ){
						done(err);
						return;
					}
					settingData = result;
					done();
				})
			}
		], function(err){
			updateSelect(settingsList, name);
			updateDetail(name, settingData);
			setWorkAreaMode("detail");
		});
	})
})

// on selector change
document.getElementById(settingsListId).addEventListener("change", function(event){
	var opt = document.getElementById(settingsListId).querySelector("option:checked");
	if( !opt ){
		return;
	}
	var name = opt.value;
	var mode = getWorkAreaMode();
	if( mode === "detail" ){
		fetchSetting(name, function(err, result){
			if( err ){
				alert(err);
				return;
			}
			updateDetail(name, result);
			setWorkAreaMode("detail");
		})
	} else if (mode === "edit" ){
		fetchSetting(name, function(err, result){
			if( err ){
				alert(err);
				return;
			}
			var data = {
				name: name
			};
			for(var key in result.aux){
				data[key] = result.aux[key];
			}
			var html = modifyTmpl.render(data);
			document.getElementById(editWorkAreaId).innerHTML = html;
			setWorkAreaMode("edit");
		});
	}
});
