var express = require('express');
var mysql = require('mysql');
var async = require('async');
var path = require('path');
var http = require('http');
var router = express.Router();

router.get('/', function(request, response) {

	var resObj =new Object();

	//Make sure a userUUID and a quinielaUUID were passed
	if(request.query.userUUID !== undefined && request.query.quinielaUUID !== undefined){

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
				 
				var queryString = 'SELECT u.userUUID, u.name as userName, g.groupUUID, g.name as groupName, q.quinielaUUID, q.name as quinielaName, q.date as quinielaDate, q.status as quinielaStatus ' +
									'FROM user u, groupUser gu, groupQuiniela gq, quiniela q, `group` g ' +
								   	'WHERE u.userId=gu.userId ' +
									'AND gu.groupId=gq.groupId ' +
									'AND gq.quinielaId=q.quinielaId ' +
									'AND gu.groupId = g.groupId ' +
									'AND u.isAdmin = 1 ' +
									'AND u.userUUID=\'%userUUID%\' '+ 
									'AND q.quinielaUUID=\'%quinielaUUID%\'';

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
				    	resObj.error="UUIDs passed are incorrect or they don't have admin permissions";
				    	callback();
				    }
				 
				    for (var i in rows) {
				    	resObj.userUUID = rows[i].userUUID;
				    	resObj.userName = rows[i].userName;
				    	resObj.quinielaUUID = rows[i].quinielaUUID;
				    	resObj.quinielaName = rows[i].quinielaName;
				    	resObj.quinielaStatus = rows[i].quinielaStatus;
				    }
				    callback();
				});

			},

			function(callback) {

				var queryString = 'SELECT q.questionId, q.questionUUID, q.points as questionPoints, q.question, oca.optionUUID as correctAnswer, o.optionId, o.optionUUID, o.title as optionTitle, o.subtitle as optionSubtitle ' +
									'FROM question q '+
										'INNER JOIN quiniela ql ON (q.quinielaId=ql.quinielaId) ' +
										'INNER JOIN `option` o ON (q.questionId=o.questionId) ' +	
										'LEFT JOIN `option` oca ON (q.answerOptionId=oca.optionId) ' +
								   	'WHERE ql.quinielaUUID=\'%quinielaUUID%\' ' +
									'ORDER BY q.questionId, o.optionId ';

				queryString = queryString.replace("%quinielaUUID%", request.query.quinielaUUID);

				connection.query(queryString, function(err, rows, fields) {

				    if (err) {
				    	resObj.error="SQL Error ";
				    	throw(err);
				    	callback();
				    } 

				    var theQuestions = new Array();
				    var q = -1;
				    var o = 0;
				    var currentQuestionId = -1;
				 
				    for (var i in rows) {
				    	if(currentQuestionId != rows[i].questionId){
				    		q++;
				    		o=0;
				    		currentQuestionId = rows[i].questionId;	
				    		theQuestions.push(new Object());	    		
				    	}

	
				    	theQuestions[q].questionUUID= rows[i].questionUUID;
				    	theQuestions[q].title = rows[i].question;
				    	theQuestions[q].correctAnswer = rows[i].correctAnswer;				    	
				    	theQuestions[q].questionPoints = rows[i].questionPoints;

				    	if(o==0){				 
				    		theQuestions[q].options = new Array();
				    	}

				    	theQuestions[q].options.push(new Object());

				    	theQuestions[q].options[o].optionUUID = rows[i].optionUUID;
				    	theQuestions[q].options[o].optionTitle = rows[i].optionTitle;
				    	theQuestions[q].options[o].optionSubtitle = rows[i].optionSubtitle;

				   		o++;				    	

				    }
				    resObj.questions = theQuestions;
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