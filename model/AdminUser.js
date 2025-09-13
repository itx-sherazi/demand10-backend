import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: {
    type: String,
    default: 'admin'
  }
});

const User = mongoose.model('User', userSchema);
export default User;