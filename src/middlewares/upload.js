import multer from "multer";
import path from "path";

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// file filter (PDF, images only)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|png|jpg|jpeg|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, JPG, JPEG, WEBP , png allowed"));
  }
};

export const uploadGovId = multer({
  storage,
  fileFilter,
});