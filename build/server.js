'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _connectFlash = require('connect-flash');

var _connectFlash2 = _interopRequireDefault(_connectFlash);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _routes = require('./routes/routes');

var _routes2 = _interopRequireDefault(_routes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DB_URL = _config2.default.get('dbURL');
var publicPath = _path2.default.resolve('public');
var app = (0, _express2.default)();

app.set('views', publicPath + '/views');
app.set('view engine', 'ejs');

require('./passport/init')(_passport2.default);

_mongoose2.default.connect(DB_URL);

// Set up express app
app.use((0, _morgan2.default)('dev'));
app.use((0, _cookieParser2.default)());
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: true }));
app.use(_express2.default.static(publicPath));

// Passport setup
app.use((0, _expressSession2.default)({
  secret: 'secretssecretsarenofun',
  resave: true,
  saveUninitialized: true
}));
app.use(_passport2.default.initialize());
app.use(_passport2.default.session()); // persistent login sessions
app.use((0, _connectFlash2.default)());

(0, _routes2.default)(app, _passport2.default);

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log('Messaging bot server running at port ' + (process.env.PORT || 3000));
});