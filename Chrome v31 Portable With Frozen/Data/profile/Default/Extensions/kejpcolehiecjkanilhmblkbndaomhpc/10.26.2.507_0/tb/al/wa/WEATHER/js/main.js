$('document').ready(function(){         
    $('#day1').hover(
        function(){
            $('#divider1').hide();
        },
        function(){
            $('#divider1').show();
        }
        );
    $('#day2').hover(
        function(){
            $('#divider1,#divider2').hide();
        },
        function(){
            $('#divider1,#divider2').show();
        }
        );
    $('#day3').hover(
        function(){
            $('#divider2').hide();
        },
        function(){
            $('#divider2').show();
        }
        );
    $('#saveButton').hover(
        function(){
            this.src=app.weatherIconPath + 'save_rollover.png';
        },
        function(){
            this.src=app.weatherIconPath + 'save-button.png';
        }
        );
    $('#toggle,#toggle2').click(
        function(){                                    
            var t_disp = app.temp_dis.toLowerCase() == "c" ? 'F' : 'C';                                    
            conduit.messaging.sendRequest('backgroundPage', 'setTempDisp', t_disp, function() {});                                
            gadgetUI.translateTemperature(t_disp);
            setTempUnit(t_disp.toLowerCase());                                                                                              
            adjustView(app.alignMode);
        });
    $('#day1,#day2,#day3').click(onClickNextDay);
    $('#back').click(daysToCurrent);
    $('#change').click(currentToChange);
    $('#change2').click(daysToChange);
    //$('#cancel,#saveButton').click(backToCurrent);

    $('#saveButton').hover(
        function(){
                              
            $('#saveButton>p').css("background-image","url('"+app.weatherIconPath+"save-center_rollover.png')");
            $('#right').attr('src',app.weatherIconPath + 'save-right_rollover.png');
            $('#left').attr('src',app.weatherIconPath +'save_left_rollover.png');
        },
        function(){
            $('#saveButton>p').css("background-image","url('"+app.weatherIconPath+"save-center.png')");
            $('#right').attr('src',app.weatherIconPath +'save-right.png');
            $('#left').attr('src',app.weatherIconPath +'save_left.png');
        }
        );
});
function adjustCancelSave(dir) {
    if(!dir || typeof(dir)!='string'){dir='ltr'}
    dir=dir.toLowerCase();
    
    var sbp = $('#saveButton>p').width();
    var rightPosition = sbp + 2 + 24 +'px';
    $('#right').css('left',rightPosition);

    var divWidth = sbp  + 6 + 14 +'px';
    $('#saveButton').css({
        'width':divWidth,
        'height':'17px'
    });
   
    var right = $('#saveButton').width() + 4 + 13 +'px';  //4 word gap save offset
    if(dir=='rtl'){
        right = $('#saveButton').width() + 8 + 13 +'px';  //4 word gap save offset
        $('#saveButton').css({
            'right': 'auto',
            'left': '6px'
        });
        $('#cancel').css({
            'left': right
        });
    }else{
        $('#cancel').css({
            'right': right
        });
    }
    var paneWidth=$('#top3').width();
    var controlsWidth = parseInt(right)+$('#cancel').width();
    var maxWidth=paneWidth-controlsWidth-15;
    $('#ui_cl_alert').css({'max-width':maxWidth+'px'});
}

function adjustView(){
    adjustCancelSave(app.alignMode);
    $('#date2, #nowTmpr').textShadow({
        x:      1,    
        y:      1,    
        radius: 2,    
        color:  "#ccd9e3",
        opacity:0.1
    });
}

function onClickNextDay() {     
    if (gadgetUI.nextDayClicked)
        return;
    gadgetUI.nextDayClicked = true;
    gadgetUI.selectedDay = this.id;
    var boxWidth = $('#current').width();          
    gadgetUI.fillDayBox(weatherData[this.id]);
    var direction = app.alignMode == "RTL" ? "+=" : "-=";    
    $('#current').add('#nextDays').animate({
        "left": direction + boxWidth
    },250, function() {
        //add stuff here after animate done, if needed
        });
}

function daysToCurrent () {
    gadgetUI.nextDayClicked = false;
    var boxWidth = $('#nextDays').width();
    var direction = app.alignMode == "RTL" ? "-=" : "+=";    
    $('#nextDays').add('#current').animate({
        "left": direction + boxWidth
    },250, function() {
        //add stuff here after animate done, if needed
        });
}

function showOptions() {
    var boxHeight = $('#current').height();
    $('#current').css({
        "top" : "-"+boxHeight+"px"
        });
    $('#changeLocation').css({
        "top" : "0px"
    });
    //$('#current').add('#changeLocation').css({"top" : "-="+boxHeight});
    gadgetUI.showCanvas();          
}


function currentToChange() {     
    sendUsage('WEATHER_CHANGE_LOCATION');
    gadgetUI.nextDayClicked = false;
    var boxHeight = $('#current').height();          
    $('#current').add('#changeLocation').animate({
        "top": "-=" + boxHeight
    },250, function() {                              
        });
}

function daysToChange() {
    sendUsage('WEATHER_CHANGE_LOCATION');
    gadgetUI.nextDayClicked = false;
    var boxHeight = $('#nextDays').height();
    $('#nextDays').add('#changeLocation').animate({
        "top": "-=" + boxHeight
        });
}

function backToCurrent () {
    if ($ac)
        $ac.killSuggestions();
    $('#current').css({
        'top':  '-291px', 
        'left': '0'
    });
    var boxHeight = $('#changeLocation').height();
    var leftSign = app.alignMode == "RTL" ? "-" : "";    
    $('#changeLocation').add('#current').animate({
        "top": "+=" + boxHeight
    },250, function() {
        $('#nextDays').css({
            'top':  '0',
            'left': leftSign+'294px'
        });
    });
}
