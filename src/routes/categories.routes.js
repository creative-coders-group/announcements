import { GET } from "../controllers/categorycontroller.js";
import express from "express";

const routerc = express.Router();

routerc.get("/", GET);

export default routerc;
