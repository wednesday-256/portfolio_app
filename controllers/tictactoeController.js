const Game = require('../models/game')
const async = require('async')
const Player = require('../models/player')
const Request = require('../models/request')
const  {body, validationResult} = require('express-validator')
const auth = require('../extensions/auth')
const TGame = require('../extensions/ttt_game')
const {Worker}= require('worker_threads')

//cookie options 
const cookie_options = {
  sameSite:'Strict', signed: true, 
  httpOnly: true, maxAge:1296000000 
}

//worker for handling engine computations
const t_worker = new Worker('./extensions/worker.js')
t_worker.on('message', (msg)=>{
  switch(msg.status){
    case 'success':
      Game.findById(msg.game_id).exec((err, the_game)=>{
        if(err){return console.log('Database: Invalid Game ID' + err)}
        if(the_game== null){return console.log('No game: Invalid Game ID')}
        let game = JSON.parse(the_game.game_state)
        const t_game = new TGame(game)
        t_game.present_turn = 2
        t_game.make_move(msg.resp.position)
        let win_response = t_game.check_winner()
        win_response ? the_game.finished= true: null
        the_game.game_state = JSON.stringify(t_game)
        the_game.turn = 1;
        win_response == 2 ? the_game.winner = 'Erik': null
        the_game.save((err)=>{if (err){return console.log('Error: Could not save '+ err)}})
      }) 
  }
})

exports.tictactoe_list = (req, res, next)=>{
  let context  = {title:'Tic Tac Toe'}
  if (!req.user){
    res.render('ttt_list', context)
    return 
  }
  Player.findOne({'cookie':req.user}).exec((err, player)=>{
    if(err){return next(err)};
    if(player == null){
      res.clearCookie('AuthToken')
      context['errors'] = [{msg:'Invalid User.'}]
      res.render('ttt_list', context)
      return
    }
    Game.find({$and:[ 
      {$or:[ {'player1': player._id}, {'player2': player._id} ]},
      {game_type:'tictactoe'}
    ]})
      .populate('player1')
      .populate('player2')
      .exec((err, games)=>{
      if(err){ return next(err)};
      if (games == null){
        return res.render('ttt_list', context)
      }
      context['games'] = games
      console.log(player.user_name)
      context.user = {name:player.user_name, url:player.url}
      return res.render('ttt_list', context)
    })
  })
}

exports.tictactoe_details = (req,res, next)=>{
  res.send('nothing yet: tic tac toe details')
}

exports.tictactoe_join_get = (req,res,next)=>{
  const handle_game= (err, result)=>{
    if(err){return next(err)}
    if(result == null){return res.render('index', {title:"Invalid Game ID", errors:[{msg:'Invalid Game Id'}]})}
    if(!result.player1){
      return res.render('index',{title:'Invalid Player', errors:[{msg:'Invalid Player'}]})}
    if(result.join_state !='waiting'){
      res.redirect(result.url)
      return
    }
    if(!req.user){
      const cookie = auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon',
        password: auth.get_auth_cookie(),
        rec_key: auth.get_rec_code(),
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
        if(err){ return next(err) }
        if (the_player == null ){
          res.clearCookie('AuthToken')
          res.render('index', {title: 'Error: Invalid User', errors:[{msg:'Error: Invalid user.'}]})
          return 
        }
        if(the_player._id == result.player1._id){
          res.redirect(result.url)
          return
        }
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

exports.tictactoe_join_post = [
  body('key').trim().isLength({'min':5}).withMessage('Invalid Join Code.').escape(),
  (req, res, next)=>{
    const errors = validationResult(req)
    if (!errors.isEmpty()){
      return res.render('index', {title:'Error: Invalid Code', errors: errors.array()})
    }
    let context = {title:'Tic Tac Toe'}
    const handle_game = (err, the_game)=>{
      if(err){return next(err)}
      if(the_game == null){ 
        return res.render('index', {title: 'Error: Invalid Game Id.', errors:[{msg:'Error: Invalid Game Id.'}]})
      }
      if(the_game.join_state !=  'waiting'){
        return res.redirect(the_game.url)
      }
      if (!req.user){
        const cookie = auth.get_auth_cookie()
        const anon_player = new Plalyer({
          user_name: 'anon',
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
            res.render('index', {title:'Error: Invalid User.', errors: [{msg: 'Error: Invalid User.'}]})
            return
          }
          if(the_player._id == the_game.player1._id){
            res.redirect(the_game.url)
            return
          }
          the_game.player2 = the_player._id
          the_game.join_state = 'joined'
          the_game.save((err)=>{
            if(err){return next(err)}
            res.redirect(the_game.url)
          })
        }
        Player.findOne({'cookie': req.user}).exec(handle_player)
      }
    }
    Game.findOne({'join_code': req.body.key}).populate('player1').exec(handle_game)
  }
]

exports.tictactoe_create_post =[
  body('option').trim().isLength({'min':1}).withMessage('Invalid Option').escape(),
  (req, res, next)=>{
    const context = {title: 'Tic Tac Toe!'}
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      context['errors'] = errors.array()
      res.render('index', context)
      return
    }
    //tic tac toe processing 
    const t_game = new TGame()
    t_game.present_turn = req.body.option == 'computer'? Math.floor((Math.random() *2)+1) : 1;
    t_game.first_move = true
    const game = new Game({
      game_type:'tictactoe',
      date_played:new Date(),
      game_state:JSON.stringify(t_game),
      finished: false,
      join_state:req.body.option == 'friend'? 'waiting': req.body.option == 'computer'? 'engine' : 'oneplayer', 
      join_code: req.body.option == 'friend'? auth.get_game_code(): '',
    })
    const handle_game_save = (err)=>{
      if(err){return next(err)}
      res.redirect(game.url)
      if(t_game.present_turn == 2 && req.body.option == 'computer'){
        t_worker.postMessage({command:'t_move', board: t_game.board, game_id: game._id.toString()})
      }
      return
    }

    if (!req.user){
      let cookie = auth.get_auth_cookie()
      const anon_player = new Player({
        user_name: 'anon',
        password:auth.get_auth_cookie(),
        rec_key: auth.get_rec_code(),
        cookie: cookie,
      })
      //sets cookie on response 
      res.cookie('AuthToken', cookie, cookie_options)
      const handle_anon_save = (err)=>{
        if(err){return next(err)}
        game.player1 = game.turn =anon_player._id
        game.save(handle_game_save)
      }
      anon_player.save(handle_anon_save)
    } else {
      const handle_find = (err, player)=>{
        if(err){return next(err)}
        if (player == null){
          res.clearCookie('AuthToken')
          context['errors']= [{msg:'Invalid User'}]
          res.render('index', context)
          return
        }
        game.player1 =  game.turn = player._id
        game.save(handle_game_save)
      }
      Player.findOne({'cookie': req.user}).exec(handle_find)
    }
  }
] 


exports.tictactoe_game =(req,res,next)=>{
  if (!req.user){
    res.render('index', {'title': 'Please Login', errors:[{msg:"Invalid User."}]})
    return
  }
  async.parallel(
    {
      player: (callback)=>Player.findOne({'cookie': req.user}).exec(callback),
      game: (callback)=>Game.findById(req.params.id).exec(callback)
    }, (err, results)=>{
      if(err){return next(err)}
      let context = {title: 'Tic Tac Toe'}
      if(results.player == null){
        res.clearCookie('AuthToken')
        context.title += " - Invalid User"
        context.errors = [{msg:'Unkown user!'}]
        res.render('index', context)
        return
      }
      context.user = {name: results.player.user_name, url: results.player.url}
      if (results.game == null){
        context.errors = [{msg: 'Unkown Game Code/Link.'}]
        res.render('index', context)
        return
      }
      if(results.game.join_state == 'waiting' && results.game.player1.toString() != results.player._id.toString()){
        res.redirect(results.game.url+ '/join')
        return
      }

      context['game'] = results.game
      res.render('ttt_game', context)
      return
    }
  )
}

exports.tictactoe_api =[
  body('command').isLength({min:1}).withMessage('Invalid Command'),
  body('game_id').isLength({min:1}).withMessage('Invalid Game ID'),
  (req, res, next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      res.send({state:'error', errors: errors.array()})
      return
    }
    const handle_start = (err, result)=>{
      if(err){return res.send({state:'error', errors:[err.toString()]})}
      if (result==null){return res.send({state: 'error', errors:['Invalid game id']})}
      const game = JSON.parse(result.game_state)
      const reply = { state:'success' }
      reply.board = game.board
      if (result.join_state == 'waiting'){
        reply['join_link'] = result.url +'/join'
        reply['join_code'] = result.join_code
      }
      reply['join_state'] = result.join_state
      if (result.finished){
        reply.finished = true
        reply.win_pos = game.win_pos
        reply.winner = result.winner
        reply.winner_url = result.winner_url
      } else { reply.finished = false } 
      res.send(reply)
      return
    } 
    const handle_turn = (err, result)=>{
      if(err){ return res.send({state:'error', errors:[err.toString()]}) }
      if (result == null){return res.send({state:'error', errors:['Error: Invalid Game.']})}
      let game = JSON.parse(result.game_state)
      let turn 
      if (result.join_state == 'engine'){
        result.turn == 1 ? turn = true: turn = false
      }else if (result.turn == result.player1._id && req.user == result.player1.cookie){
         turn = true
      } else if (result.turn == result.player2._id && req.user == result.player2.cookie){
        turn = true
      } else { turn = false }
      reply= { join_state: result.join_state, win_pos:game.win_pos ? game.win_pos : [], turn:turn, finished: result.finished, board: game.board}
      res.send(reply)
      return
    }
    const handle_state = (err, result)=>{
      if (err){ return res.send({state:'error', errors:[err.toString()]}) }
      if (result==null){return res.send({state: 'error', errors:['Invalid Game']})}
      res.send({join_state: result.join_state})
      return
    }
    const handle_choice = (err, result)=>{
      if (err){ return res.send({state:'error', errors:[err.toString()]}) }
      if (result==null){return res.send({state: 'error', errors:['Error: Invalid Game']})}
      let game = JSON.parse(result.game_state)
      const t_game = new TGame(game)

      if (result.join_state == 'joined'){
        let turn ;
        if (result.turn == result.player1._id && result.player1.cookie == req.user){
          t_game.present_turn = 1
        } else if (result.turn == result.player2._id && result.player2.cookie == req.user){
          t_game.present_turn = 2
        } else {return  res.send({state:'error', errors:['Error: Wrong Turn!']}) }
      } else {
        if (t_game.first_move){
          t_game.present_turn = 1
        } else {
          t_game.present_turn=  t_game.present_turn == 1 ? 2: 1 
        }
      }

      let game_response = t_game.make_move(req.body.values[0])
      if (game_response[0] != 0){ return res.send({state:'error', errors:[game_response[1]]}) }
      let update 
      if (result.join_state=='joined'){
        update = {turn : result.turn == result.player1._id ? result.player2._id : result.player1._id}
      } else { 
        update = {turn: result.turn == 1? 2: 1}
      }
      let win_response = t_game.check_winner()

      const reply = {
        state: 'success',
        board: t_game.board,
        turn: update.turn,
        join_state: result.join_state
      }
      if (win_response){
        update.finished =reply.finished= true;
        win_response != 'draw'? reply.win_player = win_response : null 
        win_response != 'draw'? update.score = 1: null
        if(win_response == 1){
          update.score = reply.score =t_game.player1_score
          reply.win_pos = t_game.win_pos
          
          if (result.join_state == 'joined'){
            update.winner = reply.winner = result.player1.user_name
            update.winner_url =reply.winner_url= result.player1.url
          } else {
            update.winner = reply.winner = "Player1"
          }
        } else if (win_response ==2 ){
          update.score = reply.score =t_game.player2_score
          reply.win_pos = t_game.win_pos
          if (result.join_state == 'joined'){
            update.winner = reply.winner = result.player2.user_name
            update.winner_url =reply.winner_url= result.player2.url
          } else {
            update.winner = reply.winner = "Player2"
          }
        } else {
          update.score = reply.score =t_game.player2_score
          reply.win_pos =[] 
          update.winner = 'Nobody'
        }
      } 
      update.game_state = JSON.stringify(t_game)
      const handle_game_update = (err)=>{
        if (err){return res.send({state:'error', errors:[err.toString()]})}
        res.send(reply)
        if (result.join_state== 'engine'){
          t_worker.postMessage({command:'t_move', board: t_game.board, game_id: result._id.toString()})
        }
        return
      }
      result.updateOne(update).exec(handle_game_update)
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
          //tic tac toe processing 
          const t_game = new TGame()
          let turn =  Math.floor((Math.random() *2)+1); 
          t_game.first_move = true
          const game = new Game({
            game_type:'tictactoe',
            date_played:new Date(),
            game_state:JSON.stringify(t_game),
            finished: false,
            join_state: 'joined',
            join_code: ' ' ,
            player1: results.request.sender._id,
            player2: results.request.receiver._id
          })
          game.turn = turn == 1? game.player1: game.player2
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
        sender: sender, receiver : receiver, game_type:'tictactoe'
      })
      request.save((err, the_req)=>{
        if(err){ return res.send({state:'error', errors:'Error: ' + err.toString()}) }
        return res.send({state:'success', req_id:the_req._id, msg:'ALERT: Request Sent!'})
      })
    }

    if (req.body.command == 'start'){
      Game.findById(req.body.game_id)
        .exec(handle_start)
    } else if (req.body.command == 'choice') {
      Game.findById(req.body.game_id)
        .populate('player1')
        .populate('player2')
        .exec(handle_choice)
    } else if (req.body.command == 'turn'){
      Game.findById(req.body.game_id)
        .populate('player1')
        .populate('player2')
        .exec(handle_turn)
    } else if (req.body.command== 'state'){
      Game.findById(req.body.game_id)
        .exec(handle_state)
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
      Request.find({game_type: 'tictactoe'})
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
