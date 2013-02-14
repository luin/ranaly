var ranaly = require('ranaly').createClient();
var Amount = ranaly.Amount;
var Realtime = ranaly.Realtime;
var DataList = ranaly.DataList;

var moment = require('moment');

var year = 365 * 24 * 3600 * 1000;

var startTime = Date.now() - year;
var endTime = Date.now() + year / 2;
var now;

function getRandom(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Generate amount type data.
var amount = [new Amount('Users'), new Amount('Page views'), new Amount('Groups'), new Amount('PHP'), new Amount('Node.js'), new Amount('Python'), new Amount('Ruby')];
for (now = startTime; now <= endTime; now += 3600000) {
  var diff = 20 - Math.abs(18 - moment(now).hours());
  amount.forEach(function (a) {
    a.incr(getRandom(diff * 10, (diff + 5) * 10), new Date(now));
  });
  console.log(now);
}

var realtime = [new Realtime('Memory'), new Realtime('CPU'), new Realtime('SSD'), new Realtime('Online Users'), new Realtime('Online Registered Users')];

setInterval(function () {
  realtime.forEach(function (b) {
    b.set(Math.random() * 500 | 0);
  });
}, 1000);


var images = new DataList('Images');
for (var i = 0; i < 200; ++i) {
  images.push('http://placehold.it/128x128', 200);
}

var users = new DataList('Users');
for (var i = 0; i < 200; ++i) {
  users.push({
    id: 'uI9dv',
    name: 'Peter',
    age: 65,
    description: 'BlaBlaBla...'
  }, 200);
  users.push({
    id: 'f9d0',
    name: 'Jeff',
    age: 30,
    description: 'BlaBlaBla...'
  }, 200);
  users.push({
    id: 'x87d',
    name: 'Bob',
    age: 28,
    description: 'BlaBlaBla...'
  }, 200);
}
