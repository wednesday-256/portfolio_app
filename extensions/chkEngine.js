//function to help clean arrays
const clean_arr = (arr) => {
  let res = [];
  arr.forEach((val) => {
    if (val == undefined) {
      return;
    }
    val.length > 0 ? res.push(val) : null;
  });
  return res;
};

class CGame {
  black_pieces = [];
  white_pieces = [];
  boxes = [];
  dead_pieces = [];
  k_cap = false;
  expected_pieces = [];
  kill_points = [];
  present_turn = 1;
  winner = 0;
  first_move = true;
  player2_score = 0;
  player1_score = 0;

  // white >> 1 , black >> 2

  constructor() {
    this.create_board();
    this.create_players();
  }

  create_board() {
    for (let x = 0; x < 8; x++) {
      if (x % 2 != 0) {
        for (let v = 0; v < 8; v++) {
          if (v % 2 == 0) {
            this.boxes.push([x, v]);
          }
        }
      } else {
        for (let v = 0; v < 8; v++) {
          if (v % 2 != 0) {
            this.boxes.push([x, v]);
          }
        }
      }
    }
  }

  create_players() {
    for (let i = 0; i < 12; i++) {
      let row, col;
      [row, col] = this.boxes[i];
      this.black_pieces.push(new Piece(2, row, col));
    }
    let cnt = 1;
    while (cnt < 13) {
      let row, col;
      [row, col] = this.boxes[this.boxes.length - cnt];
      this.white_pieces.push(new Piece(1, row, col));
      cnt += 1;
    }
  }

  flush_score() {
    this.player2_score = 0;
    this.player1_score = 0;
  }

  get_nextpoints(piece) {
    this.dead_pieces = [];
    let lpoint, rpoint, nrow, ncol, res, check, nnr, k_res;
    let capl = false;
    let capr = false;
    let warp = { 1: 2, 2: 1 };
    nnr = piece.clr == 2 ? piece.row + 2 : piece.row - 2;
    nrow = piece.clr == 2 ? piece.row + 1 : piece.row - 1;

    const update_dead_pieces = (arr, dir) => {
      dir == "left" ? (lpoint = arr) : (rpoint = arr);
      this.dead_pieces.push([dir, [nrow, ncol]]);
      dir == "left" ? (capl = true) : (capr = true);
    };

    //left side of the piece
    ncol = piece.col - 1;
    res = this.check_position(nrow, ncol);

    if (res == false) {
      lpoint = [nrow, ncol];
    } else if (res == warp[piece.clr]) {
      check = this.check_position(nnr, ncol - 1);
      check == false ? update_dead_pieces([nnr, ncol - 1], "left") : null;
    } else {
      lpoint = false;
    }

    //right side of the piece
    ncol = piece.col + 1;
    res = this.check_position(nrow, ncol);
    if (res == false) {
      rpoint = [nrow, ncol];
    } else if (res == warp[piece.clr]) {
      check = this.check_position(nnr, ncol + 1);
      check == false ? update_dead_pieces([nnr, ncol + 1], "right") : false;
    } else {
      rpoint = false;
    }

    res = [];
    rpoint != false ? res.push(rpoint) : null;
    lpoint != false ? res.push(lpoint) : null;

    //checks for capture points and return those instead
    if (capr != capl && res.length > 1) {
      capr == true ? res.splice(1, 1) : res.splice(0, 1);
    }

    //check if piece is a king and returns the king capture points too
    piece.is_king ? (k_res = this.king_nextpoints(piece)) : null;

    //checks for capture points and returns only those
    if ((capr == true || capl == true) && this.k_cap) {
      res = res.concat(k_res);
      this.k_cap = false;
    } else if (this.k_cap) {
      this.k_cap = false;
      res = k_res;
    } else if ((capr == true || capl == true) && this.k_cap == false) {
      res = res;
    } else {
      res = res.concat(k_res);
    }

    return clean_arr(res);
  }

  king_nextpoints(piece) {
    let lpoint, rpoint, nrow, ncol, res, check, capl, capr, warp, nnr;
    capl = false;
    capr = false;
    warp = { 1: 2, 2: 1 };
    nnr = piece.clr == 1 ? piece.row + 2 : piece.row - 2;
    nrow = piece.clr == 1 ? piece.row + 1 : piece.row - 1;

    const update_dead_pieces = (arr, dir) => {
      dir == "left" ? (lpoint = arr) : (rpoint = arr);
      this.dead_pieces.push([`d-${dir}`, [nrow, ncol]]);
      dir == "left" ? (capl = true) : (capr = true);
      this.k_cap = true;
    };

    //positions on the left side
    ncol = piece.col - 1;
    res = this.check_position(nrow, ncol);
    if (res == false) {
      lpoint = [nrow, ncol];
    } else if (res == warp[piece.clr]) {
      check = this.check_position(nnr, ncol - 1);
      check == false ? update_dead_pieces([nnr, ncol - 1], "left") : null;
    } else {
      lpoint = false;
    }

    //positions on the right side
    ncol = piece.col + 1;
    res = this.check_position(nrow, ncol);
    if (res == false) {
      rpoint = [nrow, ncol];
    } else if (res == warp[piece.clr]) {
      check = this.check_position(nnr, ncol + 1);
      check == false ? update_dead_pieces([nnr, ncol + 1], "right") : null;
    } else {
      rpoint = false;
    }

    res = [];
    rpoint != false ? res.push(rpoint) : null;
    lpoint != false ? res.push(lpoint) : null;

    if (capr != capl && res.length > 1) {
      capr == true ? res.splice(1, 1) : res.splice(0, 1);
    }

    return res;
  }

  check_position(row, col) {
    for (let p of this.boxes) {
      if (p[0] == row && p[1] == col) {
        for (let i of this.black_pieces.concat(this.white_pieces)) {
          let pos = i.get_positions();
          if (p[0] == pos[0] && p[1] == pos[1]) {
            return i.clr;
          }
        }
        return false;
      }
    }
    return undefined;
  }

  //returns the piece of the position given
  get_piece(pos) {
    for (let x of this.black_pieces.concat(this.white_pieces)) {
      if (x.row == pos[0] && x.col == pos[1]) {
        return x;
      }
    }
  }

  move_piece(prev, pos) {
    let piece, choice, check;
    piece = this.get_piece(prev);
    this.get_nextpoints(piece);

    if (piece.clr != this.present_turn) {
      return [9, "Invalid turn!!"];
    }

    if (piece == undefined) {
      return [9, "Invalid Piece"];
    }

    choice = pos[1] > prev[1] ? "right" : "left";

    if (piece.is_king) {
      if (piece.clr == 1 && pos[0] > prev[0]) {
        choice = `d-${choice}`;
      } else if (piece.clr == 2 && pos[0] < prev[0]) {
        choice = `d-${choice}`;
      }
    }

    piece.row = Number(pos[0]);
    piece.col = Number(pos[1]);
    if (piece.clr == 2 && piece.row == 7 && !piece.is_king) {
      piece.is_king = true;
    } else if (piece.clr == 1 && piece.row == 0 && !piece.is_king) {
      piece.is_king = true;
    }
    this.remove_deads(choice);

    this.dead_pieces.length > 0
      ? (check = this.get_nextpoints(piece))
      : (check = false);

    if (check != false) {
      if (this.dead_pieces.length == 1) {
        return this.move_piece(piece.get_positions(), check[0]);
      } else if (this.dead_pieces.length > 1) {
        this.expected_pieces = [piece.get_positions()];
        this.kill_points = check;
        return [1, "Next Capture", [piece.row, piece.col]];
      } else {
        this.kill_points = [];
      }
    }

    this.present_turn = piece.clr == 1 ? 2 : 1;
    this.first_move ? (this.first_move = false) : null;
    this.update_expected();
    this.check_winner();
    return [0, "Move Made"];
  }

  //function to update expected piecs for next move
  update_expected() {
    let cap_p, norm_p, pieces;
    pieces = this.present_turn == 1 ? this.white_pieces : this.black_pieces;
    cap_p = [];
    norm_p = [];

    pieces.forEach((x) => {
      if (x.row == 99) {
        return;
      }
      let res = this.get_nextpoints(x);
      if (this.dead_pieces.length > 0) {
        cap_p.push(x.get_positions());
      } else if (res.length > 0) {
        norm_p.push(x.get_positions());
      }
    });

    if (cap_p.length > 0) {
      this.expected_pieces = cap_p;
    } else {
      this.expected_pieces = norm_p;
    }
  }

  check_winner() {
    let cnt = 0;
    let pos = [];
    for (let x of this.white_pieces) {
      if (x.row != 99) {
        cnt += 1;
        pos.push(clean_arr(this.get_nextpoints(x)));
      }
    }
    if (cnt == 0 || clean_arr(pos).length == 0) {
      this.winner = 2;
      this.player2_score += 1;
    }

    cnt = 0;
    pos = [];
    for (let x of this.black_pieces) {
      if (x.row != 99) {
        cnt += 1;
        pos.push(clean_arr(this.get_nextpoints(x)));
      }
    }
    if (cnt == 0 || clean_arr(pos).length == 0) {
      this.winner = 1;
      this.player1_score += 1;
    }
  }

  remove_deads(choice) {
    let piece;
    for (let x of this.dead_pieces) {
      if (x[0] == choice) {
        piece = this.get_piece(x[1]);
        piece.row = 99;
        piece.col = 99;
      }
    }
  }
}

class Piece {
  constructor(clr, row, col, is_king) {
    if (is_king) {
      this.is_king = is_king;
    }
    this.clr = clr;
    this.row = Number(row);
    this.col = Number(col);
  }

  get_positions() {
    return [this.row, this.col];
  }

  promote_piece() {
    this.is_king = true;
  }
}

class CBoard extends CGame {
  constructor(board) {
    super();
    this.black_pieces = [];
    this.white_pieces = [];
    this.boxes = this.data_p(board.boxes);
    this.dead_pieces = this.data_p(board.dead_pieces);
    this.k_cap = this.data_p(board.k_cap);
    this.expected_pieces = this.data_p(board.expected_pieces);
    this.kill_points = this.data_p(board.kill_points);
    this.present_turn = this.data_p(board.present_turn);
    this.first_move = this.data_p(board.first_move);
    board.black_pieces.concat(board.white_pieces).forEach((obj) => {
      if (obj.clr == 1) {
        this.white_pieces.push(
          new Piece(obj.clr, obj.row, obj.col, obj.is_king)
        );
      } else {
        this.black_pieces.push(
          new Piece(obj.clr, obj.row, obj.col, obj.is_king)
        );
      }
    });
  }

  data_p(val) {
    return JSON.parse(JSON.stringify(val));
  }

  get_acc_score(player) {
    let piece = player == 1 ? this.white_pieces : this.black_pieces;
    let score = 0;
    let other_player = player == 1 ? this.black_pieces : this.white_pieces;
    other_player.forEach((obj) => {
      if (obj.row == 99) {
        score += 2;
      }
    });
    piece.forEach((obj) => {
      if (obj.row == 99) {
        return;
      }
      score += obj.is_king ? 4 : 2;
      if (!obj.is_king) {
        score += obj.clr == 1 && obj.row == 0 ? 2 : 0;
        score += obj.clr == 2 && obj.row == 7 ? 2 : 0;
      }
    });
    return score;
  }

  get_player_score(player) {
    let score = this.get_acc_score(2);
    let alt_score = this.get_acc_score(1);
    return score - alt_score;
  }
}

//engine class to hold game play function
class CEngine {
  async call_cmove(board, player) {
    this.player = player;
    board = new CBoard(board);
    let res = this.get_next_move(board, player);
    return res;
  }

  //function to get next checkers move
  get_next_move(board, player, depth, alpha, beta) {
    //console.log('whithin get next method')
    depth == undefined ? (depth = 5) : null;
    board.expected_pieces.length <= 3 && depth == undefined
      ? (depth = 6)
      : null;
    board.expected_pieces.length <= 2 && depth == undefined
      ? (depth = 7)
      : null;
    if (alpha == undefined && beta == undefined) {
      alpha = -Infinity;
      beta = +Infinity;
    }
    let max_player = this.player;
    let other_player = player == 1 ? 2 : 1;
    let best;
    if (board.first_move) {
      return {
        score: 0,
        piece: [2, [1, 3, 5, 7][Math.floor(Math.random() * 3)]],
        position: [3, [0, 2, 4, 6][Math.floor(Math.random() * 3)]],
      };
    }

    if (board.expected_pieces.length <= 0 || depth <= 0) {
      return { score: board.get_player_score(other_player), position: null };
    }
    if (board.winner == other_player || depth <= 0) {
      return {
        score: board.get_player_score(other_player),
        position: null,
      };
    }

    if (player == max_player) {
      best = { position: null, score: -Infinity };
    } else {
      best = { position: null, score: Infinity };
    }

    let cpy = new CBoard(board);
    let kings = CBoard.king_pieces;
    for (let piece of board.expected_pieces) {
      piece = board.get_piece(piece);
      if (piece.row == 99) {
        continue;
      }
      let prev_pos = piece.get_positions();
      //depth ==3 ? console.log(prev_pos) : null
      for (let move of board.get_nextpoints(piece)) {
        let mres = board.move_piece(prev_pos, move);
        let eval_score;
        try {
          eval_score = this.get_next_move(
            board,
            other_player,
            depth - 1,
            alpha,
            beta
          );
        } catch (e) {
          eval_score = {
            score: board.get_player_score(other_player),
            position: null,
          };
        }

        board = new CBoard(cpy);
        eval_score["position"] = move;
        eval_score["piece"] = prev_pos;
        if (player == max_player) {
          eval_score["score"] > best["score"] ? (best = eval_score) : null;
          alpha = Math.max(eval["score"], alpha);
          //if (beta <= alpha ){ break }
        } else {
          eval_score["score"] < best["score"] ? (best = eval_score) : null;
          beta = Math.min(eval["score"], beta);
          //if( beta <= alpha ){ break }
        }
      }
    }
    //console.log(best)
    return best;
  }
}
module.exports = CEngine;
