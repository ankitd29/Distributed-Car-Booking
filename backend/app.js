import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import carRouter from "./routes/car-routes.js";
import bookingsRouter from "./routes/booking-routes.js";
import Redis from "redis";
import cors from "cors";
dotenv.config();
const app = express();
const PORT1 = 1313;

// middlewares
app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/car", carRouter);
app.use("/booking", bookingsRouter);
app.get("/", (req,res) => {
  const data = `App running at PORT ${PORT1}`;
  console.log('This server is running')
  return res.send(data);
})

mongoose
  .connect(
    `mongodb+srv://admin123:admin123@cluster0.3gsl2b9.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() =>
  
    app.listen(PORT1, () =>
      console.log(`Connected To Database And Server is running at ${PORT1} `)
    )
  )
  .catch((e) => console.log(e));
