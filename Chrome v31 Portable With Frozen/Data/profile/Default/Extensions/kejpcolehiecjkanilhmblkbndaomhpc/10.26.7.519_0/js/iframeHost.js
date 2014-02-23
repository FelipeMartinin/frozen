/**
How the used url is determined:
1. If we find a paramter url=, its value is always used. Important: It must be the last parameter! any parameters found
after it will be considered parameters of the url we will navigate our iframe to!
2. If we find a name= parameter, that name will be set as the injected iframe's name
3. If we find a viewId=, it will be added, prefixed by '#', to the injected iframe's name
*/
var settings = JSON.parse(window.name);

// global profile name is 'Default' unless received by settings. Not sure where window.profileName can come from, but it's a fallback in any case
window.globalProfileName = 'Default';
window.globalProfileName = settings.profileName || window.profileName;
window.globalViewId = settings.viewId;

var givenUrl = settings.url;
var tasks = givenUrl ? 1 : 3;
var frontStageInjectedURL = chrome.extension.getURL("tb/al/al.view.html");
var stateFile = chrome.extension.getURL("tb/al/state.html");

function taskComplete() {
    if (--tasks !== 0) { return; }
    var iframe = document.createElement('iframe');
    var usedUrl = givenUrl || frontStageInjectedURL;
    iframe.src = usedUrl;
    iframe.id = "wrappedIframe";
    if (usedUrl.indexOf(chrome.i18n.getMessage('@@extension_id')) != -1) { // for web apps we set window name to be an ID, for BC apps we set it to be the whole context
        iframe.name = settings.name || '';
    } else {
        var prePopup = 'popup_inner_iframe';
        if (settings.name && typeof settings.name == 'string' && settings.name.indexOf(prePopup) == 0) {
            settings.name = settings.name.substr(prePopup.length);
        }
        var context = {};
        try {
            context = JSON.parse(localStorage.getItem('gadgetsContextHash_' + settings.name));
        } catch (e) { }
        context.name = settings.name;
        iframe.name = JSON.stringify(context);
    }
    document.body.appendChild(iframe);
}

function performTasks() {
    // Task #1: No need to wait for plug in any more, just continue flow
    taskComplete();

    if (givenUrl) {
        return;
    }
    try {
        // Task #2: Decide if using state.html
        var xhr = new XMLHttpRequest();
        xhr.open('GET', stateFile, false);
        xhr.send();
        if (xhr.status === 200) {
            frontStageInjectedURL = stateFile;
        }
        taskComplete();
    } catch (e) { console.error('failed to read state file', e); taskComplete(); }

    // Task #3: Get the O.K from the host page contentScript.js
    var doneOnce;
    window.addEventListener('message', function (msg) {
        if (msg.data.pageHostReady) {
            if (doneOnce) { return; }
            doneOnce = true;

            if (msg.data.viewId && msg.data.viewId != settings.viewId) {
                console.error('bad viewId, we have a problem', msg.data.viewId, settings.viewId);
            }

            taskComplete();
        }
    }, false);

}
performTasks();
