const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({ extended: false }));

const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: false },
  _id: { type: mongoose.Types.ObjectId, required: true },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
});

const logSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, required: true },
  _id: { type: mongoose.Types.ObjectId, required: true },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: String, required: true },
    },
  ],
});

const exercise = mongoose.model("exercise", exerciseSchema);
const user = mongoose.model("user", userSchema);
const log = mongoose.model("log", logSchema);

app.post("/api/users", (req, res) => {
  const username = req.body.username;

  user.findOne({ username: username }).then((data) => {
    if (data) {
      res.json({
        username: data.username,
        _id: data._id,
      });
    } else {
      const newUser = new user({
        username: username,
      });
      newUser.save();
      res.json(newUser);
    }
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.params._id;
  const description = req.params.description;//not working
  const duration = req.params.duration;//not working

  user.findById(id).then((data) => {
    if (data) {
      const newExercise = new exercise({
        username: data.username,
        description: description,
        duration: duration,
        _id: id,
      });
      res.json(newExercise);
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
