const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");
const session = require("express-session");
const http = require("http");
const socketIO = require("socket.io");
const setupSocketIO = require("./socket");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

setupSocketIO(io);

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Setup session management
app.use(
  session({
    secret: "super-dolphin",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Start the server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

module.exports = app;
