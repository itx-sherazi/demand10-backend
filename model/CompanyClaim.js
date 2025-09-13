import mongoose from 'mongoose';

const companyClaimSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebsiteUser',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'companyTeam',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  issue: {
    type: String,
    required: true
  },
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

const CompanyClaim = mongoose.model('CompanyClaim', companyClaimSchema);
export default CompanyClaim;