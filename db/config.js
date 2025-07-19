const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://zarshamwaleedbutt:ijAbthTUp1XACXga@invoicecluster.b94rfwy.mongodb.net/invoice?retryWrites=true&w=majority&appName=InvoiceCluster',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

module.exports = connectDB;
