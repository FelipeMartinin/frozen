conduit.register("applicationLayer.searchProtector.settings.dialog", (function () {
var dialogName = "FeatureProtectorV2";
var gDomainName = "";
var gToolbarName = "";
var protectionCase = "";
var appData;
var translation;

function init (){
	onLoad();
	initListeners();
}

//set all event listeners.
function initListeners() {	

	$('#learn_more_link').click(function () {
		switchContent(true);
	});
	
	$('#ok_button').click(function () {
		onFinish();
	});

	$('#back_button').click(function () {
		switchContent(false);
	});	

}


var onLoad = function () {
    appData = JSON.parse(decodeURIComponent(document.location.href.match(/appData=(.*)$/i)[1]))

    if (appData.alignMode == 'rtl') {
        document.getElementById("outer_box").style.display = "none";
        document.getElementById("outer_box").style.direction = "rtl";
        document.getElementById("title_block").style.padding = "10px 13px 10px 0px";
        document.getElementById("sub_title_img").style.cssFloat = "right";
        document.getElementById("sub_title_img").style.styleFloat = "right";
        document.getElementById("seperator_line").style.margin = "0px 6px 0px 0px";
        document.getElementById("radio_container_1").style.margin = "14px 22px 0px 0px";
        document.getElementById("radio_container_2").style.margin = "12px 22px 0px 0px";
        document.getElementById("radio_1").style.cssFloat = "right";
        document.getElementById("radio_1").style.styleFloat = "right";
        document.getElementById("radio_2").style.cssFloat = "right";
        document.getElementById("radio_2").style.styleFloat = "right";
        document.getElementById("radio_text_1").style.margin = "0px 22px 0px 0px";
        document.getElementById("radio_text_2").style.margin = "0px 22px 0px 0px";
        document.getElementById("learn_more_link").style.cssFloat = "right";
        document.getElementById("learn_more_link").style.styleFloat = "right";
        document.getElementById("learn_more_link").style.margin = "10px 44px 0px 0px";
        document.getElementById("back_button").style.margin = "0px 245px 12px 0px";
        document.getElementById("text_block").style.height = document.getElementById("middle_block").offsetHeight + "px";
        document.getElementById("outer_box").style.display = "block";
    }    

    if (!isIE7()) {
        document.getElementById("outer_box").style.margin = "12px 0px 0px 12px";
    }

    getTranslation();    
    /* TODO what is this?
    setTimeout(function () {
        onSizeChange(getWidth(), getHeight());
    }, 100);
    */
};

function isIE() {
    return conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type == "IE";
}

function isIE7() {
    var browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result;
    var browserVersion = browserInfo.version.match(/^(\d+)/)[1];
    if (isIE() && browserVersion === "7"){
        return true;
    }
    return false;
}


function Log(dialog, params) {
    //TODO implement analytics
}

//get translation from serviceLayer.
function getTranslation(){
	
	conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "options", JSON.stringify({
        service: "translation",
        method: "getTranslationByRegex",
        data: ["CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_AND_SEARCH_TITLE", "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE_AND_SEARCH", 
        "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_HOMEPAGE_AND_SEARCH", "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE_AND_SEARCH", "CTLP_STR_ID_SEARCH_PROTECTOR_TITLE", 
        "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_EXPLORER_SEARCH", "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_SEARCH", "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_DEFAULT_SEARCH", 
        "CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_TITLE", "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE", "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE",
        "CTLP_STR_ID_SEARCH_PROTECTOR_ATTEMPTED_CHANGE", "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_ONE", "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_TWO", 
        "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_LINK", "CTLP_STR_ID_SEARCH_PROTECTOR_BACK", "CTLP_STR_ID_SEARCH_PROTECTOR_OK" ],
    }), function (responseData) {
			
		//attach the result to the translation variable.
        translation = JSON.parse(responseData);	
        fillToolbarData();	
        document.getElementById("text_block").style.height = document.getElementById("middle_block").offsetHeight + "px";
        document.getElementById("learn_more_block").style.height = document.getElementById("options_block").offsetHeight + "px"; 
	});
}

function fillToolbarData() {
    var jsonData = appData.data;
    var strTitle = "";
    var strCheckBoxText1 = "";
    var strCheckBoxText2 = "";

    gDomainName = appData.domainName;
    gDomainName = gDomainName ? gDomainName : "";
    gToolbarName = appData.toolbarName;
    //TODO if domain name is empty - change text to something else
    if (jsonData.search && jsonData.homepage) {
        protectionCase = "BOTH";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_AND_SEARCH_TITLE");
        

        strCheckBoxText1 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_HOMEPAGE_AND_SEARCH");
        
        strCheckBoxText2 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE_AND_SEARCH");
    }
    else if (jsonData.search) {
        protectionCase = "DS";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_TITLE");
        strCheckBoxText1 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_SEARCH");
        strCheckBoxText2 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_DEFAULT_SEARCH");
    }
    else if (jsonData.homepage) {
        protectionCase = "HP";
        strTitle = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_TITLE");
        strCheckBoxText1 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE");
        strCheckBoxText2 = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE");
    }

    document.getElementById("title_block").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_ATTEMPTED_CHANGE");
    document.getElementById("par_1").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_ONE");
    document.getElementById("par_2").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_TWO");
    document.getElementById("learn_more_link").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_LINK");
    document.getElementById("back_button").innerHTML = getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_BACK");
    document.getElementById("ok_button").setAttribute("value", getValueByKey("CTLP_STR_ID_SEARCH_PROTECTOR_OK"));

    document.getElementById("sub_title").innerHTML = strTitle;
    if (strCheckBoxText1)
        document.getElementById("radio_text_1").innerHTML = strCheckBoxText1;
    if (strCheckBoxText2)
        document.getElementById("radio_text_2").innerHTML = strCheckBoxText2;
    document.getElementById("radio_text_2").innerHTML = document.getElementById("radio_text_2").innerHTML.replace('EB_DOMAIN_NAME', gDomainName);

    document.getElementById("options_block").style.display = "block";
};


function onFinish() {
    var objResult = {};
    var logParams = "";
    if (document.getElementById("radio_1").checked) {
        objResult.protectFeature = true;
        switch (protectionCase) {
            case "BOTH":
                logParams = "HP_DS_User_Selection_Keep_Conduit";
                break;
            case "HP":
                logParams = "HP_User_Selection_Keep_Conduit";
                break;
            case "DS":
                logParams = "DS_User_Selection_Keep_Conduit";
                break;
        }
    }
    else {
        objResult.protectFeature = false;
        switch (protectionCase) {
            case "BOTH":
                logParams = "HP_DS_User_Selection_Change_Provider";
                break;
            case "HP":
                logParams = "HP_User_Selection_Change_Provider";
                break;
            case "DS":
                logParams = "DS_User_Selection_Change_Provider";
                break;
        }
    }
    Log(dialogName, logParams);
    var jsonParams = JSON.stringify(objResult);
    onAccept(jsonParams);
};

function onAccept(data) {
    conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.searchProtectorManager", "sender", data, function (arrParams) { });
}

function getHeight() {
    if (isIE7())
        return parseInt(document.getElementById("outer_box").offsetHeight);
    else
        return parseInt(document.getElementById("outer_box").offsetHeight) + 24;
};

function getWidth() {
    if (isIE7())
        return parseInt(document.getElementById("outer_box").offsetWidth);
    else
        return parseInt(document.getElementById("outer_box").offsetWidth) + 24;
};

function switchContent(isInOptionsDialog) {
    if (isInOptionsDialog) {
        document.getElementById("options_block").style.display = "none";
        document.getElementById("learn_more_block").style.display = "block";
    }
    else {
        document.getElementById("learn_more_block").style.display = "none";
        document.getElementById("options_block").style.display = "block";
    }
};

function getValueByKey(strKey) {

    var value = translation ? translation[strKey] : null;  
    if (value) {
        value = value.replace('EB_DOMAIN_NAME', gDomainName);
        value = value.replace('EB_TOOLBAR_NAME', gToolbarName);
        return value;
    }
    switch (strKey) {
        case "CTLP_STR_ID_SEARCH_PROTECTOR_TITLE":
            value = "An attempt has been made to take over your default search";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_TITLE":
            value = "An attempt has been made to take over your home page";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_HOMEPAGE_AND_SEARCH_TITLE":
            value = "An attempt has been made to take over your home page and default search";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_OK":
            value = "OK";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE_AND_SEARCH":
            value = "Keep my current home page and default search for Internet Explorer";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_HOMEPAGE_AND_SEARCH":
            value = "Keep my current home page and default search for Firefox";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE_AND_SEARCH":
            value = "Disable default search protection and change my home page and default search to EB_DOMAIN_NAME";
            value = value.replace('EB_DOMAIN_NAME', gDomainName);
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_EXPLORER_SEARCH":
            value = "Keep my current default search for Internet Explorer";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_FIREFOX_SEARCH":
            value = "Keep my current default search for Firefox";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_DEFAULT_SEARCH":
            value = "Disable search protection and change my default search to EB_DOMAIN_NAME";
            value = value.replace('EB_DOMAIN_NAME', gDomainName);
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_KEEP_HOMEPAGE":
            value = "Keep my current home page";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_DISABLE_SEARCH_CHANGE_TO_HOMEPAGE":
            value = "Disable default search protection and change my home page to EB_DOMAIN_NAME";
            value = value.replace('EB_DOMAIN_NAME', gDomainName);
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_ATTEMPTED_CHANGE":
            value = "Attempted Change to Your Search Settings";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_ONE":
            value = "The notification you received allows you to protect your default home page and other default search settings from attempts by third parties to change them.";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_PART_TWO":
            value = "You can customize these notifications by going to your EB_TOOLBAR_NAME Toolbar Options.";
            value = value.replace('EB_TOOLBAR_NAME', gToolbarName);
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_LEARN_MORE_LINK":
            value = "Learn more";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_BACK":
            value = "Back";
            break;
        case "CTLP_STR_ID_SEARCH_PROTECTOR_OK":
            value = "OK";
            break;
        default:
            value = "";
    }
    return value;
};

init();

})());