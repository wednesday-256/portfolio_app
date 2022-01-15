const show_error=(msgs, show)=>{
  let error_box = document.querySelector('#error_box')
  let res = ''
	let rm_event = "onclick='this.style.display=`none`'"
  if(msgs instanceof Array){
    msgs.map((val)=>{ res += "<li " + rm_event + " >&#128712  "+ val+ "</li>"  })
  }else { res =`<li ${rm_event} >&#128712  ${msgs}</li>` }
  error_box.innerHTML = res
  !show? setTimeout(()=>{ error_box.innerHTML= '' }, 10000): null
	document.querySelector('body div a').scrollIntoView()
	let box = document.querySelector('#alert-sound')
	box.currentTime = 0;
	box.play().catch((e)=>console.log(e))
	View.cursor_wait(false)
}

const get_options =(body)=>( {
	method: 'POST',
	headers:{'Content-Type': 'application/json','Accept': 'application/json'},
	body: JSON.stringify(body)
})
//api address
const api_add = "/tictactoe/api"

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

//tictactoe game class
class View extends Game{

	constructor(){
		super()
		View.num = 2;
		View.worker = new Worker('/javascripts/workers/worker.js')
		View.worker.onmessage= View.message_handler
		View.board_state='down';
		document.querySelector('#flipBtn').addEventListener('click', View.rotate_board)

		document.querySelector('#restart').addEventListener('click', (e)=>{document.restart.submit()})

		const toggle_help = ()=>{
			let info_box = document.getElementById('info')
			info_box.style.display == 'none'? info_box.style.display = 'block': info_box.style.display = 'none'
		}
		//adds event to the howtoplay button
		document.querySelector('#howtoplay').addEventListener('click', toggle_help)

		//updates alert box
		Game.update_alert_box('TicTacToe.', 9);
		View.update_score(0, 0)
		let res = '<p>First player plays as X and Second player as O, the score board shows the scores after each game.</p>'
		res += '<p>A score of 1 is given to the winner after each game.</p>'
		Game.update_help(res)
		res = ""
		for (let i =0; i< 9; i++){
			res += "<div class='tbox' id='tbox"+ i +"'></div>"
		}
		let brd = Game.get_board()
		brd.classList.add('ttt-board')
		brd.innerHTML = res
		View.init_game()
	}
	static cursor_wait(check){
		let val = check ? 'wait': 'auto'
		document.querySelector('body').style.cursor = val
		document.querySelectorAll('.tbox').forEach((box)=>{
			box.style.cursor= val == 'wait' ? val : 'pointer'
		})
	}

	static async message_handler(e){
		if(e.data.state == 'error'){
			show_error(e.data.msg)
			return
		}
		switch(e.data.command){
			case 'join':
				e.data.state ? window.location.reload() : null
				break;
			case 'toggle':
				View.turn_handler(e.data.resp)
			case 'rematch':
				e.data.url ? window.location = window.origin + e.data.url: null
		}
	}

	static async turn_handler(data){
		if(data.finished){
			const play_sound= (a)=>{
				a = "#"+ a
				document.querySelector(a).play().catch((e)=>console.log(e))
			}
			data.win_pos.length > 0 ? View.update_alert_box("Oops You lost. ", 79) : null;
			data.win_pos.length > 0 ? play_sound('loss') : null;
			data.win_pos == 0? View.update_alert_box('!! DRAW !!', 2):null
			data.win_pos == 0? play_sound('draw'): null
			let boxes = document.querySelectorAll('.tbox')
			data.board.forEach((val, ind)=>{
				val == 1 ? boxes[ind].innerText = 'X': null
				val==2? boxes[ind].innerText = 'O': null
			})
			data.win_pos.forEach((val)=>{
				document.querySelector('#tbox'+val).style.backgroundColor ='#a3be8c';
			})
			data.join_state == 'joined'? View.init_rematch() : null
		} else if (data.turn){
			let box = []
			let boxes = document.querySelectorAll('.tbox')
			data.board.forEach((val, ind)=>{
				val == 'e'? box.push(ind) : null
				val == 1 ? boxes[ind].innerText = 'X': null
				val==2? boxes[ind].innerText = 'O': null
			})

			let sound = document.querySelector('#snd'+ View.num)
			sound.pause()
			sound.currentTime=0; sound.play().catch((e)=>console.log(e))
			View.num= View.num == 1?  2 : 1
			View.add_box_events(box)
			View.update_alert_box( "Your Move. ", 2);
		}
	}

	static async init_game(){
		const body = {
			command: 'start',
			game_id: document.querySelector('#game_id').value,
			values:[]
		}

		View.cursor_wait(true)
		fetch(api_add, get_options(body))
			.then( resp=>resp.json())
			.then((resp)=>{
				if (resp.state == 'error'){return show_error(resp.errors)}
				let boxes = []
				if (resp.join_link){
					let link = window.location.origin+resp.join_link
					let msg ='<h2>Waiting for a Player to Join.</h2>' 
					msg += '<div><strong>Join Link: </strong> ' +link+" <a id='cp_link'>Copy Link</a>" +'</div>'
					msg += '<div><strong>Join Code:</strong> ' + resp.join_code + " <a id='cp_code'>Copy Code</a>"+'</div>'
					msg+="<p>Send the Link or Code to a Friend .</p>"
					let link_box =document.querySelector("#link_box")
					link_box.innerHTML = msg;
					link_box.style.display= 'flex';
					['#cp_link', '#cp_code'].forEach((val, ind)=>{
						let box = document.querySelector(val)
						let message = ind ==0 ? link : resp.join_code
						box.addEventListener('click', (ind)=>{
							navigator.clipboard.writeText(message).catch(e => show_error(e.toString()))
							show_error(['Copied !'])
						}
						)
					})
					const body = {
						command:'state', 
						game_id: document.querySelector('#game_id').value,
						values:[]
					}

					View.worker.postMessage({command:'tjoin', body:get_options(body)})
				}
				if (resp.finished && resp.join_state == 'joined'){
					View.init_rematch()
					View.insert_reqs()
				}
				if (resp.join_state == 'joined' && !resp.finished){
					View.insert_reqs()
					setTimeout(View.turn_toggle, 200)
				} else {
					if (resp.finished == false){
						let boxes = []
						resp.board.forEach((val, ind)=>{
							val =='e'? boxes.push(ind): null
							if (val ==1 || val ==2){
								document.querySelector(`#tbox${ind}`).innerText = val ==1? "X": "O"
							}
						})
						View.add_box_events(boxes)
					} else {
						resp.win_player ==1 ? View.update_score(1, 0):View.update_score(0, 1) 
						resp.join_state =='joined' ? show_error( [resp.winner ?`<a href=${resp.winner_url}>${resp.winner}</a> Wins`: '!! Draw !!'], true): show_error([`${resp.winner? resp.winner: 'Nobody'} won.`])
						resp.board.forEach((val, ind)=>{
							if (val ==1 || val ==2){
								document.querySelector(`#tbox${ind}`).innerText = val ==1? "X": "O"
							}
						})
						resp.win_pos.forEach((val)=>{
							document.querySelector('#tbox'+val).style.backgroundColor ='#a3be8c';
						})
					}
				}
				View.cursor_wait(false)
			}).catch(e=>show_error(e.toString()))
	}
	static async turn_toggle(engine){
		const body = {
			command: 'turn',
			game_id: document.querySelector('#game_id').value,
			values:[]
		}
		View.worker.postMessage({'command': 'ttoggle', body:get_options(body)})
		View.remove_box_events()
		engine ? View.update_alert_box("Erik: Thinking!",78 ) : View.update_alert_box(" Waiting.", 1)
	}

	static async add_box_events(boxes){
		boxes.forEach((val)=>{
			document.querySelectorAll('.tbox')[val].addEventListener('click', View.box_event)
		})
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
						View.worker.postMessage({command:"trematch", body:get_options(body)})
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
		View.worker.postMessage({command:'treq_listen', body: get_options(body)})
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
					content += `<p style='margin-left:auto; margin-top:15px; margin-bottom:10px;'><a style="font-size:18px;" onclick='View.close_req()'>⛒ Close</a></p>`
					content += "<br/><br/>"
					let close = content
					View.req_count = 0
					if( resp.msg.sent.length > 0 ){
						View.req_count += 1
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
				View.cursor_wait(false)
				window.location = url
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

	static update_score(p1, p2){
		let res = "<p><strong>Player 1: </strong>"+ p1 + "</p> ";
		res += "<p><strong>Player 2: </strong>"+ p2+"</p>";
		Game.get_score_box().innerHTML = res;	
	}

	static async remove_box_events(){
		for (let i =0; i< 9; i++){
			document.querySelectorAll('.tbox')[i].removeEventListener('click', View.box_event)
		}
	}

	static async box_event(e){
		let link_box = document.querySelector('#link_box')
		if(link_box.style.display == 'flex'){
			return
		}
		const body = {
			command: 'choice',
			game_id: document.querySelector('#game_id').value,
			values: [e.target.id[4]]
		}
		View.cursor_wait(true)
		fetch(api_add, get_options(body)).then(resp=>resp.json()).then((resp)=>{
			if(resp.state== 'error'){ return show_error(resp.errors) }
			resp.board.forEach((val, ind)=>{
				document.querySelectorAll('.tbox')[ind].innerText = val ==1? 'X': val == 2? "O": ""
			})
			document.querySelector('#snd2').play().catch((e)=>console.log(e))
			if(resp.finished){
				const play_sound= (a)=>{
					View.cursor_wait(false)
					a= "#"+a
					document.querySelector(a).play().catch((e)=>console.log(e))
				}
				resp.join_state == 'joined' ? View.init_rematch(): null
				View.remove_box_events()
				if(resp.win_pos.length == 0){
					View.update_score(0,0)
					View.update_alert_box('!! DRAW !!', 2)
					play_sound('draw')
					return 
				}else {
					resp.win_pos.forEach((val)=>{
						document.querySelector('#tbox'+val).style.backgroundColor ='#a3be8c';
					})
					resp.win_player ==1 ? View.update_score(1, 0):View.update_score(0, 1) 
					View.update_alert_box(`${resp.winner} wins!!`, 43)
					play_sound('win')
				}
			} else {
				if (resp.join_state == 'joined'){
					View.turn_toggle()

				} else if ( resp.join_state == 'engine' ){
					View.turn_toggle(true)
				}
				else {
					let player = resp.turn ==1 ? 2: 1
					View.update_alert_box(`Player${player}'s ${player==1? "[X]": "[O]"} turn !!`,3 )
				}
			}
			View.cursor_wait(false)
		}).catch(e=>show_error(e.toString()))
	}

	static rotate_board(){
		if ( View.board_state == 'up' ){
			View.board_state = 'down';
			document.querySelector('#game-board').style.transform = 'rotate(360deg)'
		}	else {
			View.board_state = 'up';
			document.querySelector('#game-board').style.transform = 'rotate(180deg)'
		}
	}
}
new View()
