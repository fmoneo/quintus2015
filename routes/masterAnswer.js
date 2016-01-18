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
									'FROM user u, question q, `option` o, groupquiniela gq,  groupuser gu, quiniela qu ' + 
								   	'WHERE q.questionId = o.questionId ' +
								   	'AND u.userId = gu.userId ' +
								   	'AND gu.groupId = gq.groupId ' +
								   	'AND gq.quinielaId = q.quinielaId ' +
								   	'AND gq.quinielaId = qu.quinielaId ' +
								   	'AND qu.status = \'in progress\' ' +
								   	'AND u.isAdmin=1 '+ 
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
				    	resObj.error="UUIDs passed are incorrect, quiniela is not in the correct state or you don;t have the correct permissions";
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

					// UPDATE
					var queryString = 'UPDATE question '+
									   	'SET answerOptionId=\'%optionId%\' ' + 
									   	', updateDateTime=NOW() ' +
										'WHERE questionId=\'%questionId%\'';

					queryString = queryString.replace("%questionId%", questionId);
					queryString = queryString.replace("%optionId%", optionId);

					connection.query(queryString, function(err, rows, fields) {

					    if (err) {
					    	resObj.error="SQL Error ";
					    	throw(err);
					    	callback();
					    } else {
					    	console.log("****** MASTER ANSWER UPDATED! "+queryString);
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