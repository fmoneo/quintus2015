var express = require('express');
var mysql = require('mysql');
var async = require('async');
var path = require('path');
var http = require('http');
var router = express.Router();

router.put('/', function(request, response) {

	var resObj =new Object();
	var userId, quinielaId;
	var recordExists = false;
	var validUUIDs = false;

	if(request.query.userUUID !== undefined && request.query.quinielaUUID !== undefined && request.query.status !== undefined){

		var connection = mysql.createConnection(
		    {
		      host     : process.env.MYSQL_HOST,
		      user     : process.env.MYSQL_USER,
		      password : process.env.MYSQL_PWD,
		      database : process.env.MYSQL_DB,
		    }
		);

		async.series([

			function(callback) {				

				connection.connect();
				 
				var queryString = 'SELECT u.userId, qu.quinielaId ' +
									'FROM user u, groupQuiniela gq,  groupUser gu, quiniela qu ' + 
								   	'WHERE u.userId = gu.userId ' +
								   	'AND gu.groupId = gq.groupId ' +
								   	'AND gq.quinielaId = qu.quinielaId ' +
								   	'AND u.isAdmin=1 '+ 
								   	'AND u.userUUID=\'%userUUID%\' '+ 
									'AND qu.quinielaUUID=\'%quinielaUUID%\' ';

				queryString = queryString.replace("%userUUID%", request.query.userUUID);
				queryString = queryString.replace("%quinielaUUID%", request.query.quinielaUUID);
				 
				connection.query(queryString, function(err, rows, fields) {

				    if (err) {
				    	resObj.error="SQL Error ";
				    	throw(err);
				    	callback();
				    } 

				    // If we have no results it means the IDs passed are not correct	
				    if (rows.length == 0){
				    	resObj.error="UUIDs passed are incorrect or you don't have the correct permissions";
				    	callback();
				    }
				 
				    for (var i in rows) {
				    	userId = rows[i].userId;
				    	quinielaId = rows[i].quinielaId;
				    	validUUIDs = true;
				    }
				    callback();
				});

			},

			function(callback) {

				if(validUUIDs){

					// UPDATE
					var queryString = 'UPDATE quiniela '+
									   	'SET status=\'%status%\' ' +
										'WHERE quinielaId=\'%quinielaId%\'';

					queryString = queryString.replace("%quinielaId%", quinielaId);
					queryString = queryString.replace("%status%", request.query.status);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } else {
					    	console.log("****** MASTER STATUS UPDATED! "+queryString);
					    }
					    
					    callback();
					});
				} else {
					callback();
				}

			},

			function(callback) {

				connection.end();
				response.json(resObj);
				response.end();
				callback();

			}
		]);	//aync series

	} else {

		resObj.error="Missing parameters";
		response.json(resObj);
		response.end();

	}


});

module.exports = router;