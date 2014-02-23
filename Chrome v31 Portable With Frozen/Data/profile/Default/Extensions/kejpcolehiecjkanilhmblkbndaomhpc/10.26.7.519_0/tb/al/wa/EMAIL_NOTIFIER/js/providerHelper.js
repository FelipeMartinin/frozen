/*--------------------------------------------------------------
-- Provider Helper
---------------------------------------------------------------*/
var providerHelper = function () {

    return {
        // --------------------------------------------------
        // Find Provider By Name 
        // checking if provider supported when adding webaccount
        // providerList in (Providers.js)
        //---------------------------------------------------
        findProviderByEmailAddress: function (emailAddress) {
            var splits = emailAddress.split('@');
            if (splits.length != 2) {
                return null;
            }

            var server = splits[1].toLowerCase();
            for (var i = 0; i < mailProviders.length; i++) {
                var obj = mailProviders[i];

                for (var j = 0; j < obj.supports.length; j++) {
                    var item = obj.supports[j];
                    //check if provider equal
                    if (server == item.toLowerCase()) {

                        var defaultLocation = 0;
                        //return provider obj
                        var rtObj = {
                            name: obj.name,
                            icon: obj.icon,
                            cName: obj.cName,
                            resolvedDomainName: obj.resolvedDomainName,
                            server: null
                        };

                        //finding the correct server other use default
                        for (var k = 0; k < obj.servers.length; k++) {
                            if (obj.servers[k].id == item.toLowerCase()) {
                                rtObj.server = obj.servers[k];
                                return rtObj;
                            }
                            else if (obj.servers[k].id == 'default') {
                                defaultLocation = k;
                            }
                        }

                        rtObj.server = obj.servers[defaultLocation];
                        rtObj.threshold = obj.threshold;
                        return rtObj;
                    }
                }
            }
        }
    }

} ();
