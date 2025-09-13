import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationExpires: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields
});

const User = mongoose.model('WebsiteUser', userSchema);
export default User;