const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB Atlas");
    console.log("📦 Database:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
};

connectDB();
