import fs from "fs";
import sharp from "sharp";

export default function (req, house_id) {
  if (!req.files) return [];
  let pictures;
  const picturesOfHouse = [];

  if (!Array.isArray(req.files.pictures)) {
    pictures = [req.files.pictures];
  } else {
    pictures = req.files.pictures;
  }
  const folderName = house_id + "/";
  const path = "./upload/" + folderName;
  if (!fs.existsSync(path)) {
    fs.mkdir(path, (e) => console.log(e));
  }

  if (req.files.pictures) {
    for (let picture of pictures) {
      const pictureName = picture.name.replace(/\s+/g, "");
      let picturePath = path + pictureName;
      sharp(picture.data).resize(800).jpeg({ quality: 80 }).toFile(picturePath);
      picturesOfHouse.push("upload/" + folderName + pictureName);
    }
  }
  return picturesOfHouse;
}
