import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user-routes.js";
import adminRouter from "./routes/admin-routes.js";
import carRouter from "./routes/car-routes.js";
import bookingsRouter from "./routes/booking-routes.js";
import cors from "cors";
import Redis from "ioredis";
dotenv.config();
const app = express();
const PORT2 = 4000;

// middlewares
app.use(cors());
app.use(express.json());
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/car", carRouter);
app.use("/booking", bookingsRouter);
app.get("/", (req,res) => {
  const data = `App running at PORT ${PORT2}`;
  console.log('This server is running')
  return res.send(data);
})

console.log("Value of PORT2:", PORT2);
mongoose
  .connect(
    `mongodb+srv://admin123:admin123@cluster0.3gsl2b9.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() =>

    app.listen(PORT2, () =>
      console.log(`Connected To Database And Server is running at ${PORT2} `)
    )
  )
  .catch((e) => console.log(e));
