'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bcryptNodejs = require('bcrypt-nodejs');

var _bcryptNodejs2 = _interopRequireDefault(_bcryptNodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var StudentSchema = new _mongoose2.default.Schema({
  local: {
    name: String,
    email: String,
    // @TODO Find datatype for password
    password: String
  },
  canvas: {},
  fb: {
    id: String,
    senderID: String,
    accessToken: String,
    firstName: String,
    lastName: String,
    email: String
  },
  slack: {}
});

// generating a hash
StudentSchema.methods.generateHash = function (password) {
  return _bcryptNodejs2.default.hashSync(password, _bcryptNodejs2.default.genSaltSync(8), null);
};

// checking if password is valid
StudentSchema.methods.validPassword = function (password) {
  return _bcryptNodejs2.default.compareSync(password, this.local.password);
};

module.exports = _mongoose2.default.model('Student', StudentSchema);