A template express webapp
===

Defaults
--

* Uses Hogan
* A static folder
* Templates: Layout, header, head, footer, body
* Compression enbaled
* Cookie parser
* Secure session cookies

To use
--
    git clone https://github.com/netaphor/templateWebApp.git
    node webapp/app.js
    
Config options
--
Open `./webapp/config.js`

Add a values for `COOKIE_SECRET` and `COOKIE_AGE`