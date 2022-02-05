import fs from "fs/promises";
import compress_images from "compress-images";
import Joi from "joi";

const GET = async (req, res) => {
  let events = await fs.readFile("./src/database/json/events.json", "utf-8");

  events = events ? JSON.parse(events) : [];
  if (req.params.eventId) {
    try {
      let eve = events.find((e) => e.eve_id == req.params.eventId);
      eve.view_count += 1;
      await fs.writeFile(
        "./src/database/json/events.json",
        JSON.stringify(events, null, 2)
      );
      return res.json(eve);
    } catch (error) {
      return res.json({
        status: 501,
        message: error,
      });
    }
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
    return res.json(users);
  }

  if (tab == "*") {
    events = events.filter((event) => {
      let m = new Date(date);
      let j = new Date(event.eve_date);
      return (
        // event.eve_type == eve_type &&
        event.sub_category == sub_category &&
        m.getFullYear() == j.getFullYear() &&
        m.getMonth() == j.getMonth() &&
        m.getDate() == j.getDate() &&
        event.status == "accepted"
      );
    });
    return res.json(events.slice((page - 1) * limit, page * limit));
  }

  if (tab == "main") {
    for (let i = 0; i < events.length; i++) {
      let j = new Date(events[i].eve_date),
        m = new Date();
      if (j < m) {
        try {
          await fs.unlink("./src/database/image/" + events[i].eve_pic);
        } catch (error) {}
        events.splice(i, 1);
      }
    }

    await fs.writeFile(
      "./src/database/json/events.json",
      JSON.stringify(events, null, 2)
    );
    events = events.filter((event) => event.status == "accepted");
    return res.json(events);
  }

  if (tab == "search" || tab == "admin") {
    return res.json(events);
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
    eve_id: Joi.number().label("Event id son bo'lishi kerak"),
    user_id: Joi.number().required().label("User id son bo'lishi kerak"),
    userName: Joi.string()
      .min(3)
      .max(30)
      .required()
      .alphanum()
      .label("Ism 3 va 30 oralig'ida bo'lishi kerak"),
    userFamily: Joi.string()
      .min(3)
      .max(30)
      .required()
      .alphanum()
      .label("Familiya 3 va 30 oralig'ida bo'lishi kerak"),
    tel: Joi.string()
      .min(12)
      .max(12)
      .required()
      .label("Telefon 12 ta raqamdan iborat bo'lishi kerak: 90 123 45 67"),
    profession: Joi.string().label("Professiya bor bo'lishi kerak"),
    category: Joi.string().required().label("Yo'nalish bor bo'lishi kerak"),
    sub_category: Joi.string()
      .required()
      .label("Ichki yo'nalish bor bo'lishi kerak"),
    eve_pic: Joi.string().label("Tadbir uchun rasm bor bo'lishi kerak"),
    eve_name: Joi.string()
      .min(3)
      .max(50)
      .required()
      .label("Tadbirning nomi 3 va 50 oralig'ida bo'lishi kerak"),
    eve_info_little: Joi.string()
      .max(100)
      .label("qisqa ma'lumot 100 ta xabardan oshmasligi kerak"),
    eve_info_full: Joi.string()
      .min(30)
      .max(700)
      .required()
      .label("To'liq ma'lumot 30 va 700 oralig'ida bo'lishi kerak"),
    eve_type: Joi.string()
      .allow("online", "offline")
      .label("Tadbir turi belgilanishi kerak"),
    eve_location: Joi.string().label("Link bor bo'lishi kerak"),
    eve_link: Joi.string().label("Link bor bo'lishi kerak"),
    eve_date: Joi.string().label("Tadbir sanasi bor bo'lishi kerak"),
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
  eve_id = eve_id ? eve_id + 1 : 1;
  let newEvent;
  try {
    newEvent = {
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
      eve_info_little: eve_info_little
        ? eve_info_little
        : eve_info_full.slice(0, 50),
      eve_info_full,
      eve_type,
      eve_location,
      eve_date,
      status: "pending",
      view_count: 0,
    };
  } catch (error) {
    return res.json({
      status: 501,
      message: error,
    });
  }

  try {
    let value;
    try {
      value = await schema.validateAsync(newEvent);
    } catch (error) {
      return res.json({
        status: 501,
        message: error,
      });
    }
    let index = events.findIndex((e) => e.eve_date > eve_date);
    if (index == -1 && value) events.push(value);
    else if (value) events.splice(index, 0, value);
    await fs.writeFile(
      "./src/database/json/events.json",
      JSON.stringify(events, null, 2)
    );
  } catch (err) {
    return res.json({
      status: 501,
      message: error,
    });
  }
  try {
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
        gif: {
          engine: "gifsicle",
          command: ["--colors", "64", "--use-col=web"],
        },
      },
      async function (error, completed, statistic) {
        await fs.unlink("./src/database/" + req.file.originalname);
      }
    );
  } catch (error) {
    return res.json({
      status: 501,
      message: error,
    });
  }

  return res.json(newEvent);
};

const PUT = async (req, res) => {
  let events = await fs.readFile("./src/database/json/events.json", "utf-8");
  events = events ? JSON.parse(events) : [];
  let { eve_id, status, category } = req.body;

  let j = events.find((e) => e.eve_id == eve_id);
  j ? (j.status = status) : null;
  try {
    if (status == "accepted") {
      let categories = await fs.readFile(
        "./src/database/json/categories.json",
        "utf-8"
      );
      categories = categories ? JSON.parse(categories) : [];
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
    return res.json(j);
  } catch (error) {
    return res.json({
      status: 501,
      message: error,
    });
  }
};

export { GET, POST, PUT };
