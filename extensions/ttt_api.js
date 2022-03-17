const Game = require("../models/game");
const Player = require("../models/player");
const Request = require("../models/request");
const auth = require("./auth");
const TGame = require("./ttt_game");

const cookie_options = {
  sameSite: "Strict",
  signed: true,
  httpOnly: true,
  maxAge: 1296000000,
};

const list_handler = (req, res) => {
  if (!req.user) {
    res.send({ state: "error", errors: [{ msg: "Please login first!" }] });
    return;
  }
  Player.findOne({ cookie: req.user }).exec((err, player) => {
    if (err) {
      console.log(err);
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong !" }],
      });
    }
    if (player === null) {
      res.clearCookie("AuthToken");
      res.send({
        state: "error",
        errors: [{ msg: "Session Expired! Please try to  log in again." }],
      });
      return;
    }
    Game.find({
      $and: [
        { $or: [{ player1: player._id }, { player2: player._id }] },
        { game_type: "tictactoe" },
      ],
    })
      .sort({ date_played: -1 })
      .populate("player1")
      .populate("player2")
      .exec((err, games) => {
        if (err) {
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong!" }],
          });
        }
        if (games === null) {
          return res.send({
            state: "error",
            errors: [{ msg: "No games have been played yet" }],
          });
        }
        let game_array = [];
        games.forEach((g) => {
          let g_obj = {};
          g_obj.date_played = g.date_played;
          g_obj.player1 = g.player1.user_name;
          g_obj.game_id = g._id;
          g_obj.winner =
            g.winner == g.player1._id ||
            g.winner == g.player1.user_name ||
            g.winner == 1
              ? g.player1.user_name
              : g.player2
              ? g.player2.user_name
              : "";
          if (g.join_state === "joined") {
            g_obj.player2 = g.player2.user_name;
          }
          if (g.join_state === "engine") {
            g_obj.player2 = "Erik";
            g.winner !== 1 ? (g_obj.winner = g.winner) : null;
          }
          game_array.push(g_obj);
        });
        return res.send({ state: "success", games: game_array });
      });
  });
};

const join_handler = (req, res) => {
  if (req.body.key === "" || req.body.key.length !== 6) {
    return res.send({
      state: "error",
      errors: [
        { msg: "Invalid Join code. " },
        { msg: "Please check the code and try again." },
      ],
    });
  }

  Game.findOne({ join_code: req.body.key, game_type: "tictactoe" })
    .populate("player1")
    .exec((err, the_game) => {
      if (err) {
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
      }
      if (the_game === null) {
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong." }],
        });
      }
      if (the_game.join_state !== "waiting") {
        return res.send({
          state: "error",
          errors: [
            { msg: "Code has been used already. Try joining a new game." },
          ],
        });
      }
      if (!req.user) {
        const cookie = auth.get_auth_cookie();
        const a_player = new Player({
          user_name: "anon",
          password: auth.get_auth_cookie(),
          rec_key: auth.get_rec_code(),
          cookie: cookie,
        });
        res.cookie("AuthToken", cookie, cookie_options);

        a_player.save((err) => {
          if (err) {
            return res.send({
              state: "error",
              errors: [{ msg: "Something went wrong!" }],
            });
          }
          the_game.player2 = a_player._id;
          the_game.join_state = "joined";
          the_game.save((err) => {
            if (err) {
              return res.send({
                state: "error",
                errors: [{ msg: "Something went wrong!" }],
              });
            }
          });
        });
      } else {
        Player.findOne({ cookie: req.user }).exec((err, the_player) => {
          if (err) {
            console.log(err);
            return res.send({
              state: "error",
              errors: [{ msg: "Something went wrong!" }],
            });
          }
          if (the_player === null) {
            res.clearCookie("AuthToken");
            res.send({
              state: "error",
              errors: [{ msg: "Session expired! Please try to login again." }],
            });
            return;
          }
          if (the_player._id === the_game.player1._id) {
            res.send({
              state: "error",
              msg: [{ msg: "You can't join a game you created." }],
            });
            return;
          }
          the_game.player2 = the_player._id;
          the_game.join_state = "joined";
          the_game.save((err) => {
            if (err) {
              return res.send({
                state: "error",
                msg: [{ msg: "Something went wrong." }],
              });
            }
            res.send({ state: "success", game_id: the_game._id });
          });
        });
      }
    });
};

const create_handler = (req, res, t_worker) => {
  if (req.body.option === "") {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid game type." }],
    });
  }
  const t_game = new TGame();
  t_game.present_turn =
    req.body.option === "computer" ? Math.floor(Math.random() * 2 + 1) : 1;
  t_game.first_move = true;
  const game = new Game({
    game_type: "tictactoe",
    date_played: new Date(),
    game_state: JSON.stringify(t_game),
    finished: false,
    join_state:
      req.body.option === "friend"
        ? "waiting"
        : req.body.option === "computer"
        ? "engine"
        : "oneplayer",
    join_code: req.body.option === "friend" ? auth.get_game_code() : "",
  });

  if (!req.user) {
    let cookie = auth.get_auth_cookie();
    const a_player = new Player({
      user_name: "anon",
      password: auth.get_auth_cookie(),
      rec_key: auth.get_rec_code(),
      cookie: cookie,
    });
    res.cookie("AuthToken", cookie, cookie_options);
    a_player.save((err) => {
      if (err) {
        console.log(err);
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong!" }],
        });
      }
      game.player1 = a_player._id;
      game.turn = t_game.present_turn;
      game.save((err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            msg: [{ msg: "Something went wrong!" }],
          });
        }
        res.send({ state: "success", game_id: game._id });
        if (t_game.present_turn === 2 && req.body.option === "computer") {
          t_worker.postMessage({
            command: "t_move",
            board: t_game.board,
            game_id: game._id.toString(),
          });
        }
        return;
      });
    });
  } else {
    Player.findOne({ cookie: req.user }).exec((err, player) => {
      if (err) {
        console.log(err);
        return res.send({
          state: "error",
          errors: [{ msg: "Something went wrong!" }],
        });
      }
      if (player === null) {
        res.clearCookie("AuthToken");
        res.send({
          state: "error",
          errors: [{ msg: "Session expired, Please login again." }],
        });
        return;
      }
      game.player1 = player._id;
      game.turn = t_game.present_turn;

      game.save((err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            msg: [{ msg: "Something went wrong!" }],
          });
        }
        res.send({ state: "success", game_id: game._id });
        if (t_game.present_turn === 2 && req.body.option === "computer") {
          t_worker.postMessage({
            command: "t_move",
            board: t_game.board,
            game_id: game._id.toString(),
          });
        }
        return;
      });
    });
  }
};

const handle_start = (err, result, req, res) => {
  if (err) {
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong!" }],
    });
  }
  if (result == null) {
    return res.send({
      state: "error",
      errors: [{ msg: "Unknown Game, Please check url and try again." }],
    });
  }
  const game = JSON.parse(result.game_state);
  const reply = { state: "success" };
  reply.board = game.board;
  reply.game_id = result._id;
  reply.second = req.body.second ? true : false;
  reply.is_player1 = result.player1.cookie === req.user ? true : false;
  if (result.join_state == "waiting") {
    reply["join_code"] = result.join_code;
  }
  reply["join_state"] = result.join_state;
  if (result.finished) {
    reply.finished = true;
    reply.win_pos = game.win_pos;
    reply.player1_score = game.player1_score;
    reply.player2_score = game.player2_score;
    if (result.join_state === "oneplayer") {
      reply.winner = result.winner;
    } else if (result.join_state == "joined") {
      reply.winner =
        result.winner == 1
          ? result.player1.user_name
          : result.winner == 2
          ? result.player2.user_name
          : result.winner;
    } else if (result.join_state == "engine") {
      reply.winner =
        result.winner == 1 ? result.player1.user_name : result.winner;
    }
  } else {
    let turn;
    if (result.join_state === "engine") {
      result.turn === 1 ? (turn = true) : (turn = false);
    } else if (result.join_state === "oneplayer") {
      turn = true;
    } else if (result.join_state === "joined") {
      result.turn == 1 && req.user === result.player1.cookie
        ? (turn = true)
        : result.turn === 2 && req.user === result.player2.cookie
        ? (turn = true)
        : (turn = false);
    } else {
      turn = false;
    }
    reply.finished = false;
    reply.turn = turn;
  }
  res.is_player1 = req.user === result.player1.cookie ? true : false;
  res.send(reply);
  return;
};

const handle_choice = (err, result, req, res, t_worker) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong!" }],
    });
  }
  if (result === null) {
    return res.send({
      state: "error",
      errors: [{ msg: " Invalid Game. Try starting a new one." }],
    });
  }
  let game = JSON.parse(result.game_state);
  const t_game = new TGame(game);

  if (result.join_state === "joined") {
    if (result.turn == 1 && result.player1.cookie === req.user) {
      t_game.present_turn = 1;
    } else if (result.turn == 2 && result.player2.cookie === req.user) {
      t_game.present_turn = 2;
    } else {
      return res.send({
        state: "error",
        errors: [{ msg: "Error: Wrong Turn!" }],
      });
    }
  } else {
    if (t_game.first_move) {
      t_game.present_turn = 1;
    } else {
      t_game.present_turn = t_game.present_turn == 1 ? 2 : 1;
    }
  }

  let game_response = t_game.make_move(req.body.choice);
  if (game_response[0] != 0) {
    return res.send({ state: "error", errors: [{ msg: game_response[1] }] });
  }
  let update;

  update = { turn: result.turn == 1 ? 2 : 1 };

  let win_response = t_game.check_winner();

  const reply = {
    state: "success",
    board: t_game.board,
    turn: result.join_state !== "oneplayer" ? false : true, //update.turn,
    join_state: result.join_state,
    game_id: result._id,
    finished: false,
  };
  if (win_response) {
    update.finished = reply.finished = true;
    win_response !== "draw" ? (reply.win_player = win_response) : null;
    win_response !== "draw" ? (update.score = 1) : null;
    if (win_response === 1) {
      update.score = reply.score = t_game.player1_score;
      reply.win_pos = t_game.win_pos;

      if (result.join_state === "joined") {
        update.winner = 1;
        reply.winner = result.player1.user_name;
      } else {
        update.winner = reply.winner = "Player1";
      }
    } else if (win_response === 2) {
      update.score = reply.score = t_game.player2_score;
      reply.win_pos = t_game.win_pos;
      if (result.join_state == "joined") {
        update.winner = 2;
        reply.winner = result.player2.user_name;
      } else {
        update.winner = reply.winner = "Player2";
      }
    } else {
      update.score = reply.score = t_game.player2_score;
      reply.win_pos = [];
      update.winner = reply.winner = "Nobody";
    }
    reply.player1_score = t_game.player1_score;
    reply.player2_score = t_game.player2_score;
  }
  update.game_state = JSON.stringify(t_game);

  result.updateOne(update).exec((err) => {
    if (err) {
      console.log(err);
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong!" }],
      });
    }
    res.send(reply);
    if (result.join_state == "engine" && !update.finished) {
      t_worker.postMessage({
        command: "t_move",
        board: t_game.board,
        game_id: result._id.toString(),
      });
    }
    return;
  });
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
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid Game. Please try starting another one." }],
    });
  }
  let game = JSON.parse(result.game_state);
  let turn;
  if (result.join_state == "engine") {
    result.turn == 1 ? (turn = true) : (turn = false);
  } else if (result.turn == 1 && req.user == result.player1.cookie) {
    turn = true;
  } else if (result.join_state == "joined") {
    result.turn == 2 && req.user == result.player2.cookie
      ? (turn = true)
      : (turn = false);
  } else {
    turn = false;
  }
  reply = {
    join_state: result.join_state,
    win_pos: game.win_pos ? game.win_pos : [],
    turn: turn,
    finished: result.finished,
    board: game.board,
    winner:
      result.winner == 1
        ? result.player1.user_name
        : result.winner == 2
        ? result.player2.user_name
        : result.winner,
    score: [game.player1_score, game.player2_score],
  };
  res.send(reply);
  return;
};

const handle_request = (err, results, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong !" }],
    });
  }
  if (results.request == null) {
    return res.send({
      state: "error",
      errors: [{ msg: " Invalid/Deleted  request Id." }],
    });
  }
  if (results.the_game == null) {
    return res.send({
      state: "error",
      errors: [{ msg: " Invalid game Id." }],
    });
  }
  if (!req.body.action) {
    return res.send({
      state: "error",
      errors: [{ msg: " Invalid Request Action." }],
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
          conosle.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong! " }],
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
          errors: [{ msg: "Invalid user." }],
        });
      }
      const handle_delete = (err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong!" }],
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
          errors: [{ msg: "Invalid user." }],
        });
      }
      if (results.request.accept == true) {
        return res.send({
          state: "error",
          errors: [{ msg: " Already Accepted Request!" }],
        });
      }
      //tic tac toe processing
      const t_game = new TGame();
      let turn = Math.floor(Math.random() * 2 + 1);
      t_game.first_move = true;
      const game = new Game({
        game_type: "tictactoe",
        date_played: new Date(),
        game_state: JSON.stringify(t_game),
        finished: false,
        join_state: "joined",
        join_code: " ",
        player1: results.request.sender._id,
        player2: results.request.receiver._id,
      });
      game.turn = turn;
      const handle_save = (err) => {
        if (err) {
          console.log(err);
          return res.send({
            state: "error",
            errors: [{ msg: "Something went wrong!" }],
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
              errors: [{ msg: "Something went wrong!" }],
            });
          }
          game.save(handle_save);
        });
      break;
    case "check":
      if (req.user != results.request.sender.cookie) {
        return res.send({
          state: "error",
          errors: [{ msg: "Unknown user!" }],
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
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong " }],
    });
  }
  if (g_reqs == null) {
    return res.send({
      state: "error",
      errors: [{ msg: "No Requests Available." }],
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

const handle_create_req = (err, the_game, req, res) => {
  if (err) {
    console.log(err);
    return res.send({
      state: "error",
      errors: [{ msg: "Something went wrong!" }],
    });
  }
  if (the_game == null) {
    return res.send({
      state: "error",
      errors: [{ msg: "Invalid Game Id." }],
    });
  }
  let sender, receiver;
  if (the_game.player1.cookie == req.user) {
    sender = the_game.player1._id;
    receiver = the_game.player2._id;
  } else {
    sender = the_game.player2._id;
    receiver = the_game.player1._id;
  }
  let request = new Request({
    sender: sender,
    receiver: receiver,
    game_type: "tictactoe",
  });
  request.save((err, the_req) => {
    if (err) {
      console.log(err);
      return res.send({
        state: "error",
        errors: [{ msg: "Something went wrong!" }],
      });
    }
    return res.send({
      state: "success",
      req_id: the_req._id,
      msg: "Request Sent Successfully!!",
    });
  });
};

module.exports = {
  list_handler: list_handler,
  join_handler: join_handler,
  create_handler: create_handler,
  handle_start: handle_start,
  handle_choice: handle_choice,
  handle_turn: handle_turn,
  handle_request: handle_request,
  handle_list_reqs: handle_list_reqs,
  handle_create_req: handle_create_req,
};
