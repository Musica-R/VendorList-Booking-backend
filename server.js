import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config(); // load environment variables 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
}); //Starts the server and listens for requests on the specified port.