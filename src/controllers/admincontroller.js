import sha256 from "sha256";
import jsonwebtoken from "jsonwebtoken";
import fs from "fs/promises";

const POST = async (req, res) => {
  let admins = await fs.readFile("./src/database/json/admins.json", "utf-8");
  let { email, password, token } = req.body;
  if (token) {
    let admin = jsonwebtoken.verify(token, "Ariana Grande");
    let isAdmin = admins.find(
      (ad) => ad.email == admin.email && ad.password == admin.password
    );
    if (isAdmin) {
      return res.json(isAdmin);
    }
    return res.json({
      status: 501,
      message: "no such admin",
    });
  }
  let admin = admins.find(
    (ad) => ad.email == email && ad.password == sha256(password)
  );
  if (admin) {
    return res.json(
      jsonwebtoken.sign(admin, "Ariana Grande", { expiresIn: 86400 })
    );
  }
  return res.json({
    status: 501,
    message: "no such admin",
  });
};

export { POST };
