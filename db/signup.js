const mongoose = require('mongoose');

const SignUpSchema = new mongoose.Schema({
  firstName: { type: String, required: false },  // Optional for Google
  lastName:  { type: String, required: false },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: false },  // Not required for Google
  googleSignIn: { type: Boolean, default: false },
  picture: { type: String },                     // Google profile pic
  agreedToTerms: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("signups", SignUpSchema);
