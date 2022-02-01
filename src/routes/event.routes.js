import { GET, POST, PUT } from "../controllers/eventcontroller.js";
import express from "express";
import multer from "multer";

const upload = multer();
const router = express.Router();
router.get("/", GET);
router.get("/:eventId", GET);
router.post("/", upload.single("eve_pic"), POST);
router.put("/", PUT);

export default router;
