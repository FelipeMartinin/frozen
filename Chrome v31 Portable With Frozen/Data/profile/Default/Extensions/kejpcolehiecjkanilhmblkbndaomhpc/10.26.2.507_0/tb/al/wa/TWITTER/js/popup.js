Date.prototype.toJSON = function (key) {
    return ('\/Date(' + this.valueOf() + ')\/');
};

function sendUsage(name, obj) {
    try {
        //console.log('SmartBar > Twiter[popup] > app.sendUsage >>', name, obj);
        var msg = { usage: obj };
        var msg_serialized = JSON.stringify(msg);
        conduit.messaging.sendRequest("backgroundPage", "sendUsage", msg_serialized, function () { });
    } catch (ex) {
        //console.log('SmartBar > Twiter[popup] > app.sendUsage ERROR',ex);
    }
}

function SortByName(x, y) {
    return ((x.Name == y.Name) ? 0 : ((x.Name > y.Name) ? 1 : -1));
}

function SortByID(x, y) {
    return y.ID - x.ID;
}

(function (undefined) {
    $('#tweetList').css('height', '386px');
    var $list = $("#tweetList"),
        $usersMenu = $("#usersMenu").delegate("a", "click", function (e) {

            var userName = this.href.match(/#(.+)$/)[1];
            e.preventDefault();

            if ((selectedUserName === userName) && ($list.length > 1)) {
                return false;
            }

            if (selectedUserName) {
                $list.children().hide();
                $list.children("[data-user='" + userName + "']").show();
                $(".isDeleted").hide();
            }
            else {
                $list.children("[data-user!='" + userName + "']").hide();
            }

            $list.scrollTop(0);

            if (userName) {
                this.className = "selected";
            }

            if (selectedUserLink) {
                selectedUserLink.removeAttribute("class");
            }

            selectedUserLink = this;
            selectedUserName = userName;

            $(userInfo).css('display', 'block');
            $(userInfo).html($.tmpl("userInfo", $(this).parent().data("tmplItem").data));

            $('#tweetList').css('height', '295px');
            sendUsage('', { 'key': 'TWITTER_OPEN_MAIN_MENU_ITEM', 'data': { 'url': 'http://twitter.com/' + userName, 'twitterUserId': $(this).attr('data-twitter-id'), 'twitterUserScreenName': $(this).attr('data-twitter-screen-name')} });   

        }),
    selectedUserName,
	selectedUserLink,
	userInfo = document.getElementById("userInfo");

    $("#tweetTemplate").template("tweetTemplate");
    $("#userTemplate").template("userTemplate");
    $("#userInfoTemplate").template("userInfo");

    function renderTweets(tweetsData) {
        try {
            tweetsData = JSON.parse(tweetsData);
        }
        catch (e) { 
            conduit.logging.logDebug('Twitter/bgpage.js/renderTweets - received wrong data: ' + tweetsData);
        }
        var arr = tweetsData.tweets
        arr = arr.sort(SortByID);

        $list.html($.tmpl("tweetTemplate", arr));
        $('.js-hideOnError', $list).on('error', function () {
            $(this).hide();
        });
        $usersMenu.html($.tmpl("userTemplate", tweetsData.users));
        setTimeout(function () {
            $('#tweetList').off('click').on("click", "li", function (e) {
                e.preventDefault();
                var target = e.target.nodeName;
                if (target == "LI") {
                    var uri = $(this).find('p').attr('data-tweet-url');
                    sendUsage('', { 'key': 'TWITTER_OPEN_ITEM', 'data': { 'url': uri} });
                    conduit.tabs.create({ 'url': uri });
                    conduit.app.popup.close();
                }
            });

            $('#tweetList').on("click", "a", function (e) {
                e.preventDefault();
                var target = e.target.nodeName;
                if (target == "A") {
                    var uri = $(this).attr('href');
                    conduit.tabs.create({ 'url': uri });
                    conduit.app.popup.close();
                }
            });
            if ($('#usersMenu a').length > 8) {
                $('.sidebar .scrollgrip.up').off('click').on('click', function () {
                    var elm = $('#usersMenu li:last').detach();
                    elm.insertBefore('#usersMenu li:first');
                });
                $('.sidebar .scrollgrip.down').off('click').on('click', function () {
                    var elm = $('#usersMenu li:first').detach();
                    elm.insertAfter('#usersMenu li:last');
                });
            } else {
                $('.sidebar .scrollgrip.up').addClass('none');
                $('.sidebar .scrollgrip.down').addClass('none');
                $('.sidebar .scrollpanel').css('height', '368px');
            }
        }, 250);

        $("#loader").remove();
    }

    conduit.messaging.sendRequest("backgroundPage", "getTweets", "", renderTweets);

    conduit.messaging.onTopicMessage.addListener("onTweetsChange", function (tweetsData) {

        $("#tweetList").children().show();
        $(".isDeleted").hide();
        $('#tweetList').css('height', '386px');
        $('#userInfo').css('display', 'none');

        //Save selected user before re-rendering
        var selectedUserTwitterId = $('#usersMenu').find('.selected').attr('data-twitter-id');

        $('#usersMenu a').removeClass('selected');

        renderTweets(tweetsData);

        //if a user was selected before re-rendering - select it
        if(selectedUserTwitterId) {
            $('#usersMenu').find("[data-twitter-id='" + selectedUserTwitterId + "']").click();
        }
    });
})();



(function (undefined) {
    translateApp();
    $('.sidebar .inbox').click(function () {
        $("#tweetList").children().show();
        $(".isDeleted").hide();
        $('#tweetList').css('height', '386px');
        $('#userInfo').css('display', 'none');

        $('#usersMenu a').removeClass('selected');
    });
    sendUsage('', { key: 'TWITTER_OPEN_MAIN_MENU', data: {} });
     conduit.advanced.localization.getLocale(function (result) {            
            var locale=result;
            if(locale.alignMode){
                $.alerts.direction=locale.alignMode.toLowerCase();
            }
            if(locale.languageAlignMode){
                $.alerts.direction=locale.languageAlignMode.toLowerCase();
            }
        });
})();


$("#refreshBtnAll").click(function () {    
    var $list = $("#tweetList");
    var currentSelected = $("#usersMenu").find(".selected").attr('href');

    if (currentSelected) {
        currentSelected = currentSelected.replace(/#/, "");
    }

    var data = {
        'command':{
            'name':'refresh'
            ,'value':currentSelected || '%ALL%'
             
        }
    }
    
    conduit.messaging.sendRequest("backgroundPage", "refresh", JSON.stringify(data), function (tweetsData) {
        $("#tweetList").children().show();
        $(".isDeleted").hide();
        $('#tweetList').css('height', '386px');
        $('#userInfo').css('display', 'none');

        $('#usersMenu a').removeClass('selected');
        try {
            tweetsData = JSON.parse(tweetsData);
        }
        catch (e) { 
            conduit.logging.logDebug('Twitter/bgpage.js/callback of sendRequest to "refresh" - received wrong data: ' + tweetsData);
        }
        $list.html($.tmpl("tweetTemplate", tweetsData.tweets));
        $('.js-hideOnError', $list).on('error', function () {
            $(this).hide();
        });
    });
});


$("#deleteBtnAll").click(function () {
    var $list = $("#tweetList");
    var currentSelectedDisplay = "";
    var currentSelected = $("#usersMenu").find(".selected").attr('href');

    if (currentSelected) {
        currentSelectedDisplay = currentSelected.replace(/#/, " ");
        currentSelected = currentSelected.replace(/#/, "");
    }

    var data = {
        currentSelected: currentSelected || "deleteAll"
    };
    var confirmMsg = getKey("CTLP_STR_ID_TWITTER_ARE_YOU_SURE_DELETE_ALL_TWEETS");

    jConfirm(confirmMsg, 'TWITTER', function (sok) {
        if (!sok) { return; }
        sendUsage('', { 'key': 'TWITTER_DELETE_ALL', 'data': { 'url': 'http://twitter.com/' + currentSelected, 'twitterUserId': $(this).attr('data-twitter-id'), 'twitterUserScreenName': $(this).attr('data-twitter-screen-name')} });
        conduit.messaging.sendRequest("backgroundPage", "RemoveAllTweets", JSON.stringify(data), function (tweetsData) {
            try {
                tweetsData = JSON.parse(tweetsData);
            }
            catch (e) {
                conduit.logging.logDebug('Twitter/bgpage.js/callback of sendRequest to "RemoveAllTweets" - received wrong data: ' + tweetsData);
            }
            $list.html($.tmpl("tweetTemplate", tweetsData.tweets));
            $('.js-hideOnError', $list).on('error', function () {
                $(this).hide();
            });
            $('.sidebar .inbox').trigger('click');
        });
    }
    );
});

$('.js-noselect').on('selectstart', false);

conduit.messaging.sendRequest("backgroundPage", "popup-opened", JSON.stringify({ 'pid': conduit.currentApp.popupId }), function () { });	



