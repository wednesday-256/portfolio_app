class TEngine{
	//1 = 'X' 2 ="O"

	//function to get next tictactoe move 
	get_best_move(board, player){
		let max_player = this.player;
		let other_player = player == 1 ? 2 : 1
		let best;

		if (board.num_e_squares() == 9   ){
			return {'score': 0, 'position': Math.floor((Math.random() * 8) + 1)}
		}
		if ( board.winner == other_player){
			return {
				'score': other_player == max_player ? 1 * ( board.num_e_squares() + 1 ) : -1 * ( board.num_e_squares() + 1 ),
				'position': null
			}
		} else if ( board.num_e_squares() == 0 ){return { 'score': 0, 'position': null}}

		if (player == max_player){
			best = { 'position': null, 'score': -Infinity }
		} else {
			best = {'position': null, 'score': Infinity}
		}
		for (let move of board.empty_squares()){
			board.make_move(move, player)
			let eval_score =this.get_best_move(board, other_player)

			board.board[move] = 'e';
			board.winner = false;
			eval_score['position'] = move

			if (player == max_player){
				eval_score['score'] > best['score']? best = eval_score: null
			} else { eval_score['score']< best['score']? best = eval_score: null }
		}

		best['board'] = board
		return best
	}

	//function to call the best move function 
	async call_tmove(board){
		this.player = 2
		board = new TBoard(board)
		return this.get_best_move(board, 2)
	}
}


//class to hold Tictactoe board
class TBoard{
	win_positions = [ 
		[0,1,2], [3,4,5], [6,7,8], [3,0,6],
		[1,4,7], [2,5,8], [0,4,8], [2,4,6]
	]
	constructor (board){
		this.board = board
	}

	//function to return empty squares
	empty_squares(){
		let res = []
		for  (let i in this.board){
			this.board[i] == 'e'? res.push(i): null
		}
		return res
	}

	//function to return number of empty squares
	num_e_squares(){
		return this.empty_squares().length
	}

	//function to check winner on tic tac toe simulated board
	check_winner(){
		let res ;
		for (let x of this.win_positions){
			res = this.board[x[0]] == this.board[x[1]] && this.board[x[1]] == this.board[x[2]] && this.board[x[2]] != 'e'? this.board[x[0]]: false 
			if(res != false){ break; }
		}
		return res
	}

	//function  to make move on tic tac toe simulated board
	make_move(pos, player){
		this.board[pos] = player 
		let chk = this.check_winner()
		this.winner = chk 
		return this.board[pos] == player ? true: false
	}

}
module.exports = TEngine
