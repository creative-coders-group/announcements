import fs from "fs/promises";
import compress_images from "compress-images";
import Joi from "joi";

const GET = async (req, res) => {
  let events = await fs.readFile("./src/database/json/events.json", "utf-8");

  events = JSON.parse(events);
  if (req.params.eventId) {
    return res.json(events.find((e) => e.eve_id == req.params.eventId));
  }
  let tab = req.query.tab,
    user_id = req.query.user_id,
    page = req.query.page || 1,
    limit = req.query.limit || 9,
    date = req.query.date,
    eve_type = req.query.type,
    sub_category = req.query.category;

  if (tab == "users") {
    let users = [];
    let m = new Date(date);
    for (const event of events) {
      let j = new Date(event.eve_date);
      if (
        event.sub_category == sub_category &&
        event.status == "accepted" &&
        m.getFullYear() == j.getFullYear() &&
        m.getMonth() == j.getMonth() &&
        m.getDate() == j.getDate() &&
        !users.find((e) => e.user_id == event.user_id)
      ) {
        users.push({
          user_id: event.user_id,
          userName: event.userName,
          userFamily: event.userFamily,
        });
      }
    }
    res.json(users);
    return;
  }

  if (tab == "*") {
    events = events.filter((event) => {
      let m = new Date(date);
      let j = new Date(event.eve_date);
      return (
        event.eve_type == eve_type &&
        event.sub_category == sub_category &&
        m.getFullYear() == j.getFullYear() &&
        m.getMonth() == j.getMonth() &&
        m.getDate() == j.getDate() &&
        event.status == "accepted"
      );
    });
    res.json(events.slice((page - 1) * limit, page * limit));
    return;
  }

  if (tab == "main") {
    for (let i = 0; i < events.length; i++) {
      let j = new Date(events[i].eve_date),
        m = new Date();
      if (j < m || events[i].status == "rejected") {
        await fs.unlink("./src/database/image/" + events[i].eve_pic);
        events.splice(i, 1);
      }
    }

    await fs.writeFile(
      "./src/database/json/events.json",
      JSON.stringify(events, null, 2)
    );
    events = events.filter((event) => event.status == "accepted");
    res.json(events.slice((page - 1) * limit, page * limit));
    return;
  }

  events = events.filter((event) => {
    let m = new Date(date);
    let j = new Date(event.eve_date);
    return (
      event.user_id == user_id &&
      event.eve_type == eve_type &&
      event.sub_category == sub_category &&
      m.getFullYear() == j.getFullYear() &&
      m.getMonth() == j.getMonth() &&
      m.getDate() == j.getDate() &&
      event.status == "accepted"
    );
  });
  res.json(events.slice((page - 1) * limit, page * limit));
};

const POST = async (req, res) => {
  let events = await fs.readFile("./src/database/json/events.json", "utf-8");
  events = events ? JSON.parse(events) : [];

  const schema = Joi.object({
    eve_id: Joi.number(),
    user_id: Joi.number().required(),
    userName: Joi.string().min(3).max(30).required().alphanum(),
    userFamily: Joi.string().min(3).max(30).required().alphanum(),
    tel: Joi.string().min(12).max(12).required(),
    profession: Joi.string(),
    category: Joi.string().required(),
    sub_category: Joi.string().required(),
    eve_pic: Joi.string(),
    eve_name: Joi.string().min(3).max(50).required(),
    eve_info_little: Joi.string().max(100),
    eve_info_full: Joi.string().min(30).max(700).required(),
    eve_type: Joi.string().allow("online", "offline"),
    eve_location: Joi.string(),
    eve_link: Joi.string(),
    eve_date: Joi.string(),
    status: Joi.string(),
    view_count: Joi.number(),
  }).xor("eve_link", "eve_location");
  let {
    user_id,
    userName,
    userFamily,
    tel,
    profession,
    category,
    sub_category,
    eve_name,
    eve_info_little,
    eve_info_full,
    eve_type,
    eve_location,
    eve_date,
  } = req.body;
  let eve_id = 0;
  for (const j of events) {
    if (j.eve_id > eve_id) eve_id = j.eve_id;
  }
  eve_id = eve_id ? 1 : eve_id + 1;
  let newEvent = {
    eve_id,
    user_id,
    userName,
    userFamily,
    tel,
    profession,
    category,
    sub_category,
    eve_name,
    eve_pic: req.file.originalname,
    eve_info_little,
    eve_info_full,
    eve_type,
    eve_location,
    eve_date,
    status: "pending",
    view_count: 0,
  };

  try {
    const value = await schema.validateAsync(newEvent);
    let index = events.findIndex((e) => e.eve_date > eve_date);
    console.log(index);
    if (index == -1) events.push(value);
    else events.splice(index, 0, value);
    await fs.writeFile(
      "./src/database/json/events.json",
      JSON.stringify(events, null, 2)
    );
  } catch (err) {
    res.json({
      status: 501,
      message: err,
    });
  }

  await fs.writeFile(
    "./src/database/" + req.file.originalname,
    req.file.buffer
  );
  await compress_images(
    "./src/database/" + req.file.originalname,
    "./src/database/image/",
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
    { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    {
      gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
    },
    function (error, completed, statistic) {
      console.log(error);
    }
  );
  setTimeout(async () => {
    await fs.unlink("./src/database/" + req.file.originalname);
  }, 10000);
  res.json(newEvent);
};

const PUT = async (req, res) => {
  let events = await fs.readFile("./src/database/json/events.json", "utf-8");
  events = events ? JSON.parse(events) : [];
  let { eve_id, status, category } = req.body;

  let j = events.find((e) => e.eve_id == eve_id);
  j.status = status;
  if (status == "accepted") {
    let categories = await fs.readFile(
      "./src/database/json/categories.json",
      "utf-8"
    );
    categories = categories ? JSON.parse(categories) : {};
    let categorie = categories.find((e) => e.name == category);
    categorie.count += 1;
    await fs.writeFile(
      "./src/database/json/categories.json",
      JSON.stringify(categories, null, 2)
    );
  }
  await fs.writeFile(
    "./src/database/json/events.json",
    JSON.stringify(events, null, 2)
  );
};

export { GET, POST, PUT };
