(function () {

    var messages = conduit.abstractionlayer.commons.messages;
    var translation = {  //with fallbacks
        SB_RESTART_DIALOG_TITLE: "Restart Browser",
        SB_RESTART_DIALOG_BODY_TEXT: "Restart your browser to complete install process.",
        SB_RESTART_DIALOG_BTN_CANCEL: "Cancel",
        SB_RESTART_DIALOG_BTN_OK: "OK",

    };

    conduit.abstractionlayer.commons.messages.sendSysReq(
        "serviceLayer",
        "webappApi.localization.getLocale",
        JSON.stringify({ service: "toolbarSettings", method: "getLocaleData" }),
        function (result) {
            try {
                result = (typeof result == 'string') ? JSON.parse(result) : result;
                result = result || {};
                var loc_direction = (result.languageAlignMode || result.alignMode || 'ltr').toUpperCase();
                var dir = (loc_direction === "RTL") ? 'rtl' : 'ltr';
                $('html').addClass(dir);
            }
            catch (err) {
                $('html').addClass("ltr");
            }
        }
    );

    function fillDialog() {
        $("#header-title").text(translation['SB_RESTART_DIALOG_TITLE']);
        $("#content-title1-text").text(translation['SB_RESTART_DIALOG_BODY_TEXT']);
        $("#cancelButton").text(translation['SB_RESTART_DIALOG_BTN_CANCEL']);
        $("#okButton").text(translation['SB_RESTART_DIALOG_BTN_OK']);
        rezizePopup();
    }

    //get translation from serviceLayer.
    function getTranslations() {
        var trArr = [];
        for (var k in translation) {
            trArr.push(k);
        };
        conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer", "options", JSON.stringify({
            service: "translation",
            method: "getTranslationByRegex",
            data: trArr
        }), function (data) {
            if (typeof data == 'string') {
                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    data = undefined;
                }
            }
            if (!data || typeof data != 'object') {
                fillDialog();
                return;
            }

            for (var key in translation) {
                if (!translation.hasOwnProperty(key)) {
                    continue;
                }

                translation[key] = data[key] || translation[key];
            }

            fillDialog();
        });
    }

    function init() {
        getTranslations();
        $('#cancelButton').click(function () { closeDialog('cancel') });
        $('#header-close').click(function () { closeDialog('cancelX') });
        $('#okButton').click(restart);
    }

    function restart() {
        log("restart...");
        var obj = {
            method: "restart",
            data: {}
        };
        notifyModel(obj);
    }

    function rezizePopup (){
       var obj = {
            method: "rezizePopup",
            data: { }
        };
        notifyModel(obj);
    }

    function closeDialog(source) {
        log("close...");
        var obj = {
            method: "close",
            data: { source: source }
        };
        notifyModel(obj);
    }
    function notifyModel(obj, callback) {
        messages.sendSysReq("RestartDialogAction", "restartDialog", JSON.stringify(obj), function (response) { });
    }

    $(init);
})();

function log() {
    //console.log.apply(console, arguments);
}
