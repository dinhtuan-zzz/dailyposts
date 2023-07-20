const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "Session sercet",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const connectDatabase = async () => {
  try {
    mongoose.connect(
      "mongodb+srv://gentaro:flsforever@cluster0.h7fqhxn.mongodb.net/?retryWrites=true&w=majority"
    );
    console.log("Connected to database");
  } catch (err) {
    console.log(err);
  }
};
connectDatabase();

const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const postSchema = {
  title: String,
  content: String,
};

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const Post = mongoose.model("Post", postSchema);
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

async function findHomeContent() {
  return await Post.find({});
}

app.get("/", function (req, res) {
  findHomeContent()
    .then(function (foundPosts) {
      res.render("home", {
        startingContent: homeStartingContent,
        posts: foundPosts,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/login", function (req, res) {
  res.render("login", { error: req.session.messages });
  req.session.messages = undefined;
  req.session.save((err) => {
    if (err) {
      throw err;
    }
  });
});

app.post("/login", async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  });
  try {
    req.login(newUser, function (err) {
      if (err) {
        return next(err);
      } else {
        passport.authenticate("local", {
          failureRedirect: "/login",
          failureMessage: "Invalid usename or password",
        })(req, res, function () {
          res.redirect("/compose");
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.get("/register", function (req, res) {
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  try {
    User.register(
      { username: req.body.username },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          res.render("register", { error: err });
        } else {
          passport.authenticate("local")(req, res, function () {
            res.redirect("/compose");
          });
        }
      }
    );
  } catch (error) {
    console.log(err);
  }
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function (req, res) {
  const post = new Post({
    title: req.body.title,
    content: req.body.content,
  });
  post.save();
  res.redirect("/");
});

const findPost = async (requestedPostId) => {
  return await Post.findOne({ _id: requestedPostId });
};
app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;
  findPost(requestedPostId).then(function (foundPost) {
    res.render("post", {
      title: foundPost.title,
      content: foundPost.content,
    });
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
