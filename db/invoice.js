const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  quantity: { type: BigInt, required: true },
  rate: { type: BigInt, required: true },
  amount: { type: BigInt, required: true }
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signup', required: false },
  
  type: {
    type: String,
    enum: ['INVOICE', 'CREDIT NOTE', 'QUOTE', 'PURCHASE ORDER'],
    default: 'INVOICE',
    required: true
  },
  status: {
    type: String,
    enum: ['PAID', 'UNPAID'],
    default: 'UNPAID'
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
  subtotal: { type: BigInt, required: true },
  tax: { type: BigInt },
  discount: { type: BigInt },
  shipping: { type: BigInt },
  total: { type: BigInt, required: true },
  amountPaid: { type: BigInt, default: 0 },
  balanceDue: { type: BigInt, default: function() { return this.total; } },
  notes: { type: String },
  terms: { type: String },
  invoiceNumber: { type: String, required: true, unique: true },
  visitorId: { type: String, required: false },   
  lineItems: {
    type: [lineItemSchema],
    validate: v => Array.isArray(v) && v.length > 0
  },
  labels: labelsSchema,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'invoices' });


// Add a pre-save hook to automatically update status based on payment
invoiceSchema.pre('save', function(next) {
  if (this.balanceDue === 0) {
    this.status = 'PAID';
  } else {
    this.status = 'UNPAID';
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);