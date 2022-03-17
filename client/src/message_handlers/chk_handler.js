const chk_create_handler = (data, navigate) => {
  navigate("/checkers/" + data.game_id);
};

const start_handler = (
  data,
  score,
  context,
  msg,
  join,
  board,
  turn,
  finished,
  waiting,
  post,
  engine,
  moves,
  rotate
) => {
  if (data.join_state === "engine") {
    engine(true);
  }
  board(data.board);
  if (data.join_state === "waiting" && data.is_player1) {
    post({ command: "start", game_id: data.game_id, second: true });
    let box_interval = setInterval(() => {
      let check = document.querySelector(".tw_box");
      if (check === null) {
        post({ command: "stop" });
        clearInterval(box_interval);
      }
    }, 4000);
  }
  if (!data.is_player1) {
    rotate(true);
  }
  if (!data.is_player1 && !data.finished && data.join_state === "waiting") {
    post({ command: "join", key: data.join_code });
    return;
  } else {
    if (data.join_state === "waiting") {
      waiting([data.join_code, data.is_player1 ? false : true]);
      post({ command: "turn", game_id: data.game_id });
    } else {
      waiting(false);
    }
    ["waiting", "joined"].includes(data.join_state) ? join(true) : join(false);
    engine(data.join_state === "engine" ? true : false);
  }
  score([data.board.player1_score, data.board.player2_score]);
  moves(data.moves);

  if (data.finished) {
    finished(true);
    context(data.winner === "Nobody" ? "warning" : "success");
    msg(`${data.winner} won this game.`);
    return;
  } else if (data.turn) {
    context("info");
    msg("Your move");
  } else if (data.join_state === "joined") {
    context("warning");
    msg("Waiting for opponent");
  }
  if (
    !data.turn &&
    (data.join_state === "joined" || data.join_state === "engine")
  ) {
    post({ command: "turn", game_id: data.game_id });
  }
  turn(data.turn);
};

const move_handler = (
  data,
  context,
  msg,
  board,
  turn,
  finished,
  score,
  post,
  moves,
  piece,
  points
) => {
  let player1_score = 12,
    player2_score = 12;
  data.board.black_pieces.concat(data.board.white_pieces).forEach((obj) => {
    if (obj.row === 99) {
      obj.clr === 2 ? (player2_score -= 1) : (player1_score -= 1);
    }
  });
  score([player1_score, player2_score]);

  turn(data.turn);
  context("info");
  if (data.join_state === "oneplayer") {
    msg(`Player${data.turn}'s Turn.'`);
  }
  finished(data.finished);
  if (data.finished) {
    let ctx = data.winner === "Nobody" ? "warning" : "success";
    context(ctx);
    msg(`${data.winner} won this game.`);
  }
  if (
    (data.join_state === "engine" || data.join_state === "joined") &&
    !data.finished
  ) {
    context("warning");
    msg("Waiting for opponent.");
    post({ command: "turn", game_id: data.game_id });
  }
  if (data.next_kill) {
    piece(data.expected_piece);
    points(data.kill_points);
  }
  moves(data.moves);
  board(data.board);
};

const turn_handler = (
  data,
  finished,
  context,
  msg,
  board,
  turn,
  score,
  moves
) => {
  let player1_score = 12,
    player2_score = 12;
  data.board.black_pieces.concat(data.board.white_pieces).forEach((obj) => {
    if (obj.row === 99) {
      obj.clr === 2 ? (player2_score -= 1) : (player1_score -= 1);
    }
  });
  score([player1_score, player2_score]);
  turn(data.turn);
  if (data.finished) {
    context(data.winner === "Nobody" ? "warning" : "danger");
    finished(true);
    msg(`${data.winner} won this game.`);
  } else {
    context("info");
    msg("Your move.");
  }
  moves(data.moves);
  board(data.board);
};

const join_handler = (data) => {
  let url = "/checkers/" + data.game_id;
  window.location = window.location.origin + url;
};

const restart_handler = (data) => {
  let url = "/checkers/" + data.game_id;
  window.location = window.location.origin + url;
};

const list_handler = (data, show, type, games) => {
  type("checkers");
  games(data.games ? data.games : []);
  show(true);
};

const request_handler = (data, notify, sent) => {
  if (data.msg) {
    notify({
      type: "success",
      header: "Requests",
      body: data.msg,
    });
  }
  if (data.game_id) {
    window.location = `/checkers/${data.game_id}`;
    return;
  }
  if (data.deny) {
    notify({
      type: "warning",
      header: "Request",
      body: "Request denied!",
    });
    sent(false);
  }
};

const create_req_handler = (data, notify, sent, post, game_id) => {
  notify({
    type: "success",
    header: "Request",
    body: data.msg,
  });
  sent(true);
  post({
    command: "request",
    action: "check",
    req_id: data.req_id,
    game_id: game_id,
  });
  let c_time = setInterval(() => {
    let box = document.querySelector(".c_box");
    if (box === null) {
      post({ command: "stop" });
      clearInterval(c_time);
    }
  }, 5000);
};

const list_req_handler = (data, rlist, notify) => {
  rlist(Object.assign({}, data.msg));
  if (data.msg.received.length > 0) {
    notify({
      type: "info",
      header: "Request",
      body: "Received a rematch request.",
    });
  }
};

export {
  start_handler,
  move_handler,
  chk_create_handler,
  restart_handler,
  join_handler,
  turn_handler,
  list_handler,
  request_handler,
  create_req_handler,
  list_req_handler,
};
