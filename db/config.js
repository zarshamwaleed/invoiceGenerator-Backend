const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/invoice', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
    console.log("📦 Database name:", mongoose.connection.name);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📂 Collections:", collections.map((col) => col.name));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

connectDB(); 
