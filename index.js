const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  exercises: [
    {
      date: { type: Date, required: false },
      duration: { type: Number, required: true },
      description: { type: String, required: true },
    },
  ],
});

const UnexpectedError = (error, res) => {
  console.error(error);
  res.status(500).json({ error: error });
};

userSchema.methods.getUserInfos = function () {
  return {
    username: this.username,
    _id: this._id,
  };
};

userSchema.methods.addExercise = async function ({
  date,
  duration,
  description,
}) {
  try {
    this.exercises.push({
      date,
      duration,
      description,
    });
    await this.save();

    return {
      _id: this.id,
      username: this.username,
      date: date.toDateString(),
      duration: duration,
      description: description,
    };
  } catch (error) {
    throw error;
  }
};

userSchema.methods.getLogs = function (from, to, limit) {
  const filtered = this.exercises
    .filter((exercice) => {
      if (!from && !to) return true;
      if (from && to) return exercice.date >= from && exercice.date <= to;
      if (from) return exercice.date >= from;
      if (to) return exercice.date <= to;
    })
    .slice(0, limit);

  const logs = filtered.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
  }));

  return {
    _id: this.id,
    username: this.username,
    count: this.exercises.length,
    log: logs,
  };
};

const User = mongoose.model("User", userSchema);

app.post("/api/users", async (req, res) => {
  const username = String(req.body.username);

  try {
    const user = await User.findOne({ username: username });

    if (user) {
      res.json(user.getUserInfos());
      console.log(`Already existing user infos sent to client: ${user}`);
    } else {
      const newUser = new User({
        username: username,
        exercises: [],
      });
      await newUser.save();

      res.json(newUser.getUserInfos());
      console.log(
        `New User added to database and infos sent to client: ${newUser}`
      );
    }
  } catch (error) {
    UnexpectedError(error, res);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  if (!req.body.description || !req.body.duration) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const result = await user.addExercise({
      date: req.body.date ? new Date(req.body.date) : new Date(),
      duration: Number(req.body.duration),
      description: String(req.body.description),
    });

    res.json(result);
  } catch (error) {
    UnexpectedError(error, res);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? Number(req.query.limit) : Infinity;

  try {
    const user = await User.findById(req.params._id);

    if (user) {
      res.json(user.getLogs(from, to, limit));
      console.log(`User's logs sent to client: ${user}`);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    UnexpectedError(error, res);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
