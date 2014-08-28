
SOONER

- Any sort of error handling at the moment is a little noddy.
- Load balancing - Should the router do this or leave it to the underlying
  application pool?
- Add cookie filtering back in.
- Benchmarking (what sort of load can we handle on couple of heroku processes)
- Need to test other http methods beyond GET.
- The models could do with some rework (see the FIXME's) & validation.
- Maintain a map of the state of all application nodes

LATER

- Write an API on top of the proxy.js to allow updates outside of release
  cycle, ie. dynamic routing. - This functionality is complete but implemented as a pull from the service registry
- Struck me that looping around lots of regex is going to be expensive. We can
  form a hash of the key incoming request headers + path so that common lookups
  will be very fast.

