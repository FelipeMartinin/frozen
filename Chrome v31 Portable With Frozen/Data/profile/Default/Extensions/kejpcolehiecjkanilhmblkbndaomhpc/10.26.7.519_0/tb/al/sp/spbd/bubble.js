conduit.register("applicationLayer.searchProtector.bubble.dialog", (function () {
var myTimer;
var dialogName = "FeatureProtectorV2";
var logParams = "";
var protectionCase = "";
var appData;
var translation;
var alignMode;

function init (){
	onLoad();
	initListeners();
}

//set all event listeners.
function initListeners() {	
	
	$('#outer_box').mouseover(stopTimer);
	$('#outer_box').mouseout(restartTimer);
	
	$('#cancel').click(function () {
		onFinish('clickCancel');
	});
	
	$('#cancel').mouseover(function (){	
		highlightCancel(true);
	});
	
	$('#cancel').mouseout(function (){	
		highlightCancel(false);
	});	

	$('#change_settings_text').click(function () {
		onFinish('clickSettings');
	});

}

var onLoad = function () {
    appData = JSON.parse(decodeURIComponent(document.location.href.match(/appData=(.*)$/i)[1]));
    myTimer = setTimeout(function () {
        onFinish("ignore");
    }, 8000);

    if (appData.alignMode == 'rtl') {
        document.getElementById("outer_box").style.direction = "rtl";
        document.getElementById("cancel").style.background = "url(images/x-default-RTL.png)";
        document.getElementById("cancel").style.left = "-1px";
        document.getElementById("top_section").style.margin = "0px 6px 0px 6px";        
        document.getElementById("upper_text").style.backgroundPosition = "right top";
        document.getElementById("upper_text").style.padding = "0px 42px 0px 42px";
        document.getElementById("buttom_section").style.padding = "9px 7px 10px 7px";
        document.getElementById("change_settings_text").style.display = "block";
    }

    getTranslation();
    switch (protectionCase) {
        case "BOTH":
            logParams = "HP_DS_Silent_Impression";
            break;
        case "HP":
            logParams = "HP_Silent_Impression";
            break;
        case "DS":
            logParams = "DS_Silent_Impresion";
            break;
    }
    //Log(dialogName, logParams); TODO support google analytics
};

//get translation from serviceLayer.
function getTranslation(){
	
	conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "options", JSON.stringify({
        service: "translation",
        method: "getTranslationByRegex",
        data: ["CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_AND_SEARCH_BLOCKED", "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_SEARCH_BLOCKED", "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_BLOCKED", 
        "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_CLICK_TO_CHANGE"],
    }), function (responseData) {
			
		//attach the result to the translation variable.
        translation = JSON.parse(responseData);	
        fillToolbarData();	 
	});
}
	

function fillToolbarData() {    
    var strTitle = "";

    var jsonData = appData.data;
    if (jsonData.search && jsonData.homepage) {
        protectionCase = "BOTH";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_AND_SEARCH_BLOCKED");
    }
    else if (jsonData.search) {
        protectionCase = "DS";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_SEARCH_BLOCKED");
    }
    else if (jsonData.homepage) {
        protectionCase = "HP";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_BLOCKED");
    }

    document.getElementById("upper_text").innerHTML = strTitle;
    document.getElementById("change_settings_text").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_CLICK_TO_CHANGE");
};

function onFinish(closeReason) {
    if (myTimer) clearTimeout(myTimer);
    switch (protectionCase) {
        case "BOTH":
            logParams = "HP_DS_Silent_Protection";
            break;
        case "HP":
            logParams = "HP_Silent_Protection";
            break;
        case "DS":
            logParams = "DS_Silent_Protection";
            break;
    }
    if (closeReason != "clickSettings") {
        //Log(dialogName, logParams); 
    }
    var objResult = {};
    objResult.finishReason = closeReason;
    var jsonParams = JSON.stringify(objResult);
    onAccept(jsonParams);    
};

function onAccept(data) {
    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.searchProtectorManager", "sender", data, function (arrParams) { });
}

function getHeight() {
    return parseInt(document.getElementById("outer_box").offsetHeight);
};

function getWidth() {
    return parseInt(document.getElementById("outer_box").offsetWidth);
};


function getValueByKey(strKey) {
    var value = translation ? translation[strKey] : null;
    if (value) return value;
    
    switch (strKey) {
        case "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_SEARCH_BLOCKED":
            value = "An attempt to change your default search has been blocked.";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_BLOCKED":
            value = "An attempt to change your home page has been blocked.";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_HOMEPAGE_AND_SEARCH_BLOCKED":
            value = "An attempt to change your home page and default search has been blocked.";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_BUBBLE_CLICK_TO_CHANGE":
            value = "Click to change your settings";
            break;
        default:
            value = "";
    }
    return value;
};

function stopTimer() {
    if (myTimer) clearTimeout(myTimer);
};

function restartTimer() {
    if (myTimer) clearTimeout(myTimer);
    myTimer = setTimeout(function () {
        onFinish("ignore");
    }, 4000);
};

function isLocaleRtl() {
    return (appData.alignMode == 'rtl');
}

function highlightCancel(isHover) {
    if (isHover) {
        if (isLocaleRtl && isLocaleRtl()) {
            document.getElementById("cancel").style.background = "url(images/x-mouseover-RTL.png)";
        }
        else {
            document.getElementById("cancel").style.background = "url(images/x-mouseover-LTR.png)";
        }
    }
    else {
        if (isLocaleRtl && isLocaleRtl()) {
            document.getElementById("cancel").style.background = "url(images/x-default-RTL.png)";
        }
        else {
            document.getElementById("cancel").style.background = "url(images/x-default-LTR.png)";
        }
    }
};

init();

})());