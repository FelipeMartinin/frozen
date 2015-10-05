var x = new XMLHttpRequest();
x.open('GET', 'frozen-theme.css');
x.onload = function() {
    chrome.devtools.panels.applyStyleSheet(x.responseText);
};
x.send();