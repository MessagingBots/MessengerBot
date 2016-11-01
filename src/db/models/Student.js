import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';

const StudentSchema = new mongoose.Schema({
  id: String,
  local: {
    name: String,
    email: String,
    // @TODO Find datatype for password
    password: String,
  },
  canvas: {
    token: String,
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
StudentSchema.methods.generateHash = password =>
  bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

// checking if password is valid
StudentSchema.methods.validPassword = password =>
  bcrypt.compareSync(password, this.local.password);


module.exports = mongoose.model('Student', StudentSchema);
