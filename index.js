const express = require("express");
const cors = require("cors");
const connectDB = require("./db/config");
connectDB();  // ✅ Connects to MongoDB Atlas

const Signup = require("./db/signup");
const Invoice = require("./db/invoice");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID =
  "369192783250-50g1jib6u4nk2617fbg9elp636k0ccuc.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const app = express();

// ✅ FIX 1: Allow large payloads (prevents 413 Content Too Large)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ FIX 2: Dynamic CORS (allow all your Vercel preview URLs)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://invoice-generator-frontend-ypf8.vercel.app",
  "https://invoice-generator-frontend-ypf8-rm04idn5x.vercel.app",
  "https://invoice-generator-frontend-ypf8-739u4eq8o.vercel.app",
  "https://invoice-generator-frontend-ypf8-bopo0rnhp.vercel.app/"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // ✅ Always allow same-origin requests (like cURL/Postman)
      if (!origin) return callback(null, true);

      // ✅ Allow all localhost & Vercel URLs
      if (
        origin.includes("localhost:3000") ||
        origin.includes("127.0.0.1:3000") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      console.warn("❌ Blocked by CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);


// ✅ Handle preflight OPTIONS
app.options("*", cors());

// ✅ GET fallback for root
app.get("/", (req, res) => {
  res.send("✅ Backend is running on Vercel! Use API routes with POST/GET as required.");
});

// ======== SIGNUP ========
app.post("/signup", async (req, res) => {
  try {
    const signup = new Signup(req.body);
    let result = await signup.save();
    result = result.toObject();
    delete result.password;
    res.status(200).send(formatUser(result));
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ result: "Email already taken. Try a different one." });
    }
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/signup", (req, res) => {
  res.send("❌ Please use POST /signup with user details in JSON.");
});

// ======== SIGNIN (email/password) ========
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ result: "Email and password are required" });
  }

  try {
    const user = await Signup.findOne({ email, password });
    if (user) {
      res.status(200).json({ user: formatUser(user) });
    } else {
      res.status(401).json({ result: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.get("/signin", (req, res) => {
  res.send("❌ Please use POST /signin with email & password in JSON.");
});

// ======== GOOGLE LOGIN ========
const formatUser = (user) => ({
  id: user._id,
  firstName: user.firstName || "",
  lastName: user.lastName || "",
  email: user.email,
  picture: user.picture || "",
  googleSignIn: user.googleSignIn || false,
});

app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    const [firstName, ...lastParts] = (name || "").split(" ");
    const lastName = lastParts.join(" ") || "";

    let user = await Signup.findOne({ email });

    if (!user) {
      user = new Signup({
        firstName: firstName || "Google",
        lastName: lastName || "User",
        email,
        password: null,
        googleSignIn: true,
        agreedToTerms: true,
        picture,
      });
      await user.save();
    }

    res.json({
      message: "✅ Google login successful",
      user: formatUser(user),
    });
  } catch (error) {
    res.status(401).json({ error: "Invalid Google Token" });
  }
});

app.get("/api/auth/google", (req, res) => {
  res.send("❌ Please use POST /api/auth/google with Google token in JSON.");
});

// ======== AUTH ME ========
app.get("/auth/me", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    const user = await Signup.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: formatUser(user) });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== CREATE INVOICE ========
app.post("/invoice", async (req, res) => {
  try {
    let { type, userId, visitorId } = req.body;

    // ✅ Only keep valid Mongo ObjectId for userId, otherwise set null
    const finalUserId = mongoose.Types.ObjectId.isValid(userId) ? userId : null;

    // ✅ Validate invoice type
    const validTypes = ["INVOICE", "CREDIT NOTE", "QUOTE", "PURCHASE ORDER"];
    if (!validTypes.includes(type)) {
      const referer = req.headers.referer || "";
      if (referer.includes("/credit-note-template")) type = "CREDIT NOTE";
      else if (referer.includes("/quote-template")) type = "QUOTE";
      else if (referer.includes("/purchase-order-template")) type = "PURCHASE ORDER";
      else type = "INVOICE";
    }

    // ✅ Calculate status (PAID or UNPAID)
    const status = req.body.amountPaid === req.body.total ? "PAID" : "UNPAID";

    // ✅ Create invoice with both visitorId & userId
    const invoice = new Invoice({
      ...req.body,
      type,
      userId: finalUserId,
      visitorId,
      status
    });

    const result = await invoice.save();

    res.status(200).json({
      message: "✅ Invoice saved successfully",
      invoice: result.toObject(),
    });
  }catch (error) {
    console.error("❌ Invoice Save Error:", error.message, error.stack);

    // ✅ Handle duplicate invoiceNumber properly
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Duplicate invoiceNumber",
        message: "Invoice number already exists. Please use a unique one."
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      message: error.message
    });
  }
});


app.get("/invoice", (req, res) => {
  res.send("❌ Please use POST /invoice with invoice data in JSON.");
});

// ======== GET ALL INVOICES ========
app.get("/invoices", async (req, res) => {
  try {
    const { type, userId, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== DELETE SINGLE INVOICE ========
app.delete("/invoice/:id", async (req, res) => {
  try {
    const result = await Invoice.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== DELETE ALL INVOICES ========
app.delete("/invoices", async (req, res) => {
  try {
    await Invoice.deleteMany({});
    res.json({ message: "All invoices deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== UPDATE INVOICE BY INVOICE NUMBER ========
app.put("/invoice/:invoiceNumber", async (req, res) => {
  try {
    const updateData = req.body;

    if (
      updateData.balanceDue !== undefined ||
      updateData.amountPaid !== undefined
    ) {
      updateData.status =
        updateData.balanceDue === 0 ? "PAID" : "UNPAID";
    }

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNumber: req.params.invoiceNumber },
      updateData,
      { new: true }
    );

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "✅ Invoice updated successfully", invoice });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== CHECK IF INVOICE EXISTS ========
app.get("/invoice/check/:invoiceNumber", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
    });
    res.json({ exists: !!invoice });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// Get single invoice by invoice number
app.get("/invoice/:invoiceNumber", async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      invoiceNumber: req.params.invoiceNumber,
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== UPDATE INVOICE STATUS ========
app.put("/invoice/:invoiceNumber/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["PAID", "UNPAID"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNumber: req.params.invoiceNumber },
      { status },
      { new: true }
    );

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ message: "✅ Invoice status updated successfully", invoice });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

// ======== START SERVER ========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
