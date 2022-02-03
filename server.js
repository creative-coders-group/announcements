import express from "express";
import cors from "cors";
// import Host from "./src/lib/network.js";

import router from "./src/routes/event.routes.js";
import routerc from "./src/routes/categories.routes.js";
import routera from "./src/routes/admins.routes.js";

const PORT = process.env.PORT || 1234;

const app = express();

app.use(express.json());
app.use(cors());

app.use("/getfile", express.static("./src/database/image"));
app.use("/events", router);
app.use("/categories", routerc);
app.use("/admins", routera);

app.listen(PORT, console.log("Listening to localhost://" + PORT));
