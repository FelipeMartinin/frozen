// this code was duplicated from the embedded.js file that is being loaded later( too late ).
// we need to set the radio's state as soon as possible, specially for IE8, because
// by default, the radio comes with collapse state from its css.
conduit.storage.app.keys.get("shrinkState", function (state) {

    if (state != "shrinked") {
        $('#smallPanel').hide();
        $('#bigPanel').show();
        $('#canvas').width(177);
        conduit.app.embedded.setEmbedded({ width: 177 });
    }
    else {
        $('#smallPanel').show();
        $('#bigPanel').hide();
        $('#volumeBarContainer').hide();
        $('#thePanel').show();
        $('#canvas').width(64);
        conduit.app.embedded.setEmbedded({ width: 64 });
    }
}, function (e) {
    $('#smallPanel').hide();
    $('#bigPanel').show();
    $('#canvas').width(177);
    conduit.app.embedded.setEmbedded({ width: 177 });
});