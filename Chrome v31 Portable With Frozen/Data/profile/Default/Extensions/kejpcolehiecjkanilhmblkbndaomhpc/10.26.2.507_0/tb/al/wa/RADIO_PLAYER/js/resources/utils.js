
function isSet(obj) {
          return (obj != null && typeof(obj) != undefined);
}

function isEmpty(obj) {
          if(!isSet(obj)) {
                    return true;
          }
          return (obj == '') ? true : false;
}

function createImg(src) {
    var cacheImage = document.createElement('img');
    cacheImage.src = src;
    return cacheImage;
}

String.format = function () {
    var replacements = arguments;
    return arguments[0].replace(/\{(\d+)\}/gm, function(string, match) {
        return replacements[parseInt(match) + 1];
    });
}