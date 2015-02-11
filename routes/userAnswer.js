var express = require('express');
var mysql = require('mysql');
var async = require('async');
var path = require('path');
var http = require('http');
var router = express.Router();

router.put('/', function(request, response) {


	var resObj =new Object();
	var userId, questionId, optionId;
	var recordExists = false;
	var validUUIDs = false;

	if(request.query.userUUID !== undefined && request.query.questionUUID !== undefined && request.query.optionUUID !== undefined){

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
				 
				var queryString = 'SELECT u.userId, q.questionId, o.optionId ' +
									'FROM user u, question q, `option` o, groupQuiniela gq,  groupUser gu, quiniela qu ' + 
								   	'WHERE q.questionId = o.questionId ' +
								   	'AND u.userId = gu.userId ' +
								   	'AND gu.groupId = gq.groupId ' +
								   	'AND gq.quinielaId = q.quinielaId ' +
								   	'AND gq.quinielaId = qu.quinielaId ' +
								   	'AND qu.status = \'open\' ' +
								   	'AND u.userUUID=\'%userUUID%\' '+ 
									'AND q.questionUUID=\'%questionUUID%\' ' +
									'AND o.optionUUID=\'%optionUUID%\' ';

				queryString = queryString.replace("%userUUID%", request.query.userUUID);
				queryString = queryString.replace("%questionUUID%", request.query.questionUUID);
				queryString = queryString.replace("%optionUUID%", request.query.optionUUID);
				 
				connection.query(queryString, function(err, rows, fields) {

				    if (err) {
				    	resObj.error="SQL Error ";
				    	throw(err);
				    	callback();
				    } 

				    // If we have no results it means the IDs passed are not correct	
				    if (rows.length == 0){
				    	resObj.error="UUIDs passed are incorrect";
				    	callback();
				    }
				 
				    for (var i in rows) {
				    	userId = rows[i].userId;
				    	questionId = rows[i].questionId;
				    	optionId = rows[i].optionId;
				    	validUUIDs = true;
				    }
				    callback();
				});

			},

			function(callback) {

				if(validUUIDs){

				//Check if it already exists

					var queryString = 'SELECT ua.userId, ua.questionId, ua.optionId ' +
										'FROM userAnswer ua '+
									   	'WHERE ua.userId=\'%userId%\' '+ 
										'AND ua.questionId=\'%questionId%\' ' ;

					queryString = queryString.replace("%userId%", userId);
					queryString = queryString.replace("%questionId%", questionId);

					console.log(queryString);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } 

					    if (rows.length > 0){
					    	recordExists = true;
					    }
					    
					    callback();
					});
				} else {
					callback();
				}

			},

			function(callback) {

				if(validUUIDs && recordExists){

					// UPDATE
					var queryString = 'UPDATE userAnswer '+
									   	'SET optionId=\'%optionId%\' ' + 
										'WHERE userId=\'%userId%\' '+ 
										'AND questionId=\'%questionId%\'';

					queryString = queryString.replace("%userId%", userId);
					queryString = queryString.replace("%questionId%", questionId);
					queryString = queryString.replace("%optionId%", optionId);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } else {
					    	console.log("******************* UPDATED! "+queryString);
					    }
					    
					    callback();
					});
				} else if (validUUIDs && !recordExists) {

					// INSERT
					// UPDATE
					var queryString = 'INSERT INTO userAnswer (userId, questionId, optionId) '+
									   	'VALUES (\'%userId%\' ,\'%questionId%\',\'%optionId%\')';

					queryString = queryString.replace("%userId%", userId);
					queryString = queryString.replace("%questionId%", questionId);
					queryString = queryString.replace("%optionId%", optionId);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } else {
					    	console.log("******************* INSERTED! "+queryString);
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