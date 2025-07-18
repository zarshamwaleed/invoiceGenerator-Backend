const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true }
}, { _id: false });

const labelsSchema = new mongoose.Schema({
  item: String,
  quantity: String,
  rate: String,
  amount: String,
  notes: String,
  terms: String,
  subtotal: String,
  tax: String,
  discount: String,
  shipping: String,
  total: String,
  amountPaid: String,
  balanceDue: String,
  from: String,
  billTo: String,
  shipTo: String,
  paymentTerms: String,
  dueDate: String,
  poNumber: String,
  currency: String
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signup', required: true }, // ✅ ADD THIS
  type: {
    type: String,
    enum: ['INVOICE', 'CREDIT NOTE', 'QUOTE', 'PURCHASE ORDER'],
    default: 'INVOICE',
    required: true
  },
  logo: { type: String },
  from: { type: String, trim: true, required: true },
  billTo: { type: String, trim: true, required: true },
  shipTo: { type: String, trim: true },
  date: { type: String, required: true },
  paymentTerms: { type: String, trim: true },
  dueDate: { type: String },
  poNumber: { type: String, trim: true },
  currency: { type: String, trim: true, required: true },
  subtotal: { type: Number, required: true },
  tax: { type: Number },
  discount: { type: Number },
  shipping: { type: Number },
  total: { type: Number, required: true },
  amountPaid: { type: Number },
  balanceDue: { type: Number },
  notes: { type: String },
  terms: { type: String },
  invoiceNumber: { type: String, required: true, unique: true },
  lineItems: {
    type: [lineItemSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },
  labels: labelsSchema,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'invoices' });

module.exports = mongoose.model("Invoice", invoiceSchema);
