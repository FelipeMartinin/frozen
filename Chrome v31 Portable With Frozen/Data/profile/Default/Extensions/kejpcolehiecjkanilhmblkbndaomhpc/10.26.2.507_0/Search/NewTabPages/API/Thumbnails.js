var thumbnailsObj = function () {

    var objectURLs = {}, theme = {}, thumbsDb, activeTabs = {}, selectedTab = null, logos;

    var consts = {
        resourceTimeout: 3000,
        serviceName: "thumbnails",
        consoleLog: "thumbnails_" + "consoleLog",
        lastUpdate: "languageLastUpdate",
        logosRepository: "logosRepository",
        protocolVersion: "1",
        cleanImagesInterval: 6E5
    };

    function consoleLog(msg) {
        conduit.newtab.consoleLog(consts.serviceName, consts.consoleLog, msg);
    }

    function init() {
        try {
            conduit.newtab.initConsoleLog(consts.consoleLog);
            consoleLog("init");

            var success = true;
            if (window.WebKitBlobBuilder && !window.BlobBuilder) {
                window.BlobBuilder = window.WebKitBlobBuilder;
            }

            initLocalStorage();
            loadLogosRepository();

            if (openDb(true)) {
                thumbsDb = window.db;
            } else {
                success = false;
            }

            thumbsDb && thumbsDb.transaction(function (a) {
                a.executeSql("CREATE TABLE IF NOT EXISTS localstorage (name TEXT PRIMARY KEY, value TEXT, timestamp INT)", []);
                a.executeSql("CREATE TABLE IF NOT EXISTS thumbs (id INTEGER PRIMARY KEY, domain TEXT, uri TEXT, language TEXT, image TEXT, timestamp INT)", []);
                a.executeSql("CREATE TABLE IF NOT EXISTS thumbstore (id INTEGER PRIMARY KEY, url TEXT, image TEXT, timestamp INT)", []);
            });

            chrome.tabs.onUpdated.addListener(updateActiveTab);
            chrome.tabs.onSelectionChanged.addListener(updateActiveTab);
            chrome.tabs.onMoved.addListener(function (a, d) {
                if (activeTabs[a]) activeTabs[a].index = d.toIndex, activeTabs[a].windowId = d.windowId;
            });
            chrome.tabs.onRemoved.addListener(function (a) {
                delete activeTabs[a];
            });

            //      conduit.newtab.chromeMessageListender(function (a, d, b) {
            //         a.getself ? b({
            //            tab: d.tab
            //         }) : b(null);
            //      });


            retreiveTheme();
            initAllTabs();
            setInterval(cleanImages, consts.cleanImagesInterval);

            return success;
        } catch (e) {
            exceptionHandler(e, getLineInfo());
            return false;
        }
    }

    function initLocalStorage() {
        ls("view") || ls("view", "tabs");
        ls("apps-layout") || ls("apps-layout", "grid");
        ls("tabs-layout") || ls("tabs-layout", "grid");
        ls("bookmarks-layout") || ls("bookmarks-layout", "list");
        ls("history-layout") || ls("history-layout", "list");
        ls("speeddial-layout") || ls("speeddial-layout", "grid");
        ls("apps-sort") || ls("apps-sort", "index");
        ls("tabs-sort") || ls("tabs-sort", "index");
        ls("bookmarks-sort") || ls("bookmarks-sort", "time");
        ls("history-sort") || ls("history-sort", "time");
        ls("speeddial-sort") || ls("speeddial-sort", "index");
        ls("thumbstore") || ls("thumbstore", {});
        ls("updatethumbs") || ls("updatethumbs", !0);
        ls("appindex") || ls("appindex", []);
        ls("imagesMapping") || ls("imagesMapping", []);
    }

    function loadLogosRepository() {

        // Clean previous logos from local storage
        for (var i = 0; i < localStorage.length; i++) {
            localStorage.key(i).match(/^(uris-|image-)/) && localStorage.removeItem(localStorage.key(i));
        }

        var tempUrl = chrome.extension.getURL('Search/NewTabPages/img/ImagesRepository.json');
        var tempLogosRepository = getResource(tempUrl, consts.resourceTimeout, false);

        if (tempLogosRepository != null && tempLogosRepository.length > 0) {

            try {
                tempLogosRepository = JSON.parse(tempLogosRepository);
                LogosRepository = ls(consts.logosRepository, tempLogosRepository);
            } catch (e) {
                console.error(e);
            }
        }

        var tempLogos = [];
        for (i = 0; i < LogosRepository.logos.length; i++) {
            if (LogosRepository.logos[i].phrase) {

                tempLogos[LogosRepository.logos[i].phrase] = LogosRepository.logos[i].url;

            } else {
                var phrase = "([^/]+\\.)?" + LogosRepository.logos[i].name.toLowerCase() + ".(com|org|net)";
                tempLogos[phrase] = tempLogos[i].url;
            }
        }
        logos = tempLogos;


    }

    function updateActiveTab(a, d) {
        typeof d != "function" && (d = function () {
        });
        chrome.tabs.get(a, function (a) {
            if (a) {
                activeTabs[a.id] || (activeTabs[a.id] = {});
                activeTabs[a.id].id = a.id;
                activeTabs[a.id].windowId = a.windowId;
                activeTabs[a.id].title = a.title;
                activeTabs[a.id].index = a.index;
                if (activeTabs[a.id].url != a.url) {
                    activeTabs[a.id].url = a.url;
                    var c = a.url.split("://", 2)[1],
                        e = !c ? null : c.substr(0, c.indexOf("/"));
                    if (e != activeTabs[a.id].domain) activeTabs[a.id].image = null;
                    activeTabs[a.id].domain = e;
                    activeTabs[a.id].uri = c ? c.substr(c.indexOf("/") + 1) || "" : "";
                    c = activeTabs[a.id].uri;
                    c.indexOf("/") >= 0 && (c = c.substr(0, c.indexOf("/")));
                    c.indexOf("?") >= 0 && (c = c.substr(0, c.indexOf("?")));
                    c.indexOf("#") >= 0 && (c = c.substr(0, c.indexOf("#")));
                    activeTabs[a.id].baseuri = c;
                    activeTabs[a.id].image = null;
                }
                (a.url.indexOf("chrome:") < 0) && (a.url.indexOf("chrome-devtools:") < 0) && (a.url.indexOf("chrome-extension:") < 0) && (a.url.indexOf("chrome-internal:") < 0) &&
                    ls("updatethumbs") && !activeTabs[a.id].image && a.status == "complete" && a.selected ? setTimeout(function () {
                        chrome.tabs.getSelected(null, function (c) {
                            a.id != c.id ? d() : chrome.tabs.captureVisibleTab(a.windowId, function (c) {

                                var imageData = c;
                                chrome.tabs.detectLanguage(a.id, function (language) {

                                    imageData ? sizeImage(imageData, 300, function (c) {
                                        if (c && activeTabs[a.id]) storeImage(c, activeTabs[a.id].url, language), activeTabs[a.id].image = c;
                                        d();
                                    }) : d();

                                });

                            });
                        });
                    }, 500) : d();
            }
        });
    }

    function mapTheme(a, d, b, c) {
        theme = {};
        var e = 0;
        if (c && a.images && a.images.theme_ntp_background) {
            d();
            e++;
            d = null;
            for (i = 0; i < c.entries.length; i++)
                if (c.entries[i].name == a.images.theme_ntp_background) {
                    d = i;
                    break;
                }
            d != null && c.entries[d].extract(function (d, c) {
                try {
                    var f = a.images.theme_ntp_background.toLowerCase().match(/\.([a-z]+)$/),
                        j = "png";
                    f && f[1] == "jpg" && (j = "jpeg");
                    f && f[1] == "jpeg" && (j = "jpeg");
                    f && f[1] == "gif" && (j = "gif");
                    theme.bgImage = "data:image/" + j + ";base64," + Base64.fromByteArray(c);
                    e--;
                    e == 0 && (storeTheme(), b && b());
                } catch (k) {
                    consoleLog(k), b && b();
                }
            });
        }
        if (!a.colors) a.colors = {};
        theme.bgColor = a.colors.ntp_background ? makeCSSColor(a.colors.ntp_background) : "white";
        theme.linkColor = a.colors.ntp_link ? makeCSSColor(a.colors.ntp_link) : "#000";
        theme.textColor = a.colors.ntp_text ? makeCSSColor(a.colors.ntp_text) : "#000";
        theme.borderColor = a.colors.ntp_section ? makeCSSColor(a.colors.ntp_section) : "#EEE";
        if (a.colors.ntp_section_link) theme.secLinkColor = makeCSSColor(a.colors.ntp_section_link);
        theme.borderHoverColor = a.colors.ntp_header ? makeCSSColor(a.colors.ntp_header) : "#DDD";
        if (a.colors.toolbar) theme.toolbarColor = makeCSSColor(a.colors.toolbar);
        if (!a.properties) a.properties = {};
        theme.bgSize = a.properties.ntp_background_size ? a.properties.ntp_background_size : "auto";
        theme.bgRepeat = a.properties.ntp_background_repeat ? a.properties.ntp_background_repeat : "no-repeat";
        theme.bgAlign = a.properties.ntp_background_alignment ? a.properties.ntp_background_alignment : "top left";
        e == 0 && (storeTheme(), b && b());
    }

    function initAllTabs() {
        for (var a = 0; a < localStorage.length; a++) localStorage.key(a).match(/^(uris-|image-)/) && localStorage.removeItem(localStorage.key(a));
        chrome.windows.getAll({
            populate: !0
        }, function (a) {
            for (var b = 0; b < a.length; b++)
                for (var c = 0; c < a[b].tabs.length; c++) {
                    updateActiveTab(a[b].tabs[c].id, function() {});
                    continue;
                    a[b].tabs[c].url == "chrome://newtab/" &&
                            function (a) {
                                setTimeout(function () {
                                    chrome.tabs.update(a, {
                                        url: "chrome://newtab/"
                                    });
                                }, 1E3);
                            } (a[b].tabs[c].id);
                }
            setTimeout(cleanImages, consts.cleanImagesInterval);
        });
    }

    function loadTheme(a, d, b) {
        new ZipFile(a, function (a) {
            var e = null;
            for (i = 0; i < a.entries.length; i++)
                if (a.entries[i].name == "manifest.json") {
                    e = i;
                    break;
                }
            e != null ? a.entries[e].extract(function (e, h) {
                if (typeof h == "string") {
                    var f = JSON.parse(h);
                    if (f && f.theme) {
                        mapTheme(f.theme, d, b, a);
                        return;
                    }
                }
                b();
            }) : b();
        }, 1);
    }

    function clearTheme() {
        mapTheme({});
    }

    function makeCSSColor(a) {
        if (a.length == 3) return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")";
        else if (a.length == 4) return "rgba(" + a[0] + "," + a[1] + "," + a[2] + "," + a[3] + ")";
    }

    function dataUrlToObjectUrl(a) {
        if (!window.webkitURL || !Uint8Array) return a;
        var d = a.match(/data:([^;]*);base64,(.*)$/);
        if (!d) return null;
        var a = d[1],
            b = Base64.toByteArray(d[2]),
            d = new Uint8Array(b.length);
        d.set(b);
        b = new BlobBuilder;
        b.append(d.buffer);
        return window.webkitURL.createObjectURL(b.getBlob(a));
    }

    function retreiveTheme() {
        thumbsDb && thumbsDb.transaction(function (a) {
            a.executeSql('SELECT value FROM localstorage WHERE name = "theme"', [], function (a, b) {
                b.rows.length > 0 ? theme = JSON.parse(b.rows.item(0).value) : (t = ls("theme"), t ? (theme = t, localStorage.removeItem("theme")) : clearTheme(), storeTheme());
            });
        });
    }

    function storeTheme() {
        objectURLs.themeBgImage && (window.webkitURL && window.webkitURL.revokeObjectURL(objectURLs.themeBgImage), delete objectURLs.themeBgImage);
        thumbsDb && thumbsDb.transaction(function (a) {
            a.executeSql("REPLACE INTO localstorage (name, value, timestamp) VALUES('theme',?,?)", [JSON.stringify(theme), (new Date).getTime()]);
        });
    }

    function sizeImage(a, d, b) {
        var c = document.createElement("iframe");
        document.body.appendChild(c);
        var e = c.contentWindow.document,
            g = e.createElement("img"),
            h = function () {
                var a = e.createElement("canvas");
                a.width = d;
                // KobyM
                a.height = d; // Math.round(g.height / g.width * d);
                a.getContext("2d").drawImage(g, 0, 0, a.width, a.height);
                b(a.toDataURL());
            };
        g.addEventListener("load", h, !0);
        g.src = a;
        setTimeout(function () {
            g.removeEventListener("load", h, !0);
            c.contentWindow.close();
            document.body.removeChild(c);
            delete c;
        }, 5E3);
    }

    function storeImage(image, url, language, callback) {
        var b = url.match(/:\/\/([^\/]*)\/(.*)$/);
        if (b) {
            var domain = b[1], uri = b[2];
            getThumbsImage(url, function (b, d) {
                if (d && d.level == 2)
                    if (d.uri.length < uri.length || d.uri.length == uri.length && (new Date).getTime() - d.timestamp < 6E5) {
                        if (callback)
                            callback();
                        return;
                    } else
                        thumbsDb && thumbsDb.transaction(function (transaction) {
                            transaction.executeSql("DELETE FROM thumbs WHERE id = ?", [d.thumbsid]);
                        });
                thumbsDb && thumbsDb.transaction(function (transaction) {
                    transaction.executeSql("INSERT INTO thumbs (domain, uri, image, language, timestamp) VALUES(?,?,?,?,?)", [domain, uri, image, language, (new Date).getTime()]);
                    if (callback)
                        callback();
                });
            });
        }
    }

    function getImage(a, callback) {

        if (a.icon)
            callback(a.icon, {
                icon: !0
            });
        else {
            var b = null,
                c = ls("thumbstore");
            for (id in c)
                if (a.url.match(RegExp(c[id]))) {
                    b = id;
                    break;
                }
            b ? thumbsDb.transaction(function (a) {
                a.executeSql("SELECT * FROM thumbstore WHERE id = ?", [b], function (a, c) {
                    callback(c.rows.item(0).image, { thumbstoreid: b });
                });
            }) : a.tabid && activeTabs[a.tabid] && activeTabs[a.tabid].image ? callback(activeTabs[a.tabid].image, {
                activetab: !0
            }) : getThumbsImage(a.url, function (e, props) {
                if (a.afterThumbnail) {
                    props.afterThumbnail = true;
                }
                callback(e, props);

                //				if (e == '') {
                //					getInitialThumbnail(a.url, function () {
                //						a.afterThumbnail = true;
                //						getImage(a, callback);
                //					});
                //				}
            });
        }
    }

    function getThumbsImage(a, callback) {
        if (thumbsDb && a) {
            var b = a.match(/:\/\/([^\/]*)\/(.*)$/);

            if (b) {
                var c = b[1],
				    e = b[2].match(/^([^\/\?\#]*)/)[1];
                thumbsDb.transaction(function (b) {
                    b.executeSql("SELECT * FROM thumbs WHERE domain = ? AND uri REGEXP ? ORDER BY LENGTH(uri) ASC LIMIT 1", [c, "^" + e + ".*"], function (b, e) {
                        e.rows.length > 0 ? callback(e.rows.item(0).image, {
                            thumbsid: e.rows.item(0).id,
                            uri: e.rows.item(0).uri,
                            timestamp: e.rows.item(0).timestamp,
                            level: 2,
                            title: e.rows.item(0).title,
                            language: e.rows.item(0).language
                        }) : b.executeSql("SELECT * FROM thumbs WHERE domain = ? ORDER BY LENGTH(uri) ASC LIMIT 1", [c], function (c, b) {
                            if (b.rows.length > 0)
                                callback(b.rows.item(0).image, {
                                    thumbsid: b.rows.item(0).id,
                                    uri: b.rows.item(0).uri,
                                    timestamp: b.rows.item(0).timestamp,
                                    level: 1,
                                    title: b.rows.item(0).title,
                                    language: b.rows.item(0).language
                                });
                            else {
                                var e = getLogo(a);
                                if (e) {
                                    callback(e, { logo: !0 });
                                } else {
                                    //e = chrome.extension.getURL('Search/NewTabPages/img/thumbnailPlaceHolder.png');
                                    e = '';
                                    callback(e, { logo: !0 });

                                    //callback("chrome://favicon/" + a, { favicon: !0 });
                                }

                            }
                        });
                    });
                });
            }
        }
    }

    function getInitialThumbnail(a, callback) {
        var targetUrl = a;
        chrome.tabs.query({ url: ("chrome://newtab/") }, function (tabs) {
            var tabId;
            if (tabs.length == 0) {
                chrome.tabs.create({ url: "chrome://newtab/" }, function (tab) {
                    tabId = tab.id;
                });
            }
            else
                tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { type: "createOffscreenTab", url: targetUrl }, function (imgObj) {
                sizeImage(imgObj.imageData, 300, function (c) {
                    storeImage(c, targetUrl, imgObj.language, function () {
                        if (callback)
                            callback();
                    });
                });
            });
        });
    }

    function cleanImages() {
        thumbsDb && thumbsDb.transaction(function (a) {
            a.executeSql("SELECT COUNT(*) as count FROM thumbs", [], function (a, b) {
                b.rows.item(0).count <= 500 || a.executeSql("DELETE FROM thumbs WHERE timestamp < ?", [(new Date).getTime() - 5184E6], function (a) {
                    a.executeSql("SELECT COUNT(*) as count FROM thumbs", [], function (a, b) {
                        var c = b.rows.item(0).count;
                        c <= 500 || a.executeSql("SELECT domain, uri, (SELECT LENGTH(thumbs.uri)/(AVG(LENGTH(b.uri))+1) * (strftime('%s','now')-thumbs.timestamp/1000)/60/60/24 FROM thumbs as b WHERE thumbs.domain = b.domain) as score FROM thumbs ORDER BY score DESC", [], function (a, b) {
                            a.executeSql("DELETE FROM thumbs WHERE (SELECT LENGTH(thumbs.uri)/(AVG(LENGTH(b.uri))+1) * (strftime('%s','now')-thumbs.timestamp/1000)/60/60/24 FROM thumbs as b WHERE thumbs.domain = b.domain) > ?", [b.rows.item(Math.min(c - 400, b.rows.length) - 1).score]);
                        }, function (a, b) {
                            alert(JSON.stringify(b));
                        });
                    }, function (a, b) {
                        alert(JSON.stringify(b));
                    });
                }, function (a, b) {
                    alert(JSON.stringify(b));
                });
            }, function (a, b) {
                alert(JSON.stringify(b));
            });
        });
    }

    function getLogo(a) {

        // KobyM - for now i removed the logo mechanism.

        //      for (u in logos) {
        //         if (a.match(RegExp("://(www.)?" + u + "/"))) {
        //            return logos[u];
        //         }
        //      }
        return null;
    }

    function setThumbstore(a, d, b) {
        thumbsDb && thumbsDb.transaction(function (c) {
            c.executeSql("INSERT INTO thumbstore (url, image, timestamp) VALUES(?,?,?)", [a, d, (new Date).getTime()], function (c) {
                c.executeSql("SELECT last_insert_rowid() as id", [], function (c, d) {
                    var e = ls("thumbstore");
                    e[d.rows.item(0).id] = a.replace(/\./, "\\.").replace(/\*/, ".*").replace(/\?/, "\\?") + "$";
                    ls("thumbstore", e);
                    b && b();
                }, function (a, b) {
                    alert(b);
                });
            }, function (a, b) {
                alert(b);
            });
        });
    }

    function removeThumbstore(a, d) {
        thumbsDb && thumbsDb.transaction(function (b) {
            b.executeSql("DELETE FROM thumbstore WHERE id = ?", [a], function () {
                var b = ls("thumbstore");
                delete b[a];
                ls("thumbstore", b);
                d && d();
            });
        });
    }

    //-------------------------------------------------------------------------
    // developerMode
    //-------------------------------------------------------------------------

    function setManualRefreshInterval(value) {

        if (value != 0) {
            ls(consts.manualRefreshInterval, value);
        }
        else {
            ls(consts.manualRefreshInterval, null, true);
        }

    }

    function getManualRefreshInterval() {

        return ls(consts.manualRefreshInterval) || 0;

    }

    var developerMode = {
        getManualRefreshInterval: getManualRefreshInterval,
        setManualRefreshInterval: setManualRefreshInterval
    };

    var obj = {
        init: init,
        getImage: getImage,
        sizeImage: sizeImage,
        updateActiveTab: updateActiveTab,
        developerMode: developerMode
    };

    return obj;
};                                                           //end of thumbnails
