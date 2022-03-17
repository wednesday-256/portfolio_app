const Player = require("../models/player");
const auth = require("./auth");

const cookie_options = {
  sameSite: "Strict",
  signed: true,
  httpOnly: true,
  maxAge: 1296000000,
};

const login_handler = (req, res) => {
  if (req.body.user_name === "" && req.body.password === "") {
    res.send({ state: "error", errors: [{ msg: "Invalid Form Fields." }] });
    return;
  }
  Player.findOne({ user_name: req.body.user_name }).exec((err, player) => {
    if (err) {
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong !!" }],
      });
    }

    if (player === null) {
      res.send({
        state: "error",
        errors: [{ msg: "Username does not exist." }],
      });
      return;
    }

    if (player.password !== auth.get_hash(req.body.password)) {
      res.send({ state: "error", errors: [{ msg: "Wrong Password." }] });
      return;
    }

    const cookie = auth.get_auth_cookie();
    let l_player = new Player({
      user_name: player.username,
      password: player.password,
      rec_key: player.rec_key,
      cookie: cookie,
      _id: player._id,
    });

    Player.findByIdAndUpdate(
      player._id,
      l_player,
      {},
      (err, updated_player) => {
        if (err) {
          return next(err);
        }
        res.cookie("AuthToken", cookie, {
          sameSite: "Strict",
          signed: true,
          httpOnly: true,
          maxAge: 1296000000,
        });
        res.send({
          state: "success",
          profile: {
            user_name: updated_player.user_name,
            rec_key: updated_player.rec_key,
            date_added: updated_player.date_added,
          },
        });
      }
    );
  });
};

const update_handler = (req, res) => {
  if (
    (req.body.user_name === "" && req.body.password === "") ||
    (req.body.password !== "" && req.body.password.length < 8)
  ) {
    res.send({ state: "error", errors: [{ msg: "Invalid Form Fields." }] });
    return;
  }

  if (req.user) {
    Player.findOne({ user_name: req.body.user_name.trim() }).exec(
      (err, e_player) => {
        if (err) {
          res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
          return;
        }
        if (e_player !== null) {
          res.send({
            state: "error",
            errors: [{ msg: "Username Exists" }],
          });
          return;
        }

        Player.findOne({ cookie: req.user }).exec((err, result) => {
          if (err) {
            res.send({
              state: "error",
              errors: [{ msg: "Something went wrong." }],
            });
            return;
          }

          result.user_name = req.body.user_name || result.user_name;
          result.password = req.body.password
            ? auth.get_hash(req.body.password)
            : result.password;

          result.save((err, updated_player) => {
            if (err) {
              console.log(err);
              res.send({
                state: "error",
                errors: [{ msg: "Something went Wrong." }],
              });
              return;
            }

            res.send({
              state: "success",
              profile: {
                user_name: updated_player.user_name,
                rec_key: updated_player.rec_key,
                date_added: updated_player.date_added,
              },
            });
            return;
          });
        });
      }
    );
  } else {
    res.send({ state: "error", errors: [{ msg: "You are not logged in." }] });
  }
};

const register_handler = (req, res) => {
  if (
    req.body.user_name == "" ||
    req.body.password == "" ||
    req.body.password.length < 8
  ) {
    res.send({
      state: "error",
      errors: [{ msg: "Please Check Form Fields." }],
    });
  }

  Player.findOne({ user_name: req.body.user_name.trim() }).exec(
    (err, player) => {
      if (err) {
        res.send({
          state: "error",
          errors: [{ msg: "Something went wrong, Please try again later!" }],
        });
        return;
      }

      if (player !== null) {
        res.send({
          state: "error",
          errors: [{ msg: "Username Exists, Please try another." }],
        });
        return;
      }

      const cookie = auth.get_auth_cookie();

      var n_player = new Player({
        user_name: req.body.user_name,
        password: auth.get_hash(req.body.password),
        rec_key: auth.get_rec_code(),
        cookie: cookie,
      });

      n_player.save((err) => {
        if (err) {
          res.send({
            state: "error",
            errors: [{ msg: "Something went wrong, Please try again later!" }],
          });
          return;
        }
        res.cookie("AuthToken", n_player.cookie, cookie_options);
        res.send({
          state: "success",
          profile: {
            user_name: n_player.user_name,
            rec_key: n_player.rec_key,
            date_added: n_player.date_added,
          },
        });
      });
    }
  );
};

const delete_handler = (req, res) => {
  if (req.user) {
    Player.findOne({ cookie: req.user }).exec((err, result) => {
      if (err) {
        res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
        return;
      }

      if (result === null) {
        res.clearCookie("AuthToken");
        res.send({ state: "error", errors: [{ msg: "User does not exist." }] });
        return;
      }

      result
        .updateOne({
          user_name: "Deleted-User",
          password: auth.get_hash(auth.get_rec_code()),
          rec_key: auth.get_rec_code(),
        })
        .exec((err) => {
          if (err) {
            res.send({
              state: "error",
              errors: [{ msg: "Something went wrong." }],
            });
            return;
          }

          res.clearCookie("AuthToken");
          res.send({ state: "success" });
        });
    });
    return;
  }

  res.send({ state: "error", errors: [{ msg: "You are not logged in." }] });
};

const recovery_handler = (req, res) => {
  if (req.body.key === "" || req.body.password === "") {
    res.send({ state: "error", msg: [{ msg: "Invalid Form Fields." }] });
    return;
  }
  Player.findOne({ rec_key: req.body.key }).exec((err, result) => {
    if (err) {
      res.send({ state: "error", errors: [{ msg: "Something went wrong?" }] });
      return;
    }
    if (result === null) {
      res.send({ state: "error", errors: [{ msg: "Invalid Recovery key." }] });
      return;
    }
    const cookie = auth.get_auth_cookie();

    result.password = auth.get_hash(req.body.password);
    result.rec_key = auth.get_rec_code();
    result.cookie = cookie;

    result.save((err, result) => {
      if (err) {
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong!" }],
        });
      }
      res.cookie("AuthToken", cookie, cookie_options);
      res.send({
        state: "success",
        profile: {
          user_name: result.user_name,
          rec_key: result.rec_key,
          date_added: result.date_added,
        },
      });
    });
  });
};

const logout_handler = (req, res) => {
  if (req.user === null) {
    res.send({ state: "error", errors: [{ msg: "You are not logged in." }] });
    return;
  }
  res.clearCookie("AuthToken");
  res.send({ state: "success" });
};

const check_handler = (req, res) => {
  if (req.user) {
    Player.findOne({ cookie: req.user }).exec((err, player) => {
      if (err) {
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
      }
      if (player === null) {
        res.clearCookie("AuthToken");
        res.send({
          state: "error",
          errors: [{ msg: "Session expired, please login." }],
        });
        return;
      }
      res.send({
        state: "success",
        profile: {
          user_name: player.user_name,
          rec_key: player.rec_key,
          date_added: player.date_added,
        },
      });
    });
  }
};

module.exports = {
  register_handler: register_handler,
  delete_handler: delete_handler,
  update_handler: update_handler,
  recovery_handler: recovery_handler,
  login_handler: login_handler,
  logout_handler: logout_handler,
  check_handler: check_handler,
};
