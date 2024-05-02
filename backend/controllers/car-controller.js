import jwt from "jsonwebtoken";
import Redis from "ioredis";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import Car from "../models/Car.js";
const redisClient = new Redis();
export const addCar = async (req, res, next) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token Not Found" });
  }

  let adminId;

  // verify token
  jwt.verify(extractedToken, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) {
      return res.status(400).json({ message: `${err.message}` });
    } else {
      adminId = decrypted.id;
      return;
    }
  });

  //create new movie
  const { brand, model, price,posterUrl, } =
    req.body;
  if (
    !brand &&
    brand.trim() === "" &&
    !model &&
    model.trim() == "" &&
    !price &&
    price.trim() == "" &&
    !posterUrl &&
    posterUrl.trim() === ""
  ) {
    return res.status(422).json({ message: "Invalid Inputs" });
  }

  let car;
  try {
    car = new Car({
      brand,
      price,
      admin: adminId,
      posterUrl,
      model,
    });
    const session = await mongoose.startSession();
    const adminUser = await Admin.findById(adminId);
    session.startTransaction();
    await car.save({ session });
    adminUser.addedCars.push(car);
    await adminUser.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return console.log(err);
  }

  if (!car) {
    return res.status(500).json({ message: "Request Failed" });
  }

  return res.status(201).json({ car });
};

export const getAllCars = async (req, res, next) => {
  try {
    const startTime = Date.now();
    // Check if data exists in cache

    const cachedCars = await redisClient.get("allCars");
    if (cachedCars) {
      console.log("Data found in cache");
      const elapsedTime = Date.now() - startTime;
      console.log(`Time to fetch data from cache: ${elapsedTime}ms`);
      return res.status(200).json({ cars: JSON.parse(cachedCars) });
    }

    // If data not found in cache, fetch from database
    let cars = await Car.find();
    if (!cars) {
      return res.status(500).json({ message: "Request Failed" });
    }

    // Store data in cache with an expiration time (e.g., 1 hour)
    await redisClient.setex("allCars", 3600, JSON.stringify(cars));

    return res.status(200).json({ cars });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getCarById = async (req, res, next) => {
  const id = req.params.id;
  let car;
  try {
    car = await Car.findById(id);
  } catch (err) {
    return console.log(err);
  }

  if (!car) {
    return res.status(404).json({ message: "Invalid Movie ID" });
  }

  return res.status(200).json({ car });
};
