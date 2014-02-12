var myKeys = {};

var keys = ["CTLP_STR_ID_TWITTER_DELETE_ALL_TWEETS_TOOLTIP",
            "CTLP_STR_ID_TWITTER_REFRESH_TWEETS_TOOLTIP",
            "CTLP_STR_ID_TWITTER_ARE_YOU_SURE_DELETE_ALL_TWEETS"
            ,"CTLP_STR_ID_GLOBAL_OK"
            ,"CTLP_STR_ID_GLOBAL_CANCEL"
            ];

var defaultTranslation = {
    "CTLP_STR_ID_TWITTER_DELETE_ALL_TWEETS_TOOLTIP":"Delete All Tweets",
    "CTLP_STR_ID_TWITTER_REFRESH_TWEETS_TOOLTIP": "Refresh Tweets",
    "CTLP_STR_ID_TWITTER_ARE_YOU_SURE_DELETE_ALL_TWEETS": "Are you sure you want to delete all the tweets?"
    ,"CTLP_STR_ID_GLOBAL_OK": "Ok"
    ,"CTLP_STR_ID_TWITTER_REFRESH_TWEETS_TOOLTIP": "Cancel"
}

function translateApp() {
    conduit.advanced.localization.getKey(keys, function (data) {
        myKeys = data;
        $('#deleteBtnAll').attr("title", getKey("CTLP_STR_ID_TWITTER_DELETE_ALL_TWEETS_TOOLTIP"));
        $('#refreshBtnAll').attr("title", getKey("CTLP_STR_ID_TWITTER_REFRESH_TWEETS_TOOLTIP"));
        $.alerts.okButton=getKey("CTLP_STR_ID_GLOBAL_OK");
        $.alerts.cancelButton=getKey("CTLP_STR_ID_GLOBAL_CANCEL");
    });
}

function getKey(key) {
    if (!key)
        return "";
    if (!myKeys)
        translateApp();
    if (myKeys[key])
        return myKeys[key];
    else {
        return defaultTranslation[key];
    }
}
