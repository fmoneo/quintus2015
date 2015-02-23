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
				 
				var queryString = 	'SELECT fq.quinielaUUID, fq.quinielaName, fq.quinielaStatus, fq.groupName, fq.groupUUID, fq.groupId, fq.userName, fq.userId, tp.totalPoints, fq.correctAnswerId, fq.userPoints, IFNULL(pa.pendingAnswers,0) as pendingAnswers ' +
									'FROM flatquintus fq ' +
										'INNER JOIN totalPoints tp ON (fq.quinielaId = tp.quinielaId AND fq.groupId = tp.groupId AND fq.userId = tp.userId) ' +
										'LEFT JOIN pendingAnswers pa ON (fq.quinielaId = pa.quinielaId AND fq.groupId = pa.groupId AND fq.userId = pa.userId) ' +									
									'WHERE fq.quinielaUUID=\'%quinielaUUID%\' '+ 
									'AND fq.groupUUID=\'%groupUUID%\'' +
									'ORDER BY fq.quinielaUUID, fq.groupName, tp.totalPoints DESC, fq.userId, fq.updateDateTime DESC ' ;

				
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

				    var currentGroupId = -1; 
				    var groupIndex = -1;
				    var currentUserId = -1; 
				    var userIndex =-1;
				    var rank = 1;
				    var rankIdx = 1;
				    var currentTotal = -1;

				    var lastXIndex =-1;

				    var groupResults = new Array();
				 
				    for (var i in rows) {

				    	lastXIndex ++;

				    	if(i==0){
					    	resObj.quinielaUUID = rows[i].quinielaUUID;
					    	resObj.quinielaName = rows[i].quinielaName;
					    	resObj.quinielaStatus = rows[i].quinielaStatus;
					    	resObj.groupResults = new Array();
				    	}

				    	if(currentGroupId != rows[i].groupId){
				    		groupIndex ++;
				    		currentGroupId = rows[i].groupId;
				    		userIndex =-1;
				    		
				    		resObj.groupResults.push(new Object());
				    		resObj.groupResults[groupIndex].groupName = rows[i].groupName;
				    		resObj.groupResults[groupIndex].groupUUID = rows[i].groupUUID;

				    		resObj.groupResults[groupIndex].standings = new Array();

				    		rank = 1;
				    		rankIdx = 1;
				    		currentTotal = rows[i].totalPoints;
				    	}

				    	if(currentUserId != rows[i].userId){
				    		userIndex ++;
				    		currentUserId = rows[i].userId;

				    		lastXIndex = 0;

				    		resObj.groupResults[groupIndex].standings.push(new Object());
				    		resObj.groupResults[groupIndex].standings[userIndex].userName = rows[i].userName;
				    		resObj.groupResults[groupIndex].standings[userIndex].points = rows[i].totalPoints;

				    		if(currentTotal != rows[i].totalPoints){
				    			rank = rankIdx;
				    			currentTotal = rows[i].totalPoints;
				    		}

				    		resObj.groupResults[groupIndex].standings[userIndex].rank = rank;
				    		resObj.groupResults[groupIndex].standings[userIndex].lastX = new Array();

				    		if(rows[i].pendingAnswers == 0){
				    			resObj.groupResults[groupIndex].standings[userIndex].status = "ready";
				    		} else {
				    			resObj.groupResults[groupIndex].standings[userIndex].status = "missing " + rows[i].pendingAnswers + " answers";
				    		}
				    		rankIdx++;		    		

				    	}

				    	if(lastXIndex < 10 && rows[i].correctAnswerId != null){
				    		resObj.groupResults[groupIndex].standings[userIndex].lastX[lastXIndex] = rows[i].userPoints;
				    	}
				    	
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