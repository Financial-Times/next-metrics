var metrics = require('metrics');
var t = new metrics.Histogram();

t.update(1);
t.update(2);
t.update(3);
t.update(8);

console.log('count', t.count)
