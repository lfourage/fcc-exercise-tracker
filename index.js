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
  _id: { type: mongoose.Types.ObjectId, required: true },
  username: { type: String, required: true },
  date: { type: String, required: false },
  duration: { type: Number, required: true },
  description: { type: String, required: true },
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

      const newLog = new log({
        username: username,
        count: 0,
        _id: newUser._id,
        log: [],
      });
      newLog.save();

      res.json({
        id: newUser._id,
        username: username,
      });
    }
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  const date = new Date(req.body.date).toDateString();
  const duration = req.body.duration;
  const description = req.body.description;

  user.findById(_id).then((data) => {
    if (data) {
      const newExercise = new exercise({
        _id: _id,
        username: data.username,
        date: date,
        description: description,
        duration: duration,
      });
      newExercise.save();

      log.findByIdAndUpdate(_id, {
        $inc: { count: 1 },
        $push: {
          log: {
            description: description,
            duration: duration,
            date: date,
          },
        },
      });

      res.json({
        _id: _id,
        username: data.username,
        date: date,
        description: description,
        duration: duration,
      });
    }
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;

  log.findById(_id).then((data) => {
    res.json({
      _id: _id,
      username: data.username,
      count: data.count,
      log: data.log,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
