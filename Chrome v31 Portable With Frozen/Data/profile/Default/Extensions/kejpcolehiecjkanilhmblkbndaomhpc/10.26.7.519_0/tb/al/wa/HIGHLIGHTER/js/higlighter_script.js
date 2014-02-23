function script_to_inject() {
    RegExp.escape = function(text) {
        if (!arguments.callee.sRE) {
            var specials = [
                '/', '.', '*', '+', '?', '|',
                '(', ')', '[', ']', '{', '}', '\\'
            ];
            arguments.callee.sRE = new RegExp(
                '(\\' + specials.join('|\\') + ')', 'g'
            );
        }
        return text.replace(arguments.callee.sRE, '\\$1');
    }

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt /*, from*/) {
            var len = this.length;
            var from = Number(arguments[1]) || 0;
            from = (from < 0)
                ? Math.ceil(from)
                : Math.floor(from);
            if (from < 0)
                from += len;

            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }

    window.changeCssByClassName = function (classStr, pr, vl) {

        var getAll = getElementsByClassName(classStr);

        for (var i = 0; i < getAll.length; ++i) {
            getAll[i]['style'][pr] = vl;
        }
    };
    window.getElementsByClassName = function (className, tag, elm) {
        if (document.getElementsByClassName) {
            getElementsByClassName = function (className, tag, elm) {
                elm = elm || document;
                var elements = elm.getElementsByClassName(className),
                    nodeName = (tag) ? new RegExp("\\b" + tag + "\\b", "i") : null,
                    returnElements = [],
                    current;
                for (var i = 0, il = elements.length; i < il; i += 1) {
                    current = elements[i];
                    if (!nodeName || nodeName.test(current.nodeName)) {
                        returnElements.push(current);
                    }
                }
                return returnElements;
            };
        }
        else if (document.evaluate) {
            getElementsByClassName = function (className, tag, elm) {
                tag = tag || "*";
                elm = elm || document;
                var classes = className.split(" "),
                    classesToCheck = "",
                    xhtmlNamespace = "http://www.w3.org/1999/xhtml",
                    namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace) ? xhtmlNamespace : null,
                    returnElements = [],
                    elements,
                    node;
                for (var j = 0, jl = classes.length; j < jl; j += 1) {
                    classesToCheck += "[contains(concat(\' \', @class, \' \'), ' " + classes[j] + " \')]";
                }
                try {
                    elements = document.evaluate(".//" + tag + classesToCheck, elm, namespaceResolver, 0, null);
                }
                catch (e) {
                    elements = document.evaluate(".//" + tag + classesToCheck, elm, null, 0, null);
                }
                while ((node = elements.iterateNext())) {
                    returnElements.push(node);
                }
                return returnElements;
            };
        }
        else {
            getElementsByClassName = function (className, tag, elm) {
                tag = tag || "*";
                elm = elm || document;
                var classes = className.split(" "),
                    classesToCheck = [],
                    elements = (tag === "*" && elm.all) ? elm.all : elm.getElementsByTagName(tag),
                    current,
                    returnElements = [],
                    match;
                for (var k = 0, kl = classes.length; k < kl; k += 1) {
                    classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
                }
                for (var l = 0, ll = elements.length; l < ll; l += 1) {
                    current = elements[l];
                    match = false;
                    for (var m = 0, ml = classesToCheck.length; m < ml; m += 1) {
                        match = classesToCheck[m].test(current.className);
                        if (!match) {
                            break;
                        }
                    }
                    if (match) {
                        returnElements.push(current);
                    }
                }
                return returnElements;
            };
        }
        return getElementsByClassName(className, tag, elm);
    };

    window.findAndReplace = function (searchText, replacement, searchNode) {
        if (!searchText || typeof replacement === 'undefined') {
            // Throw error here if you want...
            return;
        }

        var regex = typeof searchText === 'string' ?
                new RegExp(RegExp.escape(searchText),'gim') : searchText,
            childNodes = (searchNode || document.body).childNodes,
            cnLength = childNodes.length,
            excludes = ['html', 'head', 'style', 'title', 'link', 'meta', 'script', 'object', 'iframe'];
        



        while (cnLength--) {
            var currentNode = childNodes[cnLength];
            if (currentNode.nodeType === 1 &&
                !~excludes.indexOf(currentNode.nodeName.toLowerCase())) {
                arguments.callee(searchText, replacement, currentNode);
            }

            if (!regex.test(currentNode.data || currentNode.text || currentNode.nodeValue)) {
                continue;
            }

            if (~excludes.indexOf(currentNode.nodeName.toLowerCase())) {
                continue;
            }

            var parent = currentNode.parentNode,
                currentNodeValue = currentNode.data || currentNode.text || currentNode.nodeValue;

            //var w = currentNodeValue.substr(currentNodeValue.search(regex), searchText.length);
            var w = currentNodeValue.substr(currentNodeValue.search(regex), searchText.length);
            var html = currentNodeValue.replace(regex, replacement.replace(new RegExp('>'+searchText+'<','gim'),'>'+w+'<'));


            if (typeof (currentNode.innerHTML) !== 'undefined') {
                currentNode.innerHTML = html;
            } else if (typeof (parent.innerHTML) !== 'undefined') {

                frag = (function () {
                        var wrap = document.createElement('div'),
                        frag = document.createDocumentFragment();
                    wrap.innerHTML = html;
                    while (wrap.firstChild) {
                        frag.appendChild(wrap.firstChild);
                    }
                    return frag;

                })();

                parent.insertBefore(frag, currentNode);
                parent.removeChild(currentNode);

            }
        }
    };
};