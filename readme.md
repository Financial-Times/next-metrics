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

Note the `x-version` header in the response is differing per user-agent.

To deploy
---

As above, plus

    heroku create {mySensibleAppName}
    git push heroku master


About 
---

This is an experimental router for the Next FT platform.

The project comprises of _Services_ and _Versions_.

_Services_ represent an application with a specific purpose in the context of
the Next project. For example, we might write a service that renders articles.

The job of the router is to route incoming requests that match the pattern of
an article to our service, Eg.

    $ curl -i http://www.ft.com/4d3e8748-26b6-11e4-8df5-00144feabdc0

_Versions_ extend this idea by allowing several variants of the service to
co-exist on the same URL. 

For example, we might have three versions of our article service,

 - v1.0 is our default, stable article rendering service.
 - v1.1 is a small adaptation of v1.1 with some UX enhancements.
 - v2.0 is an experimental article service the makes use of v2 of the Content
   API.

We can tell the router to split traffic between v1.0 and v1.1 for the purpose of
running an AB test to compare the performance of the two versions, and at the
same time we can tell the router to direct any opted-in traffic (say, with a
cookie) to the experimental v2.0.

Likewise, if v1.1 contained some technical improvements and bug fixes we can
run it alongside the existing version for a couple of hours for 5% of traffic
to ensure we haven't introduced any critical bugs.

We could route all internal FT traffic at v2.0 to gain some feedback, or 10% of
traffic from USA to a fresh take on a front-page. 

And so on.

Essentially, the router sits in between the CDN and our
presentational services, directing traffic to the correct application.

The router is written in Node.js and uses
[http-proxy](https://github.com/nodejitsu/node-http-proxy).

Why?
---

We want to avoid creating a monolithic application where all requests for
ft.com are sent from a load balancer to a single, ever-growing application.

The next version of ft.com will comprise of several presentational services
working in tandem to provide a set of features and products. As such we need to
be able to intelligently route between them.  

An architecture based around several small, modular applications allows for
low-risk experimentation and prototyping as part of the normal, day-to-day
production release cycle - the router, in effect, controls the exposure to
these services depending on where they are at in their development life-cycle.

