/*-----------------------------------------------------------
-- Account mails decoder
-----------------------------------------------------------*/
var decoder = function () {
    var log_type='decoder';
    function parseMimeWord(word){
        /*  ref: http://en.wikipedia.org/wiki/MIME#Encoded-Word
         * mime word came in format
         * =?charset?encoding?encoded text?=
         * where charset -  may be any character set registered with IANA
         *       encoding -  can be either "Q" denoting Q-encoding that is similar to the quoted-printable encoding, or "B" denoting base64 encoding
         *       encoded text is the Q-encoded or base64-encoded text
         *       An encoded-word may not be more than 75 characters long, including charset, encoding, encoded text, and delimiters. If it is desirable to encode more text than will fit in an encoded-word of 75 characters, multiple encoded-words (separated by CRLF SPACE) may be used.
         * */
        var strict_length=false;
        if(typeof word!='string' || !word.length){ return;}// word should be string
        if(strict_length && word.length>75){ return;} //Encoded-Word should be equal or less then 75 chars
        var parts=word.split('?');
        if(parts.length!=5){return;}
        if(!(parts[0]=='=' && parts[4]=='=' && (parts[2]=='Q' || parts[2]=='B'))){return;};//should be we

        var struct={};
        struct.charset=parts[1];
        struct.encoding=parts[2];
        struct.encodedText=parts[3];
        return struct;
    }

    function decodeMimeWord(word){
        if(typeof word=='string'){
            word=parseMimeWord(word);
        }
        if(!word){return;}

        if(word.encoding=='B'){
            var decoded=atob(word.encodedText);
            if(word.charset=='UTF-8'){
                decoded=decodeURIComponent(escape(decoded));
            }
            word.text=decoded;
        } else if (word.encoding=='Q'){
            word.text=word.encodedText.replace('_',' ').replace(/=([A-Fa-f0-9]{2})/g, function(m, g1) {
                return String.fromCharCode(parseInt(g1, 16));
            });
        }
        return word;
    }
    /*
    * decode raw header data to string
    * */
    function decodeMailHeaderText(data){
        var headerTokenRegex=/\s|\t/gmi;
        var decoded=data.split(headerTokenRegex)
            .map(function(item){
                return parseMimeWord(item)||item;
            })
            .map(function(item){
                if(typeof item=='object'){
                    return decodeMimeWord(item).text||'';
                }
                return item;
            });
        decoded=decoded.join('');
        return decoded;
    }

    function decodedMailHeader(data){
        var charset;
        var words=data.split(/\s|\t/gmi)
            .map(function(item){
                return parseMimeWord(item)||item;
            });
        words.filter(function(){})
        for(var i=0; i<words.length; i++){
            if(typeof(words[i])=='object'){
                charset=words[i].charset;
                break;
            }
        }

        var struct={};
        struct.charset=charset;
        struct.text=decodeMailHeaderText(data);
        return struct;
    }


    //recursive run on each account mail and decode mail items (from, subject, shortBody)
    var decodeItems = function (items, accountMails, callback) {
        var log_method='decodeItems'

        sdk.log.info({ type: 'decoder', method: 'decodeItems', text: 'decoding..', data: { "mails": accountMails, "items": items} });

        //call this function after conduit.encryption.decodeText/decodeCharset completed
        var afterDecodeItem = function (result) {
            var log_method='afterDecodeItem'
            sdk.log.info({data:{'text':result},text: 'decoded result',method:log_method, type: log_type});

            if (item.field == "from")
                mail.from = jQuery.trim(result);
            else if (item.field == "subject")
                mail.subject = jQuery.trim(result);
            else if (item.field == "shortBody") {
                mail.shortBody = jQuery.trim(result);
                mail.isDecoded = true; //update isDecoded flag (for prevent decode actions for already decoded mail)
            }

            decodeItems(items, accountMails, callback);
        };

        try {
            if (items == null || items.length == 0) {
                sdk.log.info({ text: 'no items to decode, call to callback and finish', method: log_method, type: log_type });
                if (callback)
                    callback(accountMails)
                else
                    sdk.log.warning({ text: 'no callback just finish' , method: log_method, type: log_type });
                return;
            }
            var item = items.pop();
            var mail = accountMails[item.index];

            var rawdata=null;
            if(item.field in mail){
                rawdata= mail[item.field];
            }

            if (rawdata==undefined || rawdata == null || rawdata == '') {
                if(item.field == "shortBody"){
                    mail.isDecoded = true; //update isDecoded flag (for prevent decode actions for already decoded mail.
                }
                //no decode process required
                decodeItems(items, accountMails, callback);
                return;
            }

            var encoding = '';
            var charset = '';
            var text = '';
            if (item.field == "shortBody") {
                charset = mail.contentTypeCharset;
                encoding = mail.contentTypeEncoding;
                text = rawdata;
            }

            if(item.field != 'shortBody'){
                sdk.log.info({data:{'rawdata':rawdata},text: 'Decode mail header',method:log_method, type: log_type});
                var decodedstruct=decodedMailHeader(rawdata);
                sdk.log.info({data:{'rawdata':rawdata},text: 'Decode mail header',method:log_method, type: log_type});
                if(decodedstruct.charset=='UTF-8'){
                    sdk.log.info({data:{'rawdata':rawdata,'decoded':decodedstruct.text},text: 'Decoded mail header is UTF-8',method:log_method, type: log_type});
                    afterDecodeItem(decodedstruct.text);
                    return;
                }
                if(decodedstruct.charset){
                    sdk.log.info({ data: {"charset": decodedstruct.charset, "text": decodedstruct.text}, text: 'Convert charset to Unicode',method:log_method, type: log_type });
                    conduit.encryption.decodeCharset(decodedstruct.text, decodedstruct.charset, afterDecodeItem);
                    return;
                }

                sdk.log.info({data:{'rawdata':rawdata},text: 'no charset defined',method:log_method, type: log_type});
                if (item.field == "shortBody") {
                    mail.isDecoded = true; //update isDecoded flag (for prevent decode actions for already decoded mail)
                }
                //no need decodeText operation
                decodeItems(items, accountMails, callback);

                return;
            }

            if (encoding != '' && charset != '') {
                encoding = encoding.toUpperCase().replace(/\s/gi, '');
                charset = charset.toUpperCase().replace(/\s/gi, '');

                if (encoding == 'Q' && (charset == 'US-ASCII' || charset == 'WINDOWS-1252')) {
                    text = jQuery.trim(text).replace(/_/gi, ' ');
                    switch (item.field) {
                        case 'from':
                            mail.from = text;
                            break;
                        case 'subject':
                            mail.subject = text;
                            break;
                    }
                    //no need decodeText operation
                    decodeItems(items, accountMails, callback);
                }
                else if (encoding == 'Q' || encoding == 'B') {

                    if(encoding=='B'){
                        var log_method='decodeItems'
                        sdk.log.info({data:{'text':text},text: 'decode Base64',method:log_method, type: log_type});
                        try{
                            var text_decoded=decodeURIComponent(escape(atob(text)));
                            sdk.log.info({data:{'decoded':text_decoded},text: 'decoded from Base64',method:log_method, type: log_type});
                            (item.field in mail) && (mail[item.field]=text_decoded);
                            decodeItems(items, accountMails, callback);
                            return;
                        }catch(ex){
                            console.error('BASE 64 DECODE ERROR',text,ex);
                        }
                    }

                    //set timeout if decodeText callback not response
                    var decodetext_timer = setTimeout(function () {
                        sdk.log.info({ type: 'decoder', method: 'decodeItems', text: 'decodeText timeout' });
                        decodeItems(items, accountMails, callback);
                        clearTimeout(decodetext_timer);
                    }, 1000);
                    sdk.log.info({ type: 'decoder', method: 'decodeItems', text: 'decode text to readable', data: { "enc": encoding, "charset": charset, "text": text} });
                    conduit.encryption.decodeText(text, encoding, charset, function (decode_result) { clearTimeout(decodetext_timer); afterDecodeItem(decode_result); });
                }
                else {
                    sdk.log.info({ type: 'decoder', method: 'decodeItems', text: 'decodeCharset to unicode', data: { "enc": encoding, "charset": charset, "text": text} });
                    conduit.encryption.decodeCharset(text, charset, afterDecodeItem);
                }
            }
            else {
                if (item.field == "shortBody") {
                    mail.isDecoded = true; //update isDecoded flag (for prevent decode actions for already decoded mail)
                }
                //no need decodeText operation
                decodeItems(items, accountMails, callback);
            }

        } catch (ex) {
            sdk.log.error({ type: 'decoder', method: 'decodeItems', text: 'exception thrown look data for exception', data: ex });
        }
    }

    return {
        prepareMails: function (accountMails, callback) {
            var log_method='prepareMails'
            sdk.log.info({text: 'before decode' , method: log_method, type: 'decoder'});
            if (accountMails == null || !accountMails) {
                sdk.log.info({text: 'no mails finish and call callback' , method: log_method, type: 'decoder'});
                callback(accountMails);
                return;
            }

            //create array of items that not decoded
            var itemsToDecode = new Array();
            for (i = 0; i < accountMails.length; i++) {
                if (!accountMails[i].isDecoded) {
                    itemsToDecode.push({ "index": i, "field": "shortBody" });
                    itemsToDecode.push({ "index": i, "field": "subject" });
                    itemsToDecode.push({ "index": i, "field": "from" });
                }
            }
            decodeItems(itemsToDecode, accountMails, callback);
            sdk.log.info({ text: 'wait to items to be decoded' , method: log_method, type: 'decoder'});
        } //method.public
    }//public.object
} ();