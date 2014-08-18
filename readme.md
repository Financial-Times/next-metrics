A stab at creating an http router
===

To use
---

    http://git.svc.ft.com:8080/scm/strat_p/next-router.git
    cd next-router/
    npm install

To verify everything is tickety boo,

    make test

To run locally
---

Do something like,

    export DEBUG=proxy; nodemon server/proxy.js

Then this will proxy your request to the correct service version, Eg

    curl -i -A 'iPhone 5' localhost:5050/badger
    curl -i -A 'Nexus 4' localhost:5050/badger

Note the `x-version` header in the response.

To deploy
---

As above, plus

    heroku create {mySensibleAppName}
    git push heroku master
