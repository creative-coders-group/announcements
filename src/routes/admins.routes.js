import { POST } from "../controllers/admincontroller.js";
import express from "express";

const routera = express.Router();

routera.post("/", POST);

export default routera;
