import express from "express"; //used to create the backend server
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import slot from "./routes/slotRoutes.js"
import fav from "./routes/favoriteRoutes.js"

const app = express();

app.use(cors());
app.use(express.json()); 

app.use("/uploads", express.static("uploads"));  

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/slot", slot);
app.use("/api/fav",fav);

// just for testing 

app.get("/", (req, res) => {
  res.send("Lokal Backend Running");
});

export default app;


//app.use(express.json());
// Tells Express to automatically convert incoming JSON data into JavaScript objects.

// Example request: {
//   "name": "Kumar",
//   "email": "kumar@gmail.com"
// }

// Then you can access:
// req.body.name
// req.body.email

// express() → Create backend app.
// app.use() → Add middleware or routes.
// app.get() → Create a GET API.