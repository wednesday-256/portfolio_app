const Game = require('../models/game')
const async = require('async')
const Player = require('../models/player')
const  {body, validationResult} = require('express-validator')
const auth = require('../extensions/auth')
const CGame = require('../extensions/chk_game')
const {Worker}= require('worker_threads')
const Request = require('../models/request')

//cookie options 
const cookie_options = {
  sameSite:'Strict', signed: true, 
  httpOnly: true, maxAge:1296000000 
}

//worker for handling engine computattions
const c_worker = new Worker('./extensions/worker.js')
c_worker.on('message', (msg)=>{
  switch(msg.status){
    case 'success':
      Game.findById(msg.game_id).populate('player1').exec((err, the_game)=>{
        if(err){return console.log('Databae Error: Invalid Transaction ' + err)}
        if(the_game==null){return console.log('Error: Game Not found.')}
        let game = JSON.parse(the_game.game_state)
        the_game.moves.push(game)
        const c_game = new CGame(game)
        c_game.present_turn = 2
        let move_response =  c_game.move_piece( msg.resp.piece, msg.resp.position )
        switch(move_response[0]){
          case 1:
            the_game.game_state = JSON.stringify(c_game)
            the_game.save((err)=>{
              if (err){return console.log('Error: could not save. ' + err)}
              c_worker.postMessage({command:'c_move', board: c_game, game_id: the_game._id.toString()})
            })
            break;
          case 0:
            if (c_game.winner> 0 ){
              the_game.finished = true;
              c_game.winner == 2? the_game.winner =  'Erik': null
              c_game.winner == 1? the_game.winner =  the_game.player1.user_name: null
              c_game.winner == 1? the_game.winner_url =  the_game.player1.url: null
            }
            the_game.turn = 1;
            the_game.game_state = JSON.stringify(c_game)
            the_game.save((err)=>{if (err){return console.log('Error: could not save. ' + err)}})
        }
      })
  }
})

exports.checkers_list = (req, res, next)=>{
  let context = {title: 'Checkers'}
  if (!req.user){
    res.render('chk_list', context)
    return
  }
  async.parallel(
    {
      player:(callback)=>Player.findOne({'cookie':req.user}).exec(callback),
      games:(callback)=>Game.find({'game_type': 'checkers'}).sort({'date_played':-1}).populate('player1').populate('player2').exec(callback),
    },(err, results)=>{
      if(err){return next(err)}
      if(results.player == null){
        res.clearCookie('AuthToken')
        context['errors'] = [{msg:'Invalid User.'}]
        res.rend('chk_list', context)
        return
      }
      if(results.games == null){return res.render('chk_list', context)}
      let games = []

      //fileter games for players games
      results.games.forEach((game)=>{
        if(game.player1.cookie == req.user){games.push(game)}
        if(game.player2){game.player2.cookie== req.user ? games.push(game): null}
      })

      //update context for views
      context['games'] = games
      context.user = {name:results.player.user_name, url:results.player.url}
      return res.render('chk_list', context)
    }
  )
}

exports.checkers_details = (req, res, next)=>{
  res.send('nothing yet: checker details')
}

exports.checkers_join_get = (req, res, next)=>{
  const handle_game = (err, result)=>{
    if(err){return next(err)}
    if(result == null ){return res.render('index', {title:'Invalid Game ID', errors:{msg:'Error: InvalidGame ID.'}})}
    if(!result.player1){
      return res.render('index', {title:'Invalid Player', errors:[{msg:'Invalid Player'}]})
    }
    if(result.join_state != 'waiting'){
      return res.redirect(result.url)
    }
    if(!req.user){
      const cookie = auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon',
        password: auth.get_auth_cookie(),
        rec_key:auth.get_rec_code(),
        cookie: cookie,
      })
      res.cookie('AuthToken', cookie, cookie_options)
      const handle_save = (err)=>{
        if(err){return next(err)}
        result.player2 = anon_player._id
        result.join_state = 'joined'
        result.save((err)=>{
          if(err){return next(err)}
          res.redirect(result.url)
        })
      }
      anon_player.save(handle_save)
    } else {
      const handle_player = (err, the_player)=>{
        if(err){return next(err)}
        if(the_player == null){
          res.clearCookie('AuthToken')
          res.render('index', {title:'Error: Invalid User.', errors:[{msg:'Error: Invalid User.'}]} )
          return
        } 
        if (the_player._id == result.player1._id){return res.redirect(result.url)}
        result.player2 = the_player._id
        result.join_state = 'joined'
        result.save((err)=>{
          if(err){return next(err)}
          res.redirect(result.url)
        })
      }
      Player.findOne({'cookie': req.user}).exec(handle_player)
    }
  }
  Game.findById(req.params.id).populate('player1').exec(handle_game)
}

exports.checkers_join_post =[
  body('key').trim().isLength({min:5}).withMessage('Invalid Join Code.').escape(),
  (req, res, next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.render('index', {title:'Error: Invalid Code.', errors: errors.array()})
    }
    let context = {title: 'Checkers '}
    const handle_game = (err, the_game)=>{
      if(err){return next(err)}
      if(the_game == null){
        context.title += ' - Invalid Game Id.'
        context.errors = [{msg: 'Error: Invalid Game Id.'}]
        return res.render('index', context)
      }
      if(the_game.join_state != 'waiting'){ return res.redirect(the_game.url) }
      if(!req.user){
        const cookie = auth.get_auth_cookie()
        const anon_player = new Player({
          user_name : 'anon',
          password: auth.get_auth_cookie(),
          rec_key: auth.get_rec_code(),
          cookie: cookie,
        })
        res.cookie('AuthToken', cookie, cookie_options)
        const handle_save = (err)=>{
          if(err){return next(err)}
          the_game.player2 = anon_player._id
          the_game.join_state = 'joined'
          the_game.save((err)=>{
            if(err){return next(err)}
            res.redirect(the_game.url)
          })
        }
        anon_player.save(handle_save)
      } else {
        const handle_player = (err, the_player)=>{
          if(err){return next(err)}
          if(the_player == null){
            res.clearCookie('AuthToken')
            context.title += " - Invalid User."
            context.errors = [{msg:'Error: Invalid User.'}]
            res.render('index', context)
            return
          }
          if(the_player._id == the_game.player1._id){return res.redirect(the_game.url)}

          the_game.player2 = the_player._id
          the_game.join_state = 'joined'
          the_game.save((err)=>{
            if(err){return next(err)}
            res.redirect(the_game.url)
          })
        }
        Player.findOne({'cookie':req.user}).exec(handle_player)
      }
    }

    Game.findOne({'join_code': req.body.key}).populate('player1').exec(handle_game)
  }
] 

exports.checkers_create_post =  [
  body("option").trim().isLength({min:1}).withMessage('Error: Invalid Option').escape()
  ,(req, res, next)=>{
    const context = {title: 'Checkers'}
    const errors = validationResult(req)
    if (!errors.isEmpty()){
      context.errors = errors.array()
      return res.render('index', context)
    }

    //checkers game processig 
    const c_game = new CGame()
    c_game.present_turn = 1
    const game = new Game({
      game_type: 'checkers',
      date_played: new Date(),
      game_state: JSON.stringify(c_game),
      finished: false,
      join_state:req.body.option == 'friend'? 'waiting': req.body.option == 'computer'? 'engine' : 'oneplayer', 
      join_code: req.body.option == 'friend'? auth.get_game_code(): '',
    })
    const handle_game_save = (err)=>{
      if (err){return next(err)}
      res.redirect(game.url)
      return
    }
    if(!req.user){
      let cookie =auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon', 
        password:auth.get_auth_cookie(),
        rec_key: auth.get_rec_code(),
        cookie: cookie
      })
      res.cookie('AuthToken', cookie, cookie_options)
      const handle_anon_save = (err)=>{
        if(err){return next(err)}
        game.player1 = game.turn = anon_player._id
        game.save(handle_game_save)
      }
      anon_player.save(handle_anon_save)
    } else {
      const handle_find = (err, player)=>{
        if(err){return next(err)}
        if(player == null){
          res.clearCookie('AuthToken')
          context.errors = [{msg: 'Error: Invalid User.'}] 
          return res.render('index', context)
        }
        game.player1 = game.turn = player._id
        game.save(handle_game_save)
      }
      Player.findOne({'cookie':req.user}).exec(handle_find)
    }
  }
]

exports.checkers_game = (req, res, next)=>{
  if(!req.user){
    res.render('index', {'title': 'Please Login', errors:[{msg:'Invalid User.'}]})
    return
  }
  async.parallel(
    {
      player: (callback)=>Player.findOne({'cookie':req.user}).exec(callback),
      game:(callback)=>Game.findById(req.params.id).exec(callback)
    }, (err, results)=>{
      if(err){return next(err)}
      let context = {title: 'Checkers. '}
      if (results.player == null){
        res.clearCookie("AuthToken")
        context.title += " - Invalid User"
        context.errors = [{msg:'Unknown User!.'}]
        return res.render('index', context)
      }
      context.user = {name: results.player.user_name, url: results.player.url}
      if(results.game == null){
        context.errors = [{msg:'Unknown Game Code/Link.'}]
        return res.render('index', context)
      }
      if(results.game.join_state == 'waiting' && results.game.player1.toString() != results.player._id.toString()){
        //console.log(results.player._id.toString())
        //console.log(results.game.player1.toString())
        return res.redirect(results.game.url + '/join')
      }
      context.game = results.game
      return res.render('chk_game', context)
    }
  )
}

exports.checkers_api = [
  body('command').isLength({min:1}).withMessage('Invalid Commad.'),
  body('game_id').isLength({min: 1}).withMessage('Invalid Game Id')
  ,(req, res, next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      res.send({state:'error', errors: errors.array()})
      return
    }
    const handle_start = (err, result)=>{
      if(err){return res.send({state:'error', errors:[err.toString()]})}
      if(result == null){return res.send({state:'error', errors:['Error: Invalid Game ID.']})}
      const game = JSON.parse(result.game_state)
      const reply = {state:'success'}
      reply.board = game
      result.moves.length > 0 ? reply.moves = result.moves: null
      if (result.join_state == 'waiting'){
        reply.join_link = result.url + '/join'
        reply.join_code = result.join_code
      }
      reply.join_state = result.join_state
      if(result.finished){
        reply.finished = true
        reply.winner = result.winner
        reply.winner_url = result.winner_url
      } else { reply.finished = false }
      return res.send(reply)
    }

    const handle_state = (err, result)=>{
      if(err){return res.send({state:'error', errors:[err.toString()]})}
      if(result==null){return res.send({state:'error', errors: ['Error: Invalid Game ']})}
      return res.send({join_state: result.join_state})
    }

    const handle_turn = (err, result)=>{
      if(err){return res.send({state:'error', errors:[err.toString()]})}
      if(result == null){return res.send({state:'error', errors:['Error: Invalid Game .']})}
      let game = JSON.parse(result.game_state)
      let turn 
      if(result.join_state == 'engine'){
        result.turn == 1 ? turn = true: turn = false
      } else if (result.turn == result.player1._id && req.user == result.player1.cookie){
        turn = true
      } else if ( result.turn == result.player2._id && req.user == result.player2.cookie ){
        turn = true
      } else {turn = false}
      reply = {turn:turn, join_state: result.join_state, finished: result.finished, board: game}
      res.send(reply)
    }

    const handle_next = (err, result)=>{
      if(err){return res.send({state:'error', errors:[err.toString()]})}
      if(result == null){return res.send({state:'error', errors: ['Error: Invalid Game.']})}
      let game = JSON.parse(result.game_state)
      let reply = {}
      reply.board = game 
      game = new CGame(game)
      let points
      try{
        points = game.get_nextpoints(req.body.values)
      }catch(e){ return res.send({state:'error', errors:'Invalid Piece.'}) }
      reply.valid = points.length > 0 ? true : false
      reply.winner = result.winner
      reply.finished = result.finished
      reply.points = points
      reply.join_state = result.join_state
      return res.send(reply)
    }
    const handle_move= (err, result)=>{
      if(err){return res.send({state:'error', errors:err.toString()})}
      if (result == null ){return res.send({state: 'error', errors: ['Error: Invalid Game.']}) }
      if(req.user != result.player1.cookie && result.player2 == undefined){return res.send({
        state:'error', errors:['Error: Invalid user!']
      })} else if (result.player2 && req.user != result.player2.cookie && req.user != result.player1.cookie){ return res.send({
        state:'error', errors:['Error: Invalid user!']
      })}
      
      let game = JSON.parse(result.game_state)
      result.moves.push(game)

      game = new CGame(game)
      let move_resp = game.move_piece(req.body.values[0], req.body.values[1])
      result.turn = game.present_turn == 1?  result.player1._id: result.join_state == 'joined'? result.player2._id : 2
      reply = { board: game }
      reply.moves = result.moves
      
      if (game.winner != 0 && game.winner != 3){
        result.finished = true
        if (result.join_state == 'joined'){ 
        
          result.winner= game.winner == 1? result.player1.user_name:result.player2.user_name
          result.winner_url= game.winner == 1? result.player1.url:result.player2.url
        } else if (result.join_state == 'engine'){
          result.winner =game.winner ==1 ? result.player1.user_name: 'Erik'
          result.winner_url =game.winner ==1 ? result.player1.url: null

        } else { 
          result.winner = game.winner ==1 ? 'Player 1' : game.winner ==2 ? 'Player 2': 'Nobody'
        }
      }else if ( game.winner == 3 ){
        result.finished = true;
        result.winner = 'Nobody'
      }
      reply.winner = result.winner
      reply.join_state= result.join_state

      const handle_save = (err)=>{
        if(err){return res.send({state:'error', errors:['Error: Couldnt save progress.']})}
        if (move_resp[0] == 9){return res.send({state:'error', errors: [move_resp[1]]})}
        if(move_resp[0] == 1 ){
          reply.next_kill  = true
          reply.kill_points = game.kill_points
          reply.expected_piece = move_resp[2]
        }
        res.send(reply)
        if (result.join_state == 'engine' && result.finished != true){
          c_worker.postMessage({command:'c_move', board: game, game_id: result._id.toString()})
        }
        return
      } 
      result.game_state = JSON.stringify(game)
      result.save(handle_save)
    }
    const handle_request= (err, results)=>{
      if(err){return res.send({state:'error', errors:['Error: '+ err.toString()]})}
      if(results.request == null){
        return res.send({state:'error', errors:['Error: Invalid requst Id.']})
      }
      if(results.the_game == null){
        return res.send({state:'error', errors:['Error: Invalid game Id.']})
      }
      if(!req.body.values.action){
        return res.send({state:'error', errors:['Error: Invalid Request Action.']})
      }
      switch(req.body.values.action){
        case 'deny':
          if(req.user != results.request.receiver.cookie){
            return res.send({state:"error", errors:['Error: Invalid user.']})
          }
          const handle_update = (err)=>{
            if(err){return res.send({state:'error', errors:['Error: '+ err.toString()]})}
            return res.send({state:'success', msg:'Request Updated successfully.'})
          }
          results.request
            .updateOne({deny:true, accept:false})
            .exec(handle_update)
          break;

        case "delete":
          if (req.user != results.request.sender.cookie){
            return res.send({state:'error', errors:['Errors: Invalid user.']})
          }
          const handle_delete = (err)=>{
            if(err){return res.send({state:'error', errors:['Error: '+ err.toString()]})}
            return res.send({state:'success', msg:'Request Deleted Successfully.'})
          }
          Request.deleteOne({_id:results.request._id})
            .exec(handle_delete)
          break;

        case 'accept':
          if (req.user != results.request.receiver.cookie){
            return res.send({state:'error', errors:['Error: Invalid User.']})
          }
          if (results.request.accept == true){
            return res.send({state:'error', errors:['Error: Already Accepted Request.']})
          }
          //checkers game processig 
          const c_game = new CGame()
          c_game.present_turn = 1
          const game = new Game({
            game_type: 'checkers',
            date_played: new Date(),
            game_state: JSON.stringify(c_game),
            finished: false,
            join_state: 'joined', 
            join_code: '',
            player1: results.request.sender._id,
            player2: results.request.receiver._id,
            turn: results.request.sender._id
          })
          const handle_save = (err)=>{
            if (err){ return res.send({state:'error', errors:['Error: '+ err.toString()]}) }
            return res.send({state: 'success', url:game.url})
          }

          results.request
            .updateOne({accept:true, deny:false, game_url: game.url})
            .exec((err)=>{
              if(err){
                return res.send({state:'error', errors:['Error: '+ err.toString()]})
              }
              game.save(handle_save)
            })
          break;
        case 'check':
          if(req.user != results.request.sender.cookie){
            return res.send({state:'error', errors:['Error: '+ err.toString()]})
          }
          return res.send({state:'success', url: results.request.accept? results.request.game_url: null})
      }
    }
    const handle_list_reqs = (err, g_reqs)=>{
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
        sender: sender, receiver : receiver, game_type:'checkers'
      })
      request.save((err, the_req)=>{
        if(err){ return res.send({state:'error', errors:'Error: ' + err.toString()}) }
        return res.send({state:'success', req_id:the_req._id, msg:'ALERT: Request Sent!'})
      })
    }

    if(req.body.command== 'start'){
      Game.findById(req.body.game_id)
        .exec(handle_start)
    } else if (req.body.command == 'state'){
      Game.findById(req.body.game_id)
        .exec(handle_state)
    } else if (req.body.command == 'turn'){
      Game.findById(req.body.game_id)
        .populate('player1')
        .populate('player2')
        .exec(handle_turn)
    } else if (req.body.command == 'next'){
      Game.findById(req.body.game_id)
        .exec(handle_next)
    } else if (req.body.command == 'move'){
      Game.findById(req.body.game_id)
        .populate('player1')
        .populate('player2')
        .exec(handle_move)
    } else if (req.body.command== 'request'){
      if(!req.body.values.req_id){return res.send({state:'error', errors:['Error:Invalid request Id.']})}
      async.parallel(
        {
          request:(callback)=>{
            Request.findById(req.body.values.req_id)
              .populate('sender')
              .populate('receiver')
              .exec(callback)
          },
          the_game:(callback)=>{
            Game.findById(req.body.game_id)
              .populate('player1')
              .populate('player2')
              .exec(callback)
          }
        }, handle_request
      ) 
    } else if ( req.body.command == 'list_reqs' ){
      Request.find({game_type:'checkers'})
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

]
