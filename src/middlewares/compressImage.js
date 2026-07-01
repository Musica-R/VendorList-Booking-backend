import sharp from "sharp";
import fs from "fs";
import path from "path";

const MAX_SIZE = 40 * 1024; // 40 KB

async function compress(file) {
  if (!file) return;

  // Skip PDF
  if (file.mimetype === "application/pdf") {
    return;
  }

  let quality = 90;
  let width = null;

  const outputPath = file.path.replace(path.extname(file.path), ".webp");

  while (quality >= 20) {
    let image = sharp(file.path);

    if (width) {
      image = image.resize({
        width,
        withoutEnlargement: true,
      });
    }

    await image
      .webp({
        quality,
        effort: 6,
      })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);

    if (stats.size <= MAX_SIZE) {
      fs.unlinkSync(file.path);

      file.filename = path.basename(outputPath);
      file.path = outputPath;
      file.mimetype = "image/webp";

      return;
    }

    quality -= 10;

    if (quality < 40 && !width) {
      width = 1200;
    } else if (quality < 30) {
      width = 900;
    } else if (quality < 20) {
      width = 700;
    }
  }

  fs.unlinkSync(file.path);

  file.filename = path.basename(outputPath);
  file.path = outputPath;
  file.mimetype = "image/webp";
}

export const compressImage = async (req, res, next) => {
  try {
    if (req.file) {
      await compress(req.file);
    }

    if (req.files) {
      for (const key in req.files) {
        for (const file of req.files[key]) {
          await compress(file);
        }
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};