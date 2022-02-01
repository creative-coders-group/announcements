import fs from "fs/promises";

const GET = async (req, res) => {
  try {
    let categories = await fs.readFile(
      "./src/database/json/categories.json",
      "utf-8"
    );
    categories = JSON.parse(categories);
    return res.json(categories);
  } catch (error) {
    res.json({
      status: 400,
      message: error.message,
    });
  }
};

export { GET };
