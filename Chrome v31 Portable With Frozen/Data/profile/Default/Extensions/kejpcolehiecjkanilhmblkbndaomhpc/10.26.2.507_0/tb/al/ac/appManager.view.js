conduit.register("applicationLayer.appCore.views.button", function (data, viewId, appElement) {
    if (!data) return;
    var self = this,
		icon, text, badge, minimizeIcon,
		prepareWith = function (element, name) {
		    return function (callback) {
		        if (element === undefined) {
		            element = $(".appView_" + name, self.$appElement);
		            element = element.length ? element[0] : null;
		        }
		        callback(element);
		    };
		};

    this.appType = "button";
    this.$appElement = appElement ? $(appElement) : $("#webappViewTemplate_" + data.viewType).tmpl(data);
    this.allowScroll = data.allowScroll || true;
    this.isOptionsShown = data.isShow;
    this.isHidden = !data.icon && !data.text && !(this.$appElement.find('img') && this.$appElement.find('img').attr('src')) && !(data.viewType == "menu");
    if (this.isHidden)
        this.$appElement.hide();

    this.isCollapsed = false;
    this.withElement = {
        badge: prepareWith(badge, "badge"),
        icon: prepareWith(icon, "icon"),
        text: prepareWith(text, "text"),
        minimize: prepareWith(minimizeIcon, "minimize")
    };
    if (typeof (data.width) !== 'undefined') {
        this.$appElement.width(data.width).css({overflow:"hidden"});
        if (data.width == 0){
            this.$appElement.css({padding:"0", border:"0"});
        }        
    }
}
);

conduit.applicationLayer.appCore.views.button.prototype = {
    collapse: function (data, callback) {
        var dfd = $.Deferred();
        var self = this;
        if (!this.isCollapsed) {
            this.withElement.text(function (textSpan) {
                $(textSpan).data("width", textSpan.clientWidth).animate({ width: 1 }, "medium", function () { $(textSpan).hide(); dfd.resolve(true); });
                self.isCollapsed = true;
            });
        }
        else
            dfd.resolve(false);

        return dfd.promise();
    },
    expand: function (data, callback) {
        var dfd = $.Deferred();
        var self = this;
        if (this.isCollapsed)
            this.withElement.text(function (textSpan) {
                var $textSpan = $(textSpan);
                $(textSpan).show();
                $textSpan.animate({ width: $textSpan.data("width") }, "medium", function () {
                    textSpan.style.width = null;
                    dfd.resolve(true);
                });
                self.isCollapsed = false;
            });
        else
            dfd.resolve(false);

        return dfd.promise();
    },
    setBadgeBackgroundColor: function (color, callback) {
        var self = this.button || this;
        self.withElement.badge(function (badge) {
            badge.style.backgroundColor = color;
        });
    },
    setBadgeText: function (text, callback) {
        var self = this.button || this;
        self.withElement.badge(function (badge) {
            var maxBadgeLength = 5,
                useTextContent = badge.textContent !== undefined;

            if (text.length > maxBadgeLength)
                text = text.slice(0, maxBadgeLength);

            if (text && self.isOptionsShown) {
                if ((useTextContent && !badge.textContent) || (!useTextContent && !badge.innerHTML))
                    badge.style.display = "block";

                if (useTextContent)
                    badge.textContent = text;
                else
                    badge.innerHTML = text;

                badge.className = "appView_badge appView_badge_" + text.length;
            }
            else {
                badge.style.display = "none";
                if (useTextContent)
                    badge.textContent = "";
                else
                    badge.innerHTML = "";
            }

            if (callback) {
                callback();
            }
        });
    },
    setIcon: function (url, callback) {
        conduit.coreLibs.logger.logDebug('url: ' + url, { className: "appCore.views.button", functionName: "setIcon" });
        var self = this.button || this;

        self.withElement.icon(function (icon) {
            conduit.utils.images.preloadImages(url, function (loadedImages) {

                if (url && self.isOptionsShown) {
                    icon.src = url;
                    icon.style.display = "block";
                    if (!self.$appElement.attr("data-noshow") && (self.isHidden || self.$appElement.css('display') == 'none')) {
                        self.$appElement.show();
                        self.isHidden = false;
                    }
                    if (loadedImages && loadedImages.length > 0) {
                        var height = loadedImages[0].clientHeight || loadedImages[0].height;
                        if (height <= 0 || height >= 28) {
                            height = icon.height;
                        }
                        if (height > 0 && height < 28) {
                            icon.setAttribute("style", "margin-top: " + Math.round((28 - height) * 0.5) + "px"); //ofir
                        }
                    }	                                        
                }
                else {
                    delete icon.src;
                }

                if (callback) {
                    callback();
                }
            }, function () { });
        });

    },
    setText: function (text, callback) {
        var dfd = $.Deferred(),
			self = this.button || this;

        self.withElement.text(function (textSpan) {
            textSpan.innerHTML = text;
            textSpan.style.display = "block";

            if (text && self.isHidden && self.isOptionsShown) {
                self.$appElement.show();
                self.isHidden = false;
            }
            else if (!text && !self.isHidden) {
                self.$appElement.hide();
                self.isHidden = true;
            }

            if (callback) {
                callback();
            }
            dfd.resolve(true);
        });
        return dfd.promise();
    },
    setTooltip: function (text, callback) {
        var self = this.button || this;
        self.$appElement.attr("title", text);
    },
    onMinimizeToggleIcon: function (data, callback) {
        var self = this.button || this;
        
        if ($('html').hasClass('ie8')) {
            ieBgManager.onMinimizeToggleIcon(self.$appElement, data.isMinimized);
        }
        else {
            self.$appElement.toggleClass("appView_button_minimized");
        }

    },
    hideApp: function (data, callback) {
        var self = this.button || this;
        self.$appElement.css('display', 'none');
    },
    showApp: function (data, callback) {
        var self = this.button || this;
        self.$appElement.css('display', 'block');
    }
};

﻿conduit.register("applicationLayer.appCore.views.menu", function (data, viewId, appElement) {
    conduit.applicationLayer.appCore.views.button.apply(this, [data, viewId, appElement]);
    var self = this,
        button;

    this.appType = "menu";
    this.$appElement = appElement ? $(appElement) : $("#webappViewTemplate_" + data.viewType).tmpl(data);
    this.allowScroll = data.allowScroll || true;

    //Manually deleteing any old arrow images from the container and adding a new one
    $arrowContainer = this.$appElement.find('.appView_menu_arrow').empty();
    if ($arrowContainer.size() === 0) {
        $arrowContainer = this.$appElement.find('.appView_menu_arrow_nohover').empty();
    }
    $('<img class="arrow_icon" src="ac/img/menu_arrow.png" alt=""/>').appendTo($arrowContainer);

    this.setLink = function (linkData, callback) {
        var self = this;        
        if (typeof (linkData) === 'string') {
            linkData = JSON.parse(linkData);
        }
        if (linkData.type == 'splitMenu') { // where there is a link and a menu together
            $a = $(".appView_menu_base", self.$appElement);
            $a.addClass('appView_menu_link');
            $a.attr("data-method", 'link');
            $arrow = $(".appView_menu_arrow_nohover", self.$appElement);
            if ($arrow) {
                $arrow.addClass('appView_menu_arrow');
                $arrow.removeClass('appView_menu_arrow_nohover');
            }
        }
        else if (linkData.type == 'link') {
            $(".appView_menu_arrow_nohover", self.$appElement).hide();
            $(".appView_menu_arrow", self.$appElement).hide();
            $a = $(".appView_menu_base", self.$appElement);

            $a.addClass('appView_menu_link');
            $a.attr("data-method", 'link');

            self.$appElement.addClass('appView_button');
            self.$appElement.removeClass('appView_menu');

            self.$appElement.removeAttr('onmouseover');
            self.$appElement.removeAttr('onmouseout');
        }
        else if (linkData.type == 'label') { // label
            $(".appView_menu_arrow_nohover", self.$appElement).hide();
            $(".appView_menu_arrow", self.$appElement).hide();

            self.$appElement.attr("data-type", "label");
            self.$appElement.attr("data-method", "label");

            self.$appElement.addClass('appView_label');
            self.$appElement.removeClass('appView_menu')

            $a = $(".appView_menu_base", self.$appElement);
            $a.attr("data-type", "label");
            $a.attr("data-method", "label");


            self.$appElement.removeAttr('onmouseover');
            self.$appElement.removeAttr('onmouseout');

        }

        //TODO what about the targer NEW,TAB...       
    }

    this.setPopup = function (popupData, callback) {
        $(".appView_menu_arrow_nohover", self.$appElement).hide();
        $(".appView_menu_arrow", self.$appElement).hide();

        self.$appElement.attr("data-type", "button");
        self.$appElement.attr("data-method", "popup");

        self.$appElement.addClass('appView_button');
        self.$appElement.removeClass('appView_menu')

        $a = $(".appView_menu_base", self.$appElement);
        $a.attr("data-type", "button");
        $a.attr("data-method", "popup");


        self.$appElement.removeAttr('onmouseover');
        self.$appElement.removeAttr('onmouseout');
    }

    if (data.action) {
        // support changes that were set in the model. originaly they came from the menu manager.
        // sometimes external components menus become popups or links.
        if (data.action.link && data.action.link.isSet && data.action.link.url) {
            this.setLink(data.action.link);
        }
        else if (data.action.popup && data.action.popup.isSet && data.action.popup.url) {
            this.setPopup(data.action.popup);
        }
    }	
});

conduit.applicationLayer.appCore.views.menu.prototype = new conduit.applicationLayer.appCore.views.button();

﻿(function () {
    function setUrlAppData(url, urlAppData) {
        return url + (url.indexOf("?") > -1 ? "&" : "") + "#appData=" + encodeURIComponent(JSON.stringify(urlAppData)) + "&___requireStorage";
    }

    conduit.register("applicationLayer.appCore.views.embedded", function (data, viewId, appElement) {

        function addTabInfo() {
            var tabData = {}
            if (data.urlAppData.info.apiPermissions) {
                if (conduit.abstractionlayer.frontstage.system.getTabData) {
                    tabInfo = conduit.abstractionlayer.frontstage.system.getTabData().result;
                }

                if (data.urlAppData.info.apiPermissions.getMainFrameUrl) {
                    tabData.url = tabInfo.url
                }
                if (data.urlAppData.info.apiPermissions.getMainFrameTitle) {
                    tabData.title = tabInfo.title
                }
                if (data.urlAppData.info) {
                    data.urlAppData.info.tabInfo = tabData;
                }
            }
        }

        this.allowScroll = data.allowScroll;
        this.buttonText = data.displayText;
        this.buttonIcon = data.displayIcon;
        this.appType = "embedded";
        data.icon = data.icon || false;

        if (data.embedded.size && typeof (data.embedded.size.height !== "undefined") && (26 > data.embedded.size.height)) {/* if smaller then 26 centerize it. Roee Ovadia 09.01.12*/
            data.embedded.size.marginTop = (26 - data.embedded.size.height) / 2;
        }

        this.$appElement = appElement ? $(appElement) : $("#webappViewTemplate_" + data.viewType).tmpl(data);
        this.allowScroll = data.allowScroll;
        this.button = $("a", this.$appElement);
        this.iframe = $("iframe", this.$appElement);
        this.imagePreloaded = !data.icon;
        this.isCollapsed = data.isCollapsed;
        this.src = (data.embedded && data.embedded.url) ? data.embedded.url : null;
        this.previewImageUrl = data.previewImageUrl;
        addTabInfo();
    });



    conduit.applicationLayer.appCore.views.embedded.prototype = (function () {

        function getModifiedSrc(src) {

            var originalSrc = src.match(/([^#]*)/)[1];
            originalSrc = /\?/.test(originalSrc) ? originalSrc + "&t=" + (+new Date()) : originalSrc + "?t=" + (+new Date());
            src = src.replace(/([^#]*)/, originalSrc);
            return src;
        }

        return {
            setEmbedded: function (data, callback) {
                try{
                    if (data.isSearch) {
                        if (data.isSearch && data.width) {
                            conduit.applicationLayer.appManager.splitter.setSearchMinWidth(data.searchMinWidth);
                            if (data.searchMaxWidth < 440) {
                                data.searchMaxWidth = 440;
                            }
                            conduit.applicationLayer.appManager.splitter.setSearchMaxWidth(data.searchMaxWidth);
                        }
                        conduit.coreLibs.logger.logDebug('splitter set Search Min/Max Width: ' + JSON.stringify(data), { className: "applicationLayer.appCore.views.embedded", functionName: "setEmbedded" });
                    }


                    if (data.url) {
                        this.$appElement.children('iframe').attr("src", data.url + "#_self");
                    }
                    if (typeof (data.width) !== 'undefined' || typeof (data.height) !== 'undefined') {
                        if (data.height) {
                            data.height = Math.min(parseInt(data.height), 30);
                        }

                        var dfd = $.Deferred();
                        if (!this.allowScroll)
                            var delta = { width: (data.width || 0) - this.iframe[0].clientWidth, height: (data.height || 0) - this.iframe[0].clientHeight };

                        this.iframe.css({
                            width: data.width,
                            height: data.height
                        });

                        // "Refresh" the css, because sometimes in chrome it doesn't recalculate the width
                        /* this bug fix (36687) causes problems with zoom
                        this.iframe.hide();
                        this.iframe[0].offsetHeight;
                        this.iframe.show();
                        */

                        if (!this.allowScroll) {
                            conduit.triggerEvent("onUpdateNoScrollWidth", delta);
                        }

                        dfd.resolve(true);
                        return dfd.promise();
                    }
                }
                catch (e) {
                    conduit.coreLibs.logger.logError('Failed to set embedded', { className: "view embedded", functionName: "setEmbedded" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
                }
            },
            collapse: function (data, callback) {
                var dfd = $.Deferred();
                if (data.onError) {
                    this.$appElement.attr("auto-expand", "true");
                    this.button.find("img").attr('src', this.previewImageUrl || "");
                    this.button.addClass('appView_label').removeClass('appView_button').attr('data-type', "").attr('data-method', "");
                }

                this.iframe.hide();
                this.button.show();
                dfd.resolve(true);

                this.iframe.attr('src', "");
                if (!this.imagePreloaded)
                    conduit.utils.images.preloadImages($("img", this.button), function () { },
					function () {
					    this.style.marginTop = Math.floor((28 - this.clientHeight) * 0.5) + "px";
					});
                this.isCollapsed = true;
                return dfd.promise();
            },
            expand: function (data, callback) {
                this.isCollapsed = false;
                var dfd = $.Deferred();
                this.iframe.show();
                this.button.hide();
                dfd.resolve(true);
                this.iframe.attr('src', this.src);
                return dfd.promise();
            },

            refreshApp: function () {
                var iframe = this.$appElement.children('iframe');
                var src = iframe.attr("src");
                iframe.attr("src", getModifiedSrc(src) + "#_self");
            },
            hideApp: function (data, callback) {
                this.$appElement.css('display', 'none');
            },
            showApp: function (data, callback) {
                this.$appElement.css('display', 'block');
            }
        };
    })();
})();

﻿conduit.register("applicationLayer.appCore.views.label", function (data, viewId, appElement) {
    var self = this,
			icon, text, 
			prepareWith = function (element, name) {
			    return function (callback) {
			        if (element === undefined) {
			            element = $(".appView_" + name, self.$appElement);
			            element = element.length ? element[0] : null;
			        }
			        callback(element);
			    };
			};
	this.appType = "label";
	this.$appElement = appElement ? $(appElement) : $("#webappViewTemplate_" + data.viewType).tmpl(data);
	this.allowScroll = data.allowScroll || true;
    this.isCollapsed = false;
    this.withElement = {
        icon: prepareWith(icon, "icon"),
        text: prepareWith(text, "text")
    };
}
);

conduit.applicationLayer.appCore.views.label.prototype = {
    collapse: function (data) {
        if (!self.isCollapsed)
            this.withElement.text(function (textSpan) {
                $(textSpan).data("width", textSpan.clientWidth).animate({ width: 0 }, "medium");
                self.isCollapsed = true;
            });
    },
    expand: function (data) {
        if (self.isCollapsed)
            this.withElement.text(function (textSpan) {
                var $textSpan = $(textSpan);
                $textSpan.animate({ width: $textSpan.data("width") }, "medium", function () {
                    textSpan.style.width = null;
                });
                self.isCollapsed = false;
            });
    }
};
﻿conduit.register("applicationLayer.appCore.views.separator", function (data, viewId, appElement) {
    this.$appElement = appElement ? $(appElement) : $("#webappViewTemplate_" + data.viewType).tmpl(data);
    this.appType = "separator";
    this.allowScroll = data.allowScroll || true;
}
);
﻿
/**
* @fileOverview: this template renders a temp place holder div on the toolbar whenever a new
* external webapp is being download. 
* FileName: webapp.js
* FilePath: ..\ApplicationLayer\Dev\src\main\js\appCore\view\js\view_types\webapp.js
* Date: 2/11/2011 
* Copyright: 
*/
conduit.register("applicationLayer.appCore.views.webapp", function (data, viewId, appElement) {
    this.$appElement = $("#webappViewTemplate_" + data.viewType).tmpl(data);
    this.appType = "webapp";
    this.allowScroll = data.allowScroll || true;
});
﻿
var $rcl = $('.rcl'),
$rcr = $('.rcr');

var ieBgManager = {
    resetBackgroundImageCssClasses: function () {
        // reset background-image css classes.
        $rcl.removeClass('rounded_corners_left');
        $rcr.removeClass('rounded_corners_right');
    },
    addBackgroundImage: function (target) {
        var $target;
        if (target.tagName === "A" && /menu/g.test(target.className)) {
            $target = $(target).parent();
        }
        else if (target.tagName === "DIV" || target.tagName === "A") {
            $target = $(target);
        }
        $target.find('.rcl').addClass('rounded_corners_left');
        $target.find('.rcr').addClass('rounded_corners_right');
    },
    removeBackgroundImage: function (target) {
        var $target;
        if (target.nodeName === "A" && /menu/g.test(target.className)) {
            $target = $(target).parent();
        } else {
            $target = $(target);
        }

        if ($target.data('method') && $target.data('is_menu_open') === 'true') {
            return;
        }
        $target.find('.rcl').removeClass('rounded_corners_left');
        $target.find('.rcr').removeClass('rounded_corners_right');
    },
    onMenuOpenAddBackground: function ($target) {
        $target.addClass("menuOpenIE");
        $target.find('.rcl').removeClass('rounded_corners_left').addClass('rounded_corners_left_withbg');
        $target.find('.rcr').removeClass('rounded_corners_right').addClass('rounded_corners_right_withbg');
        $target.data('is_menu_open', 'true');
    },
    onMenuCloseRemoveBackground: function ($target) {
        $target.removeClass("menuOpenIE");
        $target.find('.rcl').removeClass('rounded_corners_left_withbg rounded_corners_left');
        $target.find('.rcr').removeClass('rounded_corners_right_withbg rounded_corners_right');

        // set the data attribute of this app html.
        $target.data('is_menu_open', 'false');
    },
    onMinimizeToggleIcon: function ($target, isDataMinimized) {
        $target.attr('data-isMinimized', isDataMinimized);
        $target.find('.rcl').addClass('rounded_corners_left');
        $target.find('.rcr').addClass('rounded_corners_right');
    },
    setisMinimizedToFalse: function ($target) {
        $target.attr('data-isMinimized', 'false');
    }
}


﻿

/**
* @fileOverview:  [somedescription]
* FileName: button.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\appCore\control\js\controllers_types\button.js
* Date: 25/7/2011 
* Copyright: 
*/


/**
@object: "cb_eventsHandler"
@description: simple object to handle cross browsers events.
when the script loads it checks in what browser it's running in
and expose the relevant methods.
this happens just once.
@runs on init. 
*/
var environment = conduit.abstractionlayer.commons.environment,
	messages = conduit.abstractionlayer.commons.messages;

var cb_eventsHandler = (function (window) {

    //IE
    if (window.attachEvent) {
        return {
            addEventHandler: function (elem, event, handler) {
                elem.attachEvent('on' + event, function () {
                    handler.call(elem);
                });
            },
            getEvent: function (event) {
                return window.event;
            },
            getTarget: function (event) {
                return event.srcElement;
            },
            preventDefault: function (event) {
                event.returnValue = false
            },
            stopPropagation: function (event) {
                event.cancelBubble = true;
            },
            getWindowOffset: function () {
                return window.screenLeft;
            }
        }
    } 
    else {
        return {
            addEventHandler: function (elem, event, handler, capture) {
                elem.addEventListener(event, handler, capture);
            },
            getEvent: function (event) {
                return event;
            },
            getTarget: function (event) {
                return event.target;
            },
            preventDefault: function (event) {
                event.preventDefault();
            },
            stopPropagation: function (event) {
                event.stopPropagation();
            },
            getWindowOffset: function () {
                return window.screenX;
            }
        }
    }
})(this);


/**
@object: "webAppTypes"
@description: this object has properties that represent the webApp types(button, menu...etc)
each type is an object that has properties that represent events for that type.
each event is also an object which holds the functions that shoud run when this event is being fired.
*/
var webAppTypes = {};
webAppTypes.button = (function () {
    function getPosition(target) {

        var compWidth = $(target).outerWidth(true);
        var targetRect = target.getClientRects()[0],

        //get the window's offset with regard to the screen.
			windowOffset = cb_eventsHandler.getWindowOffset(),
            getToolbarPosition = conduit.abstractionlayer.frontstage.environment ? conduit.abstractionlayer.frontstage.environment.getToolbarPosition : conduit.abstractionlayer.commons.environment.getToolbarPosition,
			toolbarPosition = getToolbarPosition().result,

        //get the element's offset with regard to the screen.
			targetOffsetInRelationToScreen = {
			    left: Math.round(targetRect.left + toolbarPosition.left) + 1,
			    top: toolbarPosition.top + ($(target).data("method") === "menu" ? targetRect.bottom - 6 : 34),
			    right: Math.round(targetRect.left + toolbarPosition.left) + compWidth,
			    isAbsolute: true
			};

        return targetOffsetInRelationToScreen;
    }

    var methods = {
        popup: function (target, e) {
            //send all data to UIManager.model.
            return {
                method: "popup",
                position: getPosition(target)
            };
        },
        link: function (target, e) {
            return {
                method: "link",
                url: target.getAttribute('href')
            };
        },
        expand: function (target) {
            target.parentNode.childNodes[1].style.display = "block";
            target.style.display = "none";
            conduit.applicationLayer.appManager.view.update();

            return {
                method: "expand"
            };
        },
        menu: function (target, e) {
            //get the element's offset with regard to the window position.
            //we also check if its menu. if so, we get the parent position. 
            var positionElement = target.nodeName !== "DIV" ? target.parentNode : target;
            var $target = $(positionElement);
            var method = "menu";
            if ($target.hasClass("menuOpen")) {
                method = "closeMenu";
            }

            if ($('html').hasClass('ie8')) {
                ieBgManager.onMenuOpenAddBackground($target);
            } else {
                $target.addClass("menuOpen");
            }

            return {
                method: method,
                position: getPosition(positionElement),
                buttonWidth: positionElement.clientWidth
            };
        }
    };

    var mouseDownClassName = " appView_button_active",
		mouseDownClassNameRegex = new RegExp(mouseDownClassName.replace(" ", "\\s"));

    function removeMouseDown(target) {
        if (mouseDownClassNameRegex && mouseDownClassNameRegex.test(target.className))
            target.className = target.className.replace(mouseDownClassName, "");
    }

    return {
        mouseover: {
            onMouseHover: function (target, e) {
                //ie8 add background-image.
                if ($('html').hasClass('ie8')) {
                    ieBgManager.addBackgroundImage(target);
                }
            }
        },
        mousedown: {
            /**
            @function
            @description: execute when a webApp type button has been clicked.
            @param: {htmlElement} target - the element that was clicked.
            @param: {eventObject} e - the event object.  
            */
            onWebAppClick: function (target, e, bool) {

                if (!bool) {
                    if (mouseDownClassName && !mouseDownClassNameRegex.test(target.className))
                        target.className = target.className + " " + mouseDownClassName;
                }

                //check what method the clicked element has in its data-method attribute. 
                var method = methods[target.getAttribute('data-method')],
			        msgData;
                /*appViewElement = e.currentTarget || (function () {
                var viewElement = e.srcElement;
                while (!viewElement.getAttribute("data-viewId") && (viewElement = viewElement.parentNode));

                return viewElement;
                })();*/

                if (method) {
                    msgData = method(target, e);
                }

                if (msgData) {
                    msgData.appId = target.getAttribute("data-appId");
                    //msgData.viewId = appViewElement.getAttribute("data-viewId");
                    msgData.viewId = window.viewId;

                    var isEmbeddedTrusted = target.getAttribute("data-isEmbeddedTrusted");
                    if (isEmbeddedTrusted) {
                        msgData.isEmbeddedTrusted = true;
                    }

                    //if this is a click simulation that came from the addApp function
                    //after the user has added an app from market place,
                    //we add a flag foe the model.
                    if (bool) {
                        msgData.userAppFirstTime = true;
                    }

                    var loggerData = {
                        from: target.getAttribute('data-method'),
                        action: target.getAttribute('data-method'),
                        startTime: +new Date(),
                        isApi: false,
                        isWithState: true
                    }
                    msgData.loggerData = loggerData;
                    //send message to  UIManager.model.
                    var eventName = "applicationLayer.appManager.controller.clickEvent";
                    messages.sendSysReq(eventName, 'buttoncontroller', JSON.stringify(msgData), function () { });

                    // for ise8.
                    ieBgManager.setisMinimizedToFalse($(target))
                } // TODO: add log

            }
        },
        mouseup: {
            onWebAppClick: removeMouseDown
        },
        mouseout: {
            onWebAppClick: function (target, e) {
                //ie8 remove background-image.
                if ($('html').hasClass('ie8')) {
                    ieBgManager.removeBackgroundImage(target);
                }
                removeMouseDown(target);
            }
        }
    };
})();

﻿

/**
* @fileOverview:  [somedescription]
* FileName: menu.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\appCore\control\js\controllers_types\menu.js
* Date: 25/7/2011 
* Copyright: 
*/
webAppTypes.menu = {};
﻿webAppTypes.contextMenu = {
    mousedown: {
        onWebAppClick: function (target, event) {
            //get the element's offset.
            var getToolbarPosition = conduit.abstractionlayer.frontstage.environment ? conduit.abstractionlayer.frontstage.environment.getToolbarPosition : conduit.abstractionlayer.commons.environment.getToolbarPosition;
            var toolbarPosition = getToolbarPosition().result;

            var position = {
                left: toolbarPosition.left + event.clientX,
                right: toolbarPosition.left + event.clientX, // we use right position as left so that the popup manager can handle it in RTL mode.
                top: toolbarPosition.top + event.clientY,
                bottom: event.screenY,
                isAbsolute: true
            };

            var msgData = { method: "contextMenu", position: position };

            msgData.appId = target.getAttribute("data-appId");
            msgData.viewId = window.viewId;
            //send message to appManager.model.
            var eventName = "applicationLayer.appManager.controller.clickEvent";
            messages.sendSysReq(eventName, 'contextMenuController', JSON.stringify(msgData), function () { });
        }
    }
};
﻿/**
* @fileOverview:  [somedescription]
* FileName: mystuff.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\appCore\control\js\controllers_types\mystuff.js
* Date: 25/7/2011 
* Copyright: 
*/
webAppTypes.mystuff = {
    mousedown: {
        onWebAppClick: function (target, e) {
            conduit.abstractionlayer.commons.messages.sendSysReq(
                "applicationLayer.appManager.controller.clickEvent",
                'applicationLayer.appManager.controller.mystuff',
                JSON.stringify({
                    method: "mystuff",
                    viewId: window.viewId
                }),
                function () { }
            );
        }
    }
};
﻿webAppTypes.user_updates_alert = {
    mousedown: {
        onWebAppClick: function (target, e) {
            conduit.abstractionlayer.commons.messages.sendSysReq(
                "applicationLayer.appManager.controller.clickEvent",
                'applicationLayer.appManager.controller.user_updates_alert',
                JSON.stringify({
                    method: "user_updates_action",
                    viewId: window.viewId
                }),
                function () { }
            );
        }
    }
};

﻿webAppTypes.options = {
    mousedown: {
        onWebAppClick: function (target, e) {
            conduit.abstractionlayer.commons.messages.sendSysReq(
                "applicationLayer.appManager.controller.clickEvent",
                'applicationLayer.appManager.controller.options',
                JSON.stringify({
                    command: "OPTIONS",
                    viewId: window.viewId,
                    isIconClick: true
                }),
                function () { }
            );
        }
    }
};
﻿

/**
* @fileOverview:  [somedescription]
* FileName: design.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\appCore\view\js\design.js
* Date: 25/7/2011 
* Copyright: 
*/


/**
@object: "applicationLayer.appCore.views.design"
@description: this object gets the design object from settings and apply its css properties to the toolbar.
in case some css properties are missing there are some default properties.
*/
conduit.register("applicationLayer.appCore.views.design", (function () {

    //private members
    var $body = $('body'),
        $html = $('html'),
        $toolbar = $("#toolbar");

    var designDefaultSettings = {
        fontColor: '#000',
        fontFamily: 'Tahoma, Arial, Sans-Serif',
        fontSize: '8pt',
        fontStyle: 'normal',
        fontWeight: 'normal',
        textDecoration: 'none'
    }


    function setSkinImageUrl34px(imgUrl) {
        $toolbar.css({
            'background-image': "url(" + imgUrl + ")",
            'background-repeat': 'repeat-x',
            'background-position': 'top right'
        });
        $toolbar.css("background-color", "");
    }

    function setSkinColor(skinColor) {
        $toolbar.css("background-color", skinColor);
        $toolbar.css({
            'background-image': "",
            'background-repeat': ''
        });

        if (skinColor == 'none') {
            $toolbar.css("background-color", "");
        }
    };

    // public API -- constructor
    var Constr = function (data) {

        //adding direction class to the html tag.
        if (data.alignMode) {
            $html.removeClass('rtl'); //first remove the previus class is exist
            $html.addClass(data.alignMode.toLowerCase());

            // if toolbar is rtl, we need to update scroller configuration.
            if (data.alignMode.toLowerCase() === 'rtl') {
                conduit.applicationLayer.appManager.view.updateScrollerDir('right');
            }
        }
        else {
            $html.removeClass('rtl'); //first remove the previus class is exist
            $html.addClass('ltr');
        }



        this.fixItalicText = function () {
            if (this.fontStyle === "italic") {
                $testStyle = $(".appView_text");
                $testStyle.css({ 'padding-right': '2px' });
            }
        }

        this.setDesignData = function (designData) {
            function getPropertyValue(propertyName) {
                var isValid = false,
					value = designData.skin && designData.skin[propertyName] ? designData.skin[propertyName] : designData[propertyName];

                if (value && typeof value == 'string' && value.length) {
                    isValid = true;
                }
                return isValid ? value : designDefaultSettings[propertyName];
            };

            this.alignMode = designData.alignMode;

            var propertiesToCheck = ["fontColor", "fontFamily", "fontSize", "fontStyle", "fontWeight", "textDecoration"];
            for (var i = 0; i < propertiesToCheck.length; i++) {
                var pName = propertiesToCheck[i];
                this[pName] = getPropertyValue(pName);
            }

            if (designData.skin && designData.skin.background) {
                //reset skin
                delete this.skinColor;
                delete this.skinImageUrl34px;
                delete this.skinImageimageBase64;
                if (designData.skin.background.color) {
                    this.skinColor = designData.skin.background.color;
                }
                if (designData.skin.background.imageUrl34px) {
                    this.skinImageUrl34px = designData.skin.background.imageUrl34px;
                }
                if (designData.skin.background.imageBase64) {
                    this.skinImageimageBase64 = designData.skin.background.imageBase64;
                }
            }
        };

        this.setDesignData(data);
        this.applyDesignToToolbar = function () {

            var that = this;

            $body.css({
                'color': this.fontColor,
                'font-family': this.fontFamily,
                'font-size': this.fontSize,
                'font-style': this.fontStyle,
                'font-weight': this.fontWeight
            });
            if (window.safari) { //override safari default body a style
                var temp = document.createElement("style");
                temp.type = "text/css";
                temp.innerHTML = "body a { color : " + this.fontColor + ";}";
                document.body.appendChild(temp);
            }

            (function applySkin() {
                //check if we have image url skin

                if (/^http:\/\//.test(that.skinImageUrl34px)) {
                    setSkinImageUrl34px(that.skinImageUrl34px);
                }
                else if (that.skinColor && typeof that.skinColor == 'string' && that.skinColor.length) {
                    setSkinColor(that.skinColor);
                }
                else if (that.skinImageimageBase64) {
                    setSkinImageUrl34px(that.skinImageimageBase64);
                }
                else {
                    $toolbar.css({ 'background-image': "", 'background-repeat': "", 'background-color': "" });
                }
            } ());
        }
    };

    // return the constructor
    return Constr;

})());

﻿conduit.register("applicationLayer.appManager.view", (function (id) {
    try {
        var toolbarHeight = 28, // Get this from window.height when in toolbar!
		views = {},
        viewId = window.viewId,
        viewTypes = conduit.applicationLayer.appCore.views,
        absRepository = conduit.abstractionlayer.commons.repository,
		$toolbarPanel = $("#toolbar"),
		$noScrollPanel = $("#noScrollPanel"),
        $noScrollPanelWrapper = $("#noScrollPanelWrapper"),
		$scrollPanel = $("#scrollPanel"),
		$scrollPanelWrapper = $("#scrollPanelWrapper"),
		scrollPanelWrapperWidth,
		scrollPanelWidth,
		$scrollButtonsPanel = $("#scrollButtonsPanel"),
	    scrollButtonsPanelIsVisible = false,
        scrollerAtLimit = true,
        activeScrollBtnClassName = "activeScrollBtn",
		lastClickedScrollBtn,
		scrollBtnClickTimeoutId,
		scrollBtnMouseUp,
		$scrollLeftBtn = $("#scrollLeftBtn"),
		$scrollRightBtn = $("#scrollRightBtn"),
		$scrollButtons = $().add($scrollLeftBtn).add($scrollRightBtn),
		$window = $(window),
        rightPanelWidth = $("#rightMenuPanel").width(),
        messages = conduit.abstractionlayer.commons.messages,
		scroller,
        isInit = false,
        design,
		resizeTimeoutId,
		updateScrollerSize,
        isState = /state[^\.]*\.html/.test(document.location.href),
        preloadMsgQueue = [], // Catch messages in state mode, since embedded apps can be loaded before the backstage exists.
        $body = $('body'),
        $html = $('html'),
        windowLoaded = false,
        $search,
		isDragable = false,
		lastPosition,
		val,
		floatDir,
		appendAppToToolbar,
        stateTimeoutId,
        isFirefox = /firefox/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type),
        isIE = /IE/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type),
        isChrome = /Chrome/i.test(conduit.abstractionlayer.commons.environment.getBrowserInfo().result.type),
        isRendered,
        appChangeQueue = [], // queue for messages to apps, to be used if messages are sent before the apps are rendered on the toolbar.		
        extId = (window.chrome) ? "___" + chrome.i18n.getMessage("@@extension_id") : "",
        viewReadyQueue = new conduit.coreLibs.CallMethodQueue("viewReadyQueue"),
        ctid = conduit.abstractionlayer.commons.context.getCTID().result,
        toolbarVersion = conduit.abstractionlayer.commons.environment.getEngineVersion().result,
		toolbarName = conduit.abstractionlayer.commons.context.getToolbarName().result,
        isActivateDialog = false,
        viewInitialized = false;


        function getFloatDir() {
            floatDir = /(^|\s)rtl($|\s)/.test(document.documentElement.getAttribute("class")) ? "right" : undefined;
            return floatDir;
        }

        // Gets a function to call on scroll buttons mousedown:
        function prepareScroll(direction) {
            return function (e) {

                //right click, do nothing.
                if (e.button === 2) {
                    return;
                }
                lastClickedScrollBtn = direction;
                e.preventDefault();
                $(e.currentTarget).addClass(activeScrollBtnClassName);
                if (scrollerAtLimit) {
                    $scrollButtons.removeClass("scrollLeftBtnDisabled").removeClass("scrollRightBtnDisabled");
                    scrollerAtLimit = false;
                }

                if (!$(this).data("disabled"))
                    scrollBtnClickTimeoutId = setTimeout(function () {
                        scrollBtnClickTimeoutId = undefined;
                        scroller.scroll[direction]();
                    }, 120)
            };
        }

        function initScroller() {
            try {
                if (!scroller) {

                    scrollBtnMouseUp = function (e) {
                        if (scrollBtnClickTimeoutId) {
                            scroller.step[lastClickedScrollBtn]();
                            clearTimeout(scrollBtnClickTimeoutId);
                            scrollBtnClickTimeoutId = undefined;
                        }

                        e.preventDefault();
                        $(e.currentTarget).removeClass(activeScrollBtnClassName);
                        scroller.stop();
                    };
                    $scrollLeftBtn.mousedown(prepareScroll("left")).mouseup(scrollBtnMouseUp);
                    $scrollRightBtn.mousedown(prepareScroll("right")).mouseup(scrollBtnMouseUp);

                    function updateScrollButtons(e) {

                        $scrollButtons.each(function () { $(this).data("disabled", false); });
                        $scrollLeftBtn.removeClass("scrollLeftBtnDisabled");
                        $scrollRightBtn.removeClass("scrollRightBtnDisabled");

                        if (e.isLeftLimit) {

                            if (getFloatDir() === "right") {
                                $scrollLeftBtn.addClass("scrollLeftBtnDisabled");
                            } else {

                                $scrollRightBtn.addClass("scrollRightBtnDisabled");
                            }
                            scrollerAtLimit = true;
                        }
                        else if (e.isRightLimit) {

                            if (getFloatDir() === "right") {
                                $scrollRightBtn.addClass("scrollRightBtnDisabled");
                            } else {
                                $scrollLeftBtn.addClass("scrollLeftBtnDisabled");
                            }
                            scrollerAtLimit = true;
                        }

                    }

                    // !!getFloatDir() at this point of time is invalid function. works only with state!!.
                    scroller = new YoxScroll($scrollPanelWrapper[0], $scrollPanel[0], {
                        direction: { horizontal: getFloatDir() || "left" },
                        orientation: "horizontal",
                        velocity: 7,
                        stepDistance: 24,
                        eventHandlers: {
                            onStop: updateScrollButtons,
                            onUpdate: updateScrollButtons, // this event is disabled in the yoxscroll.
                            onScrollStart: function () {
                                $scrollButtons.each(function () { $(this).data("disabled", true); });
                            }
                        }
                    }, getFloatDir());

                }
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to init scroller', { className: "appManager.view", functionName: "initScroller" }, { error: e });
            }
        }
        initScroller();

        $(document).bind("ready", (function () {
            windowLoaded = true;
            getFloatDir(); //TODO is the early enough?
            $window.resize(function () {
                setScrollerWrapperWidth();
                saveState(true);
            });
        }));

        function setNoScrollPanelWidth(delta) {
            var newWidth = 0;
            $noScrollPanel.children().each(function (i, e) { newWidth += $(e).outerWidth(true) });
            //We add 10px to avoid sreach disapperance. this is not visible to user
            $noScrollPanel.css({ width: newWidth + 10 });
            $noScrollPanelWrapper.css({ width: newWidth });
            conduit.coreLibs.logger.logDebug("noScrollPanel width: " + $noScrollPanel.width() + " $noScrollPanelWrapper: " + $noScrollPanelWrapper.width(), { className: "appManager.view", functionName: "setNoScrollPanelWidth" })
        }

        conduit.subscribe("onUpdateNoScrollWidth", setNoScrollPanelWidth);

        // when toolbar is rtl, we need to update the scroller direction property.
        function updateScrollerDir(dir) {
            scroller.updateDirection(dir);
        }

        // browser detect, if its IE8/IE9 we add additional class to the html tag
        // for later reference.

        if (/*$.browser.msie && parseInt($.browser.version, 10) === 8*/false) {
            if (!$html.hasClass('ie8')) {
                $html.addClass('ie8')
            }
            // reset background-image css classes.
            ieBgManager.resetBackgroundImageCssClasses();

        }
        else if ($.browser.msie && parseInt($.browser.version, 10) === 9) {
            if (!$html.hasClass('ie9')) {
                $html.addClass('ie9')
            }
        }

        conduit.register("utils.images.preloadImages", function (imagesList, onDone, onLoadCallback) {
            function log(text) {
                //conduit.coreLibs.logger.logDebug(text, { className: "utils.images.preloadImages", functionName: "body" });
            }
            log('');

            var isJquery = imagesList instanceof jQuery;

            if (!imagesList) {
                log('no image list call to onDone callback');
                onDone && onDone();
                return;
            }
            if (typeof (imagesList) === "string") {
                log('turn string to list');
                imagesList = [imagesList];
            }
            else if (typeof (imagesList) !== "object") {
                log('image list is an object throw exception');
                throw "Invalid value for imageUrls.";
            }

            var count = imagesList.length;

            if (count === 0) {
                log('no images in list');
                onDone && onDone();
                return;
            }

            var loadedImages = [],
                onLoadDone = function (e) {
                    log('onLoadDone: image loaded for src=' + (e && e.currentTarget && e.currentTarget.src));

                    loadedImages.push(e.currentTarget);

                    e.currentTarget && onLoadCallback && onLoadCallback.call(e.currentTarget, e.currentTarget);
                    if (!onDone) {
                        log('onLoadDone: it no callback');
                    }
                    if (loadedImages.length >= count) {
                        log('onLoadDone: call to callback');
                        onDone && onDone(loadedImages);
                        return true;
                    }
                    log('onLoadDone: do not call to onDone loadedImages.length=' + loadedImages.length + ' count=' + count);
                    return false;
                },
                onLoadError = function (e, imgObj, src) {
                    log('onLoadError.');
                    conduit.coreLibs.logger.logError('Failed to load image: ' + src, { className: "appManager.view", functionName: "preloadImages.onErrorImage" });
                    try {
                        conduit.coreLibs.logger.logError('error data: ' + JSON.stringify(e), { className: "appManager.view", functionName: "preloadImages.onErrorImage" });
                    } catch (ex) { }

                    if (failureAttempts[src] === undefined) {
                        log('onLoadError: first attempt fail');
                        failureAttempts[src] = 1;
                    } else {
                        log('onLoadError: second attempt fail');
                        failureAttempts[src] += 1;
                    }

                    if (failureAttempts[src] < 3) {
                        log('onLoadError: reschedule attempt');
                        setTimeout(function () { imgObj.attr("src", src); }, 2000);
                    }
                    else {
                        log('onLoadError: call to onLoadDone');
                        onLoadDone({ currentTarget: src });
                    }
                },

                failureAttempts = {};
            function buildOnLoadErrorScope(imgObj, src) {
                return function (e) {
                    onLoadError(e, imgObj, src);
                }
            }

            for (var i = 0; i < count; i++) {
                var src = isJquery ? imagesList[i].src : imagesList[i];
                if (typeof (src) != 'string' || !src) {// in case image without url was sent keep array length updated
                    log('no image @src');
                    var is_done = onLoadDone({ currentTarget: null });
                    if (is_done) {
                        return;
                    }
                    continue;
                }
                if (src.match(/^file:/) && isChrome) {// Avoid local errors in Chrome
                    log('no file://* schema suported at chrome');
                    onLoadDone({ currentTarget: src });
                    conduit.coreLibs.logger.logError('Tried to load image in Chrome that starts with file: . currentImageUrl: ' + src, { className: "appManager.view", functionName: "preloadImages" });
                    continue;
                }

                if (imagesList[i].complete) {
                    log('image already has complete state');
                    onLoadDone({ currentTarget: imagesList[i] });
                    continue;
                }

                log('preload image.src=' + src);
                var imgObj = null;
                if (isJquery) {
                    log('pick from image list');
                    imgObj = imagesList.eq(i);
                } else {
                    log('create new');
                    imgObj = $("<img />");
                }
                //imgObj=$("<img />");
                imgObj.load(onLoadDone).error(buildOnLoadErrorScope(imgObj, src)).attr("src", src).each(function () {
                    //Cache fix for browsers that don't trigger .load()
                    if (this.complete) $(this).trigger('load');
                });
            }
        });

        var preloadImages = conduit.utils.images.preloadImages;

        function getDataFromModel() {
            messages.sendSysReq(
        "applicationLayer.appManager.model.getViewData",
        "applicationLayer.appManager.view." + id,
        "",
        init);
        }


        // The state is saved in the backstage:
        function saveState(saveNow, deleteState) {
            if (deleteState) {
                messages.sendSysReq("appManager.model.saveState", "appManager.view_" + viewId, JSON.stringify({ state: "deleteState", saveNow: true }), function (response) { });
                return;
            }
            if (viewInitialized && !conduit.abstractionlayer.frontstage.browser.isHidden().result) {
                if (stateTimeoutId) {
                    clearTimeout(stateTimeoutId);
                    stateTimeoutId = undefined;
                }

                // Save state after a grace time:
                stateTimeoutId = setTimeout(function () {
                    var htmlClass = document.documentElement.className,
				state = "<!doctype html><html" + (htmlClass ? " class=\"" + htmlClass + "\"" : "") + ">" + document.documentElement.innerHTML + "</html>";
                    messages.sendSysReq("appManager.model.saveState", "appManager.view_" + viewId, JSON.stringify({ state: state, saveNow: saveNow }), function (response) { });
                }, saveNow ? 300 : 5000);
            }
        }

        function handleRightPanelVisibility(id, show) {
            var selectorName = "#" + id;
            var display = $(selectorName).css('display');

            if (show) {
                if (display == 'none') {// add space
                    rightPanelWidth += 25;
                }
                $(selectorName).show();
            }
            else {
                if (display != 'none') { // remove space
                    rightPanelWidth -= 25;
                }
                $(selectorName).hide();
            }
            $("#rightMenuPanel").width(rightPanelWidth);
        }

        var viewTopicMethods = {
            options: function (apps) {
                var personalAppsData;

                try {
                    for (var appId in apps) {
                        var view = views[appId],
						appOptions = apps[appId],
						isShow = !appOptions || (appOptions && appOptions.disabled !== true);

                        if (view) {
                            if (view.appType == "embedded" && view.src) {
                                // set about:blank to iframe src for hidden embedded apps so it will stop working.
                                var iframeSrc = isShow ? view.src : "about:blank";
                                view.$appElement.children('iframe').attr("src", iframeSrc);
                            }
                            view.$appElement[isShow ? "show" : "hide"]();
                            if (view.appType == "button") {
                                view.isOptionsShown = isShow;
                            }
                            if (isShow) {
                                view.$appElement.show().removeAttr("data-noshow");
                                var $images = $("img", view.$appElement);
                                preloadImages($images, function () { updateScrollerSize(); saveState(true); }, centerImageVertically);
                                // send message to the loader to init the bgpage of the app.
                                messages.sendSysReq("applicationLayer.appManager.view.onAddApp", "applicationLayer.appManager.view." + id,
								JSON.stringify({ appId: appId }), function () { });
                            }
                            else {
                                isToRemove = apps[appId].isToRemove;
                                if (isToRemove) {
                                    view.$appElement.remove();
                                }
                                else {
                                    view.$appElement.hide().attr("data-noshow", "1");
                                }

                                updateScrollerSize();
                                saveState(true);
                            }
                        }
                    }

                }
                catch (e) {
                    conduit.coreLibs.logger.logError('Failed to set options to view. view: ' + JSON.stringify(view), { className: "appManager.view", functionName: "viewTopicMethods.options" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
                }
            },
            setSkin: function (skinObj) {
                if (skinObj.skin) {
                    setDesign(skinObj);
                    design.applyDesignToToolbar();
                    saveState(true);
                }
            },
            removeApp: function (appData) {
                //this function is being called when the model ignores an app for its invalid version.
                //we dont have a view instance for this app, we just want to make sure that the state hasn't stored it
                //from prev session.
                var view = views[appData.appId];
                if (view) {
                    $("#" + view.$appElement.attr("id")).remove();
                    updateScrollerSize();
                    saveState(true);
                }
            },
            removePlaceHolder: function (appData) {
                var view = views[appData.appId];
                if (view && /place_holder/.test(view.$appElement.attr("id"))) {
                    viewTopicMethods.removeApp(appData);
                }
            },
            setMyStuffVisibility: function (show) {
                handleRightPanelVisibility("myStuffBtn", show);
            },
            setToolbarOptionsVisibility: function (show) {
                handleRightPanelVisibility("optionsBtn", show);
            },
            userUpdatesAlert: (function () {
                var $systemPanel = $('#rightMenuPanel');
                var $alert = $('#uiUserUpdates');
                var show = function (data) {
                    hide = hideAction;
                    if (!($alert.is(':visible'))) {
                        rightPanelWidth += 25;
                    }
                    $alert.removeClass('plain active').addClass(data.status == 'active' ? 'active' : 'plain');
                    $alert.attr('title', data.tooltip || 'Policy changed');
                    $alert.show();
                };

                var hideActionStub = function () { };

                var hideAction = function () {
                    hide = hideActionStub;
                    if ($alert.is(':visible')) {
                        rightPanelWidth -= 25;
                    }
                    $alert.hide();
                };

                var act = function (data) {
                    if (!data || typeof data != 'object' || !data.enabled) {
                        return function () { return hide() };
                    }
                    return function () { return show(data) };
                };

                var use = function (data) {
                    act(data)();
                    $systemPanel.width(rightPanelWidth);
                    updateScrollAndState();
                };

                var hide = ($alert.is(':visible')) ? hideAction : hideActionStub;

                return {
                    data: function (data) {
                        use(data);
                    }
                };
            })()

        };

        function onViewTopic(topicData) {
            var dataObj = JSON.parse(topicData);
            if (dataObj.method) {
                var method = viewTopicMethods[dataObj.method];
                if (method)
                    method(dataObj.data);
            }
        }

        function doSetScrollerWrapperWidth() {
            var isRtl = (floatDir === "right");
            var rightMenuPanel = $('#rightMenuPanel');
            var splitter = $('#splitter');

            scrollPanelWrapperWidth = $window.width() - $noScrollPanelWrapper.outerWidth(true) - 16 - rightMenuPanel.outerWidth(true);
            if (floatDir === "right")
                scrollPanelWrapperWidth += 10;

            if (scrollPanelWidth > scrollPanelWrapperWidth) {
                scrollPanelWrapperWidth -= $scrollButtonsPanel.outerWidth(true);
                if (!scrollButtonsPanelIsVisible) {
                    $scrollButtonsPanel.show();
                    scrollButtonsPanelIsVisible = true;
                }

                $scrollPanelWrapper.removeClass("scrollPanelWrapperWithNoScroll");
            } else {
                $scrollButtonsPanel.hide();
                scrollButtonsPanelIsVisible = false;
                if (scroller) {
                    scroller.reset();
                }
                $scrollPanelWrapper.addClass("scrollPanelWrapperWithNoScroll");
            }
            $scrollPanelWrapper.width(scrollPanelWrapperWidth);

            //Fallback - START, if the scrollButtonsPanel is somehow shown on top of the rightPanel.
            try {
                if ($scrollButtonsPanel.is(':visible')) {
                    var scrollButtonsPosition = $scrollButtonsPanel.position();
                    var rightMenuPanelPosition = rightMenuPanel.position();

                    scrollButtonsPosition = (isRtl ? scrollButtonsPosition.left : (scrollButtonsPosition.left + $scrollButtonsPanel.outerWidth(true)));
                    rightMenuPanelPosition = (isRtl ? (rightMenuPanelPosition.left + rightMenuPanel.outerWidth(true)) : rightMenuPanelPosition.left);

                    var isPositionNotValid = isRtl ? (scrollButtonsPosition < rightMenuPanelPosition) : (scrollButtonsPosition > rightMenuPanelPosition);

                    if (isPositionNotValid) {
                        var elementsGap = scrollButtonsPosition - rightMenuPanelPosition;
                        var width = 0;

                        width = (elementsGap >= 0 ? elementsGap : (elementsGap + rightMenuPanelPosition));
                        if (isRtl) {
                            $scrollPanelWrapper.width(($scrollPanelWrapper.width() - Math.abs(elementsGap)));
                        } else {
                            $scrollPanelWrapper.width(($scrollPanelWrapper.width() - width));
                        }
                    }
                }
            } catch (e) {
                //conduit.coreLibs.logger.logError("Fallback executed and failed, JQuery's bug ($(<element>).position()) on IE8!", { className: "appManager.view", functionName: "doSetScrollerWrapperWidth" }, { error: e });
            }
            //Fallback - END, if the scrollButtonsPanel somehow shown on top of the rightPanel.

            //width without scrollpanelWrapper width
            var toolbarElementsWidth = ($noScrollPanelWrapper.outerWidth(true) + splitter.outerWidth(true) + rightMenuPanel.outerWidth(true) + (isRtl ? -5 : 6)); //6 is the rightPanel style offset

            if ($scrollButtonsPanel.is(':visible')) {
                toolbarElementsWidth += $scrollButtonsPanel.outerWidth(true);
            }
            if ($window.width() < toolbarElementsWidth) {
                rightMenuPanel.hide();
            } else {
                rightMenuPanel.show();
            }

            //Fallback - START, if the scrollPanelWrapper is somehow not shown.
            if ($toolbarPanel.width() < (toolbarElementsWidth + $scrollPanelWrapper.outerWidth(true))) {
                $scrollPanelWrapper.width($toolbarPanel.width() - toolbarElementsWidth);
            }
            //Fallback - END, if the scrollPanelWrapper is somehow not shown.

            if (scroller)
                scroller.update();
        }

        // Sets the width of the scroll panel's wrapper.
        // Shows or hides the scroll buttons' panel, if required.
        function setScrollerWrapperWidth() {
            doSetScrollerWrapperWidth();
            setScrollerButtonsUI();
            $window.load(doSetScrollerWrapperWidth);
        }

        /*
        this function updates the chevron icons state.
        */
        function setScrollerButtonsUI() {

            // get the chevron wrapper current left position.
            var $scrollPWPosLeft = parseInt($scrollPanelWrapper.offset().left),

            // get the chevron wrapper current right position.
                $scrollPWPosRight = $scrollPWPosLeft + $scrollPanelWrapper.outerWidth(),

            // get the chevron current left position.   
                $sPPosLeft = parseInt($scrollPanel.offset().left),

            // get the chevron current right position.     
                $sPPosRight = $sPPosLeft + $scrollPanel.outerWidth();

            // compare positions and update button state.
            if ($sPPosLeft < ($scrollPWPosLeft - 2)) {
                $scrollLeftBtn.removeClass("scrollLeftBtnDisabled");
            } else {
                $scrollLeftBtn.addClass("scrollLeftBtnDisabled");
            }

            if ($sPPosRight > ($scrollPWPosRight + 2)) {
                $scrollRightBtn.removeClass("scrollRightBtnDisabled");
            } else {
                $scrollRightBtn.addClass("scrollRightBtnDisabled");
            }
            saveState(true);
        }

        // Calculates the exact width of the scroll panel's contents:
        function setScrollPanelWidth() {
            var extremelyLongSize = 99999;

            $scrollPanel.width(extremelyLongSize);
            var $lastApp = $("<span style='float:" + (floatDir || "left") + "'>&nbsp;</span>").appendTo($scrollPanel);

            scrollPanelWidth = Math.ceil($lastApp.position().left + 1);
            if (floatDir === "right") {
                scrollPanelWidth = extremelyLongSize - scrollPanelWidth + 11;
            }

            $scrollPanel.width(scrollPanelWidth);
            $lastApp.remove();
        }

        updateScrollerSize = function () {
            setScrollPanelWidth();
            setScrollerWrapperWidth();
        }

        function centerImageVertically() {
            if (this.style && this.clientHeight > 0)
                this.style.marginTop = Math.floor((toolbarHeight - this.clientHeight) * 0.5) + "px";
        }

        function setDesign(designObj) {
            if (!design)
                design = new conduit.applicationLayer.appCore.views.design(designObj);
            else
                design.setDesignData(designObj);
        }

        // Draw the apps:
        var initDoneOnce;
        function init(data) {
            //TODO check if this happens twice for any FF view refresh
            if (!data || (initDoneOnce && !data.isRefresh)) { return; }

            conduit.coreLibs.logger.logDebug('appManager.view.init', { className: "appManager.view", functionName: "init" });
            conduit.coreLibs.logger.performanceLog({ from: "App Manager View", action: "start init: ", time: +new Date(), isWithState: "" });

            data = (typeof (data) == "string") ? JSON.parse(data) : data;
            var needRender = (!isState || data.isRefresh);
            if (data.status) {
                conduit.coreLibs.logger.logError('Failed to init view. Received data object : ' + JSON.stringify(data), { className: "appManager.view", functionName: "init" });
                return;
            }
            initDoneOnce = true;

            /* user update alert */
            viewTopicMethods.userUpdatesAlert.data(data.design && data.design.user_updates, 'settings');
            /* user update alert */
            var isToolbarOptionsVisible = (data.config && data.config.toolbarOptionsEnabled == false) ? false : true;
            viewTopicMethods.setToolbarOptionsVisibility(isToolbarOptionsVisible);

            if (data.design) {
                if (!data.design.textDecoration) {
                    data.design.textDecoration = 'none';
                }
                setDesign(data.design)
                getFloatDir();
            }   
            if (needRender) {
                document.body.setAttribute("dataforautomation", "{ctid:" + ctid + ",version:" + toolbarVersion + ",name:" + toolbarName + "}");
                messages.sendSysReq("onViewRequest", "applicationLayer.appManager.view." + id, JSON.stringify({ method: "isMyStuffEnabled" }), function (response) {
                    var responseObj = JSON.parse(response)
                    viewTopicMethods.setMyStuffVisibility(responseObj.result);
                });

                //instantiating the design class
                if (data.design) {
                    design.applyDesignToToolbar();
                }           
            }

            if (!data.isRefresh) {
                if ($toolbarPanel.attr("data-viewId") !== String(viewId)) {
                    $toolbarPanel.attr("data-viewId", viewId);
                }
                if (isInit)
                    return false;

                isInit = true;
            }
            else {
                conduit.coreLibs.logger.logDebug('needRender is false', { className: "appManager.view", functionName: "init" });
                absRepository.removeKey(ctid + ".embeddedsData");
                try {

                    if (isFirefox) {
                        // Due to a bug in FF abstraction layer, which results in the abstraction layer API not being written in new iframes (except on initial load),
                        // we are forced to reload the whole browser container which contains the toolbar, to avoid the bug.
                        // Because of this, we delete the state file before, so it's not loaded next time with the old settings.
                        // This bug in FF abstraction needs to be fixed in any case, because it means that there are also problems with add stuff and any other
                        // dynamically added iframe.
                        absRepository.deleteStateFile();
                        conduit.abstractionlayer.commons.browserContainer.refresh();
                        return; // Becuase after a browserContainer refresh, nothing else matters.
                    }
                    else if (isIE) {
                        var applicationDirName = conduit.coreLibs.config.getApplicationDirName();
                        //conduit.coreLibs.logger.logDebug('calling deleteStateFile', { className: "appManager.view", functionName: "init" });
                        //absRepository.deleteStateFile();
                        saveState(false, true); // backstage will delete the sate 
                        conduit.coreLibs.logger.logDebug('calling navigate', { className: "appManager.view", functionName: "init" });
                        conduit.abstractionlayer.commons.browserContainer.navigateAsync(conduit.abstractionlayer.commons.environment.getApplicationPath().result + applicationDirName + '\\al\\al.view.html');
                        return;
                    }

                } catch (e) { }
                // Refresh only, remove existing views:
                $(".appView").remove();
                $(".appView_embedded").remove(); // we also have to remove embeddeds
                views = {};
            }

            if (needRender) {
                var frags = {
                    noScroll: document.createDocumentFragment(),
                    scroll: document.createDocumentFragment()
                };

            }

            var managedApps = [];
            var isToolbarShrinked = conduit.coreLibs.repository.getLocalKey('isToolbarShrinked');
            var isToolbarHidden = conduit.abstractionlayer.frontstage.browser.isHidden().result;
            var embeddedWorkWhenHiddenVal = absRepository.getKey(ctid + ".embeddedWorkWhenHidden");
            var embeddedWorkKeyIsTrue = !embeddedWorkWhenHiddenVal.status && String(embeddedWorkWhenHiddenVal.result).toLowerCase() === "true";
            for (var i = 0, count = data.apps.length; i < count; i++) {
                try { // we do try catch to avoid blank strip
                    var appData = data.apps[i],
                        viewTypeClass = viewTypes[appData.viewType],
					    view;

                    appData.design = data.design;

                    if (viewTypeClass) {
                        view = new viewTypeClass(appData, viewId, isState && !data.isRefresh ? document.getElementById(appData.appId) : undefined);
                        var isHiddenApp = false; 
                        if (appData.isShow === false || isToolbarHidden) {


                            // if the app's enabledInHidden property is true or the embeddedWorkWhenHidden key is true, we will not set it to about:blank
                            if (appData.viewType == 'embedded' && (appData.isShow === false || !(appData.enabledInHidden || embeddedWorkKeyIsTrue))) {
                                // set about:blank to iframe src for hidden embedded apps so it will stop working.
                                view.$appElement.children('iframe').attr("src", "about:blank");
                            }
                            view.$appElement.hide();
                            isHiddenApp = true;
                        }

                        // if this is not the first view - second window/tab.
                        // we need to check if we have popups with minimized state.
                        // the UI is not stored on the state file, so we need to check if
                        // we set the property for the viewData in the model.
                        if (appData.isMinimized) {
                            view.$appElement.addClass('appView_button_minimized');
                        }

                        // shrink/unshrink toolbar
                        if (view.appType != "embedded") {
                            if (isToolbarShrinked && isToolbarShrinked.data == 'true' && view.collapse) {
                                view.collapse();
                            }
                            else if (view.expand) {
                                view.expand();
                            }
                        }
                        //Auto expand collpased embedded
                        var element = $('#' + appData.appId);
                        if (element.attr("auto-expand") == "true") {
                            view.expand({ autoExpand: true });
                            element.attr("auto-expand", "");
                        }


                        var missingApp = ($('#' + appData.appId).length == 0 && $('#place_holder_' + appData.appId).length == 0) ? true : false;
                        // check if we have a missing app on the view, if so, add it. 

                        if (!isHiddenApp && (appData.viewType === 'button' || appData.viewType === 'menu')) {
                            if (view.$appElement.css('display') === 'none') {
                                handleMissingButtons(view, appData, false);
                            }
                            else {
                                handleMissingButtons(view, appData, true);
                            }
                        }

                        if (needRender || missingApp) {

                            if (appData.viewType == 'embedded') {
                                var embeddedAppContext = JSON.stringify($.extend(appData.urlAppData, { viewId: viewId, context: "embedded" }, { name: appData.appId + extId }));
                                var frame = view.$appElement.find('iframe')[0];
                                var inExtDomain = false;
                                if (frame.src.indexOf(extId) != -1) {
                                    inExtDomain = true;
                                }
                                frame.setAttribute('name', isChrome && !inExtDomain ? embeddedAppContext : appData.appId + extId);
                                conduit.abstractionlayer.commons.appMethods.setContext(appData.appId + extId, embeddedAppContext);
                            }

                            //managedWebApp will be added at the end of the function when all other apps already exist
                            if (appData.managed && appData.managed.managerId) {
                                managedApps.push({ 'app': appData, 'view': view });
                                continue; //continue to the next app
                            }

                            if (needRender) {
                                frags[appData.allowScroll === false ? "noScroll" : "scroll"].appendChild(view.$appElement[0]);
                            }
                            else { // missing app and this init is from state
                                // this is a recovery code in case the state html does not contain all apps
                                if (appData.allowScroll === false) {
                                    $noScrollPanel[0].appendChild(view.$appElement[0]);
                                }
                                else {
                                    $scrollPanel[0].appendChild(view.$appElement[0]);
                                }
                            }
                        }


                        views[appData.appId] = view;
                    }
                }
                catch (e) {
                    conduit.coreLibs.logger.logError('Failed to init appManager view', { className: "appManager.view", functionName: "init" }, { error: e });
                }
            }

            if (needRender) {
                $noScrollPanel[0].appendChild(frags.noScroll);
                $scrollPanel[0].appendChild(frags.scroll);
                if (design) {
                    design.fixItalicText();
                }
            }

            for (var j = 0, count = managedApps.length; j < count; j++) {
                var appData = managedApps[j].app;
                var objView = managedApps[j].view;
                // managed webapp
                addManagedWebApp(appData, objView);
            }

            isRendered = true;
            if (appChangeQueue.length) {
                for (var i = 0; i < appChangeQueue.length; i++) {
                    onAppChange(appChangeQueue[i]);
                }
                appChangeQueue = [];
            }

            conduit.coreLibs.logger.logDebug('Sending message - onViewReady', { className: "appManager.view", functionName: "init" });
            conduit.coreLibs.logger.performanceLog({ from: "App Manager View", action: "send sys view ready: ", time: +new Date(), isWithState: "" });
            // The toolbar is rendered (without scroller) and background:
            messages.sendSysReq("applicationLayer.appManager.model.onViewReady", "applicationLayer.appManager.view." + id, JSON.stringify(needRender) || "", function () { });
            //performance measure:conduit.abstractionlayer.commons.storage.setPref("Perform_ViewReady",String(+new Date()));

            disableWindowEvents();

            showFirstTimeDialog();

            function onLoadedImages() {
                // When images finished loading we know the final width of the toolbar and can decide whether to show the scroller.
                updateScrollerSize();
                setNoScrollPanelWidth();
                setScrollerButtonsUI();
                saveState();
            }

            // Fix sizes and place scroller according to image sizes:
            var $images = $("img", $toolbarPanel);

            preloadImages($images, onLoadedImages, centerImageVertically);

            appendAppToToolbar = function (appData) {
                var viewTypeClass = viewTypes[appData.viewData.viewType],
						view = new viewTypeClass(appData.viewData, viewId, undefined);

                $scrollPanel.append(view.$appElement);
                var $images = $("img", $toolbarPanel);
                preloadImages($images, function () {
                    updateScrollerSize();
                    saveState();
                }, centerImageVertically);
            }

            conduit.triggerEvent("onReady", { name: 'applicationLayer.appManager.view' });
            viewInitialized = true;  // flag to indecate view is ready and visible
            viewReadyQueue.release({ logInfo: "view onReady" });
            needRender = false;
        }

        function getAppIconFromModel(modelData) {
            modelData = (typeof (modelData) == "string") ? JSON.parse(modelData) : modelData;
            if (!modelData.appStatus.iconUpdated) {
                var app = modelData.app;
                if (app && app.viewData && app.viewData.icon) {
                    var view = views[app.appId];
                    if (view) {
                        view.setIcon(app.viewData.icon, updateScrollAndState);
                    }
                }
            }
        }


        function getAppTextFromModel(modelData) {
            modelData = (typeof (modelData) == "string") ? JSON.parse(modelData) : modelData;
            if (!modelData.appStatus.textUpdated) {
                var app = modelData.app;
                app = (typeof (app) == "string") ? JSON.parse(app) : app;
                if (app && app.viewText) {
                    var view = views[app.appId];
                    if (view) {
                        view.setText(app.viewText, updateScrollAndState);
                    }
                }
            }
        }

        function getAppBadgeFromModel(modelData) {
            modelData = (typeof (modelData) == "string") ? JSON.parse(modelData) : modelData;
            if (!modelData.appStatus.badgeUpdated) {
                var app = modelData.app;
                app = (typeof (app) == "string") ? JSON.parse(app) : app;
                if (app && app.viewBadge && app.viewBadge.text) {
                    var view = views[app.appId];
                    if (view) {
                        view.setBadgeText(app.viewBadge.text, updateScrollAndState);
                    }
                }
            }
        }

        function updateIcon(view, appData, useCurrentModelData) {
            var currImg = view.$appElement.find('img');
            if (currImg && currImg.length > 0) {
                if ((!currImg.attr('src') || currImg.attr('src') === '') || useCurrentModelData) {
                    // we have no icon for the button.
                    if (appData.icon) {
                        view.setIcon(appData.icon, updateScrollAndState);
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    view.setIcon(currImg.attr('src'), updateScrollAndState);
                    return true;
                }
            }
            return false;
        }
        function updateText(view, appData, useCurrentModelData) {
            var currText = view.$appElement.find('span.appView_text');
            if (currText && currText.length > 0) {
                if (!currText.text() || useCurrentModelData) {
                    // we have no text for the button.
                    if (appData.text) {
                        view.setText(appData.text, updateScrollAndState);
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    view.setText(currText.text(), updateScrollAndState);
                    return true;
                }
            }
            return false;
        }
        function updateBadge(view, appData, useCurrentModelData) {
            //TODO : handle  setBadgeBackgroundColor
            var currBadge = view.$appElement.find('span.appView_badge');
            if (currBadge && currBadge.length > 0) {
                if (!currBadge.text() || useCurrentModelData) {
                    // we have no badge for the button.
                    if (appData.badge && appData.badge.text) {
                        view.setBadgeText(appData.badge.text, updateScrollAndState);
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    view.setBadgeText(currBadge.text(), updateScrollAndState);
                    return true;
                }
            }
            return false;

        }

        // useCurrentModelData - when true: use the data we got from the model and set the values to the view item. do not send a message to get new model data.
        function handleMissingButtons(view, appData, useCurrentModelData) {
            var iconUpdated = updateIcon(view, appData, useCurrentModelData);
            var textUpdated = updateText(view, appData, useCurrentModelData);
            var badgeUpdated = updateBadge(view, appData, useCurrentModelData);
            if (!useCurrentModelData && (!iconUpdated || !textUpdated || !badgeUpdated)) {
                messages.sendSysReq(
                                        "applicationLayer.appManager.model.getViewData",
                                        "applicationLayer.appManager.view." + id,
                                        JSON.stringify({
                                            appId: appData.appId, appStatus: {
                                                iconUpdated: iconUpdated,
                                                textUpdated: textUpdated,
                                                badgeUpdated: badgeUpdated
                                            }
                                        }), function (modelData) {
                                            getAppIconFromModel(modelData);
                                            getAppTextFromModel(modelData);
                                            getAppBadgeFromModel(modelData);
                                        });
            }
        }

        function updateScrollAndState() {
            updateScrollerSize();
            saveState(true);
        }

        function handleLoadedImage() {
            centerImageVertically();
        }

        //******************* TODO Remove this code when this is fixed in the abstraction layer!!!********************
        /* See bug 17330. currently only in IE, all browser events such as F5, mouse in/out using ctrl+weel CTRL + <key> are triggered on the toolbar apps (like embedded).
        this affects the toolbar and corrupts it.
        this hack must be removed when this is fixed in a more generic way.
        */
        var disableKey = function (event) {
            if (!event) event = window.event;
            if (!event) return;
            var keyCode = event.keyCode ? event.keyCode : event.charCode;

            if (keyCode == 116) {

                // Standard DOM (Mozilla):
                if (event.preventDefault) event.preventDefault();
                //IE (exclude Opera with !event.preventDefault):
                if (document.all && window.event && !event.preventDefault) {
                    event.cancelBubble = true;
                    event.returnValue = false;
                    event.keyCode = 0;
                }
                return false;
            }
        };

        function disableWindowEvents() {
            try {
                cb_eventsHandler.addEventHandler(document, 'keydown', disableKey);
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to disableWindowEvents', { className: "appManager.view", functionName: "disableWindowEvents" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
            }
        };
        //****************************************************************************************************************

        function showFirstTimeDialog() {
            try {
                //get the status of the dialog from the preference storage
                var loggerContext = { className: "appManager.view", functionName: "showFirstTimeDialog" };
                var response = absRepository.getKey(ctid + '.firstTimeDialogOpened');
                var firstTimeDialogOpened = false;

                if (response && !response.status) {
                    firstTimeDialogOpened = true;
                }
                conduit.coreLibs.logger.logDebug('Got firstTimeDialogOpened key: ' + response.result, loggerContext);

                if (!firstTimeDialogOpened) {
                    var position = getToolbarPosition();
                    var left = position.left;
                    var top = position.top;
                    var parentWindowID = conduit.abstractionlayer.frontstage.environment.getCurrentWindowId ? conduit.abstractionlayer.frontstage.environment.getCurrentWindowId() : null;
                    parentWindowID = (parentWindowID && !parentWindowID.status) ? parentWindowID.result : null;

                    // we will wait for translation in the dialogmodel!
                    startFirstTimeFlow(left, top, parentWindowID, loggerContext);
                }
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to send message from view to open first time dialog', { className: "appManager.view", functionName: "showFirstTimeDialog" }, { code: conduit.coreLibs.logger.GeneralCodes.FIRST_TIME_DIALOG_FLOW_FAILURE, error: e });
            }
        }; // end of showFirstTimeDialog

        function startFirstTimeFlow(left, top, parentWindowID, loggerContext) {

            try {
                conduit.coreLibs.logger.logDebug("sending message from the view to open first time dialog", loggerContext);
            }
            catch (e) {
                // ignore error
            }
            messages.sendSysReq("applicationLayer.dialog", "applicationLayer.appManager.view", JSON.stringify({ "method": "setDialog", "value": "toolbarFirstTime", "left": left, "top": top, "parentWindowID": parentWindowID }), function (response) {
                isActivateDialog = true;
            });


        }

        /*
        check if the view type is in the excluded list.
        */
        var validateApp = function (excludedTypes, view) {
            if (excludedTypes) {
                for (var index in excludedTypes) {
                    if (excludedTypes[index] == view.appType) {
                        return false;
                    }
                }
            }
            return true;
        };

        function onAppChange(data) {
            try {
                // If the toolbar isn't rendered yet, put the message in a queue, to be run later:
                if (!isRendered) {
                    appChangeQueue.push(data);
                    return;
                }

                var dataObj = JSON.parse(data),
			viewData = views[dataObj.appId];

                function proceed() {
                    if (viewData && viewData[dataObj.method]) {
                        // the passed callback functions are for setIcon method.
                        if (dataObj.method == "setIcon") {
                            viewData[dataObj.method](dataObj.data, function () {
                                updateScrollerSize();
                                saveState(true);
                            }, centerImageVertically);
                        }
                        else {
                            //TODO consider deleting this ugly code!
                            var deferredPromise = viewData[dataObj.method](dataObj.data);
                            if (deferredPromise) {
                                $.when(deferredPromise).done(function (needUpdate) {
                                    if (needUpdate) {
                                        updateScrollerSize();
                                        saveState(true);
                                    }
                                });
                            }
                            saveState(true);
                        }
                    }
                    else {
                        conduit.coreLibs.logger.logDebug('Failed to change app in view with data:' + data + ", since the viewData or method does not exist for app: " + dataObj.appId, { className: "appManager.view", functionName: "onAppChange" });
                    }
                }
                proceed();
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to change app in view with data:' + data, { className: "appManager.view", functionName: "onAppChange" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
            }
        }

        function onCommand(data) {
            var dataObj = JSON.parse(data),
			needUpdate = false,
            deferredPromises = [];

            for (var appId in views) {
                var view = views[appId],
				method = view[dataObj.method];

                var validApp = validateApp(dataObj.data, view);
                if (validApp) {
                    if (method) {

                        //elements like: search, main_menu and highlighter shouldnt be changed.
                        if ((method === 'expand' || 'collapse') && view.allowScroll === false) {
                            continue;
                        }

                        deferred = method.call(view, dataObj.data);
                        if (deferred)
                            deferredPromises.push(deferred);
                    }
                }

            }

            $.when.apply(this, deferredPromises).done(function () {
                var needUpdate = false;
                for (var i = 0, count = arguments.length; i < count && !needUpdate; i++) {
                    needUpdate = needUpdate | arguments[i];
                }

                if (needUpdate)
                    updateScrollerSize();
            })
        }

        function onMenuHide(data) {
            data = JSON.parse(data);
            // IE has same menu-viewId for all views (1) 
            if (data.viewId == window.viewId || !data.viewId || data.viewId == 1) {
                var view = views[data.appId];
                if (view && view.appType === "menu") {
                    view.$appElement.removeClass("menuOpen");
                }
            }
        }

        function hideAllMenus() {
            for (var k in views) {
                var view = views[k];
                if (view && view.appType === "menu") {
                    view.$appElement.removeClass("menuOpen");
                }
            }
        }


        /**
        @function
        @description: when new app is being selected by the user from the app store,
        this function is responsible to add it to the toolbar in the correct position,
        then its using  the controller to open a popup.
        @param: {object} data - the new app data. 
        */
        function onAddApp(data) {
            if (!viewInitialized) return;
            try {
                //alias
                var repository = conduit.coreLibs.repository,
			    messages = conduit.abstractionlayer.commons.messages;

                //variables
                var dataObj = JSON.parse(data),
			    position = dataObj.position,
			    appData = dataObj.viewData,
                viewTypeClass = viewTypes[appData.viewType],
			    view,
			    $newApp;
                var replace = appData.replace;

                //create new view instance.	
                if (viewTypeClass) {
                    view = new viewTypeClass(appData, viewId);
                    if (appData.isShow === false) {
                        if (appData.viewType == 'embedded') {
                            // set about:blank to iframe src for hidden embedded apps so it will stop working.
                            view.$appElement.children('iframe').attr("src", "about:blank");
                        }
                        view.$appElement.hide();
                    }
                    views[appData.appId] = view;
                    // if the new app is embedded me must set it's context so app will be able to use webappapi
                    if (appData.viewType == 'embedded') {
                        var embeddedAppContext = JSON.stringify($.extend(appData.urlAppData, { viewId: viewId, context: "embedded" }, { name: appData.appId + extId }));
                        var frame = view.$appElement.find('iframe')[0];
                        var inExtDomain = false;
                        if (frame.src.indexOf(extId) != -1) {
                            inExtDomain = true;
                        }
                        frame.setAttribute('name', isChrome && !inExtDomain ? embeddedAppContext : appData.appId + extId);
                        conduit.abstractionlayer.commons.appMethods.setContext(appData.appId + extId, embeddedAppContext);
                    }

                    // if the app has icon, we load the icon first then append it to view, else we just append it to view.
                    if (appData.icon) {
                        preloadImages($("img", view.$appElement).css('width', "24px"), function () {
                            addAppToView(view, appData, replace);
                        }, centerImageVertically);
                    }
                    else {
                        addAppToView(view, appData, replace);
                    }
                }
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to add app to view', { className: "appManager.view", functionName: "onAddApp" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
            }

            function createSingleBgpage(appId, replace) {
                messages.postTopicMsg("Loader.createSingleBgPage", "applicationLayer.appManager.view",
				JSON.stringify({ appId: appId, replace: replace }));
            }

            function addAppToView(view, appData, replace) {
                var requiresUpdate = true;

                function simulateClickEvent() {

                    if (appData.bIsNotAutoPopup) {
                        return;
                    }

                    //here we basically mimic a click event on the new app in order to have
                    //the 'this' object and the 'e' object and to use the controller.			
                    var newAppClickHandler = function (e) {

                        //call controller.
                        webAppTypes.button.mousedown.onWebAppClick(this, e, true);
                    };

                    //check if the new added app is type embedded and collapsed or button.
                    //if its embedded and collapsed the template will render a button in the view. 
                    var isEmbedded = appData.viewType == "embedded";

                    if (isEmbedded) {

                        if (appData.isCollapsed) {
                            //$newApp is a reference to the button which represents the new collapsed embedded.
                            $newApp = $('#' + appData.appId + '_btn')
                            $newApp.attr('data-method', 'popup');
                        }
                        else {
                            //the ebbedded is allready open
                            $newApp = $('#' + appData.appId)
                            $newApp.attr('data-method', 'popup');
                            $newApp.attr("data-appId", appData.appId);
                            $newApp.attr("data-isEmbeddedTrusted", true);
                        }
                    }
                    else {
                        $newApp = $('#' + appData.appId);
                    }

                    //simulate the click event and pass the data to the controller.
                    $newApp.bind('click', newAppClickHandler);
                    $newApp.trigger('click');
                    $newApp.unbind('click', newAppClickHandler);
                }

                if (!appData.isUserApp) {

                    //if we get WEBAPP type and its not the place holder representation, 
                    //we replace the place-holder icon with the new app data.
                    if ((appData.appType && appData.appType == "WEBAPP" && !appData.isPlaceHolder) || appData.isOptimizer) {
                        var id = appData.isOptimizer ? appData.originalAppId : appData.appId;

                        if ($("#" + id).length > 0) {
                            $("#" + id).replaceWith(view.$appElement);
                        } else if ($("#place_holder_" + id).length == 0) {
                            $scrollPanel.prepend(view.$appElement);
                        } else {
                            /* fade it webapp image when replacing place holder*/
                            if (appData.isShow) {
                                requiresUpdate = false;
                                $("#place_holder_" + id).fadeTo('slow', 1, function () {
                                    $("#place_holder_" + id).replaceWith(view.$appElement);
                                    // we must update the view and save the state after replacing the placeholder with the webapp.
                                    centerImageVertically.call(view.$appElement.find("img")[0]);
                                    updateScrollerSize();
                                    saveState(true);
                                });
                            }
                            else {
                                $("#place_holder_" + id).replaceWith(view.$appElement);
                            }
                        }
                        handleAppVisibility(view, appData);
                        if (appData.isUserWebApp) {
                            simulateClickEvent();
                        }
                    }
                    else {
                        if (appData.isPlaceHolder) {
                            $scrollPanel.prepend(view.$appElement);
                        }
                        else {
                            if ($("#" + appData.appId).length > 0) {
                                $("#" + appData.appId).replaceWith(view.$appElement);
                            }
                            else {
                                // personal apps
                                if (appData.userAppsLocation === "AFTER_SEARCH") {
                                    $scrollPanel.append(view.$appElement);
                                }
                                else {
                                    var $userApps = $scrollPanel.find('.userapp');
                                    if ($userApps.length > 0) {
                                        view.$appElement.insertBefore($userApps[0]);
                                    }
                                    else {
                                        $scrollPanel.append(view.$appElement);
                                    }
                                }
                            }
                        }
                    }

                    //finally we send message to the loader in order to init the bgpage.
                    createSingleBgpage(appData.appId);
                }
                else {

                    if (appData.hasBgpage) {
                        createSingleBgpage(appData.appId, replace);
                    }
                    var $existingApp = $("#" + appData.appId);
                    if (replace && $existingApp.length > 0) {
                        $existingApp.replaceWith(view.$appElement);
                    }
                    else {
                        //check for 'userAppsLocation' property to determine where to place the new app on the toolbar.
                        checkUserAppsLocationAndAddApp(appData, view);
                        handleAppVisibility(view, appData);
                        // we must update the scroller to get the right app position for simulateClickEvent function.
                        // TODO: refactor addition of elements to toolbar - calculate scroller size as part of the addetion.
                        requiresUpdate = false;
                        updateScrollerSize();
                        saveState(true);

                        if (floatDir == 'right') {
                            simulateClickEvent();
                        }
                        else {

                            //tell the scroller/chevron to reset itself to offset 0.
                            if (appData.userAppsLocation === "AFTER_SEARCH") {
                                scroller.onNewAppsAdd_Scroll(simulateClickEvent);
                            }
                            else {
                                var position = view.$appElement.position();
                                var distance = Math.round(position.left);
                                scroller.scroll.right(distance, 0, simulateClickEvent);
                            }
                        }
                    }


                }

                if (requiresUpdate) {
                    updateScrollerSize();
                    saveState(true);
                }
            }
        }

        function handleAppVisibility(view, appData) {
            // handle show/hide of added apps (can also happen in toolbar refresh)
            if (view.appType == "embedded" && view.src) {
                // set about:blank to iframe src for hidden embedded apps so it will stop working.
                var iframeSrc = appData.isShow ? view.src : "about:blank";
                view.$appElement.children('iframe').attr("src", iframeSrc);
            }
            if (view.appType == "button") {
                view.isOptionsShown = appData.isShow;
            }
            if (appData.isShow) {
                view.$appElement.show().removeAttr("data-noshow");
            }
            else {
                view.$appElement.hide().attr("data-noshow", "1");
            }
        }


        function addManagedWebApp(appData, objView) {
            if ($('#' + appData.appId).length > 0) {
                // app already exist, don't add it twice
                // there a bug causing this function to be called twice after toolbar refresh and browser restart
                return;
            }
            var managerId = appData.managed.managerId;
            var managerApp = $('#' + managerId);
            if (managerApp.length > 0) {
                objView.$appElement.insertAfter(managerApp);
            }
            else {
                // fallback
                $scrollPanel.append(objView.$appElement);
            }
        }

        function checkUserAppsLocationAndAddApp(appData, objView) {
            try {
                // this will load the url to avoid a problem of unloaded image on the view
                var $images = $("img", objView.$appElement);
                if ($images.length > 0) {
                    var url = $images[0].src;
                    var imageObj = new Image();
                    imageObj.src = url;
                }
            }
            catch (e) {
                conduit.coreLibs.logger.logError('Failed to load image', { className: "appManager.view", functionName: "checkUserAppsLocationAndAddApp" }, { code: conduit.coreLibs.logger.GeneralCodes.GENERAL_ERROR, error: e });
            }

            if (appData.managed && appData.managed.managerId) {
                addManagedWebApp(appData, objView);
            }
            else {
                if (appData.userAppsLocation === "AFTER_SEARCH") {
                    $scrollPanel.prepend(objView.$appElement)
                }
                else {
                    var $userApps = $scrollPanel.find('.userapp');
                    if ($userApps.length > 0) {
                        objView.$appElement.insertBefore($userApps[0]);
                    }
                    else {
                        $scrollPanel.append(objView.$appElement);
                    }
                }
            }


        }

        function getToolbarPosition() {
            var getToolbarPosition = conduit.abstractionlayer.frontstage.environment ? conduit.abstractionlayer.frontstage.environment.getToolbarPosition : conduit.abstractionlayer.commons.environment.getToolbarPosition;
            var toolbarPosition = getToolbarPosition().result;

            var toolbarHeight = 34;
            var top = toolbarPosition.top + toolbarHeight;
            var left = toolbarPosition.left + 50;

            if ($html.hasClass('rtl')) {
                left += $(window).width();
                left -= 650;
            }

            return { top: top, left: left };
        }

        var methods = {
            getAppPosition: function (appId, callback) {
                // Change this when abstraction layer is fixed:
                var getToolbarPosition = conduit.abstractionlayer.frontstage.environment ? conduit.abstractionlayer.frontstage.environment.getToolbarPosition : conduit.abstractionlayer.commons.environment.getToolbarPosition,
                toolbarPosition = getToolbarPosition().result,
                $app = $("#" + appId),
                appWidth = $app.width(),
                appOffset = $app.offset();

                conduit.coreLibs.logger.logDebug('getAppPosition: top: ' + toolbarPosition.top + ' type: ' + typeof toolbarPosition.top + ' left: ' + toolbarPosition.left + ' type: ' + typeof toolbarPosition.left, { className: "appManager.view", functionName: "getAppPosition" });
                if ($app.hasClass("appView_embedded")) {
                    if ($html.hasClass('rtl')) {
                        appOffset.left -= parseInt($app.children('iframe').css('margin-right'));
                    } else {
                        appOffset.left += parseInt($app.children('iframe').css('margin-left'));
                    }
                }

                var screenWidth = screen.width;
                var screenHeight = screen.height;
                var left = (appOffset && appOffset.left) ? appOffset.left + toolbarPosition.left : toolbarPosition.left;
                var top = (appOffset && appOffset.top) ? appOffset.top + toolbarPosition.top : toolbarPosition.top;
                var appPosition = { left: Math.round(left), top: top };

                appPosition.bottom = toolbarPosition.top + 34;
                appPosition.right = appPosition.left + $app.outerWidth(true);
                appPosition.appWidth = appWidth;
                appPosition.screenWidth = screenWidth;
                appPosition.screenHeight = screenHeight;
                conduit.coreLibs.logger.logDebug('appPosition: top: ' + appPosition.top + ' type: ' + typeof appPosition.top + ' left: ' + appPosition.left + ' type: ' + typeof appPosition.left, { className: "appManager.view", functionName: "getAppPosition" });
                callback(JSON.stringify(appPosition));
            },

            getScreenHeight: function (data, callback) {
                conduit.abstractionlayer.commons.environment.getScreenHeight(function (response) {
                    callback(response.result.toString());
                });
            },
            getToolbarPosition: function (data, callback) {
                var position = getToolbarPosition();
                callback(JSON.stringify(position));
            }
        };

        function getViewByAppId(id) {
            return views[id];
        }

        function getAppIdFromWindowName(name) {
            var appId = name;
            if (window.chrome && name) {
                // in chrome, the name attribute looks like this: appid___extensionId
                var appIdArr = name.split("___");
                appId = appIdArr && appIdArr[0];
            }
            return appId;
        }


        function initView() {

            // TODO: sync listeners with view init
            // Respond to changes in app models:
            messages.onTopicMsg.addListener("applicationLayer.appManager.model.onAppChange", onAppChange);

            // Respond to general commands from model:
            messages.onTopicMsg.addListener("applicationLayer.appManager.model.onCommand", onCommand);

            // Add new app (user apps, AKA 'add stuff'):
            messages.onTopicMsg.addListener("applicationLayer.appManager.model.onAddApp", onAddApp);

            // General listener for topics to views:
            messages.onTopicMsg.addListener("applicationLayer.appManager.view", onViewTopic);

            messages.onTopicMsg.addListener("onMenuHide", onMenuHide);

            messages.onTopicMsg.addListener("hideAllMenus", hideAllMenus);



            messages.onSysReq.addListener("applicationLayer.appManager.view_" + window.viewId, function (data, sender, callback) {
                if (!data)
                    return;

                var dataObj = JSON.parse(data);
                if (dataObj.method) {
                    viewReadyQueue.add(methods[dataObj.method], [dataObj.data, callback], { logInfo: "calling " + dataObj.method });
                }
            });

            messages.onTopicMsg.addListener("applicationLayer.appManager.model.onUserUpdates", function (data) {
                if (typeof data != 'string' || !data) {
                    return;
                }
                try {
                    data = JSON.parse(data);
                } catch (ex) {
                    return;
                }
                viewTopicMethods.userUpdatesAlert.data(data);
            });

            conduit.abstractionlayer.frontstage.browser.onEmbeddedError.addEventListener(function (data) {
                if (data && data.result && data.result.windowName) {
                    viewReadyQueue.add(function () {
                        var appId = getAppIdFromWindowName(data.result.windowName);
                        if (views && views[appId] && !views[appId].isCollapsed) {
                            // TODO check if it is already collapsed
                            views[appId].collapse({ onError: true });
                            conduit.applicationLayer.appManager.view.update();
                        }
                    }, null, { logInfo: "collapse embedded 404" });
                }
            });
            conduit.coreLibs.logger.performanceLog({
                from: "App Manager View",
                action: "create Back Stage: ",
                time: +new Date(), isWithState: ""
            });
            conduit.abstractionlayer.frontstage.system.createBackStage(function () {
                // Handshake with appCore
                conduit.coreLibs.logger.logDebug('created backstage in view', { className: "appManager.view", functionName: "createBackStage" });

                messages.onTopicMsg.addListener("applicationLayer.appManager.model.ready", function (data) {
                    conduit.coreLibs.logger.performanceLog({ from: "View", action: "got event - model ready: ", time: +new Date(), isWithState: "" });
                    conduit.coreLibs.logger.logDebug('Received model.ready event in view', { className: "appManager.view", functionName: "createBackStage" });
                    data = JSON.parse(data);
                    init(data);
                });
                conduit.coreLibs.logger.logDebug('Added model.ready listener in view', { className: "appManager.view", functionName: "createBackStage" });
                getDataFromModel();


                //for images caching
                messages.onTopicMsg.addListener("applicationLayer.appManager.view.onSaveStateRequest", function (currentViewId) {
                    if (viewId == currentViewId)
                        saveState(true);
                });

            });
        }

    }
    catch (e) {
        conduit.coreLibs.logger.logError('Failed to create appManager.view object', { className: "appManager.view", functionName: "register" }, { error: e });
    }

    return {
        initView: initView,
        update: function () {
            updateScrollerSize();
            saveState(true);
        },
        setScrollerWrapperWidth: setScrollerWrapperWidth,
        setNoScrollPanelWidth: setNoScrollPanelWidth,
        getFloatDir: getFloatDir,
        getViewByAppId: getViewByAppId,
        onAppChange: onAppChange,
        saveState: saveState,
        updateScrollerDir: updateScrollerDir
    };
})('toolbar'));

﻿

/**
* @fileOverview:  splitter.
* FileName: splitter.js
* FilePath: ..ApplicationLayer\Dev\src\main\js\appCore\view\js\splitter.js
* Date: 25/10/2011 
* Copyright: 
*/
conduit.register("applicationLayer.appManager.splitter", (function () {

    //alias.
    var floatDir,
		setScrollerWrapperWidth = conduit.applicationLayer.appManager.view.setScrollerWrapperWidth,
		setNoScrollPanelWidth = conduit.applicationLayer.appManager.view.setNoScrollPanelWidth;

    var $searchIframe,
		lastPosition,
		$splitter = $('#splitter'),
		$splitterLayer = $('#splitterLayer'),
		searchMinWidth,
		searchMaxWidth,
		dir;


    /**
    @function
    @description: simple setter to set the minimum bound for the splitter.
    used after each setEmbedded on the search.
    */
    function setSearchMinWidth(value) {
        searchMinWidth = value;
    }

    /**
    @function
    @description: simple setter to set the maximum bound for the splitter.
    used after each setEmbedded on the search.
    */
    function setSearchMaxWidth(value) {
        searchMaxWidth = value;
    }

    /**
    @function
    @description: check if the search iframe exceeds its bounds
    */
    function checkBounds() {

        if ($searchIframe.width() >= searchMaxWidth) {
            $searchIframe.css('width', searchMaxWidth + 'px');

        }

        if ($searchIframe.width() <= searchMinWidth) {
            $searchIframe.css('width', searchMinWidth + 'px');

        }
        setNoScrollPanelWidth();
    }

    /**
    @function
    @description: set the new width to all relevant elements.
    */
    function slide(noScrollPanelWidth, scrollPanelWidth, searchIframeWidth) {
        var newSearchIframeWidth = parseInt($searchIframe.css('width'), 10) + searchIframeWidth;

        if (!searchMaxWidth || !searchMinWidth || newSearchIframeWidth >= searchMaxWidth || newSearchIframeWidth <= searchMinWidth) {
            return;
        }

        $searchIframe.css('width', newSearchIframeWidth + "px");

        checkBounds();
    }

    /**
    @function
    @description: set the correct values for the slide function.
    */
    function increaseSearch(val) {
        var val1 = val3 = val;
        var val2 = (val *= -1);
        slide(val1, val2, val3);
    }

    /**
    @function
    @description: set the correct values for the slide function.
    */
    function decreaseSearch(val) {
        var val2 = val;
        var val1 = val3 = (val *= -1);
        slide(val1, val2, val3);
    }

    /**
    @function
    @description: check which direction the mouse moves
    and update the toolbar.
    */
    function handler(e) {

        //the first time lastPosition is undefined.
        //lastPosition will be equal to the last mousePosLeft.				
        if (lastPosition) {

            //dragging left.
            if (lastPosition > e.clientX) {
                var val = lastPosition - e.clientX;

                (dir === 'right') ? increaseSearch(val) : decreaseSearch(val);
            }

            //dragging right. 
            else if (lastPosition < e.clientX) {
                var val = e.clientX - lastPosition;

                (dir === 'right') ? decreaseSearch(val) : increaseSearch(val);
            }
        }
        //update last mouse position.
        lastPosition = e.clientX;
        //calculate chevron dimensions.

        setScrollerWrapperWidth();
    }

    //mousedown.
    $splitter.mousedown(function (e) {
        e.preventDefault();
        //get toolbar direction.
        floatDir = conduit.applicationLayer.appManager.view.getFloatDir();

        //resize to maximum the splitter layer div.
        $splitterLayer.css({
            'display': 'block',
            'width': $(document.body).width()
        });

        //a reference to the search iframe element.
        $searchIframe = $('.appView_embedded').eq(0).find('iframe');

        //set the floatDir var for later use. 
        if (floatDir === 'right')
            dir = 'right';
        else
            dir = 'left';

        //mousemove.
        $splitterLayer.bind('mousemove', handler);
    });

    //each time the mouse is leaving the toolbar or triggers mouseup event
    //we stop the dragging.
    $(document).bind('mouseup mouseleave', function (e) {
        e.preventDefault();
        conduit.applicationLayer.appManager.view.saveState(true);
        $splitterLayer.unbind('mousemove', handler);
        lastPosition = undefined;
        //hide the splitter layer div.
        $splitterLayer.css('display', 'none');
        var jso = { "source": 'toolbar.splitters-search', viewId: window.viewId };
        if (e.type == 'mouseup') {
            if ($(e.target).attr('id') == "splitterLayer") {
                var width = $('[settingsapptype=SEARCH]').find('iframe').width();
                if (typeof width == 'number') { jso.data = { width: width }; }

                conduit.abstractionlayer.commons.messages.postTopicMsg("adv:conduit-toolbar-view-layout-change", "splitter", JSON.stringify(jso));
            }
        }
    });

    //public interface used by the search setEmbedded function.
    return {
        setSearchMinWidth: setSearchMinWidth,
        setSearchMaxWidth: setSearchMaxWidth
    }

})());
﻿

/**
* @fileOverview:  view translation.
* FileName: viewTranslation.js
* FilePath: ..\ApplicationLayer\src\main\js\appCore\view\js\viewTranslation.js
* Date: 29/2/2012 
* Copyright: 
*/
conduit.register("applicationLayer.appManager.viewTranslation", (function () {
    
    var $optionsBtn = $('#optionsBtn'),
		$myStuffBtn = $('#myStuffBtn'),
        $scrollLeftBtn = $('#scrollLeftBtn'),
        $scrollRightBtn = $('#scrollRightBtn'),
		bIsRightIconsToolTip = false,
		
        // keys for translation.
        oKeys = {
		    optionsBtn: 'CTLP_STR_ID_OPEN_OPTIONS',
		    myStuffBtn: 'CTLP_STR_ID_MYSTUFF_ADD_STUFF_TOOLTIP',
		    scrollRight: 'CTLP_STR_ID_SCROLL_RIGHT',
		    scrollLeft: 'CTLP_STR_ID_SCROLL_LEFT'
		},
        appManagerView = conduit.applicationLayer.appManager.view;
    


    function init() {
        getToolTipsTranslation();
    }

    /**
    @function
    @description: set the tooltips for the html elemets + the 'bIsTooltipSet' attribute which indicates
    that this process is done for later checking. 
    */
    function setToolTips(oKeys) {
        if (oKeys.optionsBtn) $optionsBtn.attr({ 'title': oKeys.optionsBtn, 'bIsTooltipSet': "true" });
        if (oKeys.myStuffBtn) $myStuffBtn.attr({ 'title': oKeys.myStuffBtn, 'bIsTooltipSet': "true" });
        if (oKeys.scrollLeft) $scrollLeftBtn.attr({ 'title': oKeys.scrollLeft, 'bIsTooltipSet': "true" });
        if (oKeys.scrollRight) $scrollRightBtn.attr({ 'title': oKeys.scrollRight, 'bIsTooltipSet': "true" });
        
        // save state.
        appManagerView.saveState(true);
    }

    /**
    @function
    @description: send message to translation service.
    */
    function getViewTranslation() {
        // check if the attribute alredy exists in the elements to
        // prevent new views send messages when state is used.
        if (!($optionsBtn.attr('bIsTooltipSet') && $myStuffBtn.attr('bIsTooltipSet') && $scrollLeftBtn.attr('bIsTooltipSet') && $scrollRightBtn.attr('bIsTooltipSet'))) {

            messages.sendSysReq("serviceLayer.translation.getTranslation",
				 "view", JSON.stringify(oKeys), function (sResponse) {

				     if (sResponse) {
				         oKeys = JSON.parse(sResponse);
				         if (!bIsRightIconsToolTip) {

				             // this flag is used when backstage is first loaded, on the first view
				             //bIsRightIconsToolTip = true;
				             setToolTips(oKeys);
				         }
				     }
				 });
        }
    }

    /**
    @function
    @description: handshake - listening for translation ready & in the same time 
    send a message to translation service.
    */
    function getToolTipsTranslation() {
        messages.onTopicMsg.addListener('systemRequest.translationReady', function () {
            getViewTranslation();
        });
        getViewTranslation();
    }

    init();

})());


﻿conduit.applicationLayer.appManager.view.initView();
