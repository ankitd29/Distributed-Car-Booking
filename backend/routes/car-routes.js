import express from "express";
import {
  addCar,
  getAllCars,
  getCarById,
} from "../controllers/car-controller.js";
const carRouter = express.Router();
carRouter.get("/", getAllCars);
carRouter.get("/:id", getCarById);
carRouter.post("/", addCar);

export default carRouter;
