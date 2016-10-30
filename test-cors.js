"use strict";

var express = require("express");
var fs = require("fs");
var path = require("path");

var app = express();

app.get("/", function(req, res){
	var filePath = path.join(__dirname, "test-cors.html");
	var stat = fs.statSync(filePath);
	res.writeHead(200, {
		"Content-Type": "text/html",
		"Content-Length": stat.size
	});
	var rs = fs.createReadStream(filePath);
	rs.pipe(res);
});

var port = 12000;
app.listen(port, function(){
	console.log("cors test server listening to " + port);
})
