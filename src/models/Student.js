import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
let StudentSchema = new mongoose.Schema({
  local: {
    name: String,
    email: String,
    // @TODO Find datatype for password
    password: String,
  },
  canvas: {

  },
  fb: {
    id: String,
    senderID: String,
    accessToken: String,
    firstName: String,
    lastName: String,
    email: String,
  },
  slack: {

  },
});

// generating a hash
StudentSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
StudentSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('Student', StudentSchema);