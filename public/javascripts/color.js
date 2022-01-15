//crate worker
const myWorker = new Worker('/javascripts/workers/worker.js')
const api_add = '/color/api'

//worker ahndler function
myWorker.onmessage = (e)=>{
  if (e.data.state =='error'){
    show_error(e.data.msg)
    return
  }
  switch(e.data['command']){
    case 'join':
      e.data.state ? window.location.reload() : null
      break;
    case 'toggle':
      turn_handler(e.data.resp)
  }
}

const play_sound= (a)=>{
  a='#'+ a
  let sound = document.querySelector(a)
  sound.currentTime= 0;
  sound.play()
}

const turn_handler = (data)=>{
  if(data.attempted){
    data.attempted.forEach((val)=>{
      let box = document.querySelectorAll("#box")[val]
      box.style.backgroundColor = 'rgb(195, 208, 221)';
      box.removeEventListener('click', box_click)
    })
  }
  if (data.finished){
    let alertBox = document.querySelector("#alert-box h3")
    alertBox.innerText = " 🔴 🔴 You lost. 🔴 🔴";
    alertBox.scrollIntoView()
    play_sound('loss')
    init_rematch()
    insert_reqs()
  } else if (data.turn) {
    data.boxes.forEach((val)=>{
      document.querySelectorAll('#box')[val].addEventListener('click', box_click)
    })
    document.querySelector("#alert-box h3").innerText = " 🔵 🔵 It's your move. 🔵 🔵";
  }
}



const toggle_help = ()=>{
  let info_box = document.getElementById('info')
  info_box.style.display == 'none'? info_box.style.display = 'block': info_box.style.display = 'none'
}
//adds event to the howtoplay button
document.querySelector('#howtoplay').addEventListener('click', toggle_help)

//function to return box element
const get_box = (clr, index ) =>{
  let ele = '<div id="box" style="margin:15px; background-color:'+ clr +';" value='+ index +'></div>'
  return ele
} 

//function to get 9 random colors and set chosen color
const get_color = () => {
  const body = {
    command:'start', 
    game_id: document.querySelector('#game_id').value,
    values:[]
  }
  const requestOptions = {
    method: 'POST',
    headers:{'Content-Type': 'application/json','Accept': 'application/json'},
    body: JSON.stringify(body)
  }
  cursor_wait(true)
  fetch(api_add, requestOptions).then(resp=>resp.json()).then((resp)=>{
    if(resp.state =='error'){ show_error(resp.errors) }else {
      let boxes = ''
      let index = resp.index ? resp.index : false
      resp.colors.map((clr,index)=>{
        if(resp.index  == index ){
          boxes +='<div id="box" style="margin:15px; color:black;padding:auto; font-size:60px; border:2px inset #5e81ac; background-color:rgb(195, 208, 221);" >X</div>' 
        } else {
          boxes += get_box("rgb("+ clr[0] +","+ clr[1] +","+ clr[2] + ")", index)
        }
      })
      if(resp.join_link){
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

        myWorker.postMessage({command:'join', body:get_options(body)})
      }
      if (resp.join_state == 'joined' && !resp.winner){
        setTimeout(turn_toggle, 200)
      }
      let brd = document.querySelector('#game-board')
      brd.innerHTML = boxes
      brd.classList.add('color-board')
      if(resp.finished == false){
        add_box_events()
        localStorage.setItem('sco', 0)
      } else {
        resp.join_state == 'joined'? insert_reqs(): null
        resp.join_state == 'joined'? init_rematch(): null
        localStorage.setItem('sco', resp.score)
        let scores = "<p><strong>Score: </strong>"+ localStorage.sco +"</p>"  
        document.querySelector('#score-box').innerHTML = scores;
        resp.join_state =='joined' ? show_error(['X marks Chosen Block', `<a href=${resp.winner_url}>${resp.winner}</a> Wins`], true): show_error(['X marks Chosen Block'])
      }
    }
    cursor_wait(false)
  }).catch(e=> show_error([e.toString()]))
} 

const show_error=(msgs, show)=>{
  let error_box = document.querySelector('#error_box')
  let res = ''
  if(msgs instanceof Array){
    msgs.map((val)=>{ res += "<li onclick='this.style.display=`none`'>&#128712  "+ val+ "</li>"  })
  }else { res =`<li onclick='this.style.display="none"'>&#128712  ${msgs}</li>` }
  error_box.innerHTML = res
  !show? setTimeout(()=>{ error_box.innerHTML= '' }, 10000): null
  cursor_wait(false)
  play_sound('alert-sound')
}
const get_options =(body)=>( {
  method: 'POST',
  headers:{'Content-Type': 'application/json','Accept': 'application/json'},
  body: JSON.stringify(body)
})
//document.querySelector("#box").onclick = (e)=>console.log(e.target.attributes['value'].value)

const turn_toggle= ()=>{
  const body = {
    command:'turn', 
    game_id: document.querySelector('#game_id').value,
    values:[]
  }
  myWorker.postMessage({'command':'toggle', body:get_options(body) })
  for (let i=0; i<=9; i++){
    document.querySelectorAll('#box')[i].removeEventListener('click', box_click)
  }
   document.querySelector("#alert-box h3").innerText = " 🔴 🔴 Waiting. 🔴 🔴"
}
    

// function to initialize color game 
const init_game= ()=>{

  get_color()
  scores = "<p><strong>Score: </strong>"+ localStorage.sco +"</p>"  
  document.querySelector('#score-box').innerHTML = scores;
  let rbtn = document.querySelector('#restart')
  rbtn.addEventListener('click', ()=>{ 
    document.restart.submit()
  })
  let message = "<p>They are 10 options given, all you have to do is guess the right color, with the <strong> least number of attempts</strong>, to win.</p><p><strong>With every wrong guess, the maximum score that can be attained reduces by 1</strong>. You can make guesses by clicking on the desired box.</p>"
  document.querySelector('#info').innerHTML=message
  let alert = "<h3 style='text-align:center'>🔵 🔵 The Color Game. 🔵 🔵</h3>"
  document.querySelector('#alert-box').innerHTML = alert

}

const cursor_wait = (check)=>{
  let val = check ? 'wait': 'auto'
  document.querySelector('body').style.cursor = val
}

//function to start a new round
const new_game= ()=> {
  const body = {
    command:'restart', 
    game_id: document.querySelector('#game_id').value,
    values:[]
  }
  const requestOptions = {
    method: 'POST',
    headers:{'Content-Type': 'application/json','Accept': 'application/json'},
    body: JSON.stringify(body)
  }
  cursor_wait(true)
  fetch(api_add, requestOptions).then(e=>{
    if (e.status!==200){ show_error([e.statusText]) }
    else{ return e.json() }
  }).then(res=>{
    if(res.state=='error'){ return show_error(res.errors) }
    document.querySelector("#game_id").value = res.game_id
    get_color()
    cursor_wait(false)
  }).catch(e=>show_error(e.toString()))
  document.querySelector("#alert-box h3").innerText = " 🔵 🔵 Here we go again, Good luck !! 🔵 🔵";
}

//function to update elements
const update_elements = ()=> {
  let alertBox = document.querySelector("#alert-box h3")
  alertBox.scrollIntoView()
  play_sound('win')
  scores = "<p><strong>Score: </strong>"+ localStorage.sco +"</p>" 
  document.querySelector('#score-box').innerHTML = scores;
  if (Number(localStorage.sco) > 9){
    alertBox.innerText = "🔷 🔷 Okay!! Fess up, How did you do it? 🔷 🔷";
  } 
  else if (Number(localStorage.sco) > 7){
    alertBox.innerText = " 🟣 🟣 WoW!! You're Amazing 🟣 🟣 ";
  } 
  else if (Number(localStorage.sco) > 4){
    alertBox.innerText = " 🟢 🟢 Keep it up!! 🟢 🟢 ";
  } 
  else {
    alertBox.innerText = " 🔴 🔴 Keep Trying 🔴 🔴";
  }
}

//function to handle box click 
const box_click = (e)=> {
  let link_box = document.querySelector('#link_box')
  if(link_box.style.display == 'flex'){
    return
  }
  const show_error=(msgs)=>{
    let error_box = document.querySelector('#error_box')
    let res = ''
    msgs.map((val)=>{ res += "<li>"+ val+ "</li>"  })
    error_box.innerHTML = res
    setTimeout(()=>{ error_box.innerHTML= '' }, 10000)
  }
  const body = {
    command:'choice', 
    game_id: document.querySelector('#game_id').value,
    values:[e.target.attributes['value'].value]
  }
  const requestOptions = {
    method: 'POST',
    headers:{'Content-Type': 'application/json','Accept': 'application/json'},
    body: JSON.stringify(body)
  }
  cursor_wait(true)
  fetch(api_add, requestOptions).then(resp=>resp.json()).then((res)=>{
    if(res.state== 'error'){ return show_error(res.errors) }
    res.attempted.forEach((val)=>{
      let box = document.querySelectorAll("#box")[val]
      box.style.backgroundColor = 'rgb(195, 208, 221)';
      box.removeEventListener('click', box_click)
    })
    if(res.response ==true){
      localStorage.sco= res.score
      Number(localStorage.hsc) < Number(localStorage.sco) ? localStorage.hsc = localStorage.sco : null;
      update_elements();
      res.join_state == 'joined'? init_rematch(): null
      res.join_state == 'joined'? insert_reqs(): null
      document.querySelectorAll('#box').forEach((box)=>{
        box.removeEventListener("click", box_click)
      })
    }
    else {
      document.querySelector("#alert-box h3").innerText = " 🔴 🔴 Wrong Color!! 🔴 🔴";
      play_sound('wrong')
      if (res.join_state == 'joined'){
        turn_toggle()
      }
      e.target.style.backgroundColor = 'rgb(195, 208, 221)';
    }
    cursor_wait(false)
  }).catch(e=>show_error(e.toString()))}

//function to add box events to all boxes
const add_box_events = ()=>{
  let boxes = document.querySelectorAll('#box')
  for (let i =0; i< boxes.length; i++){
    boxes[i].addEventListener('click', box_click)
  }
}

const create_req_handler = async (e)=>{
  e.preventDefault()
  const body = {
    command: 'create_req',
    game_id: document.querySelector('#game_id').value,
    values:[]
  }
  cursor_wait(true)
  fetch(api_add, get_options(body))
    .then(resp=>resp.json())
    .then((resp)=>{
      if (resp.msg){
        const body = {
          command: 'request',
          game_id: document.querySelector('#game_id').value,
          values:{action:'check', req_id: resp.req_id }
        }
        myWorker.postMessage(
        {command:"clrematch", body:get_options(body)})
      }
      cursor_wait(false)
      return show_error(resp.errors ? resp.errors : resp.msg)
    }).catch(e=>show_error(e.toString()))
}

const init_rematch = async ()=>{
  let crt_req = document.querySelector('#create_req') 
  crt_req.style.display = 'block'
  crt_req.addEventListener('click', create_req_handler)
  const body = {
    command: 'list_reqs',
    game_id: document.querySelector('#game_id').value,
    values: []
  }
  myWorker.postMessage(
    {command:'clreq_listen', body: get_options(body)})
} 

const req_btn_handler =  async (e) => {
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
  cursor_wait(true)
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
            return `<div><p>${format_date(obj.date_created)}</p><b>To:</b><a href='${obj.to_url}'>${obj.to}</a><a onclick="del_req('${obj.req_id}')">Delete</a></div>`
          case 'received':
            return `<div style='margin:5px 0px;'><p><b>${format_date(obj.date_created)}</b></p><b>From:</b><a href='${obj.from_url}'>${obj.from}</a><a onclick="accept_req('${obj.req_id}')">Accept</a><a onclick="deny_req('${obj.req_id}')">Deny</a></div>`
        }
      }
      let content = '';
      content += `<p style='margin-left:auto; margin-top:15px; margin-bottom:10px;'><a style="font-size:18px;" onclick='close_req()'>⛒ Close</a></p>`
      content += "<br/><br/>"
      let close = content
      let req_count = 0

      if( resp.msg.sent.length > 0 ){
        req_count += 1
        resp.msg.sent.forEach((req)=>{
          content += req_elements(req, 'sent')
          content += '<br/>'
        })
      }

      content += '<br/>'
      content += '<br/>'
      if (resp.msg.received.length > 0){
        resp.msg.received.forEach((req)=>{
          req_count += 1
          content += req_elements(req, 'received')
          content += '<br/>'
        })
      }

      let req_box = document.querySelector('#req_box')
      req_box.innerHTML = req_count > 0 ?content: close + "No requests yet.";
      req_box.style.display='flex'
      cursor_wait(false)
    }).catch(e=>show_error(e.toString()))
}
const close_req = async ()=>{
  document.querySelector("#req_box").style.display ="none"
}

const accept_req = async (req_id)=>{
  const body = {
    command: 'request',
    game_id: document.querySelector('#game_id').value,
    values:{ action: 'accept', req_id:req_id}
  }
  cursor_wait(true)
  fetch(api_add, get_options(body))
    .then(resp=>resp.json())
    .then((resp) =>{
      if(resp.state == 'error'){return show_error(resp.errors)}
      let url = window.origin + resp.url
      cursor_wait(false)
      window.location = url
    }).catch(e=>show_error(e.toString()))
}

const deny_req = async (req_id) =>{
		const body = {
			command: 'request',
			game_id: document.querySelector('#game_id').value,
			values:{ action: 'deny', req_id:req_id}
		}
		cursor_wait(true)
		fetch(api_add, get_options(body))
			.then(resp=>resp.json())
			.then((resp)=>{
				if(resp.state =='error'){ return show_error(resp.errors)}
				close_req()
				cursor_wait(false)
				return show_error(resp.msg)
			}).catch(e=>show_error(e.toString()))
}

const del_req = async (req_id)=>{
  const body = {
    command: 'request',
    game_id: document.querySelector('#game_id').value,
    values:{ action: 'delete', req_id:req_id}
  }
  cursor_wait(true)
  fetch(api_add, get_options(body)).then(res=>res.json())
    .then((resp)=>{
      if(resp.state =='error'){ return show_error(resp.errors)}
      close_req();
      cursor_wait(false)
      return show_error(resp.msg)
    }).catch(e=>show_error(e.toString()))
}

const insert_reqs = async ()=>{
  let req_btn = document.querySelector("#req_btn")
  req_btn.style.display = 'block'
  req_btn.addEventListener("click", req_btn_handler)
}

init_game() //initializes color game
