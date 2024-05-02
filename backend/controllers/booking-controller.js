import mongoose from "mongoose";
import asyncLock from "async-lock";
import Bookings from "../models/Bookings.js";
import Car from "../models/Car.js";
import User from "../models/User.js";

const lock = new asyncLock();

export const newBooking = async (req, res, next) => {
  const { car, date, user } = req.body;

  // Check if the car and user exist
  let existingCar;
  let existingUser;
  try {
    existingCar = await Car.findById(car);
    existingUser = await User.findById(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!existingCar) {
    return res.status(404).json({ message: "Car Not Found With Given ID" });
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User Not Found With Given ID" });
  }

  // Check if the car is already booked for the given date
  const existingBooking = await Bookings.findOne({ car, date: new Date(date) });
  if (existingBooking) {
    console.log("Car is already booked for the given date");
    return res.status(400).json({ message: "Car already booked for the given date" });
  }

  let booking;

  try {
    await lock.acquire(existingUser._id.toString(), async () => {
      // Start a MongoDB session
      const session = await mongoose.startSession();
      session.startTransaction();

      // Create the new booking
      booking = new Bookings({
        car,
        date: new Date(date),
        user,
      });

      // Add the booking to the car and user
      existingUser.bookings.push(booking);
      existingCar.bookings.push(booking);

      // Save changes to the database
      await existingUser.save({ session });
      await existingCar.save({ session });
      await booking.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }

  if (!booking) {
    return res.status(500).json({ message: "Unable to create a booking" });
  }

  return res.status(201).json({ booking });
};

export const getBookingById = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findById(id);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.status(200).json({ booking });
};

export const deleteBooking = async (req, res, next) => {
  const id = req.params.id;
  let booking;
  try {
    booking = await Bookings.findByIdAndRemove(id).populate("user car");
    await lock.acquire(booking.user._id.toString(), async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      await booking.user.bookings.pull(booking);
      await booking.car.bookings.pull(booking);
      await booking.car.save({ session });
      await booking.user.save({ session });
      await session.commitTransaction();
      session.endSession();
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  return res.status(200).json({ message: "Successfully Deleted" });
};