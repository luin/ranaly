/*global $:true, Highcharts:true, window:true,  Kalendae:true*/
/*jshint unused:false*/
var ranalyApi = {
  amount : {
    get: function (buckets, dates, callback) {
      $.post('/api/amount_get/' + encodeURI(buckets.join(',')), {time: dates}, callback);
    },
    sum: function (buckets, dates, callback) {
      $.post('/api/amount_sum/' + encodeURI(buckets.join(',')), {time: dates}, callback);
    }
  },
  datalist : {
    get: function (bucket, from, to, callback) {
      $.get('/api/datalist_get/' + encodeURI(bucket), {from: from, to: to}, callback);
    }
  }
};

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var renderInterval = function (interval, callback) {
  setTimeout(function () {
    callback();
    renderInterval(interval, callback);
  }, interval ? interval * 1000 : getRandomInt(20000, 40000));
};

var startOfDay = function (time) {
  return new Date(time.getFullYear(), time.getMonth(), time.getDate());
};

var CHART_COLORS = [
  '#6ea8cd',
  '#f97774',
  '#92c9a1',
  '#e89746',
  '#ffe698',
  '#ce6faf',
  '#8091c8',
  '#a47d7c',
  '#b5ca92'
];

Highcharts.setOptions({
  global : {
    useUTC : false
  },
  credits: {
    enabled: false
  },
  colors: CHART_COLORS
});

window.moment = Kalendae.moment;
