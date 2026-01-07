const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

/* 🔐 ADMIN PASSWORD (CHANGE THIS) */
const ADMIN_PASSWORD = "12345";

/* TOKEN */
const ADMIN_TOKEN = "example-dealer-secret";

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const DATA_FILE = "cars.json";

/* LOGIN */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Admin" && password === ADMIN_PASSWORD) {
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

/* GET CARS */
app.get("/cars", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);
  res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
});

/* AUTH MIDDLEWARE */
function checkAdmin(req, res, next) {
  if (req.headers.token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
}

/* ADD CAR */
app.post("/add-car", checkAdmin, upload.array("images"), (req, res) => {
  const cars = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE))
    : [];

  const images = req.files.map(f => "/uploads/" + f.filename);

  cars.push({ ...req.body, images });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cars, null, 2));

  res.json({ success: true });
});

/* DELETE */
app.post("/delete/:id", checkAdmin, (req, res) => {
  const cars = JSON.parse(fs.readFileSync(DATA_FILE));
  cars.splice(req.params.id, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(cars, null, 2));
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));