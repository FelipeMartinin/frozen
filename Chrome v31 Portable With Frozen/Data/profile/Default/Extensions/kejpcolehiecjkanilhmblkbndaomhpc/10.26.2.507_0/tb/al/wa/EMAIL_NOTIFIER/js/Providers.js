/*--------------------------------------------------------------
-- Mail Providers
---------------------------------------------------------------*/
var mailProviders =
   [
/*==================================================
Gmail
====================================================*/
     {
     id: 'gmail',
     name: 'Gmail',
     cName: 'Gmail',
     resolvedDomainName: '.google.com',
     icon: 'gmail.png',
     supports: ['gmail.com'],
     threshold: 60000,
     servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 993,
                incServer: 'imap.gmail.com',
                ssl: true
            }
        ]
 },
/*==================================================
Hotmail
====================================================*/
    {
    id: 'hotmail',
    name: 'Hotmail',
    cName: 'Hotmail',
    resolvedDomainName: '.hotmail.com',
    icon: 'hotmail.png',
    supports: ['hotmail.co.il', 'hotmail.co.jp', 'hotmail.com', 'hotmail.com.ar', 'hotmail.com.br', 'hotmail.com.tr', 'hotmail.co.th', 'hotmail.co.uk', 'hotmail.de', 'hotmail.es', 'hotmail.fr', 'hotmail.it', 'hotmail.jp', 'hotmail.se', 'live.at', 'live.be', 'live.ca', 'live.cl', 'live.cn', 'live.co.kr', 'live.com', 'live.com.ar', 'live.com.au', 'live.com.mx', 'live.com.my', 'live.com.sg', 'live.co.za', 'live.de', 'live.dk', 'live.fr', 'live.hk', 'live.ie', 'live.in', 'live.it', 'live.jp', 'live.nl', 'live.no', 'live.ru', 'live.se', 'msnhotmail.com', 'windowslive.com'],
    threshold: 900000,
    servers: [
            {
                id: 'default',
                protocol: 'POP3',
                port: 995,
                incServer: 'pop3.live.com',
                ssl: true
            }
        ]
},
/*==================================================
MSN
====================================================*/
    {
    id: 'msn',
    name: 'Msn',
    cName: 'Msn',
    resolvedDomainName: '.msn.com',
    icon: 'hotmail.png',
    supports: ['msn.com'],
    threshold: 900000,
    servers: [
            {
                id: 'default',
                protocol: 'POP3',
                port: 995,
                incServer: 'pop3.live.com',
                ssl: true
            }
        ]
},

/*==================================================
Yahoo
====================================================*/
    {
    id: 'yahoo',
    name: 'Yahoo',
    cName: 'Yahoo',
    resolvedDomainName: '.yahoo.com',
    icon: 'Yahoo!.png',
    supports: ['yahoo.com', 'ymail.com', 'yahoo.com.sg', 'rocketmail.com', 'yahoo.de', 'yahoo.fr', 'y7mail.com', 'yahoo.com.au', 'yahoo.com.tr', 'yahoo.com.ar', 'yahoo.co.th', 'yahoo.co.uk', 'yahoo.it', 'yahoo.es', 'yahoo.se', 'yahoo.ca', 'yahoo.cl', 'yahoo.cn', 'yahoo.co.kr', 'yahoo.com.mx', 'yahoo.com.my', 'yahoo.dk', 'yahoo.com.hk', 'yahoo.ie', 'yahoo.in', 'yahoo.nl', 'yahoo.no'],
    threshold: 60000,
    servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 993,
                incServer: 'imap.mail.yahoo.com',
                ssl: true
            }
        ]
},

/*==================================================
AOL
====================================================*/
    {
    id: 'aol',
    name: 'AOL',
    cName: 'AOL',
    resolvedDomainName: '.aol.com',
    icon: 'AOL.png',
    supports: ['aol.com'],
    threshold: 60000,
    servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 143,
                incServer: 'imap.aol.com',
                ssl: false
            }
        ]
},
/*==================================================
RoadRunner
====================================================*/
    {
    id: 'roadrunner',
    name: 'Road Runner',
    cName: 'RoadRunner',
    resolvedDomainName: '.rr.com',
    icon: 'RoadRunner.png',
    supports: ['roadrunner.com', 'bham.rr.com', 'sw.rr.com', 'elmore.rr.com', 'eufaula.rr.com', 'bak.rr.com', 'san.rr.com', 'socal.rr.com', 'dc.rr.com', 'panhandle.rr.com', 'cfl.rr.com', 'swfla.rr.com', 'se.rr.com', 'tampabay.rr.com', 'hawaii.rr.com', 'indy.rr.com', 'ma.rr.com', 'kc.rr.com', 'we.rr.com', 'jam.rr.com', 'sport.rr.com', 'maine.rr.com', 'mass.rr.com', 'berkshire.rr.com', 'twmi.rr.com', 'mn.rr.com', 'neb.rr.com', 'ne.rr.com', 'nj.rr.com', 'nycap.rr.com', 'twcny.rr.com', 'nyc.rr.com', 'rochester.rr.com', 'stny.rr.com', 'si.rr.com', 'nc.rr.com', 'ec.rr.com', 'triad.rr.com', 'carolina.rr.com', 'cinci.rr.com', 'columbus.rr.com', 'neo.rr.com', 'woh.rr.com', 'ucwphilly.rr.com', 'midsouth.rr.com', 'austin.rr.com', 'elp.rr.com', 'houston.rr.com', 'rgv.rr.com', 'satx.rr.com', 'hot.rr.com', 'gt.rr.com', 'stx.rr.com', 'wi.rr.com', 'new.rr.com'],
    threshold: 60000,
    servers: [
            { id: 'roadrunner.com', protocol: 'POP3', port: 110, incServer: 'pop-server.roadrunner.com', ssl: false },
            { id: 'bham.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.bham.rr.com', ssl: false },
            { id: 'sw.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.sw.rr.com', ssl: false },
            { id: 'elmore.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.elmore.rr.com', ssl: false },
            { id: 'eufaula.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.eufaula.rr.com', ssl: false },
            { id: 'bak.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.bak.rr.com', ssl: false },
            { id: 'san.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.san.rr.com', ssl: false },
            { id: 'socal.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.socal.rr.com', ssl: false },
            { id: 'dc.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.dc.rr.com', ssl: false },
            { id: 'panhandle.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.panhandle.rr.com', ssl: false },
            { id: 'cfl.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.cfl.rr.com', ssl: false },
            { id: 'swfla.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.swfla.rr.com', ssl: false },
            { id: 'se.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.se.rr.com', ssl: false },
            { id: 'tampabay.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.tampabay.rr.com', ssl: false },
            { id: 'hawaii.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.hawaii.rr.com', ssl: false },
            { id: 'indy.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.indy.rr.com', ssl: false },
            { id: 'ma.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.ma.rr.com', ssl: false },
            { id: 'kc.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.kc.rr.com', ssl: false },
            { id: 'we.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.we.rr.com', ssl: false },
            { id: 'jam.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.jam.rr.com', ssl: false },
            { id: 'sport.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.sport.rr.com', ssl: false },
            { id: 'maine.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.maine.rr.com', ssl: false },
            { id: 'berkshire.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.berkshire.rr.com', ssl: false },
            { id: 'twmi.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.twmi.rr.com', ssl: false },
            { id: 'mn.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.mn.rr.com', ssl: false },
            { id: 'neb.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.neb.rr.com', ssl: false },
            { id: 'ne.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.ne.rr.com', ssl: false },
            { id: 'nj.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.nj.rr.com', ssl: false },
            { id: 'nycap.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.nycap.rr.com', ssl: false },
            { id: 'twcny.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.twcny.rr.com', ssl: false },
            { id: 'nyc.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.nyc.rr.com', ssl: false },
            { id: 'rochester.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.rochester.rr.com', ssl: false },
            { id: 'stny.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.stny.rr.com', ssl: false },
            { id: 'si.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.si.rr.com', ssl: false },
            { id: 'nc.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.nc.rr.com', ssl: false },
            { id: 'ec.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.ec.rr.com', ssl: false },
            { id: 'triad.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.triad.rr.com', ssl: false },
            { id: 'carolina.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.carolina.rr.com', ssl: false },
            { id: 'cinci.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.cinci.rr.com', ssl: false },
            { id: 'columbus.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.columbus.rr.com', ssl: false },
            { id: 'neo.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.neo.rr.com', ssl: false },
            { id: 'woh.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.woh.rr.com', ssl: false },
            { id: 'ucwphilly.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.ucwphilly.rr.com', ssl: false },
            { id: 'midsouth.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.midsouth.rr.com', ssl: false },
            { id: 'austin.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.austin.rr.com', ssl: false },
            { id: 'elp.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.elp.rr.com', ssl: false },
            { id: 'houston.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.houston.rr.com', ssl: false },
            { id: 'rgv.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.rgv.rr.com', ssl: false },
            { id: 'satx.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.satx.rr.com', ssl: false },
            { id: 'hot.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.hot.rr.com', ssl: false },
            { id: 'gt.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.gt.rr.com', ssl: false },
            { id: 'stx.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.stx.rr.com', ssl: false },
            { id: 'wi.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.wi.rr.com', ssl: false },
            { id: 'new.rr.com', protocol: 'POP3', port: 110, incServer: 'pop-server.new.rr.com', ssl: false }


        ]
},

/*==================================================
Comcast
====================================================*/
     {
     id: 'comcast',
     name: 'ComCast',
     cName: 'Comcast',
     resolvedDomainName: '.comcast.net',
     icon: 'Comcast.png',
     supports: ['comcast.com', 'comcast.net'],
     threshold: 60000,
     servers: [
            {
                id: 'default',
                protocol: 'POP3',
                port: 110,
                incServer: 'mail.comcast.net',
                ssl: false
            }
        ]
 },
/*==================================================
TWC
====================================================*/
       {
       id: 'twc',
       name: 'twc',
       cName: 'twc',
       resolvedDomainName: '.twc.com',
       icon: 'RoadRunner.png',
       supports: ['twc.com'],
       threshold: 60000,
       servers: [
               {
                   id: 'default',
                   protocol: 'POP3',
                   port: 110,
                   incServer: 'pop-server.nyc.rr.com',
                   ssl: false
               }
           ]
   },

/*==================================================
Univision
====================================================*/
     {
     id: 'univision',
     name: 'Univision',
     cName: 'Univision',
     resolvedDomainName: 'univision.com',
     icon: 'Univision.png',
     supports: ['univision.com'],
     threshold: 60000,
     servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 143,
                incServer: 'imap.univision.com',
                ssl: false
            }
        ]
 },
/*==================================================
Rambler.ru
====================================================*/
     {
     id: 'Rambler',
     name: 'Rambler',
     cName: 'Rambler.ru',
     resolvedDomainName: '.Rambler.ru',
     icon: 'Rambler.png',
     supports: ['rambler.ru'],
     threshold: 60000,
     servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 993,
                incServer: 'mail.rambler.ru',
                ssl: true
            }
        ]
 },

/*==================================================
Yandex.ru
====================================================*/
     {
     id: 'yandex',
     name: 'Yandex',
     cName: 'Yandex.ru',
     resolvedDomainName: '',
     icon: 'Yandex.png',
     supports: ['yandex.ru'],
     threshold: 60000,
     servers: [
            {
                id: 'default',
                protocol: 'IMAP',
                port: 143,
                incServer: 'imap.yandex.ru',
                ssl: false
            }
        ]
 },
/*==================================================
Mail.ru
====================================================*/
    {
    id: 'mail.ru',
    name: 'Mail.ru',
    cName: 'mail.ru',
    resolvedDomainName: '',
    icon: 'mail.ru.png',
    supports: ['mail.ru', 'inbox.ru', 'list.ru', 'bk.ru'],
    threshold: 60000,
    servers: [
            {
                id: 'default',
                protocol: 'POP3',
                port: 995,
                incServer: 'pop.mail.ru',
                ssl: true
            }
        ]
},
/*==================================================
012Mail (Smile)
====================================================*/
      {
      id: '012',
      name: '012',
      cName: '012',
      resolvedDomainName: '.012.net.il',
      icon: '012_Smile.png',
      supports: ['012.net.il', 'zahav.net.il'],
      threshold: 60000,
      servers: [
            {
                id: 'default',
                protocol: 'POP3',
                port: 110,
                incServer: 'pop.012.net.il',
                ssl: false
            }
        ]
  },

/*==================================================
013Mail (Netvision)
====================================================*/
      {
      id: '013',
      name: '013',
      cName: '013',
      resolvedDomainName: '.013net.net',
      icon: '013_netvision.png',
      supports: ['013.net.il', 'netvision.net.il'],
      threshold: 60000,
      servers: [
                {
                    id: 'default',
                    protocol: 'POP3',
                    port: 110,
                    incServer: 'mail.netvision.net.il',
                    ssl: false
                }
            ]
  },

/*==================================================
014Mail (Bezeq)
====================================================*/
      {
      id: '014',
      name: '014',
      cName: '014',
      resolvedDomainName: '.bezeqint.net',
      icon: '014_Bezeqint.png',
      supports: ['014.net', 'bezeqint.net'],
      threshold: 60000,
      servers: [
                {
                    id: 'default',
                    protocol: 'POP3',
                    port: 110,
                    incServer: 'mail.bezeqint.net',
                    ssl: false
                }
            ]
  },
/*==================================================
tiscali
====================================================*/
      {
      id: 'tiscali',
      name: 'tiscali',
      cName: 'tiscali.it',
      resolvedDomainName: '.tiscali.it',
      icon: 'Tiscali.it.png',
      supports: ['tiscali.it'],
      threshold: 60000,
      servers: [
                    {
                        id: 'default',
                        protocol: 'POP3',
                        port: 110,
                        incServer: 'pop.tiscali.it',
                        ssl: false
                    }
                ]
  },
/*==================================================
alice
====================================================*/
      {
      id: 'alice',
      name: 'alice',
      cName: 'alice.it',
      resolvedDomainName: '.alice.it',
      icon: 'Alice.it.png',
      supports: ['alice.it'],
      threshold: 60000,
      servers: [
                        {
                            id: 'default',
                            protocol: 'POP3',
                            port: 110,
                            incServer: 'in.alice.it',
                            ssl: false
                        }
                    ]
  },
/*==================================================
virgilio
====================================================*/
     {
     id: 'virgilio',
     name: 'virgilio',
     cName: 'virgilio.it',
     resolvedDomainName: '.virgilio.it',
     icon: 'Virgilio.it.png',
     supports: ['virgilio.it'],
     threshold: 60000,
     servers: [
                        {
                            id: 'default',
                            protocol: 'POP3',
                            port: 110,
                            incServer: 'in.virgilio.it',
                            ssl: false
                        }
                    ]
 },
/*==================================================
I.UA
====================================================*/
     {
     id: 'i.ua',
     name: 'i.ua',
     cName: 'i.ua',
     resolvedDomainName: '.i.ua',
     icon: 'i-ua.png',
     supports: ['i.ua'],
     threshold: 60000,
     servers: [
                        {
                            id: 'default',
                            protocol: 'POP3',
                            port: 110,
                            incServer: 'pop.i.ua',
                            ssl: false
                        }
                    ]
 },
/*==================================================
UKR.NET
====================================================*/
     {
     id: 'ukr.net',
     name: 'ukr.net',
     cName: 'ukr.net',
     resolvedDomainName: '.ukr.net',
     icon: 'Ukr.net.png',
     supports: ['ukr.net'],
     threshold: 60000,
     servers: [
                    {
                        id: 'default',
                        protocol: 'POP3',
                        port: 110,
                        incServer: 'pop3.ukr.net',
                        ssl: false
                    }
                ]
 }
 , {
     id: 'dish.net',
     name: 'dish.net',
     cName: 'dish.net',
     resolvedDomainName: '.dish.net',
     icon: 'email_dish.png',
     supports: ['dish.net'],
     threshold: 60000,
     servers: [
                    {
                        id: 'default',
                        protocol: 'POP3',
                        port: 110,
                        incServer: 'mail.dish.net',
                        ssl: false
                    }
                ]
 }
];
