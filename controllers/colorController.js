const Game = require('../models/game')
const async = require('async')
const Player = require('../models/player')
const {body, validationResult } = require('express-validator')
const auth = require('../extensions/auth')
const Request = require('../models/request')


exports.color_list = (req, res, next)=>{
  let context = {title: 'Color Game.'}
  if (!req.user){
    res.render('color_list', context)
    return
  }

  Player.findOne({'cookie':req.user}).exec((err, player)=>{
    if(err){return next(err)};
    if(player == null){
      res.clearCookie('AuthToken')
      context['errors'] = [{msg:'Invalid User.'}]
      res.render('color_list', context)
      return
    }
    Game.find({$and:[ 
      {$or:[ {'player1': player._id}, {'player2': player._id} ]},
      {game_type:'color'}
    ]})
      .populate('player1')
      .populate('player2')
      .exec((err, games)=>{
      if(err){ return next(err)};
      if (games == null){
        return res.render('color_list', context)
      }
      context['games'] = games
      console.log(player.user_name)
      context.user = {name:player.user_name, url:player.url}
      return res.render('color_list', context)
    })
  })
}

exports.color_details = (req, res, next)=>{
  res.send('nothing yet: color game details')
}

exports.color_join_get = (req, res, next)=>{
  if (req.user){
    async.parallel(
      {
        game: (callback)=>Game.findById(req.params.id).exec(callback),
        player: (callback)=>Player.findOne({'cookie': req.user}).exec(callback),
      },(err, results)=>{
        if(err){ return next(err) }
        
        if(results.player==null){
          res.clearCookie('AuthToken')
          return res.render('index', {title:'Error', errors:[{msg:'Invalid user'}], }) }
        if(results.game==null){ return res.render('index', {title:'Error', errors:[{msg:'Invalid Game Id'}],})}
        if (results.game.join_state == 'waiting'){
          if (results.game.player1.toString() == results.player._id.toString()){
            res.redirect(results.game.url)
            return 
          }
          const update = { 'player2': results.player._id, 'join_state': 'joined' }
          const handle_update = (err)=>{
            if(err){return next(err)}
            res.redirect(results.game.url)
          }
          results.game.updateOne(update).exec(handle_update)
        } else {
          res.redirect(results.game.url)
        }
      }
    ) 
  } else {
    const cookie = auth.get_auth_cookie()
    const anon_player = new Player({
      user_name: 'anon',
      password: auth.get_auth_cookie(),
      rec_key: auth.get_rec_code(),
      cookie: cookie,
    })
    res.cookie('AuthToken', cookie, {sameSite:'Strict', signed: true, httpOnly: true, maxAge:1296000000})
    Game.findById(req.params.id).exec((err, result)=>{
      if(err){return next(err)}
      if(result.join_state != 'waiting'){
        res.redirect(result.url)
        return
      }
      const handle_player =(err)=>{
        if(err){return next(err)}
        const update = { 'player2': anon_player._id, 'join_state': 'joined', attempted:"[]" }
        const handle_update =(err)=>{
          if(err){ return next(err) }
          res.redirect(result.url)
        }
        result.updateOne(update).exec(handle_update)
      } 
      anon_player.save(handle_player)
    })
  }

}

exports.color_join_post =[
  body('key').trim().isLength({'min': 5}).withMessage('Invalid Join Code.').escape(),
  (req, res, next)=>{
    const errors = validationResult(req)
    if (req.user){
      async.parallel(
        {
          player: (callback)=>Player.findOne({'cookie': req.user}).exec(callback),
          game: (callback)=>Game.findOne({'join_code': req.body.key}).exec(callback)
        }, (err, results)=>{
          if (err){next(err)}
          if (!errors.isEmpty()){
            let context = {title: 'Invalid Code', errors: errors.array(), user: {
              name: results.player.user_name, url: results.player.url
            }}
            res.render('index', context)
            return
          }
          let context = {title:'Welcome'}
          if(results.player == null || results.game == null){
            context['errors'] = []
            if (results.player ==null){
              res.clearCookie('AuthToken')
              context['errors'].push({msg: "Invalid User."}) 
            }else {
              context['user'] = {name: results.player.user_name, url: results.player.url}
            }
            results.game == null ? context['errors'].push({msg:'Invalid Join Code'}): false
            res.render('index', context)  
            return 
          }
          if (results.game.join_state !='waiting'){
            res.redirect(results.game.url)
            return
          }
          if (results.game.player1.toString() == results.player._id.toString()){
            res.redirect(results.game.url)
            return 
          }
          const update = { 'player2': results.player._id, 'join_state': 'joined', attempted:"[]" }
          const handle_update = (err)=>{
            if(err){return next(err)}
            res.redirect(results.game.url)
          }
          results.game.updateOne(update).exec(handle_update)
        })
    }else {
      if (!errors.isEmpty()){
        context = {title: 'Invalid Code', errors: errors.array()}
        res.render('index', context)
        return
      }
      const cookie = auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon',
        password: auth.get_auth_cookie(),
        rec_key: auth.get_rec_code(),
        cookie: cookie,
      })
      res.cookie('AuthToken', cookie, {sameSite:'Strict', signed: true, httpOnly: true, maxAge:1296000000})
      Game.findOne({'join_code':req.body.key }).exec((err, result)=>{
        if(err){return next(err)}
        if(result.join_state != 'waiting'){
          res.redirect(result.url)
          return
        }
        const handle_player =(err)=>{
          if(err){return next(err)}
          const update = { 'player2': anon_player._id, 'join_state': 'joined', attempted:"[]" }
          const handle_update =(err)=>{
            if(err){ return next(err) }
            res.redirect(result.url)
          }
          result.updateOne(update).exec(handle_update)
        } 
        anon_player.save(handle_player)
      })
    }
  }
]


exports.color_create_post =[
  body('option').trim().isLength({min:1}).withMessage('Invalid Option').escape(),
  (req, res, next)=>{
    //function to get 9 random colors and set chosen color
    const get_color = () => {
      let arr = []
      const color = () => Math.floor(Math.random() * 257) //function to produce random color

      for (let i=0; i<=9; i++){
        arr.push([color(), color(), color()])
      }
      // Math.floor(Math.random() * 10)
      return arr
    }

    const context = {title: 'Color Game'}
    const errors = validationResult(req)
    if(!errors.isEmpty()){ context['errors'] = errors.array()
      res.render('index', context)
      return
    }
    if(req.user){
      const handle_user = (err, the_user)=>{
        if(err){ return next(err) }
        if (the_user == null){
          context['errors'] = [{msg: 'User not logged in!'}] 
          res.render('index', context)
          return
        } else {
          context['user'] = { name: the_user.user_name, url: the_user.url }
          const game = new Game({
            game_type: 'color',
            date_played: new Date(),
            game_state: JSON.stringify([get_color(), 0, 0,Math.floor(Math.random()* 10 )]),
            finished: false,
            player1:the_user._id,
            join_state:req.body.option == 'friend'? 'waiting': 'oneplayer',
            join_code:req.body.option == 'friend'?auth.get_game_code() : '',
            turn: req.user,
            attempted: "[]"
          })
          const handle_save = (err)=>{
            if(err){return next(err)}
            res.redirect(game.url)
          }
          game.save(handle_save)
        }
      }
      Player.findOne({'cookie': req.user}).exec(handle_user)
    } else{
      const cookie = auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon',
        password: auth.get_auth_cookie(),
        rec_key: auth.get_rec_code(),
        cookie: cookie,
      })
      res.cookie('AuthToken', cookie, {sameSite:'Strict', signed: true, httpOnly: true, maxAge:1296000000})
      const handle_player = (err)=>{
        if(err){return next(err)}
        const game = new Game({
          game_type: 'color',
          date_played: new Date(),
          game_state: JSON.stringify([get_color(), 0, 0,Math.floor(Math.random()* 10 )]),
          finished: false,
          player1:anon_player._id,
          join_state:req.body.option == 'friend'? 'waiting': 'oneplayer',
          join_code:req.body.option == 'friend'?auth.get_game_code() : '',   
          turn: anon_player.cookie,
          attempted: "[]"
        })
        const handle_save = (err)=>{
          if(err){return next(err)}
          res.redirect(game.url)
        }
        game.save(handle_save)
      }
      anon_player.save(handle_player)
    }
  }
] 
  

exports.color_game = (req, res, next)=>{
  if (req.user){
    async.parallel(
      {
        player: (callback)=>Player.findOne({'cookie': req.user}).exec(callback),
        game: (callback)=>Game.findById(req.params.id).exec(callback)
      },(err, results)=>{
        let context = {title:'Color Game'}
        if (err){return next(err)}
        if(results.player == null){ 
          res.clearCookie('AuthToken')
          context['errors'] = [{'msg': 'Unknown Player'}]
          res.render('index', context)
          return
        }
        context['user'] = {name: results.player.user_name, url: results.player.url}
        if (results.game == null){
          context['errors'] = [{'msg': 'Unknown Game ID'}]
          res.render('index', context)
          return
        }
        if (results.player._id.toString() == results.game.player1.toString()){
          context['game'] = results.game
          res.render('color_game', context)
          return
        }
        if( results.game.join_state == 'waiting' ){
          res.redirect(results.game.url +'/join')
          return
        }
        context['game'] = results.game
        res.render('color_game', context)
        return
      }
    )

  }else {
    res.render('index', {'title': 'Login', errors:[{msg : 'Invalid user.'}]})
  }
}

exports.color_api = [
  body('command').isLength({min:1}).withMessage('Invalid command'),
  body('game_id').isLength({min:1}).withMessage('Invalid game id'),
  (req, res, next)=>{
    const get_color = () => {
      let arr = []
      const color = () => Math.floor(Math.random() * 257) //function to produce random color

      for (let i=0; i<=9; i++){
        arr.push([color(), color(), color()])
      }
      // Math.floor(Math.random() * 10)
      return arr
    }
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      res.send({state:'error', errors:errors.array()})
    } else{
      const handle_restart = (err, the_player)=>{
        if(err){return res.send({state:'error', errors:[err.toString()]})}
        const n_game = new Game({
          game_type: 'color',
          date_played: new Date(),
          game_state: JSON.stringify([get_color(), 0, 0,Math.floor(Math.random()* 10 )]),
          finished: false,
          player1:the_player._id,
          join_state:req.body.option == 'friend'? 'waiting': 'oneplayer',
          join_code:req.body.option == 'friend'?auth.get_game_code() : ''  
        })
        const handle_save = (err)=>{
          if(err){return res.send({state:'error', errors:[err.toString()]})}
          const reply = {
            state:'success', colors: JSON.parse(n_game.game_state)[0],
            game_id: n_game._id
          }
          res.send(reply)
        }
        n_game.save(handle_save)
      }

      const handle_start = (err, result)=>{
        if(err){return res.send({state:'error', errors:[err.toString()]})}
        if(result==null){return res.send({state:'error', errors:['Invalid game.']})}
        const reply = {
          state:'success', colors: JSON.parse(result.game_state)[0]
        }
        let state = JSON.parse(result.game_state)
        if (result.join_state =='waiting'){
          reply['join_link'] = result.url +'/join'
          reply['join_code']= result.join_code
        }
        
        reply['join_state'] = result.join_state  
        if (result.finished){
          let att = state[1]< state[2] ? state[1]: state[2]
          reply.finished = true,
          reply.index = JSON.parse(result.game_state)[3]
          reply['winner']= result.winner
          reply['winner_url'] = result.winner_url
          reply['score']=  10 -att
        } else { reply.finished = false; }
        res.send(reply)
      }
      const handle_choice =(err, result)=>{
        if(err){return res.send({state:'error', errors:[err.toString()]})}
        if(result==null){return res.send({state:'error', errors:['Invalid game.']})}
        let state = JSON.parse(result.game_state)
        let attempted = JSON.parse(result.attempted)
        if(result.join_state=='joined' && result.turn != req.user){
          res.send({state:'error', errors:['Wrong Turn']})
          return
        }
        const check = req.body.values[0] ==JSON.parse(result.game_state)[3]  ? true: false
        attempted.push(Number(req.body.values[0]))
        const reply = {
          state:'success',
          response:check ,
          attempted: attempted,
          join_state: result.join_state
        }
        let player = req.user == result.player1.cookie? 1:2
        state[player]+=1
        if (check){
          let update
          if (result.join_state == 'joined'){
            update = {
              winner:req.user == result.player1.cookie? result.player1.user_name: result.player2.user_name,
              winner_url: result.player1.cookie? result.player1.url: result.player2.url,
              game_state: JSON.stringify([state[0], Number(state[1]), state[2], state[3]]),
              finished: true,
              attempted: JSON.stringify(attempted),
              turn: player ==1 ? result.player2.cookie: result.player1.cookie
            }
          } else {
            update = {
              winner:req.user == result.player1.cookie? result.player1.user_name: result.player2.user_name,
              winner_url: result.player1.cookie? result.player1.url: result.player2.url,
              game_state: JSON.stringify([state[0], Number(state[1]), state[2], state[3]]),
              finished: true,
              attempted: JSON.stringify(attempted),
            }
          }

          Game.findOneAndUpdate({'_id': result._id }, update,{new:true}).populate('player1').populate('player2').exec( (err, game)=>{
            if(err){return res.send({state:'error', errors:[err.toString()]})}
            reply['score'] = 10 - Number(state[1])
            if (game.join_state == 'joined'){
              let winner = game.winner == game.player1.user_name? game.player1: game.player2
              let att = state[1]< state[2] ? state[1]: state[2]
              reply['winner']= winner.user_name
              reply['winner_url'] = game.winner_url
              reply['join_state'] = 'joined'
              if(winner.cookie == req.user){
                reply['score']=  10 -att
              } else { reply['score'] = 0 }

            }
            res.send(reply)
          })
        }else {
          let update;
          if(result.join_state=='joined'){
            update = {
              game_state: JSON.stringify([state[0], state[1], state[2], state[3]]),
              attempted: JSON.stringify(attempted),
              turn: player ==1 ? result.player2.cookie: result.player1.cookie
            }

          } else {
            update = {
              game_state: JSON.stringify([state[0], state[1], state[2], state[3]]),
              attempted: JSON.stringify(attempted),
            }

          }
          result.updateOne(update).exec((err, the_game)=>{
            if(err){return res.send({state:'error', errors:[err.toString()]})}
            res.send(reply)
          })
        }
      }
      const handle_state = ( err, result )=>{
        if(err){return res.send({state:'error', errors:[err.toString()]})}
        if(result==null){return res.send({state:'error', errors:['Invalid game.']})}
        res.send({'join_state': result.join_state})
        return
      }

      const handle_turn = (err, result)=>{
        if(err){return res.send({state:'error', errors:[err.toString()]})}
        if(result==null){return res.send({state:'error', errors:['Invalid game.']})}
        let turn = result.turn == req.user? true:false;
        let boxes = []; let attempted = result.attempted?  JSON.parse(result.attempted): []
        for (let i=0; i<=9; i++){
          let check = false
          attempted.forEach((val)=>{
            i == val ? check = true: false
          })
          !check ? boxes.push(i): null
        }
        res.send({turn: turn, boxes: boxes, attempted: attempted, finished: result.finished})
      }
      
      const handle_request = (err, results)=>{
        if(err){ return res.send({state: 'error', errors:['Error: ' + err.toString()]}) }
        if (results.request == null){ 
          return res.send({state:'error', errors:['Error: Invalid request Id.']})
        }
        if(results.the_game == null){ 
          return res.send({state:'error', errors: ['Error: Invalid game Id.']})
        }
        if(!req.body.values.action){
          return res.send({state:'error', errors:['Error: Invalid Request Action.']})
        }
        switch(req.body.values.action){
          case 'deny':
            if ( req.user != results.request.receiver.cookie ){
              return res.send({'state': 'error', errors:['Error: Invalid user.']})
            }
            const handle_update= (err)=>{
              if (err){ return res.send({state:'error', errors:['Error: '+ err.toString()]}) }
              return res.send({state:'success', msg:'Request Updated Successfully.'})
            }
            results.request.updateOne({deny:true, accept:false}).exec(handle_update)
            break;

          case 'delete':
            if (req.user != results.request.sender.cookie){
              return res.send({state:'error', errors:['Error: Invalid user.']})
            }
            const handle_delete= (err)=>{
              if(err){ return res.send({state: 'error', errors: ['Error: ' + err.toString()]}) }
              return res.send({state:'success', msg:'Request Deleted Successfully'})
            }
            Request.deleteOne({_id: results.request._id}).exec(handle_delete)
            break;

          case 'accept':
            if( req.user != results.request.receiver.cookie ){
              return res.send({state:'error', errors:['Error: Invalid user.']})
            }
            if( results.request.accept == true){
              return res.send({state:'error', errors:['Error: Already Accepted Request!']}) 
            }
            //color game processing 
            const game = new Game({
              game_type: 'color',
              date_played: new Date(),
              game_state: JSON.stringify([get_color(), 0, 0,Math.floor(Math.random()* 10 )]),
              finished: false,
              join_state: "joined",
              join_code: ' ',
              player1: results.request.sender._id,
              player2: results.request.receiver._id
            })
            let turn =  Math.floor((Math.random() *2)+1); 
            let cookie = [results.requres.sender._id, results.request.receiver._id]
            game.turn = cookie[turn]
            const handle_save = (err)=>{
              if(err){ return res.send({state: 'error', errors:['Error: '+ err.toString()]}) }
              return res.send({state:'success', url:game.url})
            }

            results.request.updateOne({accept: true, deny: false, game_url: game.url}).exec((err)=>{
              if (err){ 
                return res.send({state:'error', errors:['Error: '+ err.toString()]}) 
              }
              game.save(handle_save)
            })
            break;
          case 'check':
            if (req.user != results.request.sender.cookie){
              return res.send({state:'error', errors:['Error: ' + err.toString()]})
            }
            return res.send({state:'success', url: results.request.accept? results.request.game_url: null })
        }
      }

      const handle_list_reqs= (err, g_reqs)=>{
        if(err){ return res.send({state:'error', errors:['Error: '+ err.toString()]}) }
        if (g_reqs == null){return res.send({state:'error', msg:'No Requests Available.'})}
        let sent = []
        let received = []
        g_reqs.forEach((g_req)=>{
          if (g_req.sender.cookie == req.user ){
            if (g_req.deny== true || g_req.accept ==true){ return }
            let game_request =  {
              req_id: g_req._id,
              date_created: g_req.date_created,
              to: g_req.receiver.user_name,
              to_url: g_req.receiver.url,
            }
            sent.push(game_request)
          } else if (g_req.receiver.cookie == req.user ){
            if (g_req.deny== true || g_req.accept ==true){ return }
            let game_request =  {
              req_id: g_req._id,
              date_created: g_req.date_created,
              from: g_req.sender.user_name,
              from_url: g_req.sender.url,
            }
            received.push(game_request)
          }
        })
        return res.send({state:'success', msg:{sent: sent, received: received}})
      }

      const handle_create_req = (err, the_game)=>{
        if(err){ return res.send({state:'error', errors:"Error "+ err.toString()}) }
        if (the_game == null){ return res.send({state:'error', errors:'Error: Invalid Game Id.'}) }
        let sender , receiver;
        if ( the_game.player1.cookie == req.user  ){
          sender =  the_game.player1._id 
          receiver =the_game.player2._id
        } else {
          sender = the_game.player2._id
          receiver= the_game.player1._id
        }
        let request =  new Request({
          sender: sender, receiver : receiver, game_type:'color'
        })
        request.save((err, the_req)=>{
          if(err){ return res.send({state:'error', errors:'Error: ' + err.toString()}) }
          return res.send({state:'success', req_id:the_req._id, msg:'ALERT: Request Sent!'})
        })
      }

      if (req.body.command =='start'){
        Game.findById(req.body.game_id)
          .populate('player1')
          .populate('player2')
          .exec(handle_start)
      } else if (req.body.command == 'choice'){
        Game.findById(req.body.game_id)
          .populate('player1')
          .populate('player2')
          .exec(handle_choice)
      } else if(req.body.command== 'restart'){
        Player.findOne({'cookie': req.user})
          .exec(handle_restart)
      } else if ( req.body.command == 'state' ){
        Game.findById(req.body.game_id)
          .exec(handle_state)
      } else if ( req.body.command =='turn' ){
        Game.findById(req.body.game_id)
          .populate('player1')
          .populate('player2')
          .exec(handle_turn)
      } else if (req.body.command == 'request'){
        if (!req.body.values.req_id){return res.send({state:'error', errors:['Error: Invalid request Id.']}) }
        async.parallel(
          {
            request:(callback)=>Request.findById(req.body.values.req_id).populate('sender').populate('receiver').exec(callback),
            the_game:(callback)=>Game.findById(req.body.game_id).populate('player1').populate("player2").exec(callback)
          },
          handle_request
        )
      } else if (req.body.command == 'list_reqs'){
        Request.find({game_type: 'color'})
          .populate('sender')
          .populate('receiver')
          .sort({date_created: -1})
          .exec(handle_list_reqs)
      } else if ( req.body.command == 'create_req' ){
        Game.findById(req.body.game_id)
          .populate('player1')
          .populate('player2')
          .exec(handle_create_req)
      }
    }
  }
]
