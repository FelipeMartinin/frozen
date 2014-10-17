var x = new XMLHttpRequest();
x.open('GET', 'Custom.css');
x.onload = function() {
    chrome.devtools.panels.applyStyleSheet(x.responseText);
};
x.send();