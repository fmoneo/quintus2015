var express = require('express');
var mysql = require('mysql');
var async = require('async');
var path = require('path');
var http = require('http');
var router = express.Router();

router.put('/', function(request, response) {

	var resObj =new Object();
	var userId, quinielaId, questionId;
	var recordExists = false;
	var validUUIDs = false;

	if(request.query.userUUID !== undefined && request.query.quinielaUUID !== undefined && request.query.questionUUID !== undefined && request.query.isLive !== undefined){

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
				 
				var queryString = 'SELECT u.userId, qu.quinielaId, q.questionId ' +
									'FROM user u, groupquiniela gq,  groupuser gu, quiniela qu, question q ' + 
								   	'WHERE u.userId = gu.userId ' +
								   	'AND gu.groupId = gq.groupId ' +
								   	'AND gq.quinielaId = qu.quinielaId ' +
								   	'AND q.quinielaId = qu.quinielaId ' +
								   	'AND u.isAdmin=1 '+ 
								   	'AND u.userUUID=\'%userUUID%\' '+ 
								   	'AND qu.quinielaUUID=\'%quinielaUUID%\' '+ 
									'AND q.questionUUID=\'%questionUUID%\' ';

				queryString = queryString.replace("%userUUID%", request.query.userUUID);
				queryString = queryString.replace("%quinielaUUID%", request.query.quinielaUUID);
				queryString = queryString.replace("%questionUUID%", request.query.questionUUID);
				 
				connection.query(queryString, function(err, rows, fields) {

				    if (err) {
				    	resObj.error="SQL Error ";
				    	throw(err);
				    	callback();
				    } 

				    // If we have no results it means the IDs passed are not correct	
				    if (rows.length == 0){
				    	resObj.error="UUIDs passed are incorrect or you don't have the correct permissions "+ request.query.userUUID;
				    	callback();
				    }
				 
				    for (var i in rows) {
				    	userId = rows[i].userId;
				    	quinielaId = rows[i].quinielaId;
				    	questionId = rows[i].questionId;
				    	validUUIDs = true;
				    }
				    callback();
				});

			},

			function(callback) {

				if(validUUIDs){

					// UPDATE
					var queryString = 'UPDATE question '+
									   	'SET isLive=\'%isLive%\' ' +
										'WHERE questionId=\'%questionId%\'';

					queryString = queryString.replace("%questionId%", questionId);
					queryString = queryString.replace("%isLive%", request.query.isLive);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } else {
					    	console.log("****** MASTER Live Status UPDATED! "+queryString);
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

		resObj.error="Missing parameters" ;
		response.json(resObj);
		response.end();

	}


});

module.exports = router;