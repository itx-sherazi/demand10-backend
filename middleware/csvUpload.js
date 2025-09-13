
import multer from "multer";

const storage = multer.memoryStorage(); // ✅ RAM me file save hoti hai
const csvUpload = multer({ storage });

export default csvUpload;
