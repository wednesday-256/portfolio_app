onmessage = (e)=>{
  switch(e.data['command']){
    case 'join':
      join_handler(e.data.body)
    case 'toggle':
      toggle_handler(e.data.body)
      break;
    case 'ttoggle':
      ttoggle_handler(e.data.body)
      break;
    case 'tjoin':
      ttt_join_handler(e.data.body)
      break;
    case 'cjoin':
      chk_join_handler(e.data.body)
      break;
    case 'ctoggle':
      ctoggle_handler(e.data.body)
      break;
    case 'trematch':
      trematch_handler(e.data.body)
      break;
    case 'treq_listen':
      treq_listen_handler(e.data.body )
      break;
    case 'crematch':
      crematch_handler(e.data.body)
      break;
    case 'creq_listen':
      creq_listen_handler(e.data.body )
      break;
    case 'clrematch':
      clrematch_handler(e.data.body);
      break;
    case 'clreq_listen':
      clreq_listen_handler(e.data.body)
      break;
  }
}

const clreq_listen_handler = async (body)=>{
  fetch('/color/api', body)
    .then(resp => resp.json())
    .then((resp)=>{
      let check= false;
      if (resp.msg.received.length>0){
        let r_dt = new Date(resp.msg.received[0].date_created)
        let n_dt = new Date(Date.now() - 5000)
        check = r_dt > n_dt

      }else { check = false; }
      if (check ){
        return postMessage({state:'error', msg:'ALERT: Received new Request !!'})
      }
      setTimeout(()=>clreq_listen_handler(body), 2000)
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const clrematch_handler = async (body)=>{
  fetch('/color/api', body)
    .then(resp => resp.json())
    .then((resp) =>{
      if(resp.state=='error'){return postMessage({
        state:'error',
        msg:resp.errors[0].includes('Invalid')?  "ALERT: Request Denied/Deleted!!": resp.errors})}
      if(resp.url == null){
        setTimeout(()=>clrematch_handler(body), 2000)
        return 
      }
      postMessage({command:'rematch', url:resp.url})
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const creq_listen_handler = async (body)=>{
  fetch('/checkers/api', body)
    .then(resp => resp.json())
    .then((resp)=>{
      let check= false;
      if (resp.msg.received.length>0){
        let r_dt = new Date(resp.msg.received[0].date_created)
        let n_dt = new Date(Date.now() - 5000)
        check = r_dt > n_dt

      }else { check = false; }
      if (check ){
        return postMessage({state:'error', msg:'ALERT: Received new Request !!'})
      }
      setTimeout(()=>creq_listen_handler(body), 2000)
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const crematch_handler = async (body)=>{
  fetch('/checkers/api', body)
    .then(resp => resp.json())
    .then((resp) =>{
      if(resp.state=='error'){return postMessage({
        state:'error',
        msg:resp.errors[0].includes('Invalid')?  "ALERT: Request Denied/Deleted!!": resp.errors})}
      if(resp.url == null){
        setTimeout(()=>crematch_handler(body), 2000)
        return 
      }
      postMessage({command:'rematch', url:resp.url})
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const treq_listen_handler = async (body)=>{
  fetch('/tictactoe/api', body)
    .then(resp => resp.json())
    .then((resp)=>{
      let check= false;
      if (resp.msg.received.length>0){
        let r_dt = new Date(resp.msg.received[0].date_created)
        let n_dt = new Date(Date.now() - 5000)
        check = r_dt > n_dt

      }else { check = false; }
      if (check ){
       return  postMessage({state:'error', msg:'ALERT: Received new Request !!'})
      }
      setTimeout(()=>treq_listen_handler(body), 2000)
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const trematch_handler = async (body)=>{
  fetch('/tictactoe/api', body)
    .then(resp => resp.json())
    .then((resp) =>{
      if(resp.state=='error'){return postMessage({
        state:'error',
        msg:resp.errors[0].includes('Invalid')?  "ALERT: Request Denied/Deleted!!": resp.errors})}
      if(resp.url == null){
        setTimeout(()=>trematch_handler(body), 2000)
        return 
      }
      postMessage({command:'rematch', url:resp.url})
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}
const toggle_handler= async (body)=>{
  fetch('/color/api', body).then(resp=>resp.json()).then(resp=>{
    if(resp.state =='error'){ postMessage({state: 'error', msg: resp.errors})}
    else if(resp.turn != true && resp.finished != true){
      setTimeout(()=>toggle_handler(body), 1500)
    }
    else{
      postMessage({'command': 'toggle', resp: resp})
    }
  }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const ttoggle_handler = async (body)=>{
  fetch('/tictactoe/api',body).then(resp=>resp.json()).then(resp=>{
    if(resp.state=='error'){
      return postMessage({
        state:'error', msg: resp.errors
      })
    }
    if (resp.turn== true && resp.join_state == 'engine'){
      let cnt = 0;
      resp.board.forEach((val)=>{
        val == 2 ? cnt+=1 : null
      })
      if(cnt < 1){
        return  setTimeout(()=>ttoggle_handler(body), 1000)
      }
    }
    if (resp.turn!=true && resp.finished != true){
     return  setTimeout(()=>ttoggle_handler(body), 1500)
    }
    postMessage({'command': 'toggle', resp:resp})
  }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const ctoggle_handler = async (body)=>{
  fetch('/checkers/api', body).then(resp=>resp.json()).then(resp=>{
    if(resp.state=='error'){
      return postMessage({
        state:'error', msg: resp.errors
      })
    }
    if (resp.turn != true && resp.finished != true){
      return setTimeout(()=>ctoggle_handler(body), 1500)
    }
    postMessage({'command': 'toggle', resp: resp })
  }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const join_handler = async (body)=>{
  fetch('/color/api', body).
    then(resp => resp.json()).
    then((resp)=>{
      if (resp.state =='error'){
        postMessage({state: 'error', msg: resp.errors})
      } else {
        if (resp.join_state == 'joined'){
          postMessage({state: true, command: 'join'})
        } else { setTimeout(()=>join_handler(body), 2000) }
      }
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const ttt_join_handler= async (body)=>{
  fetch('/tictactoe/api', body).
    then(resp => resp.json()).
    then((resp)=>{
      switch(resp.state){
        case 'error':
          postMessage({state: 'error', msg: resp.errors})
          break;
        default:
          switch( resp.join_state ){
            case 'joined':
              postMessage({state: true, command: 'join'})
              break;
            default:
              setTimeout(()=>ttt_join_handler(body), 3000)
          }
      }
    }).catch(e => postMessage({state:'error', msg:e.toString()}))
}

const chk_join_handler = async (body)=>{
  fetch('/checkers/api', body).then(resp =>resp.json()).
    then((resp)=>{
      switch(resp.state){
        case 'error':
          postMessage({state:'error', msg:resp.errors})
          break;
        default:
          switch(resp.join_state){
            case 'joined':
              postMessage({state:true, command:'join'})
              break;
            default:
              setTimeout(()=>chk_join_handler(body), 3000)
          }
      }
    }).catch(e=>postMessage({state:'error', msg:e.toString()}))
}
