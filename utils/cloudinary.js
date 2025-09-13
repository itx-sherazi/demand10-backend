import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,      // 🔁 Replace with your Cloudinary name
  api_key: process.env.API_KEY,            // 🔁 Replace with your API key
  api_secret: process.env.API_SECRET       // 🔁 Replace with your API secret
});

export default cloudinary;
