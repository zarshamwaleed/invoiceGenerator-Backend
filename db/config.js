const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://vercel_user:7vGqcQWwBsUWsl9f@invoicecluster.b94rfwy.mongodb.net/invoice?retryWrites=true&w=majority&appName=InvoiceCluster",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("✅ Connected to MongoDB Atlas");
    console.log("📦 Database name:", mongoose.connection.name);

  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

connectDB();
