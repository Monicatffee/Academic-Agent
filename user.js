const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  name: String,
  facebook_id: String
});


module.exports = mongoose.model('User',User);