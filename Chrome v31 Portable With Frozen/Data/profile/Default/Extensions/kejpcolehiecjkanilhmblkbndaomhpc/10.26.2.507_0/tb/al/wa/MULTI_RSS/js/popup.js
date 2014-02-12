(function ($, undefined) {
    var alert_title = 'RSS';
    var last_selected_feed_index = 0;
    var feeds,
		initialized = false,
		appTitle,
		templates = {},
        RSS_FEED_ITEM_WIDTH = 393,
        translation,
        defaultTranslation = {
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_MINUTES": "{0} minutes ago",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOUR": "An hour ago",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOURS": "{0} hours ago",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_ONEDAY": "A day ago",
            "CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_DAYS": "{0} days ago",
            "CTLP_STR_ID_RSS_REFRESH_TOOLTIP": "Refresh",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TOOLTIP": "Delete All Items",
            "CTLP_STR_ID_RSS_MARK_ALL_AS_READ_TOOLTIP": "Mark All Items As Read",
            "CTLP_STR_ID_RSS_MARK_ALL_AS_UNREAD_TOOLTIP": "Mark All Items As Unread",
            "CTLP_STR_ID_RSS_ADD_YOUR_COMMET_TO_BOX": "Add your own comment to this box",
            "CTLP_STR_ID_RSS_DELETE_MESSAGE": "Are you sure you wish to delete this item?",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TITLE": "Delete All Items ?",
            "CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE": "Are you sure you want to delete all items?"
            , "CTLP_STR_ID_GLOBAL_OK": 'Ok'
            , "CTLP_STR_ID_GLOBAL_CANCEL": 'Cancel'
        },
		$feedsMenu = $("#feedsMenu").delegate(".menuItemDiv", "click", function (e) {

		    e.preventDefault();

		    var id = $(this).data("href").match(/#(\d+)$/)[1],
				feedIndex;

		    for (var i = 0, count = feeds.length; i < count && feedIndex === undefined; i++) {
		        if (feeds[i].uniqueCompId == id)
		            feedIndex = i;
		    }

		    if (feedIndex !== undefined) {
		        last_selected_feed_index = feedIndex;
		        setItems(feedIndex);
		    }
		    conduit.logging.usage.log("RSS_CHOOSE_CATEGORY", {});
		}),
		$menuNav = $("#menuNav"),
		menuPageSize,
		$itemsList = $("#itemsList"),
		feedTitle = document.getElementById("feedTitle"),
		$selectedFeedMenuItem,
		currentFeedIndex,
		currentFeedHasItems = true,
		$readBtn = $("#readBtn").click(function (e) {
		    e.preventDefault();
		    toggleReadStatus(null, true);
		    $readBtn.addClass("disabled");
		    $unreadBtn.removeClass("disabled");
		}),
		$unreadBtn = $("#unreadBtn").click(function (e) {
		    e.preventDefault();
		    toggleReadStatus(null, false);
		    $unreadBtn.addClass("disabled");
		    $readBtn.removeClass("disabled");
		}),
		$deleteBtn = $("#deleteBtn").click(function (e) {
		    e.preventDefault();

		    if (!$deleteBtn.hasClass("disabled")) {
		        deleteItems(null);
		        conduit.logging.usage.log("RSS_DELETE_ALL", {});
		    }
		}),
        $refreshBtn = $("#refreshBtn").click(function (e) {
            e.preventDefault();
            conduit.messaging.sendRequest("backgroundPage", "refresh", JSON.stringify({ feedId: feeds[currentFeedIndex].uniqueCompId }), function (newItems) {
                try {
                    newItems = JSON.parse(newItems);
                }
                catch (e) {
                    conduit.logging.logDebug('RssClassic/popup.js/refreshBtn - received wrong items: ' + newItems);
                    newItems = [];
                }
                $itemsList.prepend($.tmpl(templates.feedItemTemplate, newItems,
					{
					    dateFormatter: getDateOffset,
					    getTarget: getTarget
					}
				));
                $('.feedItemImage', $itemsList).on('error', function () {
                    $(this).hide();
                });
                if (newItems && newItems.length > 0) {
                    changeBadgeCount(newItems.length);

                    conduit.messaging.sendRequest("backgroundPage", "getFeeds", "", updateFeedsObject);
                }
                toggleButtons();
            });
            conduit.logging.usage.log("RSS_REFRESH", {});
        }),
        menuIsSliding = false,
		menuMinPosition,
		menuTopPosition = 0,
		$slideDown = $("#slideDown").click(function (e) {
		    e.preventDefault();
		    if (this.className !== "disabled")
		        slideMenu(0 - menuPageSize);
		}),
		$slideUp = $("#slideUp").click(function (e) {
		    e.preventDefault();
		    if (this.className !== "disabled")
		        slideMenu(menuPageSize);
		});

    function updateFeedsObject(data) {
        try {
            data = JSON.parse(data);
        }
        catch (e) {
            conduit.logging.logDebug('RssClassic/popup.js/updateFeedsObject - received wrong data: ' + data);
            data = [];
        }
        feeds = data;
    }

    function slideMenu(offset) {
        var targetPosition = menuTopPosition + offset;

        if (!menuMinPosition) {
            menuMinPosition = Math.round(menuPageSize - $feedsMenu.outerHeight(true));
        }

        targetPosition = offset < 0 ? Math.max(targetPosition, menuMinPosition) : Math.min(targetPosition, 0);

        if (!menuIsSliding) {
            menuIsSliding = true;
            $slideUp.removeClass("disabled");
            $slideDown.removeClass("disabled");

            $feedsMenu.animate({ top: targetPosition }, "medium", function () {
                menuTopPosition = parseInt($feedsMenu.css("top"), 10);
                menuIsSliding = false;
                if (menuTopPosition === 0)
                    $slideUp.addClass("disabled");
                else if (menuTopPosition === menuMinPosition)
                    $slideDown.addClass("disabled");
            });
        }
    }

    function getDateOffset(date) {

        if (typeof (date) === "string") {

            //atom feeds date format.
            if (/\d+T\d+/.test(date)) {
                var newDateFormat = date.replace('T', ' ').split('+')[0];
                var date = new Date(newDateFormat.split(" ")[0]);
            }
            else {

                // get rid of the : for example bad - "Wed, 24 Aug 2011 14:30:44 GMT+00:00" good - "Wed, 24 Aug 2011 14:30:44 GMT+0000"
                date = date.replace(/(\d\d):(\d\d)$/, "$1$2");
                try {
                    date = new Date(date);
                }
                catch (e) {
                    return "";
                }

            }

        }
        var returnStr = "";
        var timespanInHours = Math.round(((new Date()) - date) / (1000 * 60 * 60));
        if (timespanInHours == 1) {
            returnStr = getKey("CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOUR");
        } else {
            returnStr = getKey("CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_HOURS").replace("{0}", timespanInHours);
        }

        if (timespanInHours < 0)
            return "";
        if (timespanInHours > 23) {
            timespanInHours = Math.round(timespanInHours / 24);
            if (timespanInHours == 1) {
                returnStr = getKey("CCTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_ONEDAY");
            } else {
                returnStr = getKey("CTLP_STR_ID_MULTIRSS_DLG_TIMEPASS_DAYS").replace("{0}", timespanInHours);
            }
        }

        if (isNaN(timespanInHours)) {
            return "";
        }

        return returnStr;
    }

    function getTarget(href) {
	try{
		if (href){
			var domain = href.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
			if (domain)
				return domain[1];
		}
	}
	catch(e){
		// failed to get domain
	}
        return "rssItem";
    }

    function toggleReadStatus(itemIndex, isRead) {
        var currentFeedItems = feeds[currentFeedIndex].data.item,
			readStatus;

        function toggle(item) {
            item.isRead = isRead !== undefined
				? isRead
				: item.isRead !== undefined ? !item.isRead : true;

            //changeBadgeCount(item.isRead ? -1 : 1);
            return item.isRead;
        }

        if (itemIndex !== null) {
            $itemsList.children(":eq(" + itemIndex + ")").toggleClass("readFeedItem");
            readStatus = toggle(currentFeedItems[itemIndex]);
            changeBadgeCount(readStatus ? -1 : 1);
            // send usage
            var usageType = readStatus ? "RSS_MARK_READ" : "RSS_MARK_UNREAD";
            conduit.logging.usage.log(usageType, {});
        }
        else {
            var offset = 0;
            $itemsList.children()[isRead ? "addClass" : "removeClass"]("readFeedItem");
            for (var i = 0, count = currentFeedItems.length; i < count; i++) {
                var currentItem = currentFeedItems[i],
					previousValue = currentItem.isRead;

                if (previousValue !== isRead) {
                    offset += isRead ? -1 : 1;
                    currentItem.isRead = isRead;
                }
            }
            changeBadgeCount(offset);
            // send usage
            var usageType = isRead ? "RSS_MARK_READ" : "RSS_MARK_UNREAD";
            conduit.logging.usage.log(usageType, {});
        }

        toggleButtons();
        conduit.messaging.sendRequest("backgroundPage", "toggleRead", JSON.stringify({ feedId: feeds[currentFeedIndex].uniqueCompId, itemIndex: itemIndex, isRead: itemIndex === null ? isRead : readStatus }), function () { });

        return readStatus;
    }

    function changeBadgeCount(offset) {

        var menuItemDisplayIconDiv = $(".menuItemDiv:eq(" + currentFeedIndex + ") .menuItemDisplayIconDiv", $feedsMenu);
        var badge = menuItemDisplayIconDiv.find(".menuItemBadge");
        if (badge && badge.length == 0) {
            // this can happen when on init all the items were in state "read" and now some or all items state was changed.
            badge = $('<span></span>').text(0);
            menuItemDisplayIconDiv.append(badge);
        }

        var count = offset !== 0 ? parseInt(badge.text(), 10) + offset : 0;

        count = count >= 0 ? count : 0;
        badge.text(count);
        if (!count)
            badge.css("display", "none");
        else {
            badge[0].className = "menuItemBadge menuItemBadge_" + String(count).length;
            if (badge.css("display") === "none")
                badge.css("display", "block");
        }
    }

    function deleteItems(itemIndex) {
        var msg_delete = getKey("CTLP_STR_ID_RSS_DELETE_MESSAGE");
        var msg_delete_all = getKey("CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE");

        var confirmMsg = itemIndex !== null ? msg_delete : msg_delete_all;
        var deleteJob = function () {
            if (itemIndex !== null) {
                $itemsList.children(":eq(" + itemIndex + ")").remove();
                feeds[currentFeedIndex].data.item.splice(itemIndex, 1);
            }
            else {
                $itemsList.empty();
                feeds[currentFeedIndex].data.item = [];
                $deleteBtn.addClass("disabled");
                $readBtn.addClass("disabled");
                $unreadBtn.addClass("disabled");
                currentFeedHasItems = false;
            }

            toggleButtons();
            conduit.messaging.sendRequest("backgroundPage", "delete", JSON.stringify({ feedId: feeds[currentFeedIndex].uniqueCompId, itemIndex: itemIndex }), function (decreaseFromBadge) {
                if (decreaseFromBadge) {
                    decreaseFromBadge = JSON.parse(decreaseFromBadge);
                    changeBadgeCount(decreaseFromBadge);
                }
            });
        }

        jConfirm(confirmMsg, alert_title || 'RSS', function (sok) {
            if (sok) {
                deleteJob();
            }
        });
    }

    function toggleButtons() {
        var currentFeedData = feeds[currentFeedIndex].data;
	var itemsCount = (currentFeedData && currentFeedData.item) ? currentFeedData.item.length : 0;
	var unreadItemsCount = countUnreadItems(currentFeedData);
	var readItemsCount = itemsCount - unreadItemsCount;

        currentFeedHasItems = !!itemsCount;

        $readBtn.toggleClass("disabled", !unreadItemsCount);
        $unreadBtn.toggleClass("disabled", !readItemsCount);
        $deleteBtn.toggleClass("disabled", !currentFeedHasItems);
    }

    function setItems(feedIndex) {
        var feed = feeds[feedIndex],
	items =(feed.data && feed.data.item) ? feed.data.item : [];

        //Sometimes the images urls are missing the 'http:' prefix (crashes IE)
        for (var i = 0; i < items.length; i++) {
            if (items[i].image)
                items[i].image = (items[i].image.indexOf('//') === 0) ? items[i].image.substr(2) : items[i].image;
        }

        feedTitle.innerHTML = feed.data && feed.data.title ? feed.data.title : feed.displayText || appTitle;
        $itemsList.html($.tmpl(templates.feedItemTemplate, items,
			{
			    dateFormatter: getDateOffset,
			    getTarget: getTarget
			}
		));
		$('.feedItemImage', $itemsList).on('error', function () {
			$(this).hide();
		});



        if ($selectedFeedMenuItem)
            $selectedFeedMenuItem.removeClass("selectedFeed");

        $selectedFeedMenuItem = $feedsMenu.children(":eq(" + feedIndex + ")").addClass("selectedFeed");
        currentFeedIndex = feedIndex;

        toggleButtons();
    }

    function countUnreadItems(itemsData) {
        var unreadCount = 0;
        if (itemsData && itemsData.item) {
            for (var i = 0, itemsCount = itemsData.item.length; i < itemsCount; i++) {
                if (!itemsData.item[i].isRead)
                    unreadCount++;
            }

            itemsData.unreadCount = unreadCount;
        }

        return unreadCount;
    }

    function getBadgeClass(unreadItemsCount) {
        var str = String(unreadItemsCount);
        return "menuItemBadge_" + str.length;
    }

    function getKey(key) {
        if (!key)
            return "";
        if (translation) {
            return translation[key];
        } else {
            return defaultTranslation[key];
        }
    }

    function init(data, isupdate) {
        try {
            data = JSON.parse(data);
        }
        catch (e) {
            conduit.logging.logDebug('RssClassic/popup.js/init - received wrong data: ' + data);
            data = [];
        }
        feeds = data;

        !isupdate && $('#refreshBtn').attr("title", getKey("CTLP_STR_ID_RSS_REFRESH_TOOLTIP"));
        !isupdate && $('#deleteBtn').attr("title", getKey("CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_TOOLTIP"));
        !isupdate && $('#readBtn').attr("title", getKey("CTLP_STR_ID_RSS_MARK_ALL_AS_READ_TOOLTIP"));
        !isupdate && $('#unreadBtn').attr("title", getKey("CTLP_STR_ID_RSS_MARK_ALL_AS_UNREAD_TOOLTIP"));

        if (!isupdate) {
            $.alerts.okButton = getKey("CTLP_STR_ID_GLOBAL_OK");
            $.alerts.cancelButton = getKey("CTLP_STR_ID_GLOBAL_CANCEL");
            conduit.advanced.localization.getLocale(function (result) {
                var locale = result;
                if (locale.alignMode) {
                    $.alerts.direction = locale.alignMode.toLowerCase();
                }
                if (locale.languageAlignMode) {
                    $.alerts.direction = locale.languageAlignMode.toLowerCase();
                }
            });
        }

        // limit the feed menu title text.
        if (feeds) {
            var displayText, limit = 32;
            for (var index in feeds) {
                displayText = feeds[index].displayText;
                if (displayText && displayText.length > limit) {
                    // cut the end and add ...
                    feeds[index].displayText = displayText.substring(0, limit).concat('...')
                }
            }
        }
        if (isupdate) {
            $feedsMenu.html('');
        }
        $.tmpl(templates.menuItemTemplate, feeds, { countUnreadItems: countUnreadItems, getBadgeClass: getBadgeClass }).appendTo($feedsMenu);
        menuPageSize = $menuNav.offset().top - $feedsMenu.offset().top;
        if ($feedsMenu.outerHeight(true) < menuPageSize) {
            $menuNav.hide();
        }
        if (!isupdate) {
            $("#feedsMenuWrap").css({ height: menuPageSize, overflow: "hidden" });
        }


        setItems(last_selected_feed_index);

        if (feeds.length === 1) {
            var $sidebar = $("#sidebar");
            $sidebar.remove();
            document.getElementById("content").style.marginLeft = "0";
            $main.css({ width: RSS_FEED_ITEM_WIDTH - 2 });
        }

        $("#feedTitle").ellipsis();
        $("#appTitle").ellipsis();
        $('.menuItemDisplayTextDiv').ellipsis();
        if (!isupdate) {
            conduit.messaging.onTopicMessage.addListener("onDataChange", function (data) {
                updateFeedsObject(data);
                init(data, true);
            });
        }
        initialized = true;
    }

    var $window = $(window),
		$main = $("#main"),
		windowHeight = $window.height(),
		windowWidth = $window.width();

    $main.css({
        height: windowHeight - 4,
        width: windowWidth - 2
    });

    $itemsList.height(windowHeight - (41));

    $itemsList.delegate("a.deleteBtn", "click", function (e) {
        e.preventDefault();
        deleteItems($(this).closest(".feedItem").index());
        conduit.logging.usage.log("RSS_DELETE_ITEM", {});
    })
	.delegate("a.readBtn", "click", function (e) {
	    e.preventDefault();
	    var readStatus = toggleReadStatus($(this).closest(".feedItem").index());
	    var title = readStatus ? "Mark as unread" : "Mark as read";
	    $(this).attr('title', title);
	})
	.delegate(".feedItemLink", "click", function (e) {
	    e.preventDefault();
	    var itemIndex = $(this).closest(".feedItem").index()
	    var item = feeds[currentFeedIndex].data.item[itemIndex];
	    if (!(item && item.isRead && item.isRead == true)) {
	        // toggle the item as read only if it not already toggled as read.
	        toggleReadStatus(itemIndex, true);
	    }
	    conduit.tabs.create({ url: this.href });
	    conduit.logging.usage.log("RSS_OPEN_ITEM", {});
	    conduit.app.popup.close();
	});
	/*
	in chrome prevent scroll of main page 
    */
    $itemsList.bind('mousewheel', function (e, d) {
	    var height = $itemsList.height();
	    if ((this.scrollHeight === (this.scrollTop + height + 1) && e.originalEvent.wheelDeltaY < 0) || (this.scrollTop === 0 && e.originalEvent.wheelDeltaY > 0)) {
	        e.preventDefault();
	    }
	});
    // Set up templates from HTML:
    $("#templates script").each(function () {
        templates[this.id] = $.template(this.innerHTML);
    });

    // INIT:
    if (!initialized) {
        conduit.messaging.sendRequest("backgroundPage", "getGeneralData", "", function (data) {
            try {
                data = JSON.parse(data);
            }
            catch (e) {
                conduit.logging.logDebug('RssClassic/popup.js/init (callback of sendRequest to "getGeneralData") - received wrong data: ' + data);
            }
            document.getElementById("appTitle").innerHTML = appTitle = data.appTitle;
        });
        conduit.messaging.sendRequest("backgroundPage", "getTranslation", "", function (translationData) {
            try {
                translationData = JSON.parse(translationData);
            }
            catch (e) {
                conduit.logging.logDebug('RssClassic/popup.js/init (callback of sendRequest to "getTranslation") - received wrong translationData: ' + translationData);
                translationData = null;
            }
            if (translationData) {
                translation = translationData;
            } else {
                translation = defaultTranslation;
            }
            conduit.advanced.localization.getKey(['CTLP_STR_ID_GLOBAL_OK'
                                                 , 'CTLP_STR_ID_GLOBAL_CANCEL'
                                                 , 'CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE'], function (data) {
                                                     translation['CTLP_STR_ID_GLOBAL_OK'] = data['CTLP_STR_ID_GLOBAL_OK'];
                                                     translation['CTLP_STR_ID_GLOBAL_CANCEL'] = data['CTLP_STR_ID_GLOBAL_CANCEL'];
                                                     translation['CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE'] = data['CTLP_STR_ID_RSS_DELETE_ALL_ITEMS_MESSAGE'];
                                                     $.alerts.okButton = getKey("CTLP_STR_ID_GLOBAL_OK");
                                                     $.alerts.cancelButton = getKey("CTLP_STR_ID_GLOBAL_CANCEL");
                                                 });


            conduit.messaging.sendRequest("backgroundPage", "getFeeds", "", init);
            conduit.app.getSettingsData(function (settings) {
                if (!settings || typeof (settings) != "object" || !settings.data) return;
                alert_title = settings.displayText;
            });
        });
    }
})(jQuery);
