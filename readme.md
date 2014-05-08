A template express webapp using Origami components
===

Defaults
---

* Uses Hogan
* A 'static' folder for assets
* Hogan template for layout with partials header, head, footer, body
* Compression enbaled
* Cookie parser enabled
* Secure session cookies enabled
* Set CORS header to allow requests from all domains

To use
---

    http://git.svc.ft.com:8080/scm/strat_p/template-origami-express-app.git
    cd template-origami-express-app/
    npm install
    bower install
    grunt

To run locally
---

As above, plus, 

    node webapp/app.js

To deploy
---

As above, plus

    heroku create {mySensibleAppName}
    git push heroku master

Remember to commit your static directory and run `grunt` if you update the CSS.
=======

Config options
---

* Open `./webapp/config.js`
* Add a values for `COOKIE_SECRET` and `COOKIE_AGE`