(function () {
    var Messages = conduit.abstractionlayer.commons.messages,
		applicationPath = conduit.abstractionlayer.commons.environment.getApplicationPath().result,
		currWindowId,
		appData,
		appId,
		iframe,
		popupId,
		browserInfo = conduit.abstractionlayer.commons.environment.getBrowserInfo().result,
        isIE = /IE/i.test(browserInfo.type),
		browserVersion = browserInfo.version.match(/^(\d+)/)[1];


    var init = function () {
       
        appData = JSON.parse(conduit.abstractionlayer.commons.appMethods.getContext(window.name).result);
        appId = appData.appId;
        popupId = appData.popupId;
        currWindowId = appData.windowId;

        var popupSize = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight },
			framePage = document.getElementById("gadget-frame-page"),
			frameSizeOffset = document.getElementById("popupHeader").clientHeight + 1,
			$title = $('.gadget-frame-text');
        if (appData.resizable) {
            $('#popupFooter').css("display", "block");
        }

        if (window.chrome) { //check if chrome 

            var obj = $('.gadget-frame-minimize')
            obj.css("visibility", "hidden");
            obj.css("background-position", "0 4px");
        }
        if (!appData.isShowMininmizedIcon && appData.isShowMininmizedIcon !== undefined && typeof appData.isShowMininmizedIcon != "string") {
            $('.gadget-frame-minimize').remove();
        }
        if (!appData.closebutton && appData.closebutton !== undefined) {
            $('.gadget-frame-close').remove();
        }

        //setting the text

        var $icon = $("#icon");
        $icon.bind("load", function (e) {
            $icon.css("margin-top", Math.floor((29 - this.height) / 2) - 3);
        });
        if (appData.icon) {

            $icon.attr('src', appData.icon);
        } else {
            $('.gadget-frame-icon').css("display", "none");
        }
        //calculate the width of the header part without the section that holds the icons.  
        var addidtionalWidth = parseFloat($title.css('padding-left'), 10) + parseFloat($('.gadgetDrag').css('margin-left'), 10) + parseFloat($('.gadgetDrag').css('margin-right'), 10);

        var titleWidth = $('.gadget-frame-header').width() - $('.gadget-frame-header-right-section').width() - $('.gadget-frame-icon').width() - $('.gadgetBtn').width() - addidtionalWidth;
        //set the width for the div that holds the title text plus additional buffer.

        //if (appData.frameTitle && appData.frameTitle !== "undefined") {
        $title.text(appData.frameTitle || "");
        $title.css("width", titleWidth);
        //}



        conduit.abstractionlayer.commons.messages.onSysReq.addListener("gadgetFrame_" + popupId, function (data, sender, callback) {
            if (data) { //always take title from popup document
                $title.text(data);
            }
            if (callback)
                callback("");
        });
        framePage.style.height = (popupSize.height - 2) + "px";

        function resizeHandler() {
            var data = { method: "getSize", appData: appData };
            conduit.abstractionlayer.commons.messages.sendSysReq("applicationLayer.UI.popups",
                "gadgetFrame",
                JSON.stringify(data),
                function (response) {
                    var newSize = JSON.parse(response);
                    $("#gadget-frame-page").css({ width: newSize.width - 2, height: newSize.height - 2 });
                    var newHeaderWidth = $('#popupHeader').width();
                    var newDragIconWidth = $('.gadgetDrag').width();
                    var newIconWidth = $('.gadget-frame-icon').width();
                    var newRightSectionWidth = $('.gadget-frame-header-right-section').width();
                    var handlerWidth = newHeaderWidth - newDragIconWidth - newIconWidth - newRightSectionWidth;
                    $('.gadget-frame-text').css({ width: handlerWidth });

                });
        }

        if (window.addEventListener)
            window.addEventListener("resize", resizeHandler, false);
        else
            window.attachEvent("onresize", resizeHandler);
    } //end init()

    /**
    @description queryString function, receive a key and return its value.  (PRIVATE).
    @function
    @property {String} key - The key in the queryString.
    */
    var querySt = function (key) {
        var strQueryString = decodeURI(document.location.href.match(/\?(.*)$/)[1]),
			arrQueryString = strQueryString.split("&"),
			keys = {};

        for (i = 0; i < arrQueryString.length; i++) {
            var arrKeyValue = arrQueryString[i].split("=");
            //alert("val: " + arrKeyValue[1]);
            if (key === arrKeyValue[0])
                return arrKeyValue[1];

            keys[arrKeyValue[0]] = arrKeyValue[1];
        }

        return keys;
    }

    //get translation 
    var data = {
        CTLP_STR_ID_GLOBAL_CLOSE: 'CTLP_STR_ID_GLOBAL_CLOSE',
        CTLP_STR_ID_MINIMIZE: 'CTLP_STR_ID_MINIMIZE'
    };
    conduit.abstractionlayer.commons.messages.sendSysReq("serviceLayer.translation.getTranslation", "gadgetFrame",
		JSON.stringify(data), function (response) {

		    var translation = JSON.parse(response);

		    $('.gadget-frame-close').attr('title', translation.CTLP_STR_ID_GLOBAL_CLOSE);
		    $('.gadget-frame-minimize').attr('title', translation.CTLP_STR_ID_MINIMIZE);
		});


    //Close popup,
    $('.gadget-frame-close').click(function () {
        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "close", appData: appData }), function () { });
    });

    //Minimize popup
    $('.gadget-frame-minimize').click(function () {
        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "toggle", appData: appData }), function () { });
    });
    //drag and drop
    $('.gadget-frame-text, .gadgetDrag').mousedown(function () {

        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "dragStart", appData: appData }), function () { });
    });
    $('.gadget-frame-text, .gadgetDrag').mouseup(function () {
        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "dragStop", appData: appData }), function () { });
    });

    // resize
    $('#resize').mousedown(function () {
        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "resizeStart", appData: appData }), function () { });
    });
    $('#resize').mouseup(function () {
        Messages.sendSysReq('applicationLayer.UI.popups', 'gadgetFrame.view.js', JSON.stringify({ method: "resizeStop", appData: appData }), function () { });
    });

    //check set the align mode before calling the init
    conduit.abstractionlayer.commons.messages.sendSysReq("getToolbarDirection", "gf.view.js", "(@:", function (response) {
        dir = JSON.parse(response).alignMode.toLowerCase();
        if (dir == 'rtl') {
            $('body').addClass('rtl');
        }
        init();
    });
})();
