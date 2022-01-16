const show_error=(msgs, show)=>{
  let error_box = document.querySelector('#error_box')
  let res = ''
	let rm_event = "onclick='this.style.display=`none`'"
  if(msgs instanceof Array){
    msgs.map((val)=>{ res += "<li " + rm_event + " >&#128712  "+ val+ "</li>"  })
  }else { res =`<li ${rm_event} >&#128712  ${msgs}</li>` }
  error_box.innerHTML += res
  !show? setTimeout(()=>{ error_box.innerHTML= '' }, 10000): null
	document.querySelector('body div a').scrollIntoView()
	let box = document.querySelector('#alert-sound')
	box.currentTime=0;
	View.cursor_wait(false)
	box.play().catch((e)=>console.log(e))
}

const get_options =(body)=>( {
  method: 'POST',
  headers:{'Content-Type': 'application/json','Accept': 'application/json'},
  body: JSON.stringify(body)
})

//api address
const api_add = "/checkers/api"

class Game{

	static get_score_box(){
		return document.getElementById('score-box')
	}
	static get_alert_box(){
		return document.getElementById('alert-box')
	}
	static get_board(){
		return document.getElementById('game-board')
	}

	//function to populate alert box accordingly
	static update_alert_box(message, n ){
		let fix = ''
		if ( n === 1 ){
			fix = "🔴 🔴"
		}
		else if ( n === 2 ){
			fix = '🟢 🟢'
		}
		else if (n === 3){
			fix = '🔵 🔵'
		}
		else if( n=== 9 ) {
			fix = '⚪ ⚪'
		}
		else if ( n == 78 ){
			fix = '😺 😺'
		}
		else if ( n == 79 ){
			fix = '😿 😿'
		}
		else if (n == 22){
			fix = '🛑 🛑'
		}
		else {
			fix = '🎉 🎉'
		}

		let res = fix + " "+ message +" "+ fix 
		Game.get_alert_box().innerHTML = "<p style='text-align: center; font-size: 20px;'>"+ res + "</p>"
	}

	static update_help(msg){
		document.getElementById('info').innerHTML = msg
	}
}

//checkers game view class 
class View extends Game{

	constructor(){
		super()
		View.worker = new Worker('/javascripts/workers/worker.js')
		View.worker.onmessage= View.message_handler
		View.board_state='down';
		document.querySelector('#flipBtn').addEventListener('click', View.rotate_board)

		document.querySelector('#restart').addEventListener('click', (e)=>{document.restart.submit()})
		const toggle_help = (e)=>{
			e.preventDefault()
			let info_box = document.getElementById('info')
			info_box.style.display == 'none'? info_box.style.display = 'block': info_box.style.display = 'none'
		}
		//adds event to the howtoplay button
		document.querySelector('#howtoplay').addEventListener('click', toggle_help)

		//updates alert box
		Game.update_alert_box('Checkers.', 3);
		let help = '<p>This is a standard 8x8 checkers board game. Scores are updated after every game.</p>'
		help += '<p>You win by either trapping your opponents last piece or capturing all your opponents pieces.</p>'
		help += '<p>The game ends in a draw, when both players are left with one player each.</p>'
		Game.update_help(help)
		View.update_score(0, 0)
		let brd = Game.get_board()
		brd.classList.add('chk-board')
		brd.innerHTML = View.create_cboard();
		View.init_game()
	}

	static async rotate_board(e){
		e.preventDefault()
		if ( View.board_state == 'up' ){
			View.board_state = 'down';
			document.querySelector('.chk-board').style.transform = 'rotate(360deg)'
		}	else {
			View.board_state = 'up';
			document.querySelector('.chk-board').style.transform = 'rotate(-180deg)'
		}
	}

	static create_cboard(){
		let res = ""
		for (let x = 0; x <8; x++){
			if (x % 2 != 0){
				for (let v =0; v< 8 ; v ++){
					if (v %2 == 0){
						res +=`<div class='cbox' title='${x},${v}' id='cbox${x}${v}'></div>`
					}else{
						res+='<div class="numb"></div>'
					}
				}
			}else{
				for (let v =0; v< 8 ; v ++){
					if (v %2 != 0){
						res +=`<div class='cbox' title='${x},${v}' id='cbox${x}${v}'></div>`
					}else{
						res+='<div class="numb"></div>'
					}
				}
			}
		}
		return res
	}

	static async update_score(p1, p2){
		let res = "<p><strong>Player 1: </strong>"+ p1 + "</p> ";
		res += "<p><strong>Player 2: </strong>"+ p2+"</p>";
		Game.get_score_box().innerHTML = res;	
	}

	static async message_handler(e){
		if(e.data.state == 'error'){return show_error(e.data.msg)}
		if(View.njoin){ return }

		switch(e.data.command){
			case 'join':
				e.data.state? window.location.reload(): null
				break;
			case 'toggle':
				View.turn_handler(e.data.resp)
			case 'rematch':
				e.data.url ? window.location = window.origin + e.data.url: null
		}
	}

	static async init_game(){
		const body = {
			command: 'start',
			game_id:document.querySelector('#game_id').value,
			values:[]
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body))
			.then(resp=>resp.json())
			.then((resp)=>{
				if (resp.state == 'error'){return show_error(resp.errors)}
				if (resp.join_link){
					let link = window.location.origin+resp.join_link
					let msg ='<h2>Waiting for a player to Join.</h2>' 
					msg += '<div><strong>Join Link: </strong> ' +link+" <a id='cp_link'>Copy Link</a>" +'</div>'
					msg += '<div><strong>Join Code:</strong> ' + resp.join_code + " <a id='cp_code'>Copy Code</a>"+'</div>'
					msg+="<p>Send Link or Code to a Friend .</p>"
					let link_box =document.querySelector("#link_box")
					link_box.innerHTML = msg;
					link_box.style.display= 'flex';
					['#cp_link', '#cp_code'].forEach((val, ind)=>{
						let box = document.querySelector(val)
						let message = ind ==0 ? link : resp.join_code
						box.addEventListener('click', (e)=>{
							e.preventDefault()
							navigator.clipboard.writeText(message)
								.catch(e => show_error(e.toString()))
							show_error(['Copied !'])
						}
						)
					})
					const body = {
						command:'state', 
						game_id: document.querySelector('#game_id').value,
						values:[]
					}

					View.worker.postMessage({command:'cjoin', body:get_options(body)})
				}
				View.start = resp
				resp.moves ? View.init_prev_moves_event(resp.moves) : null
				View.start_handler(resp)
				View.cursor_wait(false)
			}).catch(e=>show_error(e.toString()))
	}

	static start_handler(resp){
		if (resp.finished && resp.join_state == 'joined'){
			View.init_rematch()
			View.insert_reqs()

		}
		if(resp.join_state == 'joined' && !resp.finished){
			View.insert_reqs()
			setTimeout(View.turn_toggle, 200)
		} else {
			View.njoin = false;
			if(resp.finished == false){
				View.update_pieces(resp.board)
				View.all_expected = resp.board.all_expected
				View.update_expected_events(resp.board.expected_pieces)
			} else {
				View.update_score(resp.board.player1_score, resp.board.player2_score)
				resp.join_state =='joined' ? show_error( [resp.winner ?`<a href=${resp.winner_url}>${resp.winner}</a> Wins`: '!! Draw !!'], true): show_error([`${resp.winner? resp.winner: 'Nobody'} won.`])
				View.update_pieces(resp.board)
			}
		}
	}

	static async turn_toggle(engine){
		const body = {
			command: 'turn', 
			game_id: document.querySelector('#game_id').value,
			values: []
		}
		View.worker.postMessage({'command': 'ctoggle', body:get_options(body)})
		View.remove_box_events()
		engine? View.update_alert_box("Erik: Thinking!!", 78) : View.update_alert_box("Waiting.", 1)
	}

	static async init_rematch(){
		let crt_req = document.querySelector('#create_req') 
		crt_req.style.display = 'block'
		View.create_req_handler = async (e)=>{
			e.preventDefault()
			const body = {
				command: 'create_req',
				game_id: document.querySelector('#game_id').value,
				values:[]
			}
			View.cursor_wait(true)
			fetch(api_add, get_options(body))
				.then(resp=>resp.json())
				.then((resp)=>{
					if (resp.msg){
						const body = {
							command: 'request',
							game_id: document.querySelector('#game_id').value,
							values:{action:'check', req_id: resp.req_id }
						}
						View.worker.postMessage({command:"crematch", body:get_options(body)})
					}
					View.cursor_wait(false)
					return show_error(resp.errors ? resp.errors : resp.msg)
				}).catch(e=>show_error(e.toString()))
		}
		const body = {
			command: 'list_reqs',
			game_id: document.querySelector('#game_id').value,
			values: []
		}
		crt_req.addEventListener('click', View.create_req_handler)
		View.worker.postMessage({command:'creq_listen', body: get_options(body)})
	}
	
	static cursor_wait(check){
		let val = check ? 'wait': 'auto'
		document.querySelector('body').style.cursor = val
		document.querySelectorAll('.cbox').forEach((box)=>{
			box.style.cursor = val == 'wait'? val : 'pointer' 
		})
	}

	static async insert_reqs(){
		let req_btn = document.querySelector("#req_btn")
		req_btn.style.display = 'block'
		View.req_btn_handler = (e) => {
			e.preventDefault()
			let req_box = document.querySelector('#req_box')

			if(req_box.style.display == 'flex'){
				e.target.innerText = 'Requests';
				req_box.style.display = 'none'
				return
			} 
			req_box.innerHTML= '<strong style="font-size:15px;">INFO:</strong> Fetching Requests ...'
			req_box.style.display = 'flex'
			const body = {
				command: 'list_reqs',
				game_id: document.querySelector('#game_id').value,
				values:[]
			}
			View.cursor_wait(true)
			fetch(api_add, get_options(body))
				.then(resp=>resp.json())
				.then((resp)=>{
					if (resp.state== 'error'){return show_error(resp.errors)}
					const req_elements = (obj, check)=>{
						const format_date = (date)=>{
							let v = new Date(date)
							return v.toLocaleString()
						}
						switch(check){
							case 'sent':
								return `<div><p>${format_date(obj.date_created)}</p><b>To:</b><a href='${obj.to_url}'>${obj.to}</a><a onclick="View.del_req('${obj.req_id}')">Delete</a></div>`
							case 'received':
								return `<div style='margin:5px 0px;'><p><b>${format_date(obj.date_created)}</b></p><b>From:</b><a href='${obj.from_url}'>${obj.from}</a><a onclick="View.accept_req('${obj.req_id}')">Accept</a><a onclick="View.deny_req('${obj.req_id}')">Deny</a></div>`
						}
					}

					let content = '';
					content += `<p style='margin-left:auto; margin-top:15px; margin-bottom:10px;'><a "style:font-size:18px;" onclick='View.close_req()'>⛒ Close</a></p>`
					content += "<br/><br/>"
					let close = content
					View.req_count = 0
					if( resp.msg.sent.length > 0 ){
						View.req_count +=1 
						resp.msg.sent.forEach((req)=>{
							content += req_elements(req, 'sent')
							content += '<br/>'
						})
					}

					content += '<br/>'
					content += '<br/>'
					if (resp.msg.received.length > 0){
						resp.msg.received.forEach((req)=>{
							View.req_count += 1
							content += req_elements(req, 'received')
							content += '<br/>'
						})
					}

					let req_box = document.querySelector('#req_box')
					req_box.innerHTML = View.req_count > 0 ?content: close + "No requests yet.";
					req_box.style.display='flex'
					View.cursor_wait(false)
				}).catch(e=>show_error(e.toString()))
		}
		req_btn.addEventListener("click", View.req_btn_handler)
	}

	static async close_req(){
		document.querySelector("#req_box").style.display ="none"
	}

	static  async accept_req( req_id ){
		const body = {
			command: 'request',
			game_id: document.querySelector('#game_id').value,
			values:{ action: 'accept', req_id:req_id}
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body))
			.then(resp=>resp.json())
			.then((resp) =>{
				if(resp.state == 'error'){return show_error(resp.errors)}
				let url = window.origin + resp.url
				window.location = url
				View.cursor_wait(false)
		}).catch(e=>show_error(e.toString()))
	}

	static async deny_req(req_id){
		const body = {
			command: 'request',
			game_id: document.querySelector('#game_id').value,
			values:{ action: 'deny', req_id:req_id}
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body))
			.then(resp=>resp.json())
			.then((resp)=>{
				if(resp.state =='error'){ return show_error(resp.errors)}
				View.close_req()
				View.cursor_wait(false)
				return show_error(resp.msg)
			}).catch(e=>show_error(e.toString()))
	}

	static async del_req( req_id ){
		const body = {
			command: 'request',
			game_id: document.querySelector('#game_id').value,
			values:{ action: 'delete', req_id:req_id}
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body)).then(res=>res.json())
			.then((resp)=>{
				if(resp.state =='error'){ return show_error(resp.errors)}
				View.close_req();
				View.cursor_wait(false)
				return show_error(resp.msg)
			}).catch(e=>show_error(e.toString()))
	}

	static async remove_box_events(){
		let boxes = document.querySelectorAll('.cbox')
		boxes.forEach((box)=>{
			box.removeEventListener('click', View.box_click)
			box.removeEventListener('click', View.move_event)
			box.style.backgroundColor = "rgb(46, 52, 64)"
		})
	}

	static async turn_handler(data){
		View.resp = data
		View.all_expected = data.board.all_expected
		if(data.finished){
			const play_sound= (a)=>{
				a='#'+ a
				try{
					document.querySelector(a).play().catch((e)=>console.log(e))
				}catch(e){ console.log("Warning: "+ e) }
			}
			if (data.join_state == 'joined'){
				View.init_rematch()
			}
			View.update_score(data.board.player1_score, data.board.player2_score)
			data.board.winner > 0 ? View.update_alert_box('Oops You Lost. ', 79) : null;
			data.board.winner > 0 ? play_sound('loss'): null;
			data.board.winner == 3 ? View.update_alert_box('!! DRAW !!', 2): null
			data.board.winner == 3 ?  play_sound('draw'): null
			data.board.winner  == 1 && data.join_state == 'engine' ? View.update_alert_box('You won !!',9) : null
			data.board.winner  == 1 && data.join_state == 'engine'? play_sound('win'): null
			View.update_pieces(data.board)
			
		} else if (data.turn){
			View.update_pieces(data.board)
			View.update_expected_events(data.board.expected_pieces)
			View.update_alert_box("Your Move.", 2)
		}
	}

	static update_pieces(board){
		if( board == undefined ){ return }
		let bcnt, wcnt 
		bcnt = wcnt = 0;
		document.querySelectorAll('.cbox').forEach((val)=>{ val.innerText = '' })
		board.white_pieces.concat(board.black_pieces).forEach((obj)=>{
			if(obj.row == 99){ return }
			obj.clr == 2? bcnt +=1 : wcnt +=1
			let res = obj.clr ==2 ?'🔵':"⚪"
			if (obj.is_king){
				res = obj.clr == 2 ? "🔵<sub style='font-size: 20px;'>🔵</sub>": "⚪<sub style='font-size: 20px;'>⚪</sub>"
			}
			document.querySelector(`#cbox${obj.row}${obj.col}`).innerHTML = res
		})
		const play_sound = (a)=>{
			document.querySelector('#snd'+ a).play().catch((e)=>console.log(e))
		}
		play_sound(board.present_turn)
		View.update_score(wcnt, bcnt)
	}

	static  async update_expected_events(pieces){
		View.last_expected = pieces
		pieces.forEach((val)=>{
			document.querySelector(`#cbox${val[0]}${val[1]}`).addEventListener('click', View.box_click)
		})
	}

	static box_click(e){
		e.preventDefault()
		if(document.querySelector('#link_box').style.display == 'flex'){return}
		View.active_element =e.target.id.slice(4).split("").map(Number)
		const body = { 
			command: 'next',
			game_id: document.querySelector('#game_id').value,
			values: View.active_element 
		} 
		View.cursor_wait(true)
		const points_handler = ( points )=>{
			let cont = []
			points.forEach((p)=>{
				let box = document.querySelector(`#cbox${p[0]}${p[1]}`)
				box.style.backgroundColor = "#8fbcbb";
				box.addEventListener('click', View.move_event)
				cont.push(box)
			})
			View.cont = cont
			const timber = ()=>{
				document.onclick = (e)=>{
					if(!View.cont.includes(e.target)){
						points.forEach((val)=>{
							let box= document.querySelector(`#cbox${val[0]}${val[1]}`)
							box.style.backgroundColor = "#2e3440";
							box.removeEventListener('click', View.move_event)
						})
						e.target.click()
						document.onclick = ''
					}
				}
			}
			setTimeout(timber, 200)
		}

		let points = View.all_expected[View.active_element]
		if (points !== undefined ){
			points_handler(points)
			View.cursor_wait(false)
			return
		}

		fetch(api_add, get_options(body)).then(rep=>rep.json()).then(resp =>{
			const play_sound= (a)=>{
				a='#'+ a
				document.querySelector(a).play()
				View.cursor_wait(false)
			}
			if(resp.state == 'error'){return show_error(resp.errors)}
			if(resp.finished){
				View.remove_box_events()
				resp.join_state == 'joined' ? View.init_rematch(): null
				if (resp.board.winner == 3){
					View.update_score(0,0)
					View.update_alert_box('!! DRAW !!', 2)
					play_sound('draw')
					return
				} else {
					View.update_score(resp.board.player1_score, resp.board.player2_score)
					View.update_alert_box(`${resp.winner} wins!!`, 43)
					play_sound('win')
					View.update_pieces(resp.board)
				}
			} else {
				if (resp.valid){
					points_handler(resp.points)
				} 
			}
			View.cursor_wait(false)
		}).catch( e => show_error(e.toString()) )
	}

	static init_prev_moves_event(moves){
		if(View.moves == undefined){
			let box = document.querySelector("#back")
			box.addEventListener('click', View.back_event_handler)
			let box2 = document.querySelector("#forward")
			box2.addEventListener('click', View.front_event_handler)
		}
		moves ? View.moves = moves : null 
	}
	static  back_event_handler(e){
		if (View.moves == undefined){ return }
		e.preventDefault()
		if (View.current_move == undefined){View.current_move = 0}
		View.current_move += 1
		if( View.current_move >= View.moves.length ){
			View.current_move = View.moves.length
			show_error('ALERT: At First Move.')
			return
		}
		View.update_pieces(
			View.moves[ View.moves.length - View.current_move]
		)
		View.update_alert_box(' REPLAY MODE ',22)
		
	}
	static front_event_handler(e){
		if (View.moves == undefined){ return }
		e.preventDefault()
		if(View.current_move == undefined){
			return show_error('ALERT: At Last Move.')
		}
		View.current_move -= 1
		if (View.current_move <= 0){
			View.resp ? View.move_handler(View.resp): View.start_handler(View.start)
			View.update_alert_box(" GAME MODE ",2 )
			return
		}
		View.update_pieces(
			View.moves[View.moves.length - View.current_move]
		)
		View.update_alert_box(' REPLAY MODE ',22)
	}

	static move_event(e){
		e.preventDefault()
		View.remove_box_events();
		View.cont.forEach((val)=>{
			val.style.backgroundColor = "#2e3440";
		})
		const body = {
			command: 'move',
			game_id: document.querySelector("#game_id").value,
			values: [View.active_element, e.target.id.slice(4).split("").map(Number) ]
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body))
			.then(resp=>resp.json())
			.then(resp =>{
				View.resp = resp;
				View.all_expected = resp.board.all_expected
				View.move_handler(resp) 
				View.cursor_wait(false)
			}).catch( e => {
				View.update_expected_events(View.last_expected)
				show_error(e.toString())
				
			})
	}

	static move_handler(resp){
		const play_sound= (a)=>{
			a='#'+ a
			document.querySelector(a).play()
		}
		if(resp.state == 'error'){
			View.update_expected_events(View.last_expected)
			return show_error(resp.errors)
		}
		View.init_prev_moves_event(resp.moves)
		View.update_pieces(resp.board)

		if(resp.winner){
			View.update_alert_box(`${resp.winner} wins!!`, 43)
			resp.winner == 'Erik' ? play_sound('loss') : play_sound('win')
			resp.join_state == 'joined' ? View.init_rematch(): null
			Game.get_alert_box().scrollIntoView()
			View.update_score(resp.board.player1_score, resp.board.player2_score)
			return
		}
		if (resp.next_kill){
			View.active_element = resp.expected_piece
			let cont = []
			resp.kill_points.forEach((p)=>{
				let box = document.querySelector(`#cbox${p[0]}${p[1]}`)
				box.style.backgroundColor = '#8fbcbb';
				box.addEventListener('click', View.move_event)
				cont.push(box)
			})
			View.cont = cont
			return
		}
		if (resp.join_state == 'joined'){
			View.turn_toggle()
		} else if (resp.join_state == 'engine'){
			View.turn_toggle(true)
		} else {
			View.update_expected_events(resp.board.expected_pieces)
			let player = resp.board.present_turn 
			View.update_alert_box(`Player${player}'s turn !!`, player == 1 ? 9: 3 )
		}
	}
}
new View()
