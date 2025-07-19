const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 
      "mongodb+srv://vercel_user:7vGqcQWwBsUWsl9f@invoicecluster.b94rfwy.mongodb.net/invoiceDB?retryWrites=true&w=majority&appName=InvoiceCluster";

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB Atlas:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
};

connectDB();
