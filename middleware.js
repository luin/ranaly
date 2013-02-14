exports.flash = function (req, res, next) {
  var err = req.session.error;
  var msg = req.session.info;
  delete req.session.error;
  delete req.session.info;
  res.locals.message = '';
  if (err)
    res.locals.message = '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Oh snap!</strong> ' + err + '</div>';
  if (msg)
    res.locals.message = '<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Well done!</strong> ' + msg + '</div>';
  next();
};

exports.requireRole = function (req, res, next) {
  if (req.session.username) {
    res.locals.user = req.session;
    next();
  } else {
    if (req.path !== '/') {
      req.session.error = 'You need to sign in before continuing.';
      res.redirect('/login?next=' + encodeURIComponent(req.path));
    } else {
      res.redirect('/login');
    }
  }
};

exports.generateMenu = function (config) {
  return function (req, res, next) {
    res.locals.menus = [];
    config.pages.forEach(function (page) {
      var pass = false;
      page.widgets.forEach(function (widget) {
        if (widget.role <= req.session.role) {
          pass = true;
        }
      });
      if (pass) {
        res.locals.menus.push({
          title: page.title,
          id:  encodeURIComponent(page.id)
        });
      }
    });
    next();
  };
};
