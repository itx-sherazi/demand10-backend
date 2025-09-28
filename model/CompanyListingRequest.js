import mongoose from 'mongoose';

const companyListingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteUser',
    required: true
  },
  companyName: {
    type: String,
  },
  companyEmail: {
    type: String,
  },
  companyPhone: {
    type: String,
  },
  website: {
    type: String
  },
  description: {
    type: String
  },
  companyCountry: {
    type: String
  },
  foundedYear: {
    type: Number
  },
  employees: {
    type: String
  },
  linkedinUrl: {
    type: String
  },
  facebookUrl: {
    type: String
  },
  twitterUrl: {
    type: String
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  image: {
    type: String
  },
  teamLeads: [{
    name: { type: String },
    position: { type: String },
    facebookUrl: { type: String },
    linkedinUrl: { type: String },
    twitterUrl: { type: String }
  }],
  // Added new fields
  minimumProjectSize: {
    type: String  // Changed from Number to String to support ranges like "$1k - $5k"
  },
  hourlyRate: {
    type: String  // Changed from Number to String to support ranges like "$25 - $49"
  },
  // Service lines field
  services: [{
    serviceName: { type: String },
    category: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],
  // Focus areas field
  focus: [{
    focusName: { type: String },
    category: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],
  
  // Industries field (for graph data)
  industries: [{
    industryName: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],
  
  // Industry tags field (simple string array)
  industryTags: [String],
  
  // Clients field
  clients: [{
    clientSegment: { type: String },
    percentage: { type: Number, min: 10, max: 100 }
  }],
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin user
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const CompanyListingRequest = mongoose.model('CompanyListingRequest', companyListingRequestSchema);
export default CompanyListingRequest;