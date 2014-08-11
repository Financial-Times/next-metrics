A stab at creating an http router
===

To use
---

    http://git.svc.ft.com:8080/scm/strat_p/next-router.git
    cd next-router/
    npm install

To run locally
---

Do something like

	nodemon server/app.js

To deploy
---

As above, plus

    heroku create {mySensibleAppName}
    git push heroku master