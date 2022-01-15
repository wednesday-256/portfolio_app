const CEngine = require('../extensions/chkEngine')
const CGame = require('../extensions/chk_game')

describe('Test Engine Multi Kill functionality.', ()=>{
	it('Checks that engine returns the valid result for a normal Piece.', ()=>{
		let game = new CGame()
		let engine = new CEngine()
		let cnt  = 0
		let points = [[3,2], [5,2], [5,4], [3,4],[1,6], [6,5]]
		game.white_pieces.forEach((val, ind)=>{
			if(cnt < 6 ){
				val.row = points[ind][0]; val.col = points[ind][1]
			} else { val.row= val.col = 99 }
			cnt +=1
		})
		cnt  = 0
		game.black_pieces.forEach((val)=>{
			if (cnt < 1){
				val.row= 4; val.col = 3
			} else{ val.row = val.col = 99 }
			cnt +=1
		})
		game.present_turn = 2; game.first_move = false
		game.expected_pieces = [[4,3]]
		engine.call_cmove(game, 2).then(resp=>{
			expect(resp.position[0]).toEqual(6)
			expect(resp.position[1]).toEqual(1)
		})
	})
	it('Checks that engine returns the valid result for a King Piece.', ()=>{
		let game = new CGame()
		let engine = new CEngine()
		let cnt  = 0
		let points = [[3,2], [5,2], [5,4], [3,4],[1,6], [6,5]]
		game.white_pieces.forEach((val, ind)=>{
			if(cnt < 6 ){
				val.row = points[ind][0]; val.col = points[ind][1]
			} else { val.row= val.col = 99 }
			cnt +=1
		})
		cnt  = 0
		game.black_pieces.forEach((val)=>{
			if (cnt < 1){
				val.row= 4; val.col = 3; val.is_king = true;
			} else{ val.row = val.col = 99 }
			cnt +=1
		})
		game.present_turn = 2; game.first_move = false
		game.expected_pieces = [[4,3]]
		engine.call_cmove(game, 2).then(resp=>{
			expect(resp.position[0]).toEqual(2)
			expect(resp.position[1]).toEqual(5)
		})
	})
})
