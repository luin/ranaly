var yaml = require('js-yaml');
var fs = require('fs');

if (process.argv[2] && fs.existsSync(process.argv[2])) {
  var configContent = fs.readFileSync(process.argv[2], 'utf8');
  var config = yaml.load(configContent);
} else {
  console.log('[WARNING] No config file specified, using the default config. In order to specify a config file use: node /path/to/ranaly /path/to/config.yaml');
  var config = require('./config_default.yaml');
}

var isArray = Array.isArray;
var rOnlyLetterOrNumber = /^[a-zA-Z][a-zA-Z0-9 ]*$/;

function generateID(prefix) {
  prefix = prefix || '';
  return prefix + (Math.random() * 1000000000 | 0).toString(36);
}

function toString(value) {
  return value ? value.toString() : (value === 0 ? '0' : '');
}

function initWidgets(wi) {
  var widgets = [];
  if (isArray(wi)) {
    wi.forEach(function (widget) {
      if (widget.type === 'custom_code') {
        if (widget.file) {
          try {
            widget.content = fs.readFileSync(widget.file, widget.encoding || 'utf8');
          } catch (e) {
            console.log('[Error] Couldn\'t load the custom_code widget: ' + e.message);
            return;
          }
        }
        if (!widget.content) return;

      } else if (!widget.type || !widget.bucket) {
        return;
      }
      // Every widget should have an ID.
      widget.id = generateID('widget_');
      // bucket should be an array
      if (typeof widget.bucket !== 'undefined' && !isArray(widget.bucket)) {
        widget.bucket = [widget.bucket];
      }
      if (isArray(widget.bucket)) {
        widget.bucket = widget.bucket.map(function (b) {
          return b.toString();
        });
      }
      // widget should have a default role
      widget.role = parseInt(widget.role, 10) || 0;
      // bucket should have a title
      widget.subtitle = toString(widget.subtitle).replace(/["']/g, '') || '';
      widget.y_axis_title = toString(widget.y_axis_title).replace(/["']/g, '') || '';
      switch (widget.type) {
      case 'amount_line_chart':
        widget.title = toString(widget.title) || 'Line Chart';
        widget.default_range = toString(widget.default_range) || 'today';
        break;
      case 'amount_pie_chart':
        widget.title = toString(widget.title) || 'Pie Chart';
        widget.default_range = toString(widget.default_range) || 'today';
        break;
      case 'amount_total_count':
        widget.title = toString(widget.title) || 'Total Count';
        widget.default_range = toString(widget.default_range) || 'all';
        break;
      case 'amount_today_count':
        widget.title = toString(widget.title) || 'Today Count';
        break;
      case 'realtime_line_chart':
        widget.title = toString(widget.title) || 'Realtime Chart';
        break;
      case 'realtime_count':
        widget.title = toString(widget.title) || 'Realtime Count';
        break;
      case 'datalist_list':
        widget.title = toString(widget.title) || 'Data List';
        widget.count_per_page = parseInt(widget.count_per_page, 10) || '12';
        if (widget.template) {
          widget.template = toString(widget.template);
        } else {
          if (!widget.preset_template) {
            widget.preset_template = 'default';
          }
          var tplPath = __dirname + '/template/' + widget.preset_template + '.mustache';
          if (fs.existsSync(tplPath)) {
            widget.template = fs.readFileSync(tplPath, 'utf8');
          } else {
            console.log('[Error] Couldn\'t load datalist widget as the specified preset template isn\'t exists.');
            return;
          }
        }
        break;
      }
      widgets.push(widget);

    });
  }
  return widgets;
}

if (!config || typeof config !== 'object') config = {};
config.app_name = toString(config.app_name) || 'New App';
config.redis = config.redis || {};
config.port = config.port || 3000;
config.secret = toString(config.secret) || generateID('cookieSecret');

// users
var users = [];
if (isArray(config.users)) {
  config.users.forEach(function (user) {
    if (!user.username) return;
    users.push({
      username: user.username.toString(),
      password: toString(user.password),
      role: parseInt(user.role, 10) || 0
    });
  });
}
config.users = users;

// pages
var pages = [];
var pageID = {};
if (isArray(config.pages)) {
  config.pages.forEach(function (page) {
    if (!page.title) return;
    page.title = page.title.toString();
    // every page should have an id
    if (rOnlyLetterOrNumber.test(page.title)) {
      page.id = toString(page.id) || page.title.toLowerCase().replace(/ +/g, '-');
    }
    if (!page.id || pageID[page.id]) {
      page.id = generateID('page_');
      pageID[page.id] = true;
    } else {
      pageID[page.id] = true;
    }

    page.widgets = initWidgets(page.widgets);

    pages.push(page);
  });
}
config.pages = pages;

module.exports = config;
