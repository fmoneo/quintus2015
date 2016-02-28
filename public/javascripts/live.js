var parser = document.createElement('a');
parser.href = document.URL;
var serverName = parser.host;


$(document).ready(function () {

   refreshData();
   var t=setInterval(refreshData,2000);

});

function refreshData(){
    var quinielaUUID = getUrlParameters("quinielaUUID", "", true);
    var groupUUID = getUrlParameters("groupUUID", "", true);

    var quinielaTitleHtmlTemplate = "<h4 class=\"openSans panel-title\">%QUINIELA_TITLE%</h4>";
    var quinielaStatusHtmlTemplate = "<span class=\"label %QUINIELA_STATUS_CLASS% pull-right\">%QUINIELA_STATUS%</span>";

    $.ajax({
        url: "http://"+serverName+"/getLive?quinielaUUID="+quinielaUUID+"&groupUUID="+groupUUID+"&r="+Math.random()
    }).then(function (data) {

        // QUINIELA TITLE
        quinielaTitleHtmlTemplate = quinielaTitleHtmlTemplate.replace("%QUINIELA_TITLE%", data.quinielaName);

        // QUINIELA STATUS
        var quinielaStatusClass = "label-warning";
        if(data.quinielaStatus == "open"){
            quinielaStatusClass = "label-success";
        } else if (data.quinielaStatus == "in progress"){
            quinielaStatusClass = "label-info";
        } else if (data.quinielaStatus == "closed"){
            quinielaStatusClass = "label-danger";
        }
        quinielaStatusHtmlTemplate = quinielaStatusHtmlTemplate.replace("%QUINIELA_STATUS_CLASS%", quinielaStatusClass);
        quinielaStatusHtmlTemplate = quinielaStatusHtmlTemplate.replace("%QUINIELA_STATUS%", data.quinielaStatus);

        $("#quinielaTitle").html(quinielaTitleHtmlTemplate);
        $("#quinielaStatus").html(quinielaStatusHtmlTemplate);


        var questionHtmlStartTemplate =   "<div class=\"panel panel-primary\">"+
                                            "<div class=\"panel-heading\">"+
                                                "<div class=\"row\">"+
                                                    "<div class=\"col-md-9 col-xs-9\">"+
                                                        "<h1 class=\"openSans list-group-item-heading\">%QUESTION%</h1>"+
                                                    "</div>"+
                                                    "<div class=\"col-md-3 col-xs-3\">"+
                                                    "</div>"+
                                                "</div>"+
                                            "</div>"+
                                            "<ul class=\"list-group\">";
        var questionHtmlEndTemplate =         "</ul>"+                    
                                        "</div>";
        var optionRecordHtmlTemplate =         "<li class=\"list-group-item %QUESTION_OPTION_CLASS%\">"+
                                                    "<div class=\"row\">"+
                                                        "<div class=\"col-md-1 col-sm-1 col-xs-1\">"+
                                                            "%IMAGE%"+
                                                        "</div>"+
                                                        "<div class=\"col-md-8 col-sm-8 col-xs-8\">"+
                                                            "<h2 class=\"list-group-item-heading\">%OPTION%</h2>"+
                                                            "<h3>%LABEL_CONTENT%</h3>"+
                                                        "</div>"+
                                                        "<div class=\"col-md-2 col-sm-2 col-xs-2 pull-right\" >"+
                                                            "<h1 align=\"right\" class=\"list-group-item-heading\">%COUNT%</h1>"+
                                                        "</div>"+
                                                    "</div>"+
                                                "</li>";
        var labelHtmlTemplate = "<span class=\"label %LABEL_CLASS%\">%LABEL%</span>";

        var numGroupQuestions = data.groupQuestions.length;

        var questionsHtml = "";

        for (var i = 0; i < numGroupQuestions; i++) {

            var questionHtmlStart = questionHtmlStartTemplate;
            var questionHtmlEnd = questionHtmlEndTemplate;

            questionHtmlStart = questionHtmlStart.replace("%QUESTION%", data.groupQuestions[i].question );

            var numOptions = data.groupQuestions[i].optionStats.length;
            var optionsHtml = "";

            for (var j = 0; j < numOptions; j++) {

                var optionRecordHtml = optionRecordHtmlTemplate;
                if(data.groupQuestions[i].optionStats[j].optionId == data.groupQuestions[i].correctAnswerId && data.groupQuestions[i].optionStats[j].optionId != null){
                    optionRecordHtml = optionRecordHtml.replace("%QUESTION_OPTION_CLASS%", "list-group-item-success");
                } else {
                    optionRecordHtml = optionRecordHtml.replace("%QUESTION_OPTION_CLASS%", "");
                }

                if(data.groupQuestions[i].optionStats[j].optionTitle != "NONE"){
                    optionRecordHtml = optionRecordHtml.replace("%IMAGE%", " <img src=\"images/%OPTION_ID%.jpg\" class=\"img-responsive img-rounded pull-right\" alt=\"Responsive image\" width=\"61\" height=\"92\">");
                    optionRecordHtml = optionRecordHtml.replace("%OPTION_ID%", data.groupQuestions[i].optionStats[j].optionUUID);
                } else {
                    optionRecordHtml = optionRecordHtml.replace("%IMAGE%", "");
                }
                
                optionRecordHtml = optionRecordHtml.replace("%OPTION%", data.groupQuestions[i].optionStats[j].optionTitle);
                optionRecordHtml = optionRecordHtml.replace("%COUNT%", data.groupQuestions[i].optionStats[j].count);

               
                var numUsers = data.groupQuestions[i].optionStats[j].users.length;
                var labelContent = "";

                for (var k = 0; k < numUsers; k++) {
                    var labelHtml = labelHtmlTemplate;
                    labelHtml = labelHtml.replace("%LABEL%", data.groupQuestions[i].optionStats[j].users[k].userName);
                    labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-default");
                    labelContent += labelHtml + "&nbsp;";
                    if(k>1 && k%8==0)
                        labelContent += "</h3><h3>";
                }

                optionRecordHtml = optionRecordHtml.replace("%LABEL_CONTENT%", labelContent);
                optionsHtml += optionRecordHtml;

            } // for numOptions

            questionsHtml += questionHtmlStart + optionsHtml + questionHtmlEnd;

           
        } // for numGroupQuestions


        $("#mainColumn").html(questionsHtml);

    });
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