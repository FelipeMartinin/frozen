/**
@object: WebAppUtils
@description: a utility for common web apps functions.
*/
var WebAppUtils = (function () {

    /**
    @function
    @description: replace common xml chars with valid ones to prevent xml parsing errors .
    @param: {string} strXml - xml as string
    */
    function fixParserError(strXml) {
        strXml = strXml.replace(/&apos;/g, "'");
        strXml = strXml.replace(/&amp;/g, "&");
        strXml = strXml.replace(/&/g, "&amp;");
        strXml = strXml.replace(/'/g, "&apos;");
        
        //strXml = strXml.replace(/<!\[CDATA\[/g, "");
        //strXml = strXml.replace(/\]\]>/g, ""); removing the CDATA will corrupt the rss xml. 

        strXml = strXml.replace("\ufeff", ""); // remove BOM

        return strXml;
    }


    /**
    @function
    @description:      replace a reserved word in an XML to different words.
     Param.: none. Prototype of Javascript's String.
     Example: String abc = "<root><link>www.google.com</link></root>"; abc.replaceReservedKeywords(); ---> abc == "<root><linkk>www.google.com</linkk></root>"
    @param: {string} strXml - xml as string
    */
    function replaceReservedKeywords(strXml) {
        // do not use for rss xml. it will currupt the link tag!!!

        var reservedKeywordsPartInRegex = ['link', 'caption', 'source', 'command', 'default'].join('|');
        var reservedKeywordsPattern = stringFormat('(</?)({0})(\\s*/?>)', reservedKeywordsPartInRegex);
        var reservedKeywordsRegex = new RegExp(reservedKeywordsPattern, 'ig'); // case insensitive and global
        var reservedKeywordsFix = '$1$2__$3';
        strXml = strXml.replace(reservedKeywordsRegex, reservedKeywordsFix);    
    }

    /**
    @function
    @description: stringFormat: same as C#'s stringFormat.
    Example: stringFormat(‘Hello {0} & {1} ‘, ‘John’, ‘Jane’)
    boundaries:  you can't repeat the placeholder more then once-
    wrong usage: stringFormat(‘Hello {0} & {0} ‘, ‘John’)
    right usage: stringFormat(‘Hello {0} & {1} ‘, ‘John’,'John')
    @param: {string} strText - string text
    */
    function stringFormat(strText) {
        if (strText) {
            if (arguments.length <= 1) { return strText; }
            var replaceString = "";
            for (var i = 0; i < arguments.length - 1; i++) {
                replaceString = "{" + i.toString() + "}";
                strText = strText.replace(replaceString, arguments[i + 1]);
            }
        }

        return strText;
    }


    return {
        fixParserError: fixParserError,
        stringFormat: stringFormat
    }

})();


