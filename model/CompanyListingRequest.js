import mongoose from 'mongoose';

const companyListingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteUser',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyEmail: {
    type: String,
    required: true
  },
  companyPhone: {
    type: String,
    required: true
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
    type: Number
  },
  hourlyRate: {
    type: Number
  },
  // Service lines field
  services: [{
    serviceName: { type: String, required: true },
    category: { type: String, required: true },
    percentage: { type: Number, required: true, min: 10, max: 100 }
  }],
  // Focus areas field
  focus: [{
    focusName: { type: String, required: true },
    category: { type: String, required: true },
    percentage: { type: Number, required: true, min: 10, max: 100 }
  }],
  
  // Industries field (for graph data)
  industries: [{
    industryName: { type: String, required: true },
    percentage: { type: Number, required: true, min: 10, max: 100 }
  }],
  
  // Industry tags field (simple string array)
  industryTags: [String],
  
  // Clients field
  clients: [{
    clientSegment: { type: String, required: true },
    percentage: { type: Number, required: true, min: 10, max: 100 }
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