"use strict";

var printer = require("./index");

function makeOriginChecker(){
	var os = require("os");
	var Netmask = require("netmask").Netmask;

	var ifs = os.networkInterfaces();
	var netmasks = [];
	Object.keys(ifs).forEach(function(key){
		var nets = ifs[key];
		nets.forEach(function(net){
			if( net.family === "IPv4" ){
				netmasks.push(new Netmask(net.address, net.netmask));
			}
		});
	});
	var n = netmasks.length;

	return function(addr){
		var i;
		for(i=0;i<n;i++){
			if( netmasks[i].contains(addr) ){
				return true;
			}
		}
		return false;
	};
}

printer.run({

});
