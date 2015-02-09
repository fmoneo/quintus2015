
var serverName = process.env.SERVER_NAME;

$(document).ready(function () {

    var userUUID = getUrlParameters("userUUID", "", true);
    var quinielaUUID = getUrlParameters("quinielaUUID", "", true);

    var questionHtmlStartTemplate = "<div class=\"panel panel-primary\"><div class=\"panel-heading\"><div class=\"row\"><div class=\"col-md-9 col-xs-9\"><h4 class=\"openSans panel-title\">%QUESTION_TITLE%</h4></div><div class=\"col-md-3 col-xs-3\">%QUESTION_POINTS_SPAN%</div></div></div><ul class=\"list-group\">";
    var questionHtmlEndTemplate = "</ul></div>";

    var questionOptionHtmlTemplate =    "<li class=\"list-group-item %OPTION_ID% %QUESTION_ID% %QUESTION_OPTION_CLASS%\">"+
                                            "<div class=\"row\">"+
                                                "<div class=\"col-md-1 col-sm-1 col-xs-1\">"+
                                                    "<input onclick=\"handleRadioClick(this);\" type=\"radio\" name=\"%QUESTION_ID%\" id=\"%OPTION_ID%\" value=\"%OPTION_ID%\" %DISABLED% %CHECKED%/>"+
                                                    "%GLYPHICON%"+
                                                "</div>"+
                                                "<div class=\"col-md-7 col-sm-7 col-xs-7\">"+
                                                    "<h4 class=\"list-group-item-heading\">%OPTION_TITLE%</h4>"+
                                                    "<p class=\"list-group-item-text\"><small>%OPTION_SUBTITLE%</small></p>"+
                                                "</div>"+
                                                "<div class=\"col-md-3 col-sm-3 col-xs-3 pull-right\">"+
                                                    " <img src=\"images/%OPTION_ID%.jpg\" class=\"img-responsive img-rounded pull-right\" alt=\"Responsive image\" width=\"61\" height=\"92\">"+
                                                "</div>"+
                                            "</div>"+
                                        "</li>";

    var questionPointsHtmlTemplate = "<span class=\"label %QUESTION_POINTS_CLASS% pull-right\">%QUESTION_POINTS%</span>";
    var questionOptionDisabledHtmlTemplate = "disabled=\"disabled\"";
    var questionOptionCheckedHtmlTemplate = "checked=\"checked\"";
    var glyphiconRemoveHtmlTemplate = "<span class=\"glyphicon glyphicon-remove pull-right\"></span>";
    var glyphiconOkHtmlTemplate = " <span class=\"glyphicon glyphicon-ok pull-right\"></span>";

    $.ajax({
        url: "http://"+serverName+"/getQuiniela?userUUID="+userUUID+"&quinielaUUID="+quinielaUUID
    }).then(function (data) {

         $("#headMessage").append(data.userName);

        var numQuestions = data.questions.length;

        for (var i = 0; i < numQuestions; i++) {

            // Initialize html templates
            var questionHtmlStart = questionHtmlStartTemplate;
            var questionHtmlEnd = questionHtmlEndTemplate;
            var questionPointsHtml = questionPointsHtmlTemplate;
            var questionOptionsHtml = "";

            // Add question title
            questionHtmlStart = questionHtmlStart.replace("%QUESTION_TITLE%", (i + 1) + ". " + data.questions[i].title);

            if (data.quinielaStatus == "open") {
                // Make the total point gray
                questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS_CLASS%", "label-default");
                // Show the points if users get the question right
                questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS%", data.questions[i].questionPoints);
            } else {
                if (data.questions[i].correctAnswer == null) {
                    // The correct answer is not posted yet
                    questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS_CLASS%", "label-default");
                } else if (data.questions[i].correctAnswer == data.questions[i].userAnswer) {
                    // CORRECT!
                    questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS_CLASS%", "label-success");
                } else {
                    // WRONG!
                    questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS_CLASS%", "label-danger");
                }
                questionPointsHtml = questionPointsHtml.replace("%QUESTION_POINTS%", data.questions[i].userPoints)
            }

            // Add Poitsn span to template
            questionHtmlStart = questionHtmlStart.replace("%QUESTION_POINTS_SPAN%", questionPointsHtml);

            var numOptions = data.questions[i].options.length;

            // Iterate over each question option
            for (var j = 0; j < numOptions; j++) {

                //Initialize option template
                var questionOptionHtml = questionOptionHtmlTemplate;

                //Check if option to be added is the one the user selected
                if (data.questions[i].userAnswer == data.questions[i].options[j].optionUUID) {

                    questionOptionHtml = questionOptionHtml.replace("%CHECKED%", questionOptionCheckedHtmlTemplate);

                    if (data.quinielaStatus == "open") {
                        // Highlight in BLUE
                        questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "alert-info");
                        // Enable radio option
                        questionOptionHtml = questionOptionHtml.replace("%DISABLED%", "");
                        // NO Glyphicon
                        questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", "");
                    } else {
                        // Disable radio button
                        questionOptionHtml = questionOptionHtml.replace("%DISABLED%", questionOptionDisabledHtmlTemplate);

                        if (data.questions[i].correctAnswer == null) {
                            // Highlight in BLUE since the correct answer has not been posted 
                            questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "alert-info");
                            // NO Glyphicon
                            questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", "");
                        } else if (data.questions[i].correctAnswer == data.questions[i].userAnswer){
                            // CORRECT! in GREEN                            
                            questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "alert-success");
                            questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", glyphiconOkHtmlTemplate);
                        } else {
                            // WRONG! in RED
                            questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "alert-danger");
                            questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", glyphiconRemoveHtmlTemplate);    
                        }                      
                    }
                } else {
                    //Unchecked
                    questionOptionHtml = questionOptionHtml.replace("%CHECKED%", "");

                    if (data.quinielaStatus == "open") {
                        // Enable radio option
                        questionOptionHtml = questionOptionHtml.replace("%DISABLED%", "");
                        // Default color
                        questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "");
                        // NO Glyphicon
                        questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", ""); 
                    } else {
                        // Disable radio option
                        questionOptionHtml = questionOptionHtml.replace("%DISABLED%", questionOptionDisabledHtmlTemplate);

                        if (data.questions[i].correctAnswer == data.questions[i].options[j].optionUUID){
                            // Highlight in yellow the correct answer
                            questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "alert-warning");
                            // NO Glyphicon
                            questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", ""); 
                        } else {
                            // Default color
                            questionOptionHtml = questionOptionHtml.replace("%QUESTION_OPTION_CLASS%", "");
                            // NO Glyphicon
                            questionOptionHtml = questionOptionHtml.replace("%GLYPHICON%", ""); 
                        }
                    }
                    
                }

                questionOptionHtml = questionOptionHtml.replace("%QUESTION_ID%", data.questions[i].questionUUID);
                questionOptionHtml = questionOptionHtml.replace("%QUESTION_ID%", data.questions[i].questionUUID);
                questionOptionHtml = questionOptionHtml.replace("%OPTION_ID%", data.questions[i].options[j].optionUUID);
                questionOptionHtml = questionOptionHtml.replace("%OPTION_ID%", data.questions[i].options[j].optionUUID);
                questionOptionHtml = questionOptionHtml.replace("%OPTION_ID%", data.questions[i].options[j].optionUUID);
                questionOptionHtml = questionOptionHtml.replace("%OPTION_ID%", data.questions[i].options[j].optionUUID);

                questionOptionHtml = questionOptionHtml.replace("%OPTION_TITLE%", data.questions[i].options[j].optionTitle);
                questionOptionHtml = questionOptionHtml.replace("%OPTION_SUBTITLE%", data.questions[i].options[j].optionSubtitle);

                questionOptionsHtml += questionOptionHtml;
            }

            if (i <= 7) {
                $("#columnA").append(questionHtmlStart + questionOptionsHtml + questionHtmlEnd);
            } else if (i <= 15) {
                $("#columnB").append(questionHtmlStart + questionOptionsHtml + questionHtmlEnd);
            } else {
                $("#columnC").append(questionHtmlStart + questionOptionsHtml + questionHtmlEnd);
            }

        }

    });

});

function handleRadioClick(myRadio) {

    var userUUID = getUrlParameters("userUUID", "", true);
    var quinielaUUID = getUrlParameters("quinielaUUID", "", true);

    console.log('myRadio.value: ' + myRadio.value);
    console.log('myRadio.id: ' + myRadio.id);
    console.log('myRadio.name: ' + myRadio.name);

    $("."+myRadio.name).removeClass("alert-info");
    $("."+myRadio.name+"."+myRadio.id).addClass("alert-warning");

    $.ajax({
        type: 'PUT',
        url: "http://"+serverName+"/userAnswer?userUUID="+userUUID+"&questionUUID="+myRadio.name+"&optionUUID="+myRadio.id
    }).then(function (data) {
        //If there are no errors
        if(data.error == null){
            $("."+myRadio.name+"."+myRadio.id).removeClass("alert-warning");
            $("."+myRadio.name+"."+myRadio.id).addClass("alert-info");
        } else {
            $("."+myRadio.name+"."+myRadio.id).removeClass("alert-warning");
            $("."+myRadio.name+"."+myRadio.id).addClass("alert-danger");
        }
                        
    });

    
    //alert('myRadio.value: ' + myRadio.value);



}

function getUrlParameters(parameter, staticURL, decode){
   /*
    Function: getUrlParameters
    Description: Get the value of URL parameters either from 
                 current URL or static URL
    Author: Tirumal
    URL: www.code-tricks.com
   */
   var currLocation = (staticURL.length)? staticURL : window.location.search,
       parArr = currLocation.split("?")[1].split("&"),
       returnBool = true;
   
   for(var i = 0; i < parArr.length; i++){
        parr = parArr[i].split("=");
        if(parr[0] == parameter){
            return (decode) ? decodeURIComponent(parr[1]) : parr[1];
            returnBool = true;
        }else{
            returnBool = false;            
        }
   }
   
   if(!returnBool) return false;  
}