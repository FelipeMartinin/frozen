var weatherData = new WeatherData();
var dayForecastUrl = "{0}/weather/local/{1}?siteLocale={2}&cc=*&dayf=4&prod=bd_select&par=chromev110XML";

var undefined;
function WeatherData() {
    this.icon = "";
    this.temperature = "";
    this.temperatureClear = "";
    this.highTemperature = "";
    this.lowTemperature = "";         //this.windSpeedGusting = "";
    this.feelsLike = "";
    this.condition = "";
    this.tUnit  = '';
    this.cityName = "";
    this.lastUpdated = "";
    this.humidity = "";
    this.visibility = "";
    this.pressure = "";
    this.pressureDescription = "";
    this.windFrom = "";
    this.windSpeed = "";
    this.hasCurrentCondition = false;
    this.night = false;
    this.severaAlertsCount = 0;
    this.loaded = false;          
    this.day1  = new Forecast();
    this.day2 = new Forecast();
    this.day3 = new Forecast();
    this.extendedOutlookLink = "";
    this.todayLink = "";
}

function Forecast() {
    this.icon = "";
    this.highTemperature = "";
    this.lowTemperature = "";
    this.condition = "";
    this.precipitation = "";          
    this.day = "0";
    this.sunr = "";
    this.suns = "";
    this.humidity = "";
    this.windFrom = "";
    this.windSpeed ="";
    this.dayName ="";
    this.date="";
}



WeatherData.prototype.getTodayLink = function() {
    var locale = config.siteLocale();

    if (locale == 'en_US') {
        return String.format("{0}/outlook/local/{1}?par=conduit&site=conduitapp&cm_ven={2}&cm_cat=conduitapp&cm_pla=application-us&cm_ite=wx-today", config.getBaseSite(), config.locId(), config.getTrackingCode());
    }
    else if (app.lang == 'es' || locale == 'en_GB' || locale == 'en_IN' || locale == 'fr_FR') {
        return String.format("{0}/today-{1}?cm_ven={2}&cm_cat=application&cm_ite=link&cm_pla=cityName", config.getBaseUri(), config.locId(), config.getTrackingCode());
    }
    else if (locale == 'de_DE' || locale == 'pt_BR') {
        return String.format("{0}/local/{1}?cm_ven={2}&cm_cat=application&cm_ite=link&cm_pla=cityName", config.getBaseUri(), config.locId(), config.getTrackingCode());
    }
}

WeatherData.prototype.getExtendedOutlookLink = function() {
    var locale = config.siteLocale();

    if (locale == 'en_US') {
        return String.format(
            "{0}/tenday/{1}?par=conduit&site=conduitapp&cm_ven=conduit&cm_cat=conduitapp&cm_pla=application-us&cm_ite=wx-10day", config.getBaseUri(), config.locId(), config.getTrackingCode());
    }
    else if (app.lang == 'es' || locale == 'en_GB' || locale == 'en_IN' || locale == 'fr_FR') {
        return String.format("{0}/10day-{1}?cm_ven={2}&cm_cat=application&cm_ite=link&cm_pla=10day", config.getBaseUri(), config.locId(), config.getTrackingCode());
    }
    else if (locale == 'de_DE' || locale == 'pt_BR') {
        return String.format("{0}/local/{1}?cm_ven={2}&cm_cat=application&cm_ite=link&cm_pla=10day", config.getBaseUri(), config.locId(), config.getTrackingCode());
    }
}

function fnEditResp(response){                 
    var getTextFunc, getCountFunc;
    var xmlDoc;
    if (typeof(ActiveXObject) == 'undefined') {
        getTextFunc = function(xmlDoc, str) {
            return findTextContent(xmlDoc, str);
        };
        getCountFunc   = function(xmlDoc, str) {
            return (xmlDoc.evaluate( 'count('+str+')', xmlDoc, null, XPathResult.ANY_TYPE, null ).numberValue == 1);
        };
        var parser=new DOMParser();
        xmlDoc=parser.parseFromString(response,"text/xml");
    }
    else {
        getTextFunc = function (xmlDoc, str) {
            var node = xmlDoc.selectSingleNode(str);
            if (node)
                return node.text;
            else
                return null

        };
        getCountFunc   = function(xmlDoc, str) {
            if (xmlDoc.selectSingleNode(str)!=undefined)
                return xmlDoc.selectSingleNode("/weather/cc/tmp").text;
            else
                return 0;
        };
        xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async="false";
        xmlDoc.loadXML(response);
    }
          
    var ut = getTextFunc(xmlDoc, "/weather/head/ut");
    if (!ut)
        return null;
    
    weatherData.tUnit = app.temp_dis;
    weatherData.cityName = getTextFunc(xmlDoc, "/weather/loc/dnam");
    weatherData.zone = parseInt(getTextFunc(xmlDoc, "/weather/loc/zone"));          
    weatherData.hasCurrentCondition = getCountFunc(xmlDoc, "/weather/cc/tmp");          
    if (weatherData.hasCurrentCondition )
    {                 
        weatherData.lastUpdated = getTextFunc(xmlDoc, "/weather/cc/lsup");
        var temper = temp_format(ut, getTextFunc(xmlDoc, "/weather/cc/tmp"));
        var flik = temp_format(ut, getTextFunc(xmlDoc, "/weather/cc/flik"));
        weatherData.temperatureClear = String.format("{0}", temper);
        weatherData.temperature = String.format("{0}", weatherData.temperatureClear);
        weatherData.feelsLike = String.format("{0}", flik);                    
        weatherData.icon = String.format("{0}.png", padDigits(getTextFunc(xmlDoc, "/weather/cc/icon"),2));
        weatherData.condition = getTextFunc(xmlDoc, "/weather/cc/t");
        weatherData.humidity = String.format("{0}%",getTextFunc(xmlDoc, "/weather/cc/hmid"));
        weatherData.visibility = String.format("{0} {1}", getTextFunc(xmlDoc, "/weather/cc/vis"), getTextFunc(xmlDoc, "/weather/head/ud"));
        weatherData.pressure = String.format("{0} {1}", getTextFunc(xmlDoc, "/weather/cc/bar/r"), getTextFunc(xmlDoc, "/weather/head/up"));
        weatherData.pressureDescription = getTextFunc(xmlDoc, "/weather/cc/bar/d");
        weatherData.windFrom = getTextFunc(xmlDoc, "/weather/cc/wind/t");
        var spd = wind_format(getTextFunc(xmlDoc, "/weather/head/us"), getTextFunc(xmlDoc, "/weather/cc/wind/s"));
        weatherData.windSpeed = String.format("{0}", spd);
    /*
                    if (!isNaN(parseInt(getTextFunc(xmlDoc, "/weather/cc/wind/gust"))))
                              weatherData.windSpeedGusting = String.format("{0} {1}", getTextFunc(xmlDoc, "/weather/cc/wind/gust"), getTextFunc(xmlDoc, "/weather/head/us"));
                    */
    }
    else
        weatherData.icon = "41.png";       
    if (config.siteLocale() == 'en_US')
        weatherData.severeAlertsCount = getCountFunc(xmlDoc,  '/weather/swa/a');
    else
        weatherData.severeAlertsCount = 0;


    var high = getTextFunc(xmlDoc, "/weather/dayf/day[@d='0']/hi");
    if (!(isNaN(parseInt(high))))          {
        weatherData.night = false;
        weatherData.highTemperature = String.format("{0}", temp_format(ut,high));
    } else          {
        weatherData.night = true;
        weatherData.highTemperature = weatherData.temperatureClear;
    }
    var low = getTextFunc(xmlDoc, "/weather/dayf/day[@d='0']/low");
    if (!(isNaN(parseInt(low))))
        weatherData.lowTemperature = String.format("{0}", temp_format(ut,low));
    else
        weatherData.lowTemperature = weatherData.temperatureClear;    
    var d = new Date(); 
    var curr_year = d.getFullYear();                   
    setForecast(xmlDoc, weatherData.day1, '1', 'd', ut, curr_year);
    setForecast(xmlDoc, weatherData.day2, '2', 'd', ut, curr_year);
    setForecast(xmlDoc, weatherData.day3, '3', 'd', ut,curr_year);
    weatherData.loaded = true;
    
    weatherData.extendedOutlookLink = weatherData.getTodayLink();
    weatherData.todayLink = weatherData.getExtendedOutlookLink();
    return weatherData;    
}


function setForecast(xmlDoc, forecast, day, part, ut, year) {          
    var getTextFunc, getAttributeFunct;
    var dayStr = "/weather/dayf/day[@d='" + day + "']";
    var partStr = dayStr +"/part[@p='" + part + "']/";
    if (typeof(ActiveXObject) == 'undefined') {
        getTextFunc = function(xmlDoc, str) {          
            return findTextContent(xmlDoc, str);
        };
        getAttributeFunct = function(xmlDoc, str,att){
            var node = hasNode(xmlDoc, str);
            if (node)
                return  node.getAttribute(att);
            else
                return "";
        }
    }
    else {
        getTextFunc = function(xmlDoc, str) {
            var ret = xmlDoc.selectSingleNode(str);
            if (ret)
                return  xmlDoc.selectSingleNode(str).text;
            else
                return "";
        };
        getAttributeFunct = function (xmlDoc, str, att) {
            var node = xmlDoc.selectSingleNode(str);
            if (node)
                return node.getAttribute(att);
            else
                return "";
        }
    }
    var icon = getTextFunc(xmlDoc, partStr+"icon");
    forecast.icon = String.format("{0}.png", padDigits(icon,2));
    var high = getTextFunc(xmlDoc, dayStr+"/hi");
    if (high!= "N/D")
        forecast.highTemperature = String.format("{0}",temp_format(ut, high));
    else 
        forecast.highTemperature = "N/D";
    var low = getTextFunc(xmlDoc, dayStr + "/low");
    if (low != "N/D")
        forecast.lowTemperature = String.format("{0}",temp_format(ut, low));
    else 
        forecast.lowTemperature = "N/D";
    forecast.sunr = getTextFunc(xmlDoc, dayStr + "/sunr");
    forecast.suns = getTextFunc(xmlDoc, dayStr + "/suns");
    forecast.humidity = String.format("{0}%", getTextFunc(xmlDoc, partStr + "hmid"));
    forecast.condition = getTextFunc(xmlDoc, partStr+"t");
    forecast.precipitation = String.format("{0}%", getTextFunc(xmlDoc, partStr+"ppcp"));          
    forecast.windFrom = getTextFunc(xmlDoc, partStr+"wind/t");
    var unitSpeed = getTextFunc(xmlDoc, "/weather/head/us");
    var spd = wind_format(unitSpeed, getTextFunc(xmlDoc, partStr+"wind/s"));
    forecast.windSpeed = String.format("{0}", spd);
    forecast.dayName = String.format("{0}", getAttributeFunct(xmlDoc, dayStr, "t"));                             
    var wDate = getAttributeFunct(xmlDoc, dayStr, "dt");
    if ((wDate == "Jan 1") || ((wDate == "Jan 2") && (('d' == '2') || ('d' == '3'))) ||((wDate == "Jan 3")  && ('d' == '3')))
        year++;          
                    
    forecast.date = String.format("{0}, {1}", wDate, year);
    forecast.day = day;
}


function getCountryCode() {    
    var country = app.region;
    if (country=='UK')
        country='GB';
    if (country!='US' && country!='GB' && country!='IN' && country!='SA' && country!='MX' && country!='ES' && country!='AR' && country!='FR' && country!='DE' && country!='BR')
        country = 'OT';
    return country;
}

function temp_format(ut, val, current)
{    
    var tmp_tem, temper, tmp_tem2, tmp_temp;          
    if (current !== undefined)
        tmp_temp = current;
    else
        tmp_temp = app.temp_dis;
          
    if (!tmp_temp)
        tmp_temp = 'c';
          
    if (tmp_temp.toLowerCase()!=ut.toLowerCase())
    {
        if (tmp_temp.toLowerCase()=='f')
        {
            tmp_tem = parseInt(val);
            temper = Math.round(tmp_tem*9/5+32)+'\u00B0F';
        }
        else if (tmp_temp.toLowerCase()=='c')
        {
            tmp_tem = parseInt(val);
            tmp_tem2 = (tmp_tem - 32)*5/9;
            temper = Math.round(tmp_tem2)+'\u00B0C';
        }
    }
    else
    {
        temper = val + '\u00B0' + ut.toUpperCase();
    }
    return temper;
}

function wind_format(ut, val)
{
    var wind, mesure;
    ut = ut.replace("/", '');
    var temp_int = parseInt(val);
    var utLower = ut.toLowerCase();
    var tmp_wind = app.wind_dis;
    if (!tmp_wind)
        tmp_wind = 'kmh';
          
    var tmp_windLower = tmp_wind.toLowerCase();          
    if (tmp_windLower == utLower)
        wind = val+' '+ut;
    else {
        if (tmp_wind=='mph')
        {
            if (utLower =='kmh')
                temp_int /= 1.6;
            else if (utLower=='ms')
                temp_int /= 0.45
            mesure = ' MPH';
        }
        else if (tmp_wind=='kmh')
        {
            if (utLower=='mph')
                temp_int*=1.6;
            else if (utLower=='ms')
                temp_int*=3.6;
            mesure = ' Km/h';
        }
        else if (tmp_wind=='ms')
        {
            if (utLower=='kmh')
                temp_int /= 3.6;
            else if (utLower=='mph')
                temp_int /= 0.45;
            mesure = ' m/s';
        }
        wind = Math.round(temp_int) + mesure;
    }
    return wind;
}

