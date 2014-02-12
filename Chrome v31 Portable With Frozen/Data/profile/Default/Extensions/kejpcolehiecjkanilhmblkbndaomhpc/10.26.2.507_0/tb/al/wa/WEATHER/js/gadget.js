
//var data = chrome.extension.getBackgroundPage().weatherData;
var gadgetUI = {
    dayOrNight: 'night',
    selectedDay: null,
    init: function () {
        //app.alignMode = "RTL";
        if (app.alignMode == "RTL") {
            $('body').addClass(app.alignMode);
            $('.moreShev').text("<<");
            adjustCancelSave(app.alignMode);
        }



        $('#logo, #logo2,#logo3').click(function () {
            goByUrl(config.getWeatherUri());
        })
        //$('#defaultInput').keypress(defaultCityKeyPress);
        $('#cancel').click(cansel_options);
        $('#saveButton').click(save_options);
        $("#regionSelect").change(onRegionChanged);
        $("#defaultInput").keyup(function (e) {
            if (e.keyCode != 13)
                $("#locId").val("");
            else {
                $('#saveButton').click();
                $('#defaultInput').blur();

            }
        }).blur(toggleText).focus(function () {
            toggleText();
            $("#defaultInput").css({
                'border': 'solid 1px white',
                'font-family': 'Arial',
                'color': 'gray'

            });
        });

    },
    setCityName: function (cName) {
        var maxLen = 21;
        var citNam = ((cName.length > maxLen) ? cName.substr(0, maxLen - 1) + '...' : cName);
        $("#location, #location2").text(citNam);
        $("#location, #location2").attr('title', cName);
        $("#location").css('color', 'white');
    },
    fillCurrentWeather: function (data) {
        //set proper backgrounds for day / night time
        var divImgs;
        if (data.night) {
            gadgetUI.dayOrNight = 'night';
            divImgs = [
            'divider.gif',
            'divider.gif',
            'divider.gif',
            'divider-top_location-screen.png', //irelevant
            'night-divider.png'
            ];
        }
        else {
            gadgetUI.dayOrNight = 'day';
            divImgs = [
            'devider_1st-screen.png',
            'devider_1st-screen.png',
            'devider_2nd-screen.png',
            'divider_third-screen.png', //irelevant
            'divider_third-screen.png'
            ];
        }
        var tod = gadgetUI.dayOrNight + '/';
        var prefix = app.weatherIconPath + tod;
        $('#canvas').css('background-image', 'url(' + prefix + 'grad.jpg)');
        $('#topBg').attr("src", prefix + 'rec_top_main.png');
        $('#bottomBg').attr("src", prefix + 'rec_bottom_main.png');
        $('#topBg2').attr("src", prefix + 'top.png');
        $('#bottomBg2').attr("src", prefix + 'bottom.png');
        $('#changeBg').attr("src", prefix + 'change-location.png');
        $('#day1, #day2, #day3').removeClass().addClass(gadgetUI.dayOrNight);
        for (var i = 1; i <= 5; i++)
            $('#divider' + i).attr('src', prefix + divImgs[i - 1]);

        $("#nowImg").attr("src", app.weatherIconPath + "93x93/" + data.icon);
        if (data.hasCurrentCondition) { // Set current conditions
            if (app.supportedLang)
                $("#feelsDesc").text(data.condition);
            else {
                var key = 'SB_WEATHER_' + data.condition.toUpperCase().replace(' ', '_');
                getStr(key, ["#feelsDesc"]);
            }
            $("#nowTmpr").text(data.temperature.toLowerCase());
            $("#flik_val").text(data.feelsLike.toLowerCase());
            $("#nowTmprLow").text(data.lowTemperature.toLowerCase());
            $("#nowTmprHigh").text(data.highTemperature.toLowerCase());
        }
        else { // not available all around
            getStr('SB_WEATHER_STATION_DOWN', ["#feelsDesc"]);
            getStr('SB_WEATHER_STATION_DOWN', ["#nowTmpr", "#flik_val", "#nowTmprLow", "#nowTmprHigh"]);
        }
    },
    fillNextDays: function (dt) {
        gadgetUI.fillDay($("#day1"), dt.day1);
        gadgetUI.fillDay($("#day2"), dt.day2);
        gadgetUI.fillDay($("#day3"), dt.day3);
        //gadgetUI.fillDayBox(dt.forecastTomorrow);
    },
    fillDay: function (day, data) {
        //day.css("background","url("+app.weatherIconPath+"52x52/" +data.icon + ") no-repeat  91% 20%");
        day.find(".dayImg").attr("src", app.weatherIconPath + "52x52/" + data.icon);
        if (app.supportedLang)
            day.find(".dayName").text(data.dayName);
        else {
            var key = "SB_WEATHER_" + data.dayName.toUpperCase().replace(' ', '_');
            //adjustText(key, day.find(".dayName"));
            getStr(key, day.find(".dayName"));
        }
        day.find(".dayHigh").text(data.highTemperature.toLowerCase());
        day.find(".dayLow").text(data.lowTemperature.toLowerCase());
    },
    translateTemperature: function (unit) {
        conduit.storage.app.keys.set(app.TWC_PREFIX + 'temp_dis', unit);
        app.temp_dis = unit;
        var data = weatherData;
        $("#nowTmpr").text(temp_format(data.tUnit, parseInt(data.temperature), unit).toLowerCase());
        $("#flik_val").text(temp_format(data.tUnit, parseInt(data.feelsLike), unit).toLowerCase());
        $("#nowTmprLow").text(temp_format(data.tUnit, parseInt(data.lowTemperature), unit).toLowerCase());
        $("#nowTmprHigh").text(temp_format(data.tUnit, parseInt(data.highTemperature), unit).toLowerCase());
        if (gadgetUI.selectedDay) {
            $('#nowTmpr2 #high').text(temp_format(data.tUnit, parseInt(data[gadgetUI.selectedDay].highTemperature), unit).toLowerCase());
            $('#nowTmpr2 #low').text(temp_format(data.tUnit, parseInt(data[gadgetUI.selectedDay].lowTemperature), unit).toLowerCase());

            if (data[gadgetUI.selectedDay].hourly)
                for (x = 0; x < 4 && data[gadgetUI.selectedDay].hourly[x]; x++) {
                    $('.col5 .data' + (x + 1)).text(temp_format('f', parseInt(data[gadgetUI.selectedDay].hourly[x].temp), unit).toLowerCase());
                }
        }

        gadgetUI.translateDayTemperature($("#day1"), data.day1, data.tUnit, unit);
        gadgetUI.translateDayTemperature($("#day2"), data.day2, data.tUnit, unit);
        gadgetUI.translateDayTemperature($("#day3"), data.day3, data.tUnit, unit);

    },
    translateDayTemperature: function (day, data, curUnit, unit2) {
        day.find(".condition").text(temp_format(curUnit, parseInt(data.condition), unit2).toLowerCase());
        day.find(".dayHigh").text(temp_format(curUnit, parseInt(data.highTemperature), unit2).toLowerCase());
        day.find(".dayLow").text(temp_format(curUnit, parseInt(data.lowTemperature), unit2).toLowerCase());
    },
    fillDayBox: function (data) {

        $("#nowImg2").attr("src", app.weatherIconPath + "93x93/" + data.icon);
        //todo - get year of tomorrow
        $('#date2').text(data.date);
        $('#nowTmpr2 #high').text(temp_format(weatherData.tUnit, parseInt(data.highTemperature)).toLowerCase());
        $('#nowTmpr2 #low').text(temp_format(weatherData.tUnit, parseInt(data.lowTemperature)).toLowerCase());
        if (app.supportedLang)
            $("#desc").text(data.condition);
        else {
            var key = 'SB_WEATHER_' + data.condition.toUpperCase().replace(' ', '_');
            getStr(key, ["#desc"]);
        }
        $('.col2 .data1').text(data.sunr)
        $('.col2 .data2').text(data.suns);
        $('.col2 .data3').text(data.humidity);
        $('.col2 .data4').text(data.windSpeed);
        //hourly
        for (var x = 0; x < 4; x++) {
            $('.col3 .data' + (x + 1)).text('');
            $('.col4 .data' + (x + 1)).hide();
            $('.col5 .data' + (x + 1)).text('');
        }
        if (data.hourly)
            for (x = 0; x < 4 && data.hourly[x]; x++) {
                $('.col3 .data' + (x + 1)).text(data.hourly[x].dateTime)
                $('.col4 .data' + (x + 1)).attr("src", app.weatherIconPath + '20x20/' + padDigits(data.hourly[x].icon, 2) + '.png').show();
                $('.col5 .data' + (x + 1)).text(temp_format('f', parseInt(data.hourly[x].temp)).toLowerCase());
            }
    },
    showCanvas: function () {
        $("#nodata").hide();
        $('body').css('background-color', '#042c45');
        $('#canvas').show();
        sendUsage('WEATHER_OPEN_WINDOW');
        adjustView();
        //$("#bottom").show();
        //document.getElementById('facebook').innerHTML = '<iframe src="http://www.facebook.com/plugins/like.php?href=http%3A%2F%2Fapps.conduit.com%2FWeathercom-The-Weather-Channel--app%3Fappid%3D96a27762-7d9a-4703-89b9-10b2a20044c0&amp;layout=button_count&amp;show_faces=false&amp;width=140&amp;action=like&amp;colorscheme=light&amp;height=24" scrolling="no" style="border:none; overflow:hidden; width:141px; height:25px;" allowTransparency="true"></iframe>';
    }
}

var firstTime = true;
function init() {
    translate_ui();
    loadConfig(init2);
}

function init2() {
    //translate_ui();
    gadgetUI.init();
    conduit.messaging.onTopicMessage.addListener('weatherData', fnContinueInit);
    conduit.messaging.sendRequest("backgroundPage", "weatherData", '',function (data){
        fnContinueInit(data || '');
    });
}

function fnContinueInit(wData) {
    fnBodyLoad();
    if (firstTime) {
        setupAutocomplete(getCountryCode());
    }
    try {
        wData = JSON.parse(wData);
    }
    catch (e) {
        conduit.logging.logDebug('weather/gadget.js/fnContinueInit - received wrong wData: ' + wData);
        wData = "";
    }
    if (wData) {
        loadData(wData);
        if (app.temp_dis != wData.tUnit)   //check if need to translate from F to C
            gadgetUI.translateTemperature(app.temp_dis);
    } else {
        toggleText();
        showOptions();
    }
    if (firstTime)
        firstTime = false;
}

function loadData(dt) {
    weatherData = dt;
    $("#more2").unbind().click(function () {   // Set more  links
        sendUsage('WEATHER_EXTENDED_FORECAST')
        goByUrl(dt.todayLink);
    });
    $("#more").unbind().click(function () {
        sendUsage('WEATHER_EXTENDED_FORECAST')
        goByUrl(dt.extendedOutlookLink);
    });

    gadgetUI.setCityName(dt.cityName);
    gadgetUI.fillCurrentWeather(dt);
    gadgetUI.fillNextDays(dt);
    gadgetUI.showCanvas();
}


///FROM OPTIONS SCREEN

function cansel_options() {
    //check for region chage

    if (app.locId == '' || app.locId == null)
        alertInvalidLocation();
    else
        backToCurrent();
}

function save_options() {
    if (trim($("#defaultInput").val()) == "" || isToggleText()) {
        $("#defaultInput").css({
            'border': 'solid 1px red',
            'font-family': 'Arial',
            'color': '#ff4848'
        });
        var translatedVal = tr('SB_WHEATHER_FILL_LOCATION');
        if (translatedVal == undefined) {
            translatedVal = defaultTranslations['SB_WHEATHER_FILL_LOCATION'];
        }
        $("#defaultInput").val(translatedVal);
        return;
    }

    if ($("#locId").val().length == 8) {
        saveToStorage();
    }
    else {
        isValidZipCode(
            function () {
                var locationDescription = $("#defaultInput").val();
                var startIndexParentesis = locationDescription.indexOf("(");
                if (startIndexParentesis != -1) {
                    locationDescription = trim(locationDescription.substring(startIndexParentesis + 1, locationDescription.lastIndexOf(")")));
                }
                findMapLocation(locationDescription, validateLocation);
            },
            function () {

                var locationDescription = $("#defaultInput").val();
                if (locationDescription.length == 5)
                    findMapLocation(locationDescription, validateLocation);
                else
                    alertInvalidLocation();
            }
            );
    }

    sendUsage('WEATHER_SEARCH', { searchQuery: $("#defaultInput").val() });
}

function isValidZipCode(invalidZipFunction, errorFunction) {
    var locTmp = $("#defaultInput").val().split(',');
    if (locTmp[0] != '')
        var loc = locTmp[0];
    else
        loc = $("#defaultInput").val();
    var locale = String.format("{0}_{1}", app.lang, getRegion());
    var url = String.format("{0}/weather/local/{1}?siteLocale={2}&cc=*&dayf=2&prod=bd_select&par=chromev110XML", config.searchSite, loc, locale);
    function CallbackFunction(strData, headers, httpCode) {
        if (httpCode == 200) {
            if (strData) {
                var i = 0;
                if (typeof (ActiveXObject) == 'undefined') {
                    var parser = new DOMParser();
                    xmlDoc = parser.parseFromString(strData, "text/xml");
                    i = xmlDoc.evaluate('count(/weather/cc)', xmlDoc, null, XPathResult.ANY_TYPE, null).numberValue;
                } else {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(strData);
                    var node = xmlDoc.selectSingleNode('/weather/cc');
                    if (node)
                        i = node.text;
                }
                if (i > 0 || i.length > 20) {
                    errorFunction();
                    return;
                } else {
                    invalidZipFunction();
                }
            } else {
                invalidZipFunction();
            }
        } else {
            invalidZipFunction();
        }
    }
    Request(CallbackFunction, url);
}

function saveToStorage() {
    //all hidden fields
    $("input[type='hidden']").each(
        function () {
            var $this = $(this);
            var val = '' + $this.val();
            conduit.storage.app.keys.set(app.TWC_PREFIX + $this.attr("id"), val);
            app[$this.attr("id")] = val;
        });
    //region
    var region = '' + $("#regionSelect").val();
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'region', region);
    app.region = region;

    //location
    var location = '' + $("#defaultInput").val();
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'location', location);
    app.location = location;

    //farn/celcius
    var temp_dis = '' + $('input[name=tmpr]:checked').val();
    if (app.temp_dis != temp_dis) {
        sendUsage('WEATHER_CHANGE_TO', {
            changeTo: temp_dis
        });

    }
    conduit.storage.app.keys.set(app.TWC_PREFIX + 'temp_dis', temp_dis);
    app.temp_dis = temp_dis;
    conduit.messaging.sendRequest('backgroundPage', 'refresh', JSON.stringify({ loc: app.locId, tmp_dis: app.temp_dis }), function () { });
    //setTimeout(backToCurrent, 200);
    backToCurrent();
}


function alertInvalidLocation() {
    e = jQuery.Event("blur");
    $("#defaultInput").trigger(e);
    $("#defaultInput").css({
        'border': 'solid 1px red',
        'font-family': 'Arial',
        'color': '#ff4848'
    });
    clearLocation();
    $("#defaultInput").css({
        'border': 'solid 1px red',
        'font-family': 'Arial',
        'color': '#ff4848'
    });

    $("#ui_cl_alert").css({
});

var translatedVal = tr('SB_WHEATHER_FILL_LOCATION');

if (translatedVal == undefined) {
    translatedVal = defaultTranslations['SB_WHEATHER_FILL_LOCATION'];
}
$("#defaultInput").val(translatedVal);
$("#ui_cl_alert").text('*' + translatedVal);
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    loadRegions();
    $("#regionSelect").val(app.region);
    $("#defaultInput").val(app.location);
    $("#locId").val(app.locId);
    setTempUnit(app.temp_dis);
    $("#wind_dis").val(app.win_disp);
}


function setTempUnit(tmp_disp) {
    if (!tmp_disp) {
        tmp_disp = app.region != 'US' ? 'c' : 'f';
    }
    if (tmp_disp && tmp_disp.toLowerCase() == "f") {
        $('input[name=tmpr]:eq(0)').attr("checked", "checked");
        $('#toggle,#toggle2').attr("src", app.weatherIconPath + "toggle-left.png");
    }
    else { //c
        $('input[name=tmpr]:eq(1)').attr("checked", "checked");
        $('#toggle,#toggle2').attr("src", app.weatherIconPath + "toggle-right.png");
    }

}

function validateLocation(xmlDoc) {
    var locFounds, locationDescription, startIndexParentesis, locationId;
    if (typeof (ActiveXObject) == 'undefined') {
        var parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlDoc, "text/xml");
        locFounds = xmlDoc.evaluate('count(/search/loc)', xmlDoc, null, XPathResult.ANY_TYPE, null).numberValue;
        locationDescription = findTextContent(xmlDoc, "/search/loc[position()=1]");
        startIndexParentesis = locationDescription.indexOf("(");
        locationId = findTextContent(xmlDoc, "/search/loc[position()=1]/@id");
    } else {
        var xmlDoc2 = xmlDoc;
        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlDoc2);
        if (xmlDoc2.indexOf('loc id="') != -1) {
            locFounds = xmlDoc.selectSingleNode('/search/loc').text;
            locationDescription = xmlDoc.selectSingleNode('/search/loc').text;
        } else {
            locFounds = '';
            locationDescription = '';
        }
        if (locFounds != '')
            locFounds = 1;

        startIndexParentesis = locationDescription.indexOf("(");
        if (xmlDoc2.indexOf('loc id="') != -1) {
            var tmp_loc = xmlDoc2.split('loc id="');
            var tmp_loc2 = tmp_loc[1].split('"');
            locationId = tmp_loc2[0];
        }
        else
            locationId = '';
    }

    if (!isNaN(locFounds) && locFounds > 0) {
        if (startIndexParentesis == -1 && locationId.length == 8) {
            var region = getRegion();
            if ((region == 'DE' && locationId.indexOf('GM') != 0) ||
                (region == 'BR' && locationId.indexOf('BR') != 0)) {
                alertInvalidLocation();
                return;
            }

            // If no locId is set, save the mapLocId.
            if ($("#locId").val() == "")
                $("#locId").val(locationId);

            saveToStorage();
        }
        else {
            // Strip zip code & search again to obtaing the locId
            var locVal = document.getElementById('defaultInput').value;
            if (locVal.indexOf(' (') != -1)
                var tmp_val = locVal.split(' (');
            else {
                if (locationDescription.indexOf(' (') != -1)
                    tmp_val = locationDescription.split(' (');
                else if (locVal.length == 5) {
                    document.getElementById('locId').value = locationId;
                    saveToStorage();
                    return;
                }
            }
            findMapLocation(tmp_val[0], validateLocation);
        }
        return;
    }

    alertInvalidLocation();
}

function findMapLocation(searchString, processFunction) {

    var locale = String.format("{0}_{1}", app.lang, getRegion());
    if (locale.indexOf('es') != -1 && searchString.indexOf('Italia') != -1 && navigator.userAgent.indexOf('MSIE') != -1) searchString = rtrim(searchString, 'lia');
    if (locale.indexOf('es') != -1 && searchString.indexOf('México') != -1 && navigator.userAgent.indexOf('MSIE') != -1) searchString = rtrim(searchString, 'México');
    var url = String.format("{0}/search/search?siteLocale={1}&where={2}", config.searchSite, locale, escape(searchString));

    function CallbackFunction(strData, headers, httpCode) {
        if (httpCode == 200) {
            if (strData) {
                processFunction(strData);
            } else {
                //alert('err');
            }
        } else {
            //alert('http code error - ' + httpCode);
        }
    }
    Request(CallbackFunction, url);
}

var options, $ac;

function setupAutocomplete(rgn) {
    if (!rgn)
        rgn = getRegion();
    var locale = String.format("{0}_{1}", app.lang, rgn);
    options = {
        maxHeight: 100,
        serviceUrl: String.format('{0}/search/search', config.searchSite),
        deferRequestBy: 300,
        params: {
            siteLocale: locale
        },
        onSelect: function (value, data) {
            $("#locId").val(data);
            $("#ui_cl_alert").html('');
        }
    };
    $ac = $('#defaultInput').autocomplete(options);
}

function updateAutocompleteOptions() {
    var locale = String.format("{0}_{1}", app.lang, getRegion());

    $ac.setOptions({
        params: {
            siteLocale: locale
        }
    });
    $ac.clearCache();
}

function fnBodyLoad() {
    adjustCancelSave(app.alignMode);
    if (isFirstTime()) {
        loadRegions();
        var country = app.region;
        setTempUnit();
        $("#wind_dis").val(country == 'US' || country == 'GB' ? 'mph' : 'kmh');
        $('#defaultInput').val(getToggleText()).css("color", "gray");
        document.getElementById("location").style.color = 'gray';
    } else {
        restore_options();
    }
}

var loading = new LoadingIndicator();
function LoadingIndicator() {
    this.start = function ($elem) {
        if ($(".load-indicator").length == 0) {
            var imgName = app.weatherIconPath + gadgetUI.dayOrNight + "/loader.gif";
            var $loading = $("<img>").attr("src", imgName).attr("alt", " ").addClass("load-indicator");
            $elem.after($loading);
        }
    }

    this.finish = function () {
        $(".load-indicator").remove();
    }
}

function toggleText() {
    var $this = $("#defaultInput");
    var message = getToggleText();

    if ($this.val() == "")
        $this.val(message).css("color", "gray");
    else if ($this.val() == message)
        $this.val("").css({
            "color": "black",
            'border': 'none'
        });
}

function isToggleText() {
    var $this = $("#defaultInput");
    var message = getToggleText();
    return ($this.val() == message);
}

function getToggleText() {
    if (app.region == "GB" && app.lang == "en")
        return tr("SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_UK");
    else if (app.region == "US" && (app.lang == "en" || app.lang == 'es'))
        return tr("SB_WEATHER_OPTIONS_SAVE_ENTER_CITY_US");
    else
        return tr("SB_WEATHER_OPTIONS_SAVE_ENTER_CITY");
}

function clearLocation() {
    updateAutocompleteOptions();
    $("#defaultInput").val("");
    toggleText();
}

function onRegionChanged() {

    app.region = $(this).val();
    var fc = 'c';
    var wind_unit = "kmh";
    var reg = $(this).val();
    if (reg == 'US' || reg == "GB") {
        if (reg == 'US')
            fc = 'f';
        wind_unit = "mph";
    }

    $("#wind_dis").val(wind_unit);
    setTempUnit(fc);
    clearLocation();
}

function fnChanges() {
    conduit.storage.app.keys.get(app.TWC_PREFIX + "TMP_changes", function (gk) {
        if (gk != '1' && gk != 1)
            conduit.storage.app.keys.set(app.TWC_PREFIX + "TMP_changes", '1');
    }, function (e) { conduit.storage.app.keys.set(app.TWC_PREFIX + "TMP_changes", '1'); });
}

function getRegion() {
    return Configuration.convertRegion(app.lang, app.region);
}

function loadRegions() {
    var arrOptions = new Array();
    var fc = 'c';
    var defaultSelect = '<select id="regionSelect"><option>"' + translations['SB_WEATHER_OTHER'] + '"</option></select>';
    var regDiv = document.getElementById('regDiv');
    if (app.supportedLang) {
        switch (app.lang) {
            case "fr":
                regDiv.innerHTML = defaultSelect;
                arrOptions.push(["FR", "France"]);
                arrOptions.push(["OT", "Autre"]);
                break;
            case "de":
                regDiv.innerHTML = defaultSelect;
                arrOptions.push(["DE", "Deutschland"]);
                arrOptions.push(["OT", "Andere"]);
                break;
            case "pt":
                regDiv.innerHTML = defaultSelect;
                arrOptions.push(["BR", "Brasil"]);
                arrOptions.push(["OT", "Outro"]);
                break;
            case "en":
                regDiv.innerHTML = defaultSelect;
                arrOptions.push(["US", "United States of America"]);
                arrOptions.push(["GB", "United Kingdom"]);
                arrOptions.push(["IN", "India"]);
                arrOptions.push(["SA", "South Africa"]);
                arrOptions.push(["OT", "Other"]);
                fc = 'f';
                break;
            case "es":
                arrOptions.push(["US", "Estados Unidos"]);
                arrOptions.push(["MX", "México"]);
                arrOptions.push(["ES", "España"]);
                arrOptions.push(["AR", "Argentina"]);
                arrOptions.push(["OT", "Otro"]);
                fc = 'f';
                break;
        }

        setTempUnit(fc);
        var $region = $("#regionSelect").empty();
        for (i = 0; i < arrOptions.length; i++)
            $('<option>').text(arrOptions[i][1]).attr('value', arrOptions[i][0]).appendTo($region);

        if (arrOptions.length == 1)
            $region.attr("disabled", "disabled");
        else
            $region.attr("disabled", false);

        $("#regionSelect").change(onRegionChanged);

    } else {
        regDiv.innerHTML = defaultSelect;
        var key = "SB_WEATHER_OTHER"
        var val;
        getSpecialStr(key, function (value) {
            val = value;
            arrOptions.push(["OT", val]);
            setTempUnit(fc);
            var $region = $("#regionSelect").empty();
            for (i = 0; i < arrOptions.length; i++)
                $('<option>').text(arrOptions[i][1]).attr('value', arrOptions[i][0]).appendTo($region);

            if (arrOptions.length == 1)
                $region.attr("disabled", "disabled");
            else
                $region.attr("disabled", false);

            $("#regionSelect").change(onRegionChanged);
        });



    }
}

function translate_ui() {
    var keys=[];
    for(k in defaultTranslations){
        keys.push(k);
    }
    conduit.advanced.localization.getKey(keys, function (val) {
        translationsArr = val;
        getStr('SB_WEATHER_BACK', ['#back']);
        getStr('SB_WEATHER_OPTIONS_SAVE', ['#saveButton p']);
        getStr('SB_WEATHER_OPTIONS_CANCEL', ['p#cancel']);
        getStr('SB_WEATHER_SUNRISE', ['.col1 .data1']);
        getStr('SB_WEATHER_SUNSET', ['.col1 .data2']);
        getStr('SB_WEATHER_HUMIDITY', ['.col1 .data3']);
        getStr('SB_WEATHER_WIND', ['.col1 .data4']);
        getStr('SB_WEATHER_FEELS_LIKE', ["#flik_lbl"]);
        getStr('SB_WEATHER_OPTIONS_REGION', ["#region"]);
        getStr('SB_WEATHER_TEMP_DISPLAY', ["#tmpr"]);
        getStr('SB_WEATHER_OPTIONS_LOCATION', ["#default"]);
        getStr('SB_WEATHER_MORE_DETAILS', ["#more", "#more2"]);
        getStr('SB_WEATHER_CHANGE_LOCATION', ["#change", "#change2", "#title"]);
    });
}



function rtrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

$(document).keydown(function (objEvent) {
    if (objEvent.keyCode == 9) {  //tab pressed
        objEvent.preventDefault(); // stops its action
    }
})

window.onload = init;
