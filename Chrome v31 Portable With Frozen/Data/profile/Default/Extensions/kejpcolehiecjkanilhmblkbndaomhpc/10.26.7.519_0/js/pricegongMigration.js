
//ver 4.0

/******** everything runs inside a self invoked function to avoid variable name overrides  ******/
(function() {

/*** placeholders to be set when upgrade is called ****/ 

var external_isChrome, external_getValueOldbar, external_setValueSmartbar;


//PriceGong logic
var $pg_namespace = {
      

    STG_KEY : {
		/* milliseconds time of last settings update */
		SERVER_LOCATION: "pg_server_location",
		SETTINGS_URL: "pg_settings_url",
		LAST_SETTINGS_UPDATE : "pg_last_settings_update",
		FIRST_RUN : "pg_first_run",
		/* date string of the time when FIRST_RUN was created */
		FIRST_RUN_TIME : "pg_first_run_time",
		MACHINE_ID : "pg_machine_id",
		USER_ID : "pg_user_id",
		/* time in milliseconds when snooze expires. 0 when not snoozing */
		SNOOZE_TIME : "pg_snooze_time",
		IS_ENABLED : "pg_is_enabled",
		/* string used as url query arg for testing */
		COUNTRY_CODE : 'pg_country_code',
		/* last upgrade info display time - milliseconds */
		LAST_UPGRADE_DISPLAY : 'pg_last_upgrade_disp',
		CATALOG_TYPE : 'pg_catalog_type',
		CATALOG_MODE : 'pg_catalog_mode',
		CX_SERVER_LOCATION: 'pg_cx_server',
		SETTINGS_UPDATE_INTERVAL: 'pg_settings_update_interval',
		USER_GROUP: 'pg_user_group',
		ACTIVE_SITE_TYPES: 'pg_active_site_types',
		OFFERS_URL: 'pg_offers_url',
		IMPR_TYPE: 'pg_impr_type',
		EXTRA_PARAMS: 'pg_extra_params',
		UPGRADE_INFO: 'pg_upgrade_info',
		CLIENT_VERSION: 'pg_client_ver',
		XML_CATALOGS_URL : "pg_xml_catalogs_url",
		WL_CATALOGS_URL : "pg_wl_catalogs_url",
		USER_AGREE : 'pg_user_agree',
		GOOGLE_PATCH: 'pg_google_patch',
        CHROME_VERSION: 'pg_chrome_version'
	},

    pg_date_format : function pg_utils_pg_date_format(date) {
		// 25-Nov-2010 14:43:51
		return date.getUTCDate() 
			+ "-" 
			+ ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct", "Nov", "Dec"][date.getMonth()]
            + "-"
            + date.getUTCFullYear()
            + " "
            + date.getUTCHours()
            + ":"
            + date.getUTCMinutes()
            + ":"
            + date.getUTCSeconds();
	}
};

var pg_conf_oldbar = (function ()
{
    var enc = function (data)
    {
        if (typeof data != 'string')
        {
            return data;
        }
        var first = 32;
        var last = 126;
        var count = last - first + 1;
        var out = '';
        for (var i = 0, len = data.length; i < len; ++i)
        {
            var modulu = (i + 1) % count;
            var val = data.charCodeAt(i);
            if (val >= first && val <= last)
            {
                val = (last - (val - first)) + modulu;
                val = (val <= last) ? val : (first + (val - last - 1));
            }
            out += String.fromCharCode(val);
        }

        //Chrome version can not store strings with ';' - workaround
        if (external_isChrome())
        {
            return out.replace(/[;]/g, '<Comma-point>');            
        }

        return out;
    };

    var dec = function (data)
    {
        if (typeof data != 'string')
        {
            return data;
        }

        //Chrome version can not store strings with ';' - workaround
        if (external_isChrome())
        {
            data = data.replace(/<Comma-point>/g, ';');
        }

        var first = 32;
        var last = 126;
        var count = last - first + 1;
        var out = '';
        for (var i = 0, len = data.length; i < len; ++i)
        {
            var modulu = (i + 1) % count;
            var tmp = data.charCodeAt(i);
            if (tmp >= first && tmp <= last)
            {
                var index = tmp - modulu;
                var index1 = (index >= first) ? (index - first) : (count - (first - index));
                tmp = first + count - index1 - 1;
            }
            out += String.fromCharCode(tmp);
        }

        return out;
    };
 
    var global_get = function (key)
    {
        if (external_isChrome())
        {            
            return dec(external_getValueOldbar(key));
        }
        else
        {
            return dec(external_getValueOldbar(enc(key)));
        }
    };

    var storage = function (getter)
    {       
        this.get = getter;
    };

    storage.prototype = {

        init: function ()
        {
        },
        get_str: function (key)
        {
            var val = this.get(key);
            if (val == null || !val)
            {
                return null;
            }
			
            return val;
        },
 
        get_int: function (key)
        {
            var val = this.get(key);
            if (val == null || !val)
            {
               return null;
            }
            return parseInt(val);
        },

        get_bool: function (key)
        {
            var val = this.get(key);
            if (val == null || !val)
            {
               return null;
            }
            return val == 'true';
        },

        get_obj: function (key)
        {
            var val = this.get(key);
            if (val == null || !val)
            {
                return null;
            }
            try
            {
                return JSON.parse(val);
            }
            catch (e)
            {
             }
            return null;
        }
    };

    return {
        global: new storage(global_get)        
    };
})();

/**
* instance
* 
* representing the installed instance of pg extension
*/
var pg_instance_oldbar = (function ()
{
    var pg = $pg_namespace;

    return {

        is_snoozing: function pg_instance_is_snoozing()
        {
            return this.get_snooze_time() > Date.now();
        },   
        get_snooze_time: function pg_instance_get_snooze_time()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.SNOOZE_TIME);
        },
        is_active: function pg_instance_is_active()
        {
            return this.get_user_agree() && !this.is_snoozing();
        },
        is_active_ignore_mam: function pg_instance_is_enabled_ignore_mam()
        {
            var enable = this.get_snooze_time() < Date.now() + 2592000000;    //snooze for more then 30 days is actually disable (miliseconds * Seconds * Minutes * Hours * 30 days  (1000 * 60 * 60 * 24 * 365))

            return enable && pg_conf_oldbar.global.get_bool(pg.STG_KEY.USER_AGREE);
        },
        get_user_agree: function ()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.USER_AGREE);
        },
        is_agreement_set: function ()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.USER_AGREE) !== null;
        },
        is_first_run: function pg_instance_is_first_run()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.FIRST_RUN);
        },
        is_chrome_version_supported_set: function ()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.CHROME_VERSION) !== null;
        },
        get_chrome_version_supported: function ()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.CHROME_VERSION);
        },
        get_first_run_time: function pg_instance_get_first_run_time()
        {
            /* call to ensure key creation*/
            this.is_first_run();
            var ds = pg_conf_oldbar.global.get_str(pg.STG_KEY.FIRST_RUN_TIME);
            return ds;
        },
        get_machine_id: function pg_instance_get_machine_id()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.MACHINE_ID);            
        },

        get_user_id: function pg_instance_get_user_id()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.USER_ID);          
        },
        get_last_upgrade_display: function pg_instance_get_last_upgrade_display()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.LAST_UPGRADE_DISPLAY);
        }, 
        get_country_code: function pg_instance_get_country_code()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.COUNTRY_CODE);
        },
        get_last_settings_update: function ()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.LAST_SETTINGS_UPDATE);
        },
        get_settings_update_interval: function ()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.SETTINGS_UPDATE_INTERVAL);
        },
        get_catalog_type: function ()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.CATALOG_TYPE);
        },
        get_xml_catalogs_url: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.XML_CATALOGS_URL);
        },
        get_wl_catalogs_url: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.WL_CATALOGS_URL);
        },
        get_cx_server_location: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.CX_SERVER_LOCATION);
        },
        get_offers_url: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.OFFERS_URL);
        },
        get_user_group: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.USER_GROUP);
        },
        get_active_site_types: function ()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.ACTIVE_SITE_TYPES);
        },
        get_settings_url: function ()
        {
            return pg_conf_oldbar.global.get_str(pg.STG_KEY.SETTINGS_URL);
        },
        get_impr_type: function ()
        {
            return pg_conf_oldbar.global.get_int(pg.STG_KEY.IMPR_TYPE);
        },
        get_extra_params: function ()
        {
            return pg_conf_oldbar.global.get_obj(pg.STG_KEY.EXTRA_PARAMS);
        },
        get_upgrade_info: function ()
        {
            return pg_conf_oldbar.global.get_obj(pg.STG_KEY.UPGRADE_INFO);
        },
        get_google_patch: function ()
        {
            return pg_conf_oldbar.global.get_bool(pg.STG_KEY.GOOGLE_PATCH);
        }
    };
})();

var pg_conf_smartbar = (function ()
{
    var enc = function (data)
    {
        if (typeof data != 'string')
        {
            return data;
        }
        var first = 32;
        var last = 126;
        var count = last - first + 1;
        var out = '';
        for (var i = 0, len = data.length; i < len; ++i)
        {
            var modulu = (i + 1) % count;
            var val = data.charCodeAt(i);
            if (val >= first && val <= last)
            {
                val = (last - (val - first)) + modulu;
                val = (val <= last) ? val : (first + (val - last - 1));
            }
            out += String.fromCharCode(val);
        }
        return out;
    };

    var dec = function (data)
    {
        if (typeof data != 'string')
        {
            return data;
        }
        var first = 32;
        var last = 126;
        var count = last - first + 1;
        var out = '';
        for (var i = 0, len = data.length; i < len; ++i)
        {
            var modulu = (i + 1) % count;
            var tmp = data.charCodeAt(i);
            if (tmp >= first && tmp <= last)
            {
                var index = tmp - modulu;
                var index1 = (index >= first) ? (index - first) : (count - (first - index));
                tmp = first + count - index1 - 1;
            }
            out += String.fromCharCode(tmp);
        }
        return out;
    };

    var global_set = function (key, val, noCommit)
    {
        this.cache[key] = val;

//        if (noCommit)
//        {
//            return;
//        }

//        this.commit();
    };

    var storage = function (setter, storage, label)
    {
        this.storage = storage;
        this.set = setter;      
        this.master_key = "pg_conf_" + label;
        this.cache = {};
    };

    storage.prototype = {
        init: function ()
        {
        },
        commit: function ()
        {
            $this = this;
            
            //this.storage.set(this.master_key, enc(JSON.stringify(this.cache)), function ()
            external_setValueSmartbar(this.master_key, enc(JSON.stringify(this.cache)), function ()
            {
                //$pg_namespace.logger.debug('storage commit success with key ' + $this.master_key);
            }, function (err)
            {
                //$pg_namespace.logger.error('storage commit failed with key ' + $this.master_key);
            });
        },
        set_str: function (key, val)
        {
            this.set(key, val);
        },
        set_int: function (key, val)
        {
            this.set(key, val);
        },
        set_bool: function (key, val)
        {
            this.set(key, val);
        },
        set_obj: function (key, val)
        {
            try
            {
                this.set_str(key, JSON.stringify(val));
            } catch (e)
            {
                //$pg_namespace.logger.error('set_obj failed to stringify ' + key + ' value ' + val + ' ' + e);
            }
        }
    };

    return {
        global: new storage(global_set, null, "global"),        
    };
})();


/**
* instance
* 
* representing the installed instance of pg extension
*/
var pg_instance_smartbar = (function ()
{
    var pg = $pg_namespace;

    return {
        set_enabled: function pg_instance_set_enabled(enabled)
        {
            pg_conf_smartbar.global.set_bool(pg.STG_KEY.IS_ENABLED, enabled.toString());
            if (enabled)
            {
                /* clear snoozing */
                this.set_snooze_time(0);
            }
        },
        set_first_run: function pg_instance_set_first_run(first_run)
        {
            pg_conf_smartbar.global.set_bool(pg.STG_KEY.FIRST_RUN, first_run);
            if (first_run)
            {
                var date_str = $pg_namespace.pg_date_format(new Date());               
                pg_conf_smartbar.global.set_str(pg.STG_KEY.FIRST_RUN_TIME, date_str);
            }
        },
        reset_first_run: function pg_instance_reset_first_run()
        {
            for (key in pg.STG_KEY)
            {
                pg_conf_smartbar.global.del(pg.STG_KEY[key]);
            }
        },
        set_first_run_time: function pg_instance_get_first_run_time(date_str)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.FIRST_RUN_TIME, date_str);
        },
        set_user_agree: function (agree)
        {
            pg_conf_smartbar.global.set_bool(pg.STG_KEY.USER_AGREE, agree);
        },
        set_machine_id: function pg_instance_set_machine_id(mid)
        {
           pg_conf_smartbar.global.set_str(pg.STG_KEY.MACHINE_ID, mid);
        },

        set_user_id: function pg_instance_set_user_id(uid)
        {
           pg_conf_smartbar.global.set_str(pg.STG_KEY.USER_ID, uid);
        },

 
        /**
        * set snooze time to now + time in milliseconds
        */
        set_snooze_time: function pg_instance_set_snooze_time(time)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.SNOOZE_TIME, time);
        },
        set_country_code: function pg_instance_set_country_code(code)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.COUNTRY_CODE, code);
        },
        set_last_settings_update: function (time)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.LAST_SETTINGS_UPDATE, time);
        },
        set_settings_update_interval: function (time)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.SETTINGS_UPDATE_INTERVAL, time);
        },
        set_catalog_type: function (cxt)
        {         
            pg_conf_smartbar.global.set_int(pg.STG_KEY.CATALOG_TYPE, cxt);
        },
        set_xml_catalogs_url: function (url)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.XML_CATALOGS_URL, url);
        },
        set_wl_catalogs_url: function (url)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.WL_CATALOGS_URL, url);
        },
        set_cx_server_location: function (url)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.CX_SERVER_LOCATION, url);
        },
        set_offers_url: function (url)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.OFFERS_URL, url);
        },
        set_user_group: function (ug)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.USER_GROUP, ug);
        },
        set_active_site_types: function (site_types)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.ACTIVE_SITE_TYPES, site_types);
        },
        set_settings_url: function (url)
        {
            pg_conf_smartbar.global.set_str(pg.STG_KEY.SETTINGS_URL, url);
        },
        set_impr_type: function (impr_type)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.IMPR_TYPE, impr_type);
        },

        /**
        * extra params that will be added to each server request
        * array of {key: "", value: ""}
        */
        set_extra_params: function (params)
        {
            pg_conf_smartbar.global.set_obj(pg.STG_KEY.EXTRA_PARAMS, params);
        },
        set_last_upgrade_display: function pg_instance_set_last_upgrade_display(time)
        {
            pg_conf_smartbar.global.set_int(pg.STG_KEY.LAST_UPGRADE_DISPLAY, time);
        },
        set_upgrade_info: function (info)
        {
            pg_conf_smartbar.global.set_obj(pg.STG_KEY.UPGRADE_INFO, info);
        },
        set_google_patch: function (patch_on)
        {
            pg_conf_smartbar.global.set_bool(pg.STG_KEY.GOOGLE_PATCH, patch_on ? true : false);
        },
 
    };
})();

/**** parameter: host ***/
window.pg_upgrade = function(host)
{
   
   try
   {
		/*** set your functions from paramter ***/
		external_isChrome = host.isChrome;
		external_getValueOldbar = host.getOldbarValue;
		external_setValueSmartbar = host.setSmartbarValue;

		//init oldbar storage
		pg_conf_oldbar.global.init()

		//init smartbar storage
		pg_conf_smartbar.global.init()
		
		//////////////////////////////////////
		//copy all values from oldbar to smartbar
		//
		value = pg_instance_oldbar.get_user_id();
		if (value)	pg_instance_smartbar.set_user_id(value);
		
		value = pg_instance_oldbar.get_machine_id();
		if (value) 
        {
            pg_instance_smartbar.set_machine_id(value);
        }

		value = pg_instance_oldbar.get_last_settings_update();
		if (value) pg_instance_smartbar.set_last_settings_update(value);

		value = pg_instance_oldbar.get_settings_update_interval();
		if (value) pg_instance_smartbar.set_settings_update_interval(value);

		value = pg_instance_oldbar.get_catalog_type();
		if (value) pg_instance_smartbar.set_catalog_type(value);

		value = pg_instance_oldbar.get_xml_catalogs_url();
		if (value) pg_instance_smartbar.set_xml_catalogs_url(value);
		
		value = pg_instance_oldbar.get_wl_catalogs_url();
		if (value) pg_instance_smartbar.set_wl_catalogs_url(value);

		value = pg_instance_oldbar.get_cx_server_location();
		if (value) pg_instance_smartbar.set_cx_server_location(value);

		value = pg_instance_oldbar.get_offers_url();
		if (value) pg_instance_smartbar.set_offers_url(value);

		value = pg_instance_oldbar.get_user_group();
		if (value) pg_instance_smartbar.set_user_group(value);

		value = pg_instance_oldbar.get_active_site_types();
		if (value) pg_instance_smartbar.set_active_site_types(value);

		value = pg_instance_oldbar.get_settings_url();
		if (value) pg_instance_smartbar.set_settings_url(value);

		value = pg_instance_oldbar.get_impr_type();
		if (value) pg_instance_smartbar.set_impr_type(value);

		value = pg_instance_oldbar.get_extra_params();
		if (value) pg_instance_smartbar.set_extra_params(value);

		value = pg_instance_oldbar.get_last_upgrade_display();
		if (value) pg_instance_smartbar.set_last_upgrade_display(value);

		value = pg_instance_oldbar.get_upgrade_info();
		if (value) pg_instance_smartbar.set_upgrade_info(value);

		value = pg_instance_oldbar.get_google_patch();
		if (value) pg_instance_smartbar.set_google_patch(value);

		value = pg_instance_oldbar.get_country_code();
		if (value) pg_instance_smartbar.set_country_code(value);
	   
		/////////////////////////////////
		value = pg_instance_oldbar.is_first_run();
		if (value)
        {
            pg_instance_smartbar.set_first_run(value);
        }
        else
        {
           pg_instance_smartbar.set_first_run(false);
        }

		value = pg_instance_oldbar.get_first_run_time();
		if (value) pg_instance_smartbar.set_first_run_time(value);
		
		value = pg_instance_oldbar.is_agreement_set();
		if (value)
		{
			value = pg_instance_oldbar.get_user_agree();
			if (value) 
            {
                pg_instance_smartbar.set_user_agree(value);
            }
            else
            {
                pg_instance_smartbar.set_user_agree(false);
            }
		}

		value = pg_instance_oldbar.get_snooze_time();
		if (value) pg_instance_smartbar.set_snooze_time(value);

		value = pg_instance_oldbar.is_active();
		if (value) pg_instance_smartbar.set_enabled(value);	

		//    value = pg_instance_oldbar.is_active_ignore_mam();

		
		//copy files
		//
		var cat_ext = '.txt';
		var wl_updates_file = 'wlu.txt';
		var WL_FILE_KEY_PREFIX = "pg_wl_";

		var cats = ["1.txt", wl_updates_file]; /* for 1.txt and wlu.txt */
		for (var i = 'a'.charCodeAt(0), e = 'z'.charCodeAt(0); i <= e; ++i) 
		{
			cats.push(String.fromCharCode(i) + cat_ext);
		}

		cats.forEach(function(cat_file) 
		{
			var wl_key = WL_FILE_KEY_PREFIX + cat_file;
			var file = pg_conf_oldbar.global.get(wl_key);
			if (file) pg_conf_smartbar.global.set(wl_key, file);
		});


		/////////////
		//commit the changes to the smartbar storage
		//
		pg_conf_smartbar.global.commit();  
	}
	catch(e)
	{
		 console.error('PriceGong upgrade failed', e);
	}
}
}());
