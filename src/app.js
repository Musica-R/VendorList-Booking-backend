import express from "express"; //used to create the backend server
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import slot from "./routes/slotRoutes.js"
import fav from "./routes/favoriteRoutes.js"
import db from "./config/db.js";
import razorpayWebhookRoutes from "./models/razorpayWebhookRoutes.js";
import "./cron/CronJob.js";
import act from "./routes/activityBookingRoutes.js"

const app = express();

app.use(
  cors({
    origin: [
      "https://booking-website-df76f.web.app",
      "https://booking-vendorpanel.web.app",
      "https://bookingwebstie-adminpanel.web.app",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json()); 

app.use("/uploads", express.static("uploads"));  

app.use("/api/users", userRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/slot", slot);
app.use("/api/fav",fav);
app.use("/api/act",act);
app.use("/api/webhook", razorpayWebhookRoutes);

// just for testing 

app.get("/", (req, res) => {
  res.send("Lokal Backend Running");
});

app.get("/test-vendor-columns", (req, res) => {
  db.query("SHOW COLUMNS FROM vendors", (err, result) => {
    if (err) return res.json(err);
    res.json(result);
  });
});

app.get("/test-upi", (req, res) => {
  db.query(
    "SELECT v.upi_id FROM vendors v LIMIT 20",
    (err, result) => {
      if (err) return res.json(err);
      res.json(result);
    }
  );
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