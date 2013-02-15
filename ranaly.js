var express = require('express');
var http = require('http');

var config = require('./load_config');

var ranaly = require('ranaly').createClient(config.redis.port,
    config.redis.host, config.redis.key_prefix);

var sub = require('redis').createClient();

var app = express();

var cookieParser = express.cookieParser(config.secret);
var sessionStore = new (require('connect')).
      middleware.session.MemoryStore();

var middleware = require('./middleware');

app.configure(function(){
  app.locals.config = config;
  app.set('port', process.env.PORT || config.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('title', config.app_name);
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.bodyParser());
  app.use(cookieParser);
  app.use(express.session({store: sessionStore}));
  app.use(middleware.flash);
  app.use(express.compress());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

function noPageError(req, res) {
  res.locals.title = 'Error - ' + app.locals.settings.title;
  req.session.error = 'No pages found. Please refer to the <a href="https://github.com/luin/ranaly/">ranaly\'s documentation</a>.';
  middleware.flash(req, res, function () {});
  res.render('error');
}

app.get('/', middleware.requireRole, middleware.generateMenu(config),
    function (req, res) {
  if (!config.pages.length || !res.locals.menus[0]) {
    noPageError(req, res);
  } else {
    res.redirect('/pages/' + res.locals.menus[0].id);
  }
});

app.get('/pages/:pageID', middleware.requireRole,
    middleware.generateMenu(config), function (req, res) {
  var found = config.pages.some(function (page) {
    if (page.id === req.params.pageID) {
      res.locals.title = page.title + ' - ' + app.locals.settings.title;
      res.locals.page = page;
      res.render('page');
      return true;
    }
  });
  if (!found) {
    noPageError(req, res);
  }
});

app.get('/login', function (req, res) {
  res.locals.title = 'Login - ' + app.locals.settings.title;
  res.render('login');
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/login', function (req, res) {
  var currentUser;
  config.users.forEach(function (user) {
    if (user.username === req.body.username &&
        user.password === req.body.password) {
      currentUser = user;
    }
  });
  if (currentUser) {
    req.session.username = currentUser.username;
    req.session.role = currentUser.role;
    res.redirect(req.query.next || '/');
  } else {
    req.session.error = 'Wrong username or password.';
    if (req.query.next)
      res.redirect('/login?next=' + (req.query.next));
    else
      res.redirect('/login');
  }
});

/*
 * API
 */
app.post('/api/amount_get/:buckets', middleware.requireRole,
    function (req, res) {
  var buckets = req.params.buckets.split(',');
  var len = buckets.length;
  var results = [];
  buckets.forEach(function (bucket) {
    bucket = new ranaly.Amount(bucket);
    bucket.get(req.body.time, function (err, result) {
      results.push(result);
      if (!--len) {
        res.json({items: results});
      }
    });
  });
});

app.post('/api/amount_sum/:buckets', middleware.requireRole, function (req, res) {
  var buckets = req.params.buckets.split(',');
  var len = buckets.length;
  var results = [];
  buckets.forEach(function (bucket) {
    bucket = new ranaly.Amount(bucket);
    bucket.sum(req.body.time, function (err, result) {
      results.push(result);
      if (!--len) {
        res.json({items: results});
      }
    });
  });
});

app.get('/api/datalist_get/:bucket', middleware.requireRole, function (req, res) {
  var bucket = new ranaly.DataList(req.params.bucket);
  bucket.len(function (err, length) {
    bucket.range(parseInt(req.query.from, 10), parseInt(req.query.to, 10), function (err, list) {
      res.json({length: length, data: list});
    });
  });
});

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Ranaly server listening on port ' + app.get('port'));
});

/*
 * Socket.io Server
 */
var io = require('socket.io').listen(server, {log: false});
io.enable('browser client etag');
io.set('log level', 1);

var sessionSockets = new (require('session.socket.io'))(io, sessionStore, cookieParser);

sub.on('message', function (channel, message) {
  io.sockets['in'](channel).emit('realtime value', {
    bucketKey: channel,
    value: parseInt(message, 10)
  });
});

sessionSockets.on('connection', function (err, socket, session) {
  if (!session || !session.username) {
    socket.disconnect('unauthorized');
    return;
  }
  socket.on('register realtime bucket', function (bucket, fn) {
    bucket = bucket.map(function (b) {
      var rl = new ranaly.Realtime(b);
      sub.subscribe(rl.channel);
      socket.join(rl.channel);
      return rl;
    });

    var l = bucket.length;
    var result = [];
    bucket.forEach(function (b, i) {
      b.get(function (err, value) {
        result[i] = [b.key, value];
        if (!--l) {
          fn(result);
        }
      });
    });
  });
});
