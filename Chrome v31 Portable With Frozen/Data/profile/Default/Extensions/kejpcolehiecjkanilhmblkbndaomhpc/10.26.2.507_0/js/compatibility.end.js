var css = document.createElement('style');
css.innerHTML = '@media print { #main-iframe-wrapper .TOOLBAR_IFRAME { width: 0 !important; } html { margin-top: 0 !important; } }';
(document.head || document.documentElement).appendChild(css);


