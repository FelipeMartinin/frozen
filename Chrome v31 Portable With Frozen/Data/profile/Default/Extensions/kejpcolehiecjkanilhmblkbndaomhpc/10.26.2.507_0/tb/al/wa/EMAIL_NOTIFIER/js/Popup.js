
sdk.log.setName('App/Email[POPUP]');
window.comPort=new ComPort();
/*----------------------------------------------------------------
-- Popup
----------------------------------------------------------------*/
var transValues = {};
var needRefreshMails = false;
var imagesDir = "http://emailnotifier.webapps.conduitapps.com/";
var taskManager=new sdk.TaskManager();
//////////////////////////////////////////////////////////
//INIT
//////////////////////////////////////////////////////////
$(document).ready(function () {
    sdk.log.info({ 'method': '$(document).ready()', 'type': 'global' });
    // Bind handlers
    bindHandlers();

    //INIT
    checkLocale(function () {
        loadTranslation(function () {
            loadSettings(function () {
        init_mail_view();
        init_accounts_view();
        init_addAccount_view();
        init_editAccount_view();
        loadAccounts(function () {
        //add message listener to notification
        conduit.messaging.onRequest.addListener("Notification", onNotificationArrived);
        });
            });
        });
    });
});

function bindHandlers() {
    function isNumberKey(evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode;
        return !(charCode > 31 && (charCode < 48 || charCode > 57));
    }

    $('#txtPOP3Port').on('keypress', function (event) {
        return isNumberKey(event);
    });
}

function onPopupReady() {
    sdk.log.info({ 'method': 'onPopupReady', 'type': 'global' });
    showMails();
}

function checkLocale(cb) {
    sdk.log.info({ 'method': 'checkLocale', 'type': 'global' });
    //localization and change to RTL when necessary
    conduit.advanced.localization.getLocale(function (env) {
        sdk.log.info({ 'method': 'checkLocale/conduit.advanced.localization.getLocale callback', 'type': 'global' });
        /*prefere use of language direction in dialogs instead of toolbar direction (sometime publisher prefere use LTR toolbar direction with RTL language)*/
        var loc_direction = (env.languageAlignMode) ? env.languageAlignMode : env.alignMode;
        if (loc_direction == "RTL") { //
            $('#mainBody').attr('dir', 'rtl');
            $('#mainBody').addClass('rtl');
            $("head").append("<link>");
            css = $("head").children(":last");
            css.attr({
                rel: "stylesheet",
                type: "text/css",
                href: "css/en_rtl.css"
            });
        }
        cb && cb();
    });
}

function loadSettings(cb) {
    sdk.log.info({ 'method': 'loadSettings', 'type': 'global' });
    var dataObj = { method: 'getSettings' };
    sendMessage(dataObj, function (settings) {
        try {
            settings = JSON.parse(settings);
        }
        catch (e) {
            conduit.logging.logDebug('EmailNotifier/Popup.js/loadSettings - received wrong settings: ' + settings);
            settings = null;
        }
        if (settings != null) {
            $('#cmbInterval').val(settings.interval);
        }
        cb && cb();
    });
}
var loadAccountCallback= function (data) {
        try{
            sdk.log.info({ 'data': data, 'method': 'loadSettings/sendMessage[getAccounts] callback', 'type': 'global' });
            var show_add_account=function () {
                    showAddAccount();
                    $('#btnAddManageAccount').hide();
                };
            var show_mail_view=function (){
                    showMails();
                    $('#tabMail a:first-child').trigger('click')
                };
            
            fillAccounts(data);        
            var delay=0;            
            var onAccountLoaded=show_add_account;
            if ($('#tabMail').children().length > 0) {//trigger first item            
                delay=1000;
                onAccountLoaded=show_mail_view;
            }
            setTimeout(onAccountLoaded,delay);
        }catch(ex){
            //alert(ex);
        }
    };

function loadAccounts(cb) {
    sdk.log.info({ 'method': 'loadAccounts', 'type': 'global' });
    var msg = { method: 'getAccounts' };
    sendMessage(msg, function (data){
        loadAccountCallback(data);
        cb && cb();
    });
}

var transValues;
function loadTranslation(cb) {
    sdk.log.info({ 'method': 'loadTranslation', 'type': 'global' });
    var dataObj = {
        method: 'getTranslation'
    };

    sendMessage(dataObj, function (_transValues) {
        sdk.log.info({ 'method': 'loadTranslation/sendMessage[getTranslation]', 'type': 'global' });
        transValues = _transValues;
        try {
            transValues = JSON.parse(transValues);
        }
        catch (e) { conduit.logging.logDebug('EmailNotifier/Popup.js/loadTranslation - received wrong transValues: ' + transValues); }
        $('[transKey]').each(function () {
            $(this).html(transValues[$(this).attr('transKey')]);
        });

        //split translation key SB_EMAIL_NOTIFIER_MAIN_RETREIVE_MAIL
        var splitArray = transValues['SB_EMAIL_NOTIFIER_MAIN_RETREIVE_MAIL'].split('<#>');
        $('#spanRetreive').text(splitArray[0] || '');
        $('#spanMinutes').text(splitArray[1] || '');
        onPopupReady();
        cb && cb();
    });
}

///////////////////////////////////////////////////////////////////
// END INIT
//////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////
///	Global functions
//////////////////////////////////////////////////////////////////


//hide  panels
function hideDivs() {
    sdk.log.info({ 'method': 'hideDivs', 'type': 'global' });
    $('#divManageAccount').hide();
    $('#divAddAccount').hide();
    $('#divEditAccount').hide();
    $('#divMails').hide();
}

//show specific panel
function showPanel(pnl) {
    sdk.log.info({ 'data': { panel: pnl }, 'method': 'showPanel', 'type': 'global' });
    pnl.show();
}

//send message to BG Page
function sendMessage(dataObj, cb) {
    sdk.log.info({ data: { 'dataObj': dataObj }, 'method': 'sendMessage', 'type': 'global' });
    //var data = JSON.stringify(dataObj);
    window.comPort.send(dataObj,cb);
    //conduit.messaging.sendRequest("backgroundPage", "backgroundPage", data, cb);
    //window.comPort.send();

}

function resetPriorViewAccounts() {
    sdk.log.info({ 'method': 'resetPriorViewAccounts', 'type': 'global' });
    $('#tabMail').empty();
    $('#editAccountList').empty();
    $('#ulMoreAccounts').empty();
    $('#btnRemove').addClass('dx-disabled');

    enable3DivButton(document.getElementById('btnEdit'), false);
    enableUpButton(false);
    enableDownButton(false);
}

//fill accounts that retrieve from BG page
function fillAccounts(accounts) {
    sdk.log.info({ 'method': 'fillAccounts', 'type': 'global' });
    try {
        accounts = JSON.parse(accounts);
    }
    catch (e) {
        conduit.logging.logDebug('EmailNotifier/Popup.js/fillAccounts - received wrong accounts: ' + accounts);
        accounts = null; 
    }
    resetPriorViewAccounts();
    if (accounts == null) {
        return;
    }

    var tabIndex = 0;
    var account_count = accounts.length;

    for (var i = 0; i < account_count; i++){
        tabIndex++;

        var accountId = accounts[i].id;
        var accountName = accounts[i].userPersonalDetail.emailAddress;
        var shortName = accountName.split('@')[0];

        var iconname = (accounts[i].mailProvider.icon != '') ? accounts[i].mailProvider.icon : 'mail_default.png';
        var bigAccountIcon = imagesDir + 'icn24/' + iconname;
        var accountIcon = imagesDir + 'icn16/' + iconname;

        var accountNewMailsNo = accounts[i].stats.newMailsNo;

        // fill manage account list 
        var toAppend = $("<li class='manageAccountItem' id='" + accountId + "' tabindex='" + tabIndex + "'>" +
            "<img class=\"marginLeft10\"  src='" + bigAccountIcon + "'/> <span style='margin-left:7px'>" + accountName + "</span></li>");
        toAppend.on('click', function() {
            onSelectAccount(this);
        }).on('ondblclick', function() {
            onDBAccount(this);
        });
        $('#editAccountList').append(toAppend);

        //build the tab's
        if (tabIndex <= 4) {

            var tabHtmlText = '<a href="#" class="tabLink" id="cont-' + accountId + '" accountId="' + accountId + '" accountName="' + accountName + '">' +
                '<table border="0" cellspacing="0" cellpadding="0"><tr>' +
                '<td align="center"><img class="img16" src="' + accountIcon + '" /><img class="img24" style="display:none;" src="' + bigAccountIcon + '"/></td>';
            var newMailsNoClass = '';
            var span_class = '';
            var mail_count_text = '';
            if (accountNewMailsNo > 0 && tabIndex > 1) {
                mail_count_text = accountNewMailsNo;
                if (accountNewMailsNo < 10) { newMailsNoClass = 'singleDigit'; span_class = 'single'; }
                else if (accountNewMailsNo < 100) { newMailsNoClass = 'doubleDigit'; span_class = 'double'; }
                else if (accountNewMailsNo < 1000) { newMailsNoClass = 'tripleDigit'; span_class = 'triple'; }
            }

            //set in tab mail count digit display
            tabHtmlText += '<td id="digit-' + accountId + '" align="center" valign="top" class="hideMeWhenSelected ' + newMailsNoClass + '"><span class="digit ' + span_class + '">' + mail_count_text + '</span></td>';
            //set in tab mail account label
            tabHtmlText += '<tr><td colspan="2" valign="middle" align="center" class="hideMeWhenSelected label">' + shortName.substring(0, 12) + '</td></tr></table></a>';

            $('#tabMail').append(tabHtmlText);
        }
        else {
            $('#ulMoreAccounts').append('<li accountId="' + accountId + '"><img  src="' + bigAccountIcon + '"/> <a>' + accountName + '</a></li>');
        }

        if (tabIndex == 1) {
            //marked first tab as active
            $('.tabLink').filter('#cont-' + accounts[i].id).addClass("activeLink");
            //set emailAddress for first tab
            $('#accName').text(accountName);
            $('#hidAccId').val(accounts[i].id);
        }
    } //foreach

    //manage account scrolling 
    $('.scroll-pane2').jScrollPane({ showArrows: true });

    if (tabIndex > 0) {
        $('#divMailHeaderMailAddress').show();

        var firstAccount = $('#editAccountList').children()[0];
        onSelectAccount(firstAccount); //select first account

        //add more account tab when accountsNo more than 4
        if (tabIndex > 4) {
            $('#tabMail').append(
            '<a href="#" class="tabLinkMenu" id="cont-9999" accountId="9999">' +
            '<table class="uiTabMore" border="0" cellspacing="0" cellpadding="0" style="width:32px;height:45px">' +
            '<tr><td align="center" style="padding-top:12px;" ><img src="' + imagesDir + 'more-dd.png"/></td></tr>' +
            '<tr><td valign="bottom" align="center">&nbsp;</td></tr></table></a>');
        }
    }
    else {
        $('#divMailHeaderMailAddress').hide();
    }

}

var account_add_notification_handler={
    handle:function (type, data){}
    ,handleStub:function (type, data){}
    ,handleActive:function (data){
                //update account status during adding account
                var type = "POP3";
                if ($('#rdWebAccount').is(":checked") == true) {
                    type = "Web";
                }

                if (data.notificationStatus == "ERROR") {
                    showFailedMessage(type, data.data);
            for (var l in account_add_notification_handler.listeners){
                account_add_notification_handler.listeners[l] && account_add_notification_handler.listeners[l](data);
            }
                }
                else if (data.notificationStatus == "INFO") {
                    showInfoMessage(type, data.data);
                }
    }
        ,listeners:{}
}
account_add_notification_handler.handle=account_add_notification_handler.handleStub;

function onNotificationArrived(d, sender, cb) {
    sdk.log.info({ 'method': 'onNotificationArrived', 'type': 'global' });
    var data = JSON.parse(d);
    switch (data.key) {
        case "CHECK_ADD_ACCOUNT":
        {
            account_add_notification_handler.handle(data);

            } break;
        case "CHECK_EDIT_ACCOUNT":
            {
                //update account status when during check connection for account
                var type = "Edit";

                if (data.notificationStatus == "ERROR") {
                    showFailedMessage(type, data.data);
                }
                else if (data.notificationStatus == "INFO") {
                    showInfoMessage(type, data.data);
                }
            } break;
        case "UPDATE_ACCOUNT_NO":
            {
                //update the number of new mail (tab badge)
                var account = JSON.parse(data.data);
            } break;
        case "REFRESH_EMAIL_VIEW_AND_UNREAD_COUNTS":
            {
                var obj = update_view(data.data);
            } break;
        case "ACCOUNTS_LOADED":
            {
                var obj = loadAccountCallback(data.data);
            } break;
    } //switch
} //function

function update_view(accounts) {
    sdk.log.info({ 'method': 'update_view', 'type': 'global' });
    if (!accounts) {
        return;
    }
    // redraw mail display in active tab
    $('.activeLink').filter("a:first-child").trigger('click');

    setTimeout(function () {
        //update the on tab counts
        var tab_index = 0;
        var account_count = accounts.length;
        for (var i = 0; i < account_count; i++) {
            tab_index++;
            var account_id = accounts[i].id;
            var account_new_mails = accounts[i].stats.newMailsNo;

            //build the tab's
            if (tab_index <= 4) {
                refreshAccountNewMailsNoIcon(accounts[i]);
            } else {
                break;
            }
        }
    }, 1000);
} //function


//execute a navigate to inbox script
function goToInbox(accountId) {
    sdk.log.info({ 'method': 'goToInbox', 'type': 'global' });
    var dataObj = {
        method: 'goToInbox',
        account: {
            id: accountId
        }
    };
    sendMessage(dataObj, null);
    conduit.app.popup.close();
}

//set title
function setHeader(strHeader) {
    sdk.log.info({ 'method': 'setHeader', 'type': 'global' });
    $('#divHeaderContent').text(strHeader);
}

//////////////////////////////////////////////////////////////
//MAILS
/////////////////////////////////////////////////////////////

var init_mail_view =function() {
    sdk.log.info({ 'method': 'init_mail_view()', 'type': 'global' });
    sendMessage({ method: 'sendUsage', usage: { key: 'EMAILNOTIFY_OPEN_MENU'} }, function () { });

    //refresh click
    $('#imgRefresh').click(function () {

        if ($(this).hasClass('dx-disabled')) {
            return;
        }

        sendMessage({ method: 'sendUsage', usage: { key: 'EMAILNOTIFY_CHECK'} }, function () { });

        var obj = {
            method: 'refreshEmails',
            account: {
                id: $('#hidAccId').val()
            }
        };

        $('#divMenuMoreItems').hide();

        $('#divLoading').show();

        //disable refresh button
        $('#imgRefresh').addClass('dx-disabled');
        $('#imgRefresh').css('cursor', 'default');
        $('#imgRefresh').live('mouseover', function () {
            $(this).attr('src', imagesDir + 'refresh.png');
        });

        sendMessage(obj, function (result) //refresh complete callback
        {
            try {
                result = JSON.parse(result);
            }
            catch (e) {
                conduit.logging.logDebug('EmailNotifier/Popup.js/document.ready - received wrong result: ' + result);
            }
            //enable refresh button
            $('#imgRefresh').removeClass('dx-disabled');
            $('#imgRefresh').css('cursor', 'pointer');
            $('#imgRefresh').live("mouseover", function () {
                $(this).attr("src", imagesDir + "refresh_hover.png");
            });

            
            if (result.success) {
                on_MailsRecieved(result.accData);
                return;
            }
            else {
                $('#divLoading').hide();

                (new Dialog({uiid:'#uiDialog'
                    ,title:transValues['SB_EMAIL_NOTIFIER_ERROR_POPUP_TITLE']
                    ,content:transValues['SB_EMAIL_NOTIFIER_RETREIVE_ACCOUNT_MAILS_FAILED']
                    ,icon:imagesDir + 'error_icon.png'}))
                    .actions([{
                    'button':{
                        'label':transValues['SB_EMAIL_NOTIFIER_EDIT_ACCOUNT_DETAILS']
                        ,classes:['major']
                        ,a10n:{name:'confirm'}
                    }
                    ,'act':function(){
                        EditAccount($('#hidAccId').val());
                    }
                },{
                    'button':{
                        'label':'Retry'
                        ,classes:['minor']
                        ,a10n:{name:'decline'}
                    }
                    ,'act':function(){
                    $("#imgRefresh").click();
                    }
                }]).show();
            }
        });
    });

    //refresh mail items hover events
    $('#imgRefresh').hover(
        function () { $(this).attr('src', imagesDir + 'refresh_hover.png'); },
        function () { $(this).attr('src', imagesDir + 'refresh.png'); }
     );

    // go to manage account panel
    $('#btnMailManageAccounts').click(function () {
        $("#divMenuMoreItems").hide();
        showManageAccount();
    });

    //on select item from more accounts menu
    $('#ulMoreAccounts li').live('click', function () {
        if ($(this).length > 0) {
            $('.tabLink').removeClass('activeLink');
            $('.tabLinkMenu').addClass('activeLink');
            $('.img24').hide();
            $('.img16').show();
            $('.hideMeWhenSelected').show();
            $('#divMenuMoreItems').hide();
            var accountName = $(this).attr('accountName');
            $('#accName').text(accountName);
            var accountId = $(this).attr('accountId');
            $('#hidAccId').val(accountId);
            getMails(accountId, true);
        }
    });

    // mail account tab item click
    $('.tabLink').live('click', function () {
        onSelectTab($(this));
    });


    // more tab item
    $(".tabLinkMenu").live({
        mouseenter: function () {
            var pos = $(this).offset();
            $("#divMenuMoreItems").css({ "left": (pos.left) + "px", "top": (pos.top + 39) + "px" });
            $("#divMenuMoreItems").show();
        },
        mouseleave: function () {
            $("#divMenuMoreItems").hide();
        }
    });

    //when hover on more accounts menu
    $("#divMenuMoreItems").bind({
        mouseenter: function () {
            $("#divMenuMoreItems").show();
        },
        mouseleave: function () {
            $("#divMenuMoreItems").hide();
        }
    });


    //go to inbox when user click on user account name 
    $('#accName').click(function () {
        goToInbox($('#hidAccId').val());
    });

    //change time interval
    $('#cmbInterval').change(function () {
        var setObj = {
            method: 'changeInterval',
            settings: {
                interval: parseInt($(this).val())
            }
        };
        sendMessage(setObj, function () { });
    });

    //on click on mail message 
    //now it's gotoinbox (unable to go to message)
    $('.mailContainer').live('click', function () {
        $('#accName').trigger('click');
    });
};

//get mails by accountId
function getMails(accountId, markAsSeen) {
    sdk.log.info({ 'method': 'getMails', 'type': 'global' });
    //show the loading panel
    $('#divLoading').show();

    var dataObj = { method: 'getMailsByAccountID', account: { id: accountId, markAsSeen: markAsSeen} };
    sendMessage(dataObj, on_MailsRecieved);
}

// build the mails list dynamicly
function on_MailsRecieved(obj) {
    sdk.log.info({ 'method': 'on_MailsRecieved', 'type': 'global' });
    try {
        obj = JSON.parse(obj);
    }
    catch (e) {
        conduit.logging.logDebug('EmailNotifier/Popup.js/on_MailsRecieved - received wrong object: ' + obj);
    }
    //update the account name
    $('#accName').text(obj.account.userPersonalDetail.emailAddress);
    $('#hidAccId').val(obj.account.id);

    //update the last update label
    var d = new Date(obj.account.stats.lastUpdated);
    if (d != null) {
        $('#lblLastUpdate').show();
        $('#lblLastUpdate').text(transValues['SB_EMAIL_NOTIFIER_MAIN_LST_UPDATED'].replace("<time>", d.format("hh:nn a/p") + " "));
    }
    else {
        $('#lblLastUpdate').hide();
    }

    //re-update newMailsNo icon for active account
    refreshAccountNewMailsNoIcon(obj.account);

    //remove old mail items
    $("#divMailContainer").empty();

    if (obj.mails != null && obj.mails.length > 0) {

        //sort mails by date (from latest to first message)
        obj.mails.sort(function (a, b) { return b.date - a.date; });

        //build the mail item
        for (var index = 0; index < obj.mails.length; index++) {
            var oMail = obj.mails[index];
            if (!oMail || oMail.emailID == '' && oMail.from == '- - -') {
                continue;
            }

            var $newdiv = $("<div id='" + oMail.emailID + "' class='mailContainer' />");

            var from = decorateText(oMail.from.replace(/"/gi, '')).fxTrim() || '&nbsp;';
            var subject = decorateText(oMail.subject).fxTrim();
            var shortBody = decorateText(oMail.shortBody).replace(/\n+/gi, '').replace(/\[cid:.*\]|<.*>/gi, '');
            var recived = new Date(oMail.date);

            if (!subject) subject = decorateText(transValues['SB_EMAIL_NOTIFIER_NO_SUBJECT']).fxTrim() || '&nbsp;';
            $newdiv.append('<div class="mailField floatLeft"><span class="mailCellField" style="width: 100px;min-height: 31px;">{0}</span></div>'.format(from));
            $newdiv.append('<div class="mailField floatLeft"><span class="mailCellField" style="width: 310px;min-height: 31px;">{0}</span>'.format(subject) +
                           '<span class="mailCellField floatLeft" style="width: 310px;">{0}</span></div>'.format(shortBody));

            $newdiv.append('<div class="mailLastField"><span class="mailCellField mailCellDateTime" >' + recived.format("dd/MM/yyyy") + "<br />" + recived.format("hh:nn a/p") + "</span></div>");
            $newdiv.append('<div style="clear: both"></div>');

            $("#divMailContainer").append($newdiv);
        }

        $('.mailCellField').ellipsis();
        $('.scroll-pane').show();
        $('.scroll-pane').jScrollPane({ showArrows: true });

        //enable refresh button
        $('#imgRefresh').removeClass('dx-disabled');
        $('#imgRefresh').css('cursor', 'pointer');
        $('#imgRefresh').live('mouseover', function () {
            $(this).attr('src', imagesDir + 'refresh_hover.png');
        });
    }
    else {
        //no items hide the mail container
        $('.scroll-pane').hide();
    }

    //hide the loading panel
    $('#divLoading').hide();
}

//decorate text to correct html
function decorateText(text) {
    sdk.log.info({ 'method': 'decorateText', 'type': 'global' });
    if (!text) return '';

    var html = text.replace(/&/g, "&amp;");
    html = html.replace(/"/g, "&quot;");
    html = html.replace(/</g, "&lt;");
    html = html.replace(/>/g, "&gt;");

    return html;
} //function

//re-update newMailsNo icon for active account
function refreshAccountNewMailsNoIcon(account) {
    sdk.log.info({ 'method': 'refreshAccountNewMailsNoIcon', 'type': 'global' });

    var accDigit = $('#digit-' + account.id);
    accDigit.removeClass('singleDigit doubleDigit tripleDigit ');
    accDigit.find('.digit').removeClass('single double triple');

    var accountNewMailsNo = account.stats.newMailsNo;
    var newMailsNoClass = '';
    var digit_class = '';
    if (accountNewMailsNo < 10) {
        newMailsNoClass = "singleDigit";
        digit_class = 'single';
    }
    else if (accountNewMailsNo < 100) {
        newMailsNoClass = "doubleDigit";
        digit_class = 'double';
    }
    else if (accountNewMailsNo < 1000) {
        newMailsNoClass = "tripleDigit";
        digit_class = "triple";
    }

    if (accountNewMailsNo > 0) {
        accDigit.addClass(newMailsNoClass);
        accDigit.children('.digit').addClass(digit_class);
        accDigit.children('.digit').text(accountNewMailsNo);
        accDigit.show();
    }
    else {
        accDigit.children('.digit').text('');
        accDigit.hide();
    }
} //function

//show the mail panel
function showMails() {
    sdk.log.info({ 'method': 'showMails', 'type': 'global' });
    hideDivs();
    showPanel($('#divMails'));
    setHeader(transValues['SB_EMAIL_NOTIFIER_MAIN_TITLE']);
}

//on select tab changed
function onSelectTab(tab) {
    sdk.log.info({ 'method': 'onSelectTab', 'type': 'global' });
    $(".tabLink").removeClass("activeLink");
    $(".tabLinkMenu").removeClass("activeLink");
    $(".hideMeWhenSelected").show();
    $(tab).find('.hideMeWhenSelected').hide();

    //icons changed
    $('.img24').hide();
    $('.img16').show();
    $(tab).find('.img16').hide();
    $(tab).find('.img24').show();

    //add activelink tab to select tab
    $(tab).addClass("activeLink");

    //hide the more items
    $("#divMenuMoreItems").hide();

    // Reset the scroll position to top.
    $('#uiTabContent .jspDrag').css('top', '0px');
    $('#uiTabContent .jspPane').css('top', '0px');

    if ($(tab).length > 0) {
        //update the subtitle
        var accountId = $(tab).attr('accountId');
        $('#hidAccId').val(accountId);
        $('#accName').text($(tab).attr('accountName'));

        //show the loading panel
        $('#divLoading').show();
        //remove old mail items
        $("#divMailContainer").empty();
        //bring mails for selected account
        setTimeout("getMails(" + accountId + ",true);", 200);
    }
    return false;
}


//////////////////////////////////////////////////////////////
// End Mails
//////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////
// Accounts
//////////////////////////////////////////////////////////////
var init_accounts_view=function () {
    sdk.log.info({ 'method': 'init_accounts_view', 'type': 'global' });

    //Key UpDown event for move accounts
    $('#divManageAccount').keyup(function (event) {
        onKeyUPDownAccount(event);
    });

    // add account click
    $('#btnAdd').click(function () {
        showAddAccount();
    });

    //edit account click
    $('#btnEdit').click(function () {
        if ($(this).hasClass('dx-disabled'))
            return;

        var accountsNo = $("#editAccountList li").length;
        if (accountsNo == 0) return;

        var currentAccount;
        if (accountsNo == 1)
            currentAccount = $("#editAccountList li")[0];
        else //only when account selected
            currentAccount = $("#editAccountList li[class~='selected']")[0];

        var dataObj = {
            method: 'getAccountByID',
            account: {
                id: currentAccount.id
            }
        };
        sendMessage(dataObj, function (acc) {
            showEditAccount(acc);
        });
    });

    //edit hover button events
    $('#btnEdit').hover(
        function () { mouseOver3DivButton(this); },
        function () { mouseOut3DivButton(this); }
     );

    //remove account from list
    $('#btnRemove').click(function (e) {
        var accountsNo = $("#editAccountList li").length;
        if (accountsNo == 0) return;
        var currentAccount;
        if (accountsNo == 1)
            currentAccount = $("#editAccountList li")[0];
        else //only when account selected
            currentAccount = $("#editAccountList li[class~='selected']")[0];

        var confirmMsg = transValues['SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TEXT'];
        confirmMsg = confirmMsg.replace('<email address>', currentAccount.lastChild.innerHTML + '\n');
        (new Dialog({
            uiid:'#uiDialog'
            ,title: transValues['SB_EMAIL_NOTIFIER_MNG_REMOVE_ACT_DIALOG_TITLE']
            ,content:confirmMsg}))
            .actions([{
            'button':{
                'label':transValues['SB_EMAIL_NOTIFIER_BTN_YES']
                ,classes:['major']
                ,a10n:{name:'confirm'}
            }
            ,'act':function(){
                RemoveAccount(currentAccount.id);
            }
        },{
            'button':{
                'label':transValues['SB_EMAIL_NOTIFIER_BTN_NO']
                ,classes:['minor']
                ,a10n:{name:'decline'}
            }
            ,'act':function(){}
        }]).show();
    });

    //modal popup button (yes action) hover event
    $('#popupActionYes').hover
    (
        function () { mouseOver3DivButton(this); },
        function () { mouseOut3DivButton(this); }
     );

    //back to mail panel 
    $('#btnManageAccountCancel').click(function (e) {
        showMails();

        if (needRefreshMails) {
            //bring mails for selected tab account
            $('.activeLink').filter("a:first-child").trigger('click');
        }
    });

    //up click change account order
    $('#btnUp').click(function () {
        //get current selected account
        var current = $("#editAccountList li[class~='selected']");
        if (current.length > 0) {
            //get previous account
            var accPrev = $("#editAccountList li[class~='selected']").prev();
            if (accPrev.length > 0) {

                var posObj = {
                    method: 'changePosition',
                    account: {
                        id: current[0].id,
                        replaceWithId: accPrev[0].id
                    }
                };

                //send message to backstage to change order between 2 accounts
                sendMessage(posObj, function (d) {
                    needRefreshMails = true;
                    fillAccounts(d);
                    onSelectAccount(current[0]);
                    ChangeScrollerPosition(current[0]);
                });
            }
        }
    });


    $('#btnDown').click(function () {
        var current = $("#editAccountList li[class~='selected']");
        if (current.length > 0) {
            var accNext = $("#editAccountList li[class~='selected']").next();

            if (accNext.length > 0) {
                var posObj = {
                    method: 'changePosition',
                    account: {
                        id: current[0].id,
                        replaceWithId: accNext[0].id
                    }
                };

                sendMessage(posObj, function (d) {
                    needRefreshMails = true;
                    fillAccounts(d);
                    onSelectAccount(current[0]);
                    ChangeScrollerPosition();
                });
            }
        }
    });
};

//show edit account (click in error popup)
function EditAccount(accountId) {
    sdk.log.info({ 'method': 'EditAccount', 'type': 'global' });
    var dataObj =
	{
	    method: 'getAccountByID',
	    account: {
            id: accountId
	    }
	};

    sendMessage(dataObj, function (acc) {
        showEditAccount(acc);
    });
}

//remove account (click in confirmation popup)
function RemoveAccount(accountId) {
    sdk.log.info({ 'method': 'RemoveAccount', 'type': 'global' });
    var message =
	{
	    method: 'removeAccount',
	    account: {
            id:accountId
	    }
	};
    //send message (remove selected account)
    sendMessage(message, function (d) {
        needRefreshMails = true;
        fillAccounts(d);

        if ($('#tabMail').children().length == 0) {
            //if no accounts -> move to add account screen
            showAddAccount();
            $('#btnAddManageAccount').hide();
        }
    });
}

function onSelectAccount(selectAcc) {
    sdk.log.info({ 'method': 'onSelectAccount', 'type': 'global' });
    $("#editAccountList li").removeClass('selected')
                    .filter('#' + selectAcc.id)
                    .addClass('selected')
                    .focus(); //set selected item in focus

    enable3DivButton(document.getElementById('btnEdit'), true);
    $('#btnRemove').removeClass('dx-disabled');

    if ($("#editAccountList li[class~='selected']").prev().length == 0)
        enableUpButton(false);
    else
        enableUpButton(true);

    if ($("#editAccountList li[class~='selected']").next().length == 0)
        enableDownButton(false);
    else
        enableDownButton(true);

}

//account double click -> show edit account screen
function onDBAccount(selectedAccount) {
    sdk.log.info({ 'method': 'onDBAccount', 'type': 'global' });
    var dataObj =
	{
	    method: 'getAccountByID',
	    account: {
	        id: selectedAccount.id
	    }
	};

    sendMessage(dataObj, function (acc) {
        showEditAccount(acc);
    });
}

function onKeyUPDownAccount(e) {
    sdk.log.info({ 'method': 'onKeyUPDownAccount', 'type': 'global' });

    e = e || window.event;
    if (!e) {
        return;
    }

    if (typeof (e.keyCode) == 'number') {
        if (e.keyCode == 40) {
            //down key
            $('#btnDown').trigger('click');
        }
        else if (e.keyCode == 38) {
            //up key
            $('#btnUp').trigger('click');
        }
    }
}


function showManageAccount() {
    sdk.log.info({ 'method': 'showManageAccount', 'type': 'global' });
    sendMessage({ method: 'sendUsage', usage: { key: 'EMAILNOTIFY_OPEN_SETTINGS'} }, function () { });
    needRefreshMails = false;
    hideDivs();
    showPanel($('#divManageAccount'));
    setHeader(transValues['SB_EMAIL_NOTIFIER_MNG_TITLE']);
    $('.scroll-pane2').jScrollPane({ showArrows: true });
    $('#divManageAccount').focus();
}


function ChangeScrollerPosition() {
    sdk.log.info({ 'method': 'ChangeScrollerPosition', 'type': 'global' });
    var selectedItem = $("#editAccountList li[class~='selected']");
    //scroller position
    var api = $('.scroll-pane2').data('jsp');
    var height = selectedItem.height();
    var index = selectedItem.index();
    var numOfItems = $("#editAccountList li").length;

    api.scrollToY(index * height);

}

//////////////////////////////////////////////////////////
//End settings
//////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////
//AddAccount
//////////////////////////////////////////////////////////

var init_addAccount_view=function () {
    sdk.log.info({ 'method': 'init_addAccount_view', 'type': 'global' });
    function onClipboardEdit() {
        var that = this;
        setTimeout(function () {
            $(that).val($.trim($(that).val()));
            enableAddSubmitButton();
        }, 0);
    }
    $("#divAddAccount input").on('paste', onClipboardEdit);
    $("#divAddAccount input").on('cut', onClipboardEdit);

    $("#divEditAccount input").on('paste', onClipboardEdit);
    $("#divEditAccount input").on('cut', onClipboardEdit);

    //add account click
    $('#btnAddSubmit').click(function (e) {

        if ($(this).hasClass('dx-disabled')) {
            return;
        }
        account_add_notification_handler.handle=account_add_notification_handler.handleActive;
        account_add_notification_handler.listeners['add_account']=function(){
            $('#btnCancel').off('click').on('click',onCancel);
            (new Dialog({uiid:'#uiDialog'})).hide();
        };
        enable3DivButton(document.getElementById('btnAddSubmit'), false);

        var acc = null;
        if ($('#rdWebAccount').is(":checked") == true) {
            //fill web account data
            acc = {
                emailAddress: jQuery.trim($('#txtEmailAddress').val()),
                password: jQuery.trim($('#txtPassword').val()),
                isCustomPOP3: false
            };

            $('#imgWebAccountLoader').show();
        }
        else {
            //fill pop3 account	
            acc = {
                emailAddress: jQuery.trim($('#txtPOP3EmailAddress').val()),
                password: jQuery.trim($('#txtPOP3Password').val()),
                isCustomPOP3: true,
                incServer: jQuery.trim($('#txtPOP3IncServer').val()),
                port: parseInt($('#txtPOP3Port').val()),
                ssl: false   //$('#chkPOP3SSL').attr('checked')
            };

            // set ssl id port 995 or 993
            if (acc.port == 995 || acc.port == 993) {
                acc.ssl = true;
            }

            $('#imgPOP3AccountLoader').show();
        }

        var taskinfo=taskManager.create(function (d) {
                account_add_notification_handler.handle=account_add_notification_handler.handleStub;
                account_add_notification_handler.listeners['add_account']=function(){};
                hideLoadingImg();
                clearAddAccountControls();
                showManageAccount();
                needRefreshMails = true;
                fillAccounts(d);
                showMails();
                $('#tabMail a:first-child').trigger('click');
                $('#btnCancel').off('click').on('click',onCancel);
                (new Dialog({uiid:'#uiDialog'})).hide();
            }
        );

        var dataObj = {
            method: 'addAccount',
            account: acc
        };

        sendMessage(dataObj,taskinfo.task);

        $('#btnCancel').off('click').on('click',function(){
            var email =  mail();
            (new Dialog({uiid:'#uiDialog'
                ,title: transValues['SB_EMAIL_NOTIFIER_ADD_TITLE_BAR']
                ,content:transValues['SB_EMAIL_NOTIFIER_ADD_NEW_ACCOUNT_CANCEL_DIALOG_BODY'].format(email)}))
                .actions([{
                'button':{
                    'label':transValues['SB_EMAIL_NOTIFIER_BTN_YES']
                    ,classes:['major']
                    ,a10n:{name:'confirm'}
                }
                ,'act':function(){
                    taskManager.purge(taskinfo.tid);
                    var message = {
                        method: 'removeAccount',
                        account: {
                            email: email
                        }
                    };
                    sendMessage(message, function (data) {
                        $('#btnCancel').off('click').on('click',onCancel);
                        account_add_notification_handler.handle=account_add_notification_handler.handleStub;
                        account_add_notification_handler.listeners['add_account']=function(){};
                        hideLoadingImg();
                        clearAccountMessage();
                        enableAddSubmitButton();
                    });
                }
            },{
                'button':{
                    'label':transValues['SB_EMAIL_NOTIFIER_BTN_NO']
                    ,classes:['minor']
                    ,a10n:{name:'decline'}
                }
                ,'act':function(){
                    $('#btnCancel').off('click').on('click',onCancel);
                }
            }]).show();
        });

    });
    function mail(){
        return (($('#rdWebAccount').is(":checked") == true)?$('#txtEmailAddress').val():$('#txtPOP3EmailAddress').val()).trim();
    }

    //add account button hover event
    $('#btnAddSubmit').hover
    (
        function () { mouseOver3DivButton(this); },
        function () { mouseOut3DivButton(this); }
     );

    // cancel add account click
    function onCancel(){
        if ($('#tabMail').children().length > 0) {
            //clear fields
            clearAddAccountControls();
            //go to mail screen
            showMails();
         } else { //Close popup
            conduit.app.popup.close(conduit.currentApp.popupId);
        }
    }
    $('#btnCancel').off('click').on('click',onCancel);

    //keyup event on add account input fields
    $('.dummyAddAccountclass').keyup(function (event) {
        enableAddSubmitButton();

        if (event.keyCode == 13 && validateFields())
            $('#btnAddSubmit').click();
    });

    $('input[name="webAccountType"]').keyup(function (event) {
        if (event.keyCode == 13 && validateFields())
            $('#btnAddSubmit').click();
    });

    $('#btnAddManageAccount').click(function () {
        showManageAccount();
    });


    $('#lnkWebAccount').click(function () {
        if ($('#rdWebAccount').is(":checked") != true) {
            $("#rdWebAccount").trigger('click');
        }
    });


    $('#lnkPop3Account').click(function () {
        if ($('#rdPop3Account').is(":checked") != true) {
            $("#rdPop3Account").trigger('click');
        }
    });

    $("#rdWebAccount").click(function () {
        $("#rdPop3Account").attr('checked', false);
        $("#rdWebAccount").attr('checked', true);
        $(".dummySelectAccount").removeClass('addAccountSpacerHover');
        $('#divAddWebAccount').show('fast');
        $('#divAddPop3Account').hide();
        $('#txtEmailAddress').focus();
        enableAddSubmitButton();
    });

    $("#rdPop3Account").click(function () {
        $("#rdWebAccount").attr('checked', false);
        $("#rdPop3Account").attr('checked', true);
        $(".dummySelectAccount").removeClass('addAccountSpacerHover');
        $('#divAddWebAccount').hide();
        $('#divAddPop3Account').show('fast');
        $('#txtPOP3EmailAddress').focus();
        enableAddSubmitButton();
    });


    $(".dummySelectAccount").hover(
		function () {
		    if ($(this).find('[type=radio]').is(":checked") != true)
		        $(this).addClass('addAccountSpacerHover');
		},
		function () {
		    $(this).removeClass('addAccountSpacerHover');
		}
	);


    $('#txtEmailAddress').blur(function () {
        var val = jQuery.trim($(this).val());
        $('#imgWebAccountMailStatusFailed, #imgWebAccountMailStatusOK').hide();
        if (!val) {
            return;
        }
        if (IsValidEmail($(this).val())) {
            $('#imgWebAccountMailStatusOK').show();
            hideEmailStatusMessage("Web");
        }
        else {
            $('#imgWebAccountMailStatusFailed').show();
            showFailedMessage("Web", transValues['SB_EMAIL_NOTIFIER_VALIDATION_FAILED']);
            return;
        }

        var dataObj = {
            method: 'checkMailProvider',
            account: {
                emailAddress: jQuery.trim($(this).val())
            }
        }//object

        sendMessage(dataObj, function (data) {
            $('#imgWebAccountMailStatusFailed, #imgWebAccountMailStatusOK').hide();
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                conduit.logging.logDebug('EmailNotifier/Popup.js/document.ready - received wrong data: ' + data);
            }
            if (data.success) {
                $('#imgWebAccountMailStatusOK').show();
                hideEmailStatusMessage('Web');
            }
            else {
                $('#imgWebAccountMailStatusFailed').show();
                showFailedMessage('Web', transValues['SB_EMAIL_NOTIFIER_FAILED_NOTSUPPORTED_MSG']);
            }
        });
    });


    $('#txtPOP3EmailAddress').blur(function () {
        var val = jQuery.trim($(this).val());
        if (!val) {
            return;
        }
        if (IsValidEmail($(this).val())) {
            $('#imgPOP3AccountMailStatusFailed').hide();
            $('#imgPOP3AccountMailStatusOK').show();
            hideEmailStatusMessage("POP3");
        }
        else {
            $('#imgPOP3AccountMailStatusFailed').show();
            $('#imgPOP3AccountMailStatusOK').hide();
            showFailedMessage("POP3", transValues['SB_EMAIL_NOTIFIER_VALIDATION_FAILED']);
        }
    });
};

function hideEmailStatusMessage(type) {
    $('#div' + type + 'AccountStatus').css('visibility', 'hidden');
    $('#div' + type + 'AccountStatus').removeClass('successMessage').removeClass("failedMessage").removeClass('infoMessage');
    $('#lbl' + type + 'AccountMessage').text('');
    $('#img' + type + 'AccountLoader').hide();
}

function showFailedMessage(type, message) {
    $('#div' + type + 'AccountStatus').css('visibility', 'visible');
    $('#div' + type + 'AccountStatus').removeClass('successMessage').removeClass("infoMessage").addClass('failedMessage');
    $('#lbl' + type + 'AccountMessage').text(message);
    $('#lbl' + type + 'AccountMessage').removeClass('successMessage').removeClass("infoMessage").addClass('failedMessage');
    $('#img' + type + 'AccountLoader').hide();
}
function showSuccessMessage(type, message) {
    $('#div' + type + 'AccountStatus').css('visibility', 'visible');
    $('#div' + type + 'AccountStatus').removeClass('failedMessage').removeClass("infoMessage").addClass('successMessage');
    $('#lbl' + type + 'AccountMessage').text(message);
    $('#lbl' + type + 'AccountMessage').removeClass('failedMessage').removeClass("infoMessage").addClass('successMessage');
    $('#img' + type + 'AccountLoader').hide();
}

function showInfoMessage(type, message) {
    $('#div' + type + 'AccountStatus').css('visibility', 'visible');
    $('#div' + type + 'AccountStatus').removeClass('successMessage').removeClass('failedMessage').addClass("infoMessage");
    $('#lbl' + type + 'AccountMessage').text(message);
    $('#lbl' + type + 'AccountMessage').removeClass('successMessage').removeClass('failedMessage').addClass("infoMessage");
    $('#img' + type + 'AccountLoader').show();

}

function showAddAccount() {
    sdk.log.info({ 'method': 'showAddAccount', 'type': 'global' });
    sendMessage({ method: 'sendUsage', usage: { key: 'EMAILNOTIFY_OPEN_ADD_NEW_ACCOUNT_DLG'} }, function () { });

    hideDivs();
    clearAddAccountControls();
    showPanel($('#divAddAccount'));
    $('#txtEmailAddress').focus();
    setHeader(transValues['SB_EMAIL_NOTIFIER_ADD_TITLE_BAR']);
}

function clearAddAccountControls() {
    sdk.log.info({ 'method': 'clearAddAccountControls', 'type': 'global' });
    $('#chkPOP3SSL').attr('checked', false);
    $('.dummyAddAccountclass').val('');
    $('#divAccountContentStatus').text('');
    $(".dummyAccountImage").hide();
    hideLoadingImg();
    clearAccountMessage();
    enableAddSubmitButton();
}

function hideLoadingImg() {
    $('#imgWebAccountLoader').hide();
    $('#imgPOP3AccountLoader').hide();
    $('#imgEditAccountLoader').hide();
}

function clearAccountMessage() {
    $('#lblWebAccountMessage').text('');
    $('#lblPOP3AccountMessage').text('');
    $('#lblEditAccountMessage').text('');
    $('#divWebAccountStatus').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
    $('#lblWebAccountMessage').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
    $('#divPOP3AccountStatus').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
    $('#lblPOP3AccountMessage').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
    $('#divEditAccountStatus').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
    $('#lblEditAccountMessage').removeClass('successMessage').removeClass('failedMessage').removeClass("infoMessage");
}


function enableAddSubmitButton() {
    if (validateFields())
        enable3DivButton(document.getElementById('btnAddSubmit'), true);
    else
        enable3DivButton(document.getElementById('btnAddSubmit'), false);
}


//Change enable/disable style for UpButton
function enableUpButton(enable) {
    if (enable) {
        $('#btnUp').removeClass('dx-disabled');
        $('#btnUp').removeClass('btnUp_disabled');
        $('#btnUp').addClass('btnUp');
    }
    else {
        $('#btnUp').removeClass('btnUp');
        $('#btnUp').addClass('dx-disabled');
        $('#btnUp').addClass('btnUp_disabled');
    }
}


//Change enable/disable style for DownButton
function enableDownButton(enable) {
    if (enable) {
        $('#btnDown').removeClass('dx-disabled');
        $('#btnDown').removeClass('btnDown_disabled');
        $('#btnDown').addClass('btnDown');
    }
    else {
        $('#btnDown').removeClass('btnDown');
        $('#btnDown').addClass('dx-disabled');
        $('#btnDown').addClass('btnDown_disabled');
    }
}


function validateFields() {
    sdk.log.info({ 'method': 'validateFields', 'type': 'global' });
    var _val_address = '';
    var _val_pass = '';
    if ($('#rdWebAccount').is(":checked")) {
        _val_address = jQuery.trim($('#txtEmailAddress').val());
        _val_pass = jQuery.trim($('#txtPassword').val());
        if (_val_address && _val_pass && IsValidEmail(_val_address)) {
            return true;
        }
    }
    else {
        _val_address = jQuery.trim($('#txtPOP3EmailAddress').val());
        _val_pass = jQuery.trim($('#txtPOP3Password').val());
        if ((_val_address != "") && (_val_pass != "")
            && ($('#txtPOP3IncServer').val() != "") && ($('#txtPOP3Port').val() != "")
            && (IsValidEmail(_val_address)) && (!isNaN($('#txtPOP3Port').val()))
           ) {
            return true;
        }
    }
    return false;
} //function

function IsValidEmail(emailAdd) {
    emailAdd = jQuery.trim(emailAdd);
    var emailRegex = new RegExp(/^(("[\w-+\s]+")|([\w-+]+(?:\.[\w-+]+)*)|("[\w-+\s]+")([\w-+]+(?:\.[\w-+]+)*))(@((?:[\w-+]+\.)*\w[\w-+]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][\d]\.|1[\d]{2}\.|[\d]{1,2}\.))((25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\.){2}(25[0-5]|2[0-4][\d]|1[\d]{2}|[\d]{1,2})\]?$)/i);
    //return (emailAdd.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) != -1);
    return emailRegex.test(emailAdd);
} //function




/////////////////////////////////////////////////////////////
//End AddAccount
/////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////
//EditAccount
//////////////////////////////////////////////////////////
var init_editAccount_view=function () {
    sdk.log.info({ 'method': 'init_editAccount_view', 'type': 'global' });
    //update account
    $('#btnEditSubmit').click(function () {
        if ($(this).hasClass('dx-disabled'))
            return;

        //create account object
        var acc = {
            emailAddress: $('#lblEditEmailData').text(),
            password: $('#txtEditPassword').val(),
            id: $('#txtEditMailID').val(),
            isCustomPOP3: $('#txtEditISCustom').val()
        }

        if ($('#txtEditISCustom').val()) {
            //is pop3 account
            acc.incServer = $('#txtEditPOP3Server').val();
            acc.port = $('#txtEditPort').val();
            if (acc.port == 995 || acc.port == 993) {
                acc.ssl = true;
            }
            else {
                acc.ssl = false;
            }
        }

        var dataObj = {
            method: 'updateAccount',
            account: acc
        };

        //send message update account
        sendMessage(dataObj, function (d) {
            //clear fields
            clearEditAccountControls();
            //show manage account screen
            showManageAccount();
            needRefreshMails = true;
            fillAccounts(d);
        });
        (this).addClass('dx-disabled');
    });

    //edit account hover event
    $('#btnEditSubmit').hover
    (
        function () { mouseOver3DivButton(this); },
        function () { mouseOut3DivButton(this); }
     );

    //cancel edit account
    $('#btnEditCancel').click(function () {
        //clear fields
        clearEditAccountControls();
        //go to manage screen
        showManageAccount();
    });

    //key-up event on edit account input fields
    $(".DummyEditAccountClass").keypress(function (event) {
        enableEditAccountBtn();

        if (event.keyCode == 13 && !$('#btnEditSubmit').hasClass('dx-disabled'))
            $('#btnEditSubmit').click();
    });
};


function enableEditAccountBtn() {
    var isValid = false;
    if ($('#txtEditISCustom').val() === 'true') {
        if (($('#txtEditPassword').val() != "") && ($('#txtEditPort').val() != "") && ($('#txtEditPOP3Server').val() != "") && (!isNaN($('#txtEditPort').val()))) {
            isValid = true;
        }
    }
    else {
        if ($('#txtEditPassword').val()) {
            isValid = true;
        }
    }
    enable3DivButton(document.getElementById('btnEditSubmit'), isValid);
}

// show edit account panel
function showEditAccount(data) {
    clearEditAccountControls();
    hideDivs();
    try {
        data = JSON.parse(data);
    }
    catch (e) {
        conduit.logging.logDebug('EmailNotifier/Popup.js/showEditAccount - received wrong data ' + data);
    }
    //set account data
    setHeader(transValues['SB_EMAIL_NOTIFIER_EDIT_ACT_TITLE']);
    $('#lblEditEmailData').text(data.userPersonalDetail.emailAddress);
    $('#txtEditPassword').val(data.userPersonalDetail.password);
    $('#txtEditMailID').val(data.id);
    $('#txtEditISCustom').val(data.isCustomPOP3);

    if (!data.isCustomPOP3) {
        //web account
        $('#EditAccountSubTitle').text(transValues['SB_EMAIL_NOTIFIER_EDIT_WEB_ACT_TITLE']);
        $('#trEditAdditionalData').hide();
    }
    else {
        //pop3 account
        $('#EditAccountSubTitle').text(transValues['SB_EMAIL_NOTIFIER_EDIT_POP3_ACT_TITLE']);
        $('#txtEditPOP3Server').val(data.mailProvider.server.incServer);
        $('#txtEditPort').val(data.mailProvider.server.port);
        $('#trEditAdditionalData').show();
    }
    enableEditAccountBtn();
    //show edit account screen
    showPanel($('#divEditAccount'));
}

//clear edit controls
function clearEditAccountControls() {
    $(".DummyEditAccountClass").val('');
    hideLoadingImg();
    clearAccountMessage();
}

/////////////////////////////////////////////////////////////
//End EditAccount
/////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////
/// Button visibility
/////////////////////////////////////////////////////////////

//change button styles according divContainer enable state
function enable3DivButton(src, enable) {
    if (enable) {
        $('#' + src.id).removeClass('dx-disabled');
        $('#' + src.id + 'Center').removeClass('btnCenter_disabled').addClass('btnCenter');
        $('#' + src.id + 'Left').removeClass('btnLeft_disabled').addClass('btnLeft');
        $('#' + src.id + 'Right').removeClass('btnRight_disabled').addClass('btnRight');
    }
    else {
        $('#' + src.id + 'Center').removeClass('btnCenter').addClass('btnCenter_disabled');
        $('#' + src.id + 'Left').removeClass('btnLeft').addClass('btnLeft_disabled');
        $('#' + src.id + 'Right').removeClass('btnRight').addClass('btnRight_disabled');

        $('#' + src.id).addClass('dx-disabled');
    }
}

//change button styles when divContainer raise event mouse over
function mouseOver3DivButton(src) {
    $('#' + src.id + 'Left').addClass("btnLeft_hover").removeClass("btnLeft");
    $('#' + src.id + 'Center').addClass("btnCenter_hover").removeClass("btnCenter");
    $('#' + src.id + 'Right').addClass("btnRight_hover").removeClass("btnRight");
}

//change button styles when divContainer raise event mouse out
function mouseOut3DivButton(src) {
    $('#' + src.id + 'Left').addClass("btnLeft").removeClass("btnLeft_hover");
    $('#' + src.id + 'Center').addClass("btnCenter").removeClass("btnCenter_hover");
    $('#' + src.id + 'Right').addClass("btnRight").removeClass("btnRight_hover");
}

/////////////////////////////////////////////////////////////
/// End Button visibility
/////////////////////////////////////////////////////////////

function Dialog(options){
    var $$scope=this;
    var $canvas=$(options.uiid);
    var $glassPanel=$('#uiGlassPane');

    this.content=function(text){
        text=text || '';
        $canvas.find('section.content .text').html(text.replace('\\n', '<br/>').replace('\n', '<br/>'));
        return this;
    };

    this.show=function(){
        $glassPanel.show();
        $canvas.show();
        return this;
    };

    this.hide=function(){
        $glassPanel.hide();
        $canvas.hide();
        return this;
    };
    this.actions=function(acts){
        $canvas.find('footer').html('');
        for(var i=0;i<acts.length;i++){
            var button=$('<a class="button" data-a10n-dialog-footer-action="{0}"></a>'.format(acts[i].button.a10n.name));
            button.text(acts[i].button.label);
            button.off('click').on('click',(function(act){return function(){
                act && act();
                $$scope.hide();
            }})(acts[i].act));
            for(var k=0;k < acts[i].button.classes.length;k++){
                button.addClass(acts[i].button.classes[k]);
            }
            $canvas.find('footer').append(button);
        }
        return this;
    };

    $canvas.find('header label').text(options.title);
    $$scope.content(options.content);
    $canvas.find('header a.close').off('click').on('click',function(){
        $$scope.hide();
    });
    if(options.icon){
        $canvas.find('section.content p').css({'background-image':'url({0})'.format(options.icon)});
    }
}


function ComPort(){
    if(!(this instanceof ComPort)){ return new ComPort(); }
    var $this=this;
    var $method=this;
    var $log_type='ComPort';
    var queue=[];
    var ready=false;
    $method.send=function(cmd,cb){
        sdk.log.info({ data: { 'dataObj': cmd, cb:typeof cb }, 'method': 'sendMessage', 'type': $log_type });
        if (!ready){
            queue.push({command:cmd,callback:cb});
            return;
        }
        var data = JSON.stringify(cmd);
        conduit.messaging.sendRequest("backgroundPage", "backgroundPage", data, cb);
    };
    $method.ready=function(val){
        sdk.log.info({ data: val, 'method': 'ready', 'type': $log_type });
        ready=!!val;

        if (!ready){
            sdk.log.info({text: 'set to supended state', 'method': 'ready', 'type': $log_type });
            return;
        }
        sdk.log.info({data:queue, text:'flush queue on state changed to ready', 'method': 'ready', 'type': $log_type });

        queue.forEach(function(item){
            $method.send(item.command,item.callback);
        });

    };
    (function ctor(){
        sdk.log.info({ 'method': 'ctor', 'type': $log_type });
        conduit.messaging.onRequest.addListener('handshake', function(data){
            sdk.log.info({data:data, 'method': 'onRequest[handshake]', 'type': $log_type });
            $method.ready(true);
        });
        conduit.messaging.onRequest.addListener('message', function(data){
            sdk.log.info({data:data, 'method': 'onRequest[message]', 'type': $log_type });
        });
        var cmd = {method: 'handshake'};
        cmd=JSON.stringify(cmd);
        conduit.messaging.sendRequest("backgroundPage", "backgroundPage", cmd, function(data){
            sdk.log.info({data:data, text: 'came back from handshake request', 'method': 'ctor/sendRequest', 'type': $log_type });
            $method.ready(true);
        });
    })();
}//class
