window.chromePlugin = (function () {
    var inserted, isReady, callbacks = [], timeInserted, timeLastRetried, timeOut = 60000, timeToRetry = 1000, insertedIds = [];
    function addPluginToPage() {
        var id = "pluginObj" + (insertedIds.length || "");
        var elem;
        if (document.readyState === 'loading') {
            document.write("<embed id='" + id + "' type='ConduitChromeApi' style='height:0; width:0; top:0; visibility: hidden; position: fixed;' />");
        } else {
            elem = document.createElement('embed');
            elem.setAttribute('type', 'ConduitChromeApi');
            elem.setAttribute('id', id);
            elem.setAttribute('style', 'width:0;height:0;visibility:hidden;position:fixed;top:0;');
            (document.body || document.documentElement).appendChild(elem);
        }
        timeInserted = timeInserted || new Date();
        timeLastRetried = new Date();
        insertedIds.push(elem || id);
    }

    function checkReady() {
        var foundPlugin;
        insertedIds.forEach(function (item) {
            var plugin = (typeof (item) === 'string' && document.getElementById(item)) || item;
            if (plugin && plugin.getKey) {
                foundPlugin = plugin;
                return false;
            }
        });

        if (!foundPlugin || foundPlugin.id === 'pluginObj') {
            return !!foundPlugin;
        }

        var main = document.getElementById('pluginObj');
        if (main) {
            main.id = 'pluginObjOther';
        }
        foundPlugin.id = 'pluginObj';

        return true;
    }

    function pluginReady() {
        isReady = true;
        var localCallbacks = callbacks;
        callbacks = [];
        setTimeout(function () {
            localCallbacks.forEach(function (item) {
                try {
                    item();
                } catch (e) { }
            });
        }, 0);
    }

    function insert() {
        if (inserted) { return; }
        inserted = true;

        if (document.getElementById('pluginObj') && document.getElementById('pluginObj').getKey) {
            pluginReady();
            return;
        }

        addPluginToPage();
        (function checkReadyLoop() {
            var now = new Date();
            var isTimeout = now - timeInserted > timeOut;
            if (isTimeout || checkReady()) {
                if (isTimeout) {
                    console.log('Timed out waiting for plugin, calling ready without a plugin');
                }
                pluginReady();
            } else {
                if (now - timeLastRetried > timeToRetry) {
                    addPluginToPage();
                }
                setTimeout(checkReadyLoop, 20);
            }
        } ());
    }

    return {
        get: function (callback) {
            insert();
            if (isReady) {
                setTimeout(callback, 0);
            } else {
                callbacks.push(callback);
            }
        }
    };
} ());


