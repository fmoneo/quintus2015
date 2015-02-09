var express = require('express');
var mysql = require('mysql');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express ' + process.env.SERVER_NAME });

});

module.exports = router;
