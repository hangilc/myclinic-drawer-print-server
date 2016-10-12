"use strict";

var http = require("http");

var req = http.request({
	hostname: "localhost",
	port: 8082,
	path: "/print",
	headers: {
		"content-type": "application/json"
	},
	method: "POST"
}, function(res){
	res.setEncoding("utf-8");
	res.on("data", function(chunk){
		console.log(chunk);
	});
	res.on("error", function(e){
		console.log("ERROR:", e);
	});
});

var data = 
	{ pages: 
		[
			[
				["create_pen", "b", 0, 0, 255, 0.2],
				["set_pen", "b"],
				["move_to", 10, 10],
				["line_to", 40, 39]
			]
		],
	  setting: "pdf"
	};

req.write(JSON.stringify(data));
req.end();
