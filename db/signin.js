const mongoose = require('mongoose');



    const SigninSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: String,
      googleSignIn: Boolean,
      keepLoggedIn: Boolean,
      createdAt: { type: Date, default: Date.now }
    });


    module.exports= mongoose.model("signins",SigninSchema);