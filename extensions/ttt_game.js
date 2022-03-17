class TGame {
  board = [];
  win_positions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [3, 0, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  constructor(board) {
    //initialize with board variables
    for (let i = 0; i < 9; i++) {
      this.board.push("e");
    }
    this.board = board ? board.board : this.board;
    this.player2_score = board ? board.player2_score : 0;
    this.player1_score = board ? board.player1_score : 0;
    this.first_move = board ? board.first_move : true;
    this.present_turn = board ? board.present_turn : 0;
    this.win_pos = board ? board.win_pos : [];
  }

  make_move(pos) {
    pos = Number(pos);
    if (this.board[pos] != "e") {
      return [1, "Invalid Position"];
    }
    if (![0, 1, 2, 3, 4, 5, 6, 7, 8].includes(pos)) {
      return [1, "Invalid Position"];
    }

    this.board[pos] = this.present_turn;
    //this.present_turn = this.present_turn == 1? 2 : 1
    this.first_move = false;
    return [0, "Success"];
  }

  check_winner() {
    let res, cnt;
    for (let x of this.win_positions) {
      res =
        this.board[x[0]] == this.board[x[1]] &&
        this.board[x[1]] == this.board[x[2]] &&
        this.board[x[2]] != "e"
          ? this.board[x[0]]
          : false;

      if (res != false) {
        res == 2 ? (this.player2_score += 1) : (this.player1_score += 1);
        this.win_pos = x;
        break;
      }
    }
    this.board.forEach((val) => {
      if (val == "e") {
        cnt = 5;
      }
    });
    if (cnt != 5 && res == false) {
      return "draw";
    }

    return res;
  }

  new_game() {
    this.board = [];
    for (let i = 0; i < 9; i++) {
      this.board.push("e");
    }
    this.first_move = true;
  }

  flush_score() {
    this.player2_score = 0;
    this.player1_score = 0;
  }
}

module.exports = TGame;
