var parser = document.createElement('a');
parser.href = document.URL;
var serverName = parser.host;


$(document).ready(function () {

   refreshData();
   var t=setInterval(refreshData,10000);

});

function refreshData(){
    var quinielaUUID = getUrlParameters("quinielaUUID", "", true);
    var groupUUID = getUrlParameters("groupUUID", "", true);

    var quinielaTitleHtmlTemplate = "<h4 class=\"openSans panel-title\">%QUINIELA_TITLE%</h4>";
    var quinielaStatusHtmlTemplate = "<span class=\"label %QUINIELA_STATUS_CLASS% pull-right\">%QUINIELA_STATUS%</span>";



    $.ajax({
        url: "https://"+serverName+"/getResults?quinielaUUID="+quinielaUUID+"&groupUUID="+groupUUID+"&r="+Math.random()
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


        var resultHtmlStartTemplate =   "<div class=\"panel panel-primary\">"+
                                            "<div class=\"panel-heading\">"+
                                                "<div class=\"row\">"+
                                                    "<div class=\"col-md-9 col-xs-9\">"+
                                                        "<h4 class=\"openSans panel-title\">%GROUP_NAME%</h4>"+
                                                    "</div>"+
                                                    "<div class=\"col-md-3 col-xs-3\">"+
                                                    "</div>"+
                                                "</div>"+
                                            "</div>"+
                                            "<ul class=\"list-group\">";
        var resultHtmlEndTemplate =         "</ul>"+                    
                                        "</div>";
        var standingRecordHtmlTemplate =         "<li class=\"list-group-item\">"+
                                                    "<div class=\"row\">"+
                                                        "<div class=\"col-md-1 col-sm-1 col-xs-1\">"+
                                                            "<h2 class=\"list-group-item-heading\">%RANK%</h2>"+
                                                        "</div>"+
                                                        "<div class=\"col-md-5 col-sm-5 col-xs-5\">"+
                                                            "<h2 class=\"list-group-item-heading\">%USER_NAME%</h2>"+
                                                            "%LABEL_CONTENT%"+
                                                        "</div>"+
                                                        "<div class=\"col-md-5 col-sm-5 col-xs-5 pull-right\" >"+
                                                            "<h2 align=\"right\" class=\"list-group-item-heading\">%POINTS%</h2>"+
                                                        "</div>"+
                                                    "</div>"+
                                                "</li>";
        var labelHtmlTemplate = "<span class=\"label %LABEL_CLASS%\">%LABEL%</span>";


        var numGroupResults = data.groupResults.length;

        var resultsHtml = "";

        for (var i = 0; i < numGroupResults; i++) {

            var resultHtmlStart = resultHtmlStartTemplate;
            var resultHtmlEnd = resultHtmlEndTemplate;

            resultHtmlStart = resultHtmlStart.replace("%GROUP_NAME%", data.groupResults[i].groupName);

            var numStandingRecords = data.groupResults[i].standings.length;
            var standingsHtml = "";

            for (var j = 0; j < numStandingRecords; j++) {

                var standingRecordHtml = standingRecordHtmlTemplate;
                standingRecordHtml = standingRecordHtml.replace("%RANK%", data.groupResults[i].standings[j].rank);
                standingRecordHtml = standingRecordHtml.replace("%USER_NAME%", data.groupResults[i].standings[j].userName);
                standingRecordHtml = standingRecordHtml.replace("%POINTS%", data.groupResults[i].standings[j].points);

                var labelContent = "";

                // Show status when quiniela is still open
                if(data.quinielaStatus == "open"){

                    var labelHtml = labelHtmlTemplate;
                    labelHtml = labelHtml.replace("%LABEL%", data.groupResults[i].standings[j].status);

                    if (data.groupResults[i].standings[j].status == "ready"){
                        labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-success");
                    } else {
                        labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-danger");
                    }

                    labelContent = labelHtml;

                } else {

                    var numLastX = data.groupResults[i].standings[j].lastX.length;

                    for (var k = 0; k < numLastX; k++) {

                        var labelHtml = labelHtmlTemplate;

                        if(data.groupResults[i].standings[j].lastX[k] > 0){
                            labelHtml = labelHtml.replace("%LABEL%", data.groupResults[i].standings[j].lastX[k]);
                            labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-success");
                        } else if (data.groupResults[i].standings[j].lastX[k] == 0){
                            labelHtml = labelHtml.replace("%LABEL%", data.groupResults[i].standings[j].lastX[k]);
                            labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-danger");
                        } else {
                            labelHtml = labelHtml.replace("%LABEL%", "?");
                            labelHtml = labelHtml.replace("%LABEL_CLASS%", "label-default");
                        }

                        labelContent += labelHtml + "&nbsp;";
                    }

                }

                standingRecordHtml = standingRecordHtml.replace("%LABEL_CONTENT%", labelContent);

                standingsHtml += standingRecordHtml;


            } // for numStandingRecords

            resultsHtml += resultHtmlStart + standingsHtml + resultHtmlEnd;

        } // for numGroupResults


        $("#mainColumn").html(resultsHtml);

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