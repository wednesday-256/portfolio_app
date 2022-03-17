const Game = require("../models/game");
const async = require("async");
const Player = require("../models/player");
const auth = require("./auth");
const Request = require("../models/request");

const e_fmt = (msg) => {
  if (msg instanceof Array) {
    let res = [];
    msg.forEach((m) => {
      res.push({ msg: m });
    });
    return res;
  }
  return [{ msg: msg }];
};

const get_color = () => {
  let arr = [];
  const color = () => Math.floor(Math.random() * 257); //function to produce random color

  for (let i = 0; i <= 8; i++) {
    arr.push([color(), color(), color()]);
  }
  // Math.floor(Math.random() * 10)
  return arr;
};

const join_handler = (req, res) => {
  if (req.body.key === "" || req.body.key.length < 6) {
    return res.send({
      state: "error",
      errors: [
        { msg: ["Invalid Join code.", "Please check the code and try again."] },
      ],
    });
  }
  if (req.user) {
    async.parallel(
      {
        player: (callback) =>
          Player.findOne({ cookie: req.user }).exec(callback),
        game: (callback) =>
          Game.findOne({ join_code: req.body.key, game_type: "color" }).exec(
            callback
          ),
      },
      (err, results) => {
        if (err) {
          res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
          return;
        }
        if (results.player === null || results.game === null) {
          let errors = [];
          if (results.player === null) {
            res.clearCookie("AuthToken");
            errors.push({ msg: "Invalid User. Please try logging in again." });
          }
          if (results.game === null) {
            errors.push({ msg: "Invalid Join code." });
            errors.push({ msg: "Please check the code and try again." });
          }
          res.send({ state: "error", errors: errors });
          return;
        }
        if (results.game.join_state !== "waiting") {
          res.send({
            state: "error",
            errors: [{ msg: "Oops! The Join code has already been used." }],
          });
          return;
        }
        if (results.game.player1.toString() === results.player._id.toString()) {
          res.send({
            state: "error",
            errors: [{ msg: "You can't Join a game you created." }],
          });
          return;
        }
        results.game.player2 = results.player._id;
        results.game.join_state = "joined";
        results.game.attempted = "[]";

        results.game.save((err) => {
          if (err) {
            console.log(err);
            res.send({
              state: "error",
              msg: [{ msg: "Something went wrong." }],
            });
            return;
          }
          res.send({ state: "success", game_id: results.game._id });
        });
      }
    );
  } else {
    const cookie = auth.get_auth_cookie();
    const a_player = new Player({
      user_name: "anon",
      password: auth.get_rec_code(),
      rec_key: auth.get_rec_code(),
      cookie: cookie,
    });
    res.cookie("AuthToken", cookie, {
      sameSite: "Strict",
      signed: true,
      httpOnly: true,
      maxAge: 1296000000,
    });
    Game.findOne({ join_code: req.body.key, game_type: "color" }).exec(
      (err, result) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
        }
        if (result === null) {
          let errors = [];
          errors.push({ msg: "Invalid Join code." });
          errors.push({ msg: "Please check the code and try again." });
          res.send({ state: "error", errors: errors });
          return;
        }
        if (result.join_state !== "waiting") {
          res.send({
            state: "error",
            errors: [{ msg: "Oops! The Join code has already been used." }],
          });
          return;
        }
        a_player.save((err) => {
          if (err) {
            console.log(err);
            return res.send({
              state: "error",
              errors: [{ msg: "Something went wrong." }],
            });
          }

          result.player2 = a_player._id;
          result.join_state = "joined";
          result.attempted = "[]";

          result.save((err) => {
            if (err) {
              console.log(err);
              return res.send({
                state: "error",
                errors: [{ msg: "Something went wrong." }],
              });
            }
            res.send({ state: "success", game_id: result._id });
          });
        });
      }
    );
  }
};

const create_handler = (req, res) => {
  if (req.body.option === "") {
    res.send({
      state: "error",
      errors: [{ msg: "Invalid Action. Please try again" }],
    });
    return;
  }
  if (req.user) {
    Player.findOne({ cookie: req.user }).exec((err, the_user) => {
      if (err) {
        console.log(err);
        res.send({
          state: "error",
          errors: [{ msg: "Something went wrong!" }],
        });
      }
      if (the_user === null) {
        res.clearCookie("AuthToken");
        res.send({
          state: "error",
          errors: [{ msg: "Session expired, Please try to login  again." }],
        });
        return;
      }
      const game = new Game({
        game_type: "color",
        date_played: new Date(),
        game_state: JSON.stringify([
          get_color(),
          0,
          0,
          Math.floor(Math.random() * 9),
        ]),
        finished: false,
        player1: the_user._id,
        join_state: req.body.option === "friend" ? "waiting" : "oneplayer",
        join_code: req.body.option === "friend" ? auth.get_game_code() : "",
        turn: req.user,
        attempted: "[]",
      });
      game.save((err) => {
        if (err) {
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong!!" }],
          });
        }
        res.send({ state: "success", game_id: game._id });
      });
    });
  } else {
    const cookie = auth.get_auth_cookie();
    const a_player = new Player({
      user_name: "anon",
      password: auth.get_rec_code(),
      rec_key: auth.get_rec_code(),
      cookie: cookie,
    });
    res.cookie("AuthToken", cookie, {
      ameSite: "Strict",
      signed: true,
      httpOnly: true,
      maxAge: 1296000000,
    });
    a_player.save((err) => {
      if (err) {
        console.log(err);
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
      }
      const game = new Game({
        game_type: "color",
        date_played: new Date(),
        game_state: JSON.stringify([
          get_color(),
          0,
          0,
          Math.floor(Math.random() * 9),
        ]),
        finished: false,
        player1: a_player._id,
        join_state: req.body.option == "friend" ? "waiting" : "oneplayer",
        join_code: req.body.option == "friend" ? auth.get_game_code() : "",
        turn: a_player.cookie,
        attempted: "[]",
      });
      game.save((err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
        }
        res.send({ state: "success", game_id: game._id });
      });
    });
  }
};

const handle_start = (err, result, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong." }],
    });
  }
  if (result === null) {
    return res.send({ state: "error", errors: [{ msg: "Invalid game." }] });
  }
  const reply = {
    state: "success",
    colors: JSON.parse(result.game_state)[0],
    game_id: result._id,
    second: req.body.second ? true : false,
  };
  let state = JSON.parse(result.game_state);
  if (result.join_state == "waiting") {
    reply["join_code"] = result.join_code;
    reply.is_player1 = result.turn === req.user ? true : false;
  }

  reply["join_state"] = result.join_state;

  if (result.finished) {
    let att = state[1] > state[2] ? state[1] : state[2];
    reply.finished = true;
    reply.index = JSON.parse(result.game_state)[3];
    if (result.join_state === "joined") {
      reply["winner"] =
        result.winner == result.player1._id ||
        result.winner === result.player1.user_name
          ? result.player1.user_name
          : result.player2.user_name;
    } else {
      reply.winner = result.player1.user_name;
    }
    reply["score"] = 10 - att;
    reply.turn = false;
  } else {
    reply.finished = false;
    reply.turn = result.turn === req.user ? true : false;
  }
  res.send(reply);
};

const list_handler = (req, res) => {
  if (!req.user) {
    res.send({
      state: "error",
      errors: [{ msg: "Please login/Signup first." }],
    });
    return;
  }

  Player.findOne({ cookie: req.user }).exec((err, player) => {
    if (err) {
      console.log(err);
      res.send({
        state: "error",
        errors: e_fmt("Something went wrong. Please try again."),
      });
      return;
    }
    if (player === null) {
      res.clearCookie("AuthToken");
      res.send({
        state: "error",
        errors: e_fmt("Invalid User: Please try logging in again."),
      });
      return;
    }
    Game.find({
      $and: [
        { $or: [{ player1: player._id }, { player2: player._id }] },
        { game_type: "color" },
      ],
    })
      .populate("player1")
      .populate("player2")
      .sort({ date_played: -1 })
      .exec((err, games) => {
        if (err) {
          res.send({
            state: "error",
            errors: e_fmt("Something went wrong. Please try again."),
          });
        }
        if (games === null) {
          return res.send({
            state: "error",
            errors: e_fmt([
              "No games have been played yet.",
              " You can start a new one now.",
            ]),
          });
        }
        let game_array = [];
        games.forEach((g) => {
          let g_object = {};
          g_object.date_played = g.date_played;
          g_object.player1 = g.player1.user_name;
          let state = JSON.parse(g.game_state);
          g_object.score = 10 - (state[1] > state[2] ? state[1] : state[2]);
          g_object.game_id = g._id;
          g_object.winner =
            g.winner == g.player1._id.toString() ||
            g.winner == g.player1.user_name ||
            g.winner == 1
              ? g.player1.user_name
              : g.player2
              ? g.player2.user_name
              : "";
          if (g.join_state === "joined") {
            g_object.player2 = g.player2.user_name;
          }
          game_array.push(g_object);
        });
        return res.send({ state: "success", games: game_array });
      });
  });
};

const handle_choice = (err, result, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong" }],
    });
  }
  if (result == null) {
    return res.send({ state: "error", errors: [{ msg: "Invalid game." }] });
  }
  let state = JSON.parse(result.game_state);
  let attempted = JSON.parse(result.attempted);
  if (result.join_state == "joined" && result.turn != req.user) {
    res.send({ state: "error", errors: [{ msg: "Wrong Turn." }] });
    return;
  }
  const check = Number(req.body.choice) == state[3] ? true : false;
  check ? "" : attempted.push(Number(req.body.choice));
  const reply = {
    state: "success",
    response: check,
    attempted: attempted,
    join_state: result.join_state,
    colors: state[0],
    game_id: result._id,
  };
  let player = req.user == result.player1.cookie ? 1 : 2;
  state[player] += 1;
  if (check) {
    let update;
    if (result.join_state == "joined") {
      update = {
        winner:
          req.user === result.player1.cookie
            ? result.player1._id
            : result.player2._id,
        game_state: JSON.stringify([
          state[0],
          Number(state[1]),
          state[2],
          state[3],
        ]),
        finished: true,
        attempted: JSON.stringify(attempted),
        turn: player == 1 ? result.player2.cookie : result.player1.cookie,
      };
    } else {
      update = {
        winner:
          req.user === result.player1.cookie
            ? result.player1._id
            : result.player2._id,

        game_state: JSON.stringify([
          state[0],
          Number(state[1]),
          state[2],
          state[3],
        ]),
        finished: true,
        attempted: JSON.stringify(attempted),
      };
    }

    Game.findOneAndUpdate({ _id: result._id }, update, { new: true })
      .populate("player1")
      .populate("player2")
      .exec((err, game) => {
        if (err) {
          console.log(err);
          res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
          return;
        }
        reply["score"] = 9 - Number(state[1]);
        reply["index"] = Number(req.body.choice);
        if (game.join_state == "joined") {
          let winner =
            game.winner === game.player1.user_name ||
            game.winner === game.player1._id.toString()
              ? game.player1
              : game.player2;
          let att = state[1] < state[2] ? state[1] : state[2];
          reply["winner"] = winner.user_name;
          reply["join_state"] = "joined";
          if (winner.cookie === req.user) {
            reply["score"] = 9 - att;
          } else {
            reply["score"] = 0;
          }
        }
        res.send(reply);
      });
  } else {
    let update;
    if (result.join_state == "joined") {
      update = {
        game_state: JSON.stringify([state[0], state[1], state[2], state[3]]),
        attempted: JSON.stringify(attempted),
        turn: player == 1 ? result.player2.cookie : result.player1.cookie,
      };
    } else {
      update = {
        game_state: JSON.stringify([state[0], state[1], state[2], state[3]]),
        attempted: JSON.stringify(attempted),
      };
    }
    result.updateOne(update).exec((err) => {
      if (err) {
        console.log(err);
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
      }
      res.send(reply);
    });
  }
};

const handle_restart = (err, the_player, req, res) => {
  if (err) {
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong ." }],
    });
  }

  const n_game = new Game({
    game_type: "color",
    date_played: new Date(),
    game_state: JSON.stringify([
      get_color(),
      0,
      0,
      Math.floor(Math.random() * 9),
    ]),
    finished: false,
    player1: the_player._id,
    join_state: req.body.option == "friend" ? "waiting" : "oneplayer",
    join_code: req.body.option == "friend" ? auth.get_game_code() : "",
    turn: req.user,
    attempted: "[]",
  });

  const handle_save = (err) => {
    if (err) {
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong." }],
      });
    }
    const reply = {
      state: "success",
      game_id: n_game._id,
    };
    res.send(reply);
  };
  n_game.save(handle_save);
};

const handle_turn = (err, result, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong!" }],
    });
  }
  if (result == null) {
    return res.send({ state: "error", errors: [{ msg: "Invalid game." }] });
  }
  let turn = result.turn == req.user ? true : false;
  let attempted = result.attempted ? JSON.parse(result.attempted) : [];
  state = JSON.parse(result.game_state);
  let reply = {
    turn: turn,
    colors: state[0],
    attempted: attempted,
    finished: result.finished,
  };
  if (reply.finished) {
    reply.index = state[3];
  }
  res.send(reply);
};

//request handlers
const handle_request = (err, results, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong" }],
    });
  }
  if (results.request == null) {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid/Deleted request." }],
    });
  }
  if (results.the_game == null) {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid game Id." }],
    });
  }
  if (!req.body.action) {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid Request Action." }],
    });
  }
  switch (req.body.action) {
    case "deny":
      if (req.user != results.request.receiver.cookie) {
        return res.send({
          state: "error",
          errors: [{ msg: "Error: Invalid user." }],
        });
      }
      const handle_update = (err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong" }],
          });
        }
        return res.send({
          state: "success",
          msg: "Request Updated Successfully.",
        });
      };
      results.request
        .updateOne({ deny: true, accept: false })
        .exec(handle_update);
      break;

    case "delete":
      if (req.user != results.request.sender.cookie) {
        return res.send({
          state: "error",
          errors: [{ msg: "Error: Invalid user." }],
        });
      }
      const handle_delete = (err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
        }
        return res.send({
          state: "success",
          msg: "Request Deleted Successfully",
        });
      };
      Request.deleteOne({ _id: results.request._id }).exec(handle_delete);
      break;

    case "accept":
      if (req.user != results.request.receiver.cookie) {
        return res.send({
          state: "error",
          errors: [{ msg: "Error: Invalid user." }],
        });
      }
      if (results.request.accept == true) {
        return res.send({
          state: "error",
          errors: [{ msg: "Error: Already Accepted Request!" }],
        });
      }
      //color game processing
      const game = new Game({
        game_type: "color",
        date_played: new Date(),
        game_state: JSON.stringify([
          get_color(),
          0,
          0,
          Math.floor(Math.random() * 9),
        ]),
        finished: false,
        join_state: "joined",
        join_code: " ",
        player1: results.request.sender._id,
        player2: results.request.receiver._id,
        attempted: "[]",
      });
      let turn = Math.floor(Math.random() * 2);
      let cookie = [
        results.request.sender.cookie,
        results.request.receiver.cookie,
      ];
      game.turn = cookie[turn];
      const handle_save = (err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong." }],
          });
        }
        return res.send({ state: "success", game_id: game._id });
      };

      results.request
        .updateOne({ accept: true, deny: false, game_id: game._id })
        .exec((err) => {
          if (err) {
            console.log(err);
            return res.send({
              state: "error",
              errors: [{ msg: "Something went wrong. " }],
            });
          }
          game.save(handle_save);
        });
      break;

    case "check":
      if (req.user != results.request.sender.cookie) {
        return res.send({
          state: "error",
          errors: [{ msg: "Invalid user." }],
        });
      }
      return res.send({
        state: "success",
        game_id: results.request.accept ? results.request.game_id : null,
        deny: results.request.deny,
      });
  }
};

const handle_list_reqs = (err, g_reqs, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong." }],
    });
  }
  if (g_reqs == null) {
    return res.send({
      state: "error",
      msg: [{ msg: "No Requests Available." }],
    });
  }
  let sent = [];
  let received = [];
  g_reqs.forEach((g_req) => {
    if (g_req.sender.cookie == req.user) {
      if (g_req.deny == true || g_req.accept == true) {
        return;
      }
      let game_request = {
        req_id: g_req._id,
        to: g_req.receiver.user_name,
      };
      sent.push(game_request);
    } else if (g_req.receiver.cookie == req.user) {
      if (g_req.deny == true || g_req.accept == true) {
        return;
      }
      let game_request = {
        req_id: g_req._id,
        from: g_req.sender.user_name,
      };
      received.push(game_request);
    }
  });
  return res.send({
    state: "success",
    msg: { sent: sent, received: received },
  });
};

const handle_create_req = (err, game, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong." }],
    });
  }
  if (game === null) {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid Game Id." }],
    });
  }
  let sender, receiver;

  if (game.player1.cookie === req.user) {
    sender = game.player1._id;
    receiver = game.player2._id;
  } else {
    sender = game.player2._id;
    receiver = game.player1._id;
  }
  let request = new Request({
    sender: sender,
    receiver: receiver,
    game_type: "color",
  });
  request.save((err, the_req) => {
    if (err) {
      console.log(err);
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong." }],
      });
    }
    return res.send({
      state: "success",
      req_id: the_req._id,
      msg: "Request Sent Successfully!",
    });
  });
};

module.exports = {
  list_handler: list_handler,
  handle_start: handle_start,
  handle_choice: handle_choice,
  handle_restart: handle_restart,
  handle_turn: handle_turn,
  handle_request: handle_request,
  handle_create_req: handle_create_req,
  handle_list_reqs: handle_list_reqs,
  create_handler: create_handler,
  join_handler: join_handler,
};
