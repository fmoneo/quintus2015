var express = require('express');
var mysql = require('mysql');
var async = require('async');
var path = require('path');
var http = require('http');
var router = express.Router();

router.get('/', function(request, response) {

    var resObj =new Object();

	//Make sure a userUUID and a quinielaUUID were passed
	if(request.query.quinielaUUID !== undefined && request.query.groupUUID !== undefined){

		var connection = mysql.createConnection(
		    {
		      host     : process.env.MYSQL_HOST,
		      user     : process.env.MYSQL_USER,
		      password : process.env.MYSQL_PWD,
		      database : process.env.MYSQL_DB
		    }
		);

		async.series([

			function(callback) {				

				connection.connect();
				 
				var queryString = 	'SELECT sq.quinielaUUID, sq.quinielaName, sq.quinielaStatus, sq.groupName, sq.userName, q.questionId, q.questionUUID, q.question, oua.optionUUID, oua.optionId, COALESCE(oua.title,\'NONE\') as optionTitle, oua.subtitle, sq.correctAnswerId ' +
									'FROM quintus.sq ' +
										'INNER JOIN question q ON (q.questionUUID = sq.questionUUID) ' +
										'LEFT JOIN useranswer ua ' +
											'INNER JOIN `option` oua ' +
											'ON (oua.OptionId = ua.OptionId) ' +
										'ON (ua.userId = sq.userId AND ua.questionId = sq.questionId) ' +
									'WHERE sq.quinielaUUID=\'%quinielaUUID%\' '+ 
									'AND sq.groupUUID=\'%groupUUID%\' ' +
									'AND sq.isLive = 1 ' +
									'ORDER BY q.questionId, oua.optionId DESC, sq.userName ' ;

				
				queryString = queryString.replace("%quinielaUUID%", request.query.quinielaUUID);
				queryString = queryString.replace("%groupUUID%", request.query.groupUUID);
				 
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

				    var currentQuestionId = -1; 
				    var userCount = -1;
				    var questionIndex = -1;
				    var currentOptionId = -1; 
				    var optionIndex =-1;
				    var userIndex =-1;
				    //var rank = 1;
				    //var rankIdx = 1;
				    //var currentTotal = -1;

				    //var lastXIndex =-1;

				    var groupQuestions = new Array();
				 
				    for (var i in rows) {

				    	if(i==0){
					    	resObj.quinielaUUID = rows[i].quinielaUUID;
					    	resObj.quinielaName = rows[i].quinielaName;
					    	resObj.groupName = rows[i].groupName;
					    	resObj.quinielaStatus = rows[i].quinielaStatus;
					    	resObj.groupQuestions = new Array();
				    	}

				    	if(currentQuestionId != rows[i].questionId){
				    		questionIndex ++;
				    		currentQuestionId = rows[i].questionId;
				    		currentOptionId = -1;
				    		optionIndex = -1;
				    		
				    		resObj.groupQuestions.push(new Object());
				    		resObj.groupQuestions[questionIndex].question = rows[i].question;
				    		resObj.groupQuestions[questionIndex].questionUUID = rows[i].questionUUID;
				    		resObj.groupQuestions[questionIndex].correctAnswerId = rows[i].correctAnswerId;

				    		resObj.groupQuestions[questionIndex].optionStats = new Array();


				    	}

				    	if(currentOptionId != rows[i].optionId){
				    		optionIndex ++;
				    		currentOptionId = rows[i].optionId;
				    		userIndex = 0;

				    		resObj.groupQuestions[questionIndex].optionStats.push(new Object());
				    		resObj.groupQuestions[questionIndex].optionStats[optionIndex].optionUUID = rows[i].optionUUID;
				    		resObj.groupQuestions[questionIndex].optionStats[optionIndex].optionId = rows[i].optionId;
				    		resObj.groupQuestions[questionIndex].optionStats[optionIndex].optionTitle = rows[i].optionTitle;
				    		resObj.groupQuestions[questionIndex].optionStats[optionIndex].subtitle = rows[i].subtitle;
				    		resObj.groupQuestions[questionIndex].optionStats[optionIndex].count = 0;
							resObj.groupQuestions[questionIndex].optionStats[optionIndex].users = new Array();				    		
						}
				    	
				    	resObj.groupQuestions[questionIndex].optionStats[optionIndex].users.push(new Object());
				    	resObj.groupQuestions[questionIndex].optionStats[optionIndex].users[userIndex].userName = rows[i].userName;
				    	resObj.groupQuestions[questionIndex].optionStats[optionIndex].count ++;
				    	userIndex ++;
				    }
				    
				    callback();
				});

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