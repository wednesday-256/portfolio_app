var Player = require('../models/player');
const auth = require('../extensions/auth')
const {body, validationResult } = require('express-validator')

exports.player_index_get = (req, res, next)=>{
  let context = {
    title: '🚩 Welcome 🚩',
  }
  if (req.user != null){
    Player.findOne({'cookie': req.user}).exec((err, result)=>{
      if (err){return next(err)}
      if (result != null){
        context['user'] = {url: result.url, name: result.user_name}
      }
      res.render('index', context)
      return 
    })
  } else {
      res.render('index', context)
  }
}

exports.player_logout_get = (req,res,next)=>{
  if (req.user ==null){
    res.render('index',{title:'Not logged In',  errors:[{msg: 'Not logged In.'}]})
    return
  }
  res.clearCookie('AuthToken');
  res.render('index', {title:'Logged out', errors:[{msg:'Logged out successfully'}]})
}

exports.player_signin_post =[ 
  //validate and sanitize fields
  body('username').trim().isLength({min:1}).withMessage('Empyt Name').isAlphanumeric().withMessage('Invalid user name').escape(),
  body('pass').trim().isLength({min:1}).withMessage('Empty Password!!').escape(),
  //
  //process clean fields
  (req, res, next)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      //send back form with sanitize feilds and errors
      res.render('index', {title: 'Welcome', errors: errors.array(), creds:req.body})
      return;
    }
    else{

      //data is valid 
      Player.findOne({'user_name': req.body.username}).exec((err, player)=>{
        if(err) { return next(err) }
        if(player == null){
          res.render('index',{title:'User does not exist', creds: req.body, errors:[{msg: 'User does not exist'}]})
          return
        }
        if ( player.password != auth.get_hash(req.body.pass) ){
          res.render('index',{title:'Wrong Password', creds: req.body, errors:[{msg: 'Invalid Password'}]})
          return
        }
        const cookie = auth.get_auth_cookie();
        var n_player = new Player({
          user_name: player.username,
          password: auth.get_hash(player.password),
          rec_key : player.rec_key,
          cookie: cookie,
          _id: player._id
        })
        Player.findByIdAndUpdate(player._id, n_player,{}, (err, resp)=>{
          if(err){ return next(err); }
          res.cookie('AuthToken', cookie, {sameSite:'Strict', signed: true, httpOnly: true, maxAge:1296000000})
          res.redirect(resp.url)
        })
      })
    }
  }
]

exports.player_create_post = [
  //validation and sanitization
  body('username').trim().isLength({min:1}).withMessage('Empyt Name').isAlphanumeric().withMessage('Invalid user name').escape(),
  body('pass').trim().isStrongPassword().withMessage('Weak Password!!').escape(),
  body('con_pass').trim().isStrongPassword().withMessage('Weak Password!!').escape(),

  //process clean fields
  (req, res,next)=>{
    const errors= validationResult(req)
    if(!errors.isEmpty()){
      //send back form with sanitize feilds and errors
      res.render('index', {title: 'Welcome', errors: errors.array(), creds:req.body})
      return;
    } else {
      if (!req.body.password == req.body.con_pass ){
        res.render('index',{title:'Passwords Do not Match', creds: req.body, errors:[{msg: 'Passwords do not match'}]})
        return
      }
      Player.findOne({'user_name': req.body.username}).exec((err, player)=>{
        if (err) { return next(err) }

        if(player != null) {
          res.render('index', {title:'User Name Exists', creds: req.body, errors:[{msg: 'Username exists'}]})
          return
        }
  
        const cookie = auth.get_auth_cookie()
        var n_player = new Player({
          user_name: req.body.username,
          password: auth.get_hash(req.body.pass),
          rec_key: auth.get_rec_code(),
          cookie: cookie,
        })
        n_player.save((err)=>{
          if (err){return next(err)}
          res.render('player_page', {title:'Welcome '+ n_player.user_name, user: {url: n_player.url, name:n_player.user_name}, player:n_player})
        })
      })
    }
  }
]



exports.player_recover_post =[
  //validate and sanitize
  body('username').trim().isLength({min:1}).withMessage('Empty Name').isAlphanumeric().withMessage('Invalid user name').escape(),
  body('code').trim().isLength({min:10}).withMessage('Invalid Code').escape(),
  body('pass').trim().isStrongPassword().withMessage('Weak Password!!').escape(),
  body('con_pass').trim().isStrongPassword().withMessage('Weak Password!!').escape(),

  //process  clean fields
  (req, res,next)=>{
    const errors= validationResult(req)

    if(!errors.isEmpty()){
      //send back form with sanitize feilds and errors
      res.render('index', {title: 'Welcome', errors: errors.array(), creds:req.body})
      return;
    } else {
      if( !req.body.pass == req.body.con_pass ){ 
        res.render('index',{title:'Passwords Do not Match', creds: req.body, errors:[{msg: 'Passwords do not match'}]})
        return
      }
      Player.findOne({'user_name': req.body.username}).exec((err, player)=>{
        if(err){ return next(err) }
        if( player == null ){ 
        res.render('index',{title:'User does not Exist', creds: req.body, errors:[{msg: 'Username does not exist'}]})
          return
        }
        if (player.rec_key == req.body.code || true){
          const cookie = auth.get_auth_cookie();
          var n_player = new Player({
            user_name: req.body.user_name,
            password: auth.get_hash(req.body.pass),
            rec_key: auth.get_rec_code(),
            cookie: cookie,
            _id: player._id
          })
          Player.findByIdAndUpdate(player._id, n_player, {},(err, result)=>{
            if(err){return next(err)}
            //success
          res.cookie('AuthToken', cookie, {sameSite:'Strict', signed: true, httpOnly: true, maxAge:1296000000})
            res.redirect(result.url)
            return
          })
        } else {
          res.render('index',{title:'User does not Exist', creds: req.body, errors:[{msg: 'Invalid Recovery Key'}]})
        }
      })
    }
  }

] 

exports.player_detail = (req, res, next)=>{
  Player.findById(req.params.id, (err, result)=>{
    if (err){ return next(err) }
    if (result  == null){ 
      res.render('index',{title:'Invalid User', creds: req.body, errors:[{msg: 'Invalid User'}]})
      return
    }
    let change = result.cookie == req.user ? true: false
    let user ;
    if (req.user){
      Player.findOne({'cookie': req.user}).exec((err, player)=>{
        if (err){ return next(err) }
        if(result != null){
          user= {
            url: player.url, name: player.user_name
          }
        }
        res.render('player_page', { title: 'Profile Page', player: result, change: change, user:user })
        return
      })
    } else {
    res.render('player_page', { title: 'Profile Page', player: result, change: change })
    }
  })

}

exports.player_update_get = (req, res, next)=>{
  if(req.user){
    Player.findOne({'cookie': req.user}).exec((err, result)=>{
      if(err){return next(err)}
      if (result ==null){
        res.clearCookie('AuthToken')
        res.render('index', {title:'Home Page', errors: [{msg:'You are not Logged in.'}]})
      }else {
        res.render('player_update', {title:'Update Profile', player: result, user:{url: result.url, name: result.user_name}})
      }
    })
  } else {
    res.render('index', {title:'Not Logged in', errors:[{msg:'You are not logged in.'}]})
  }
}

exports.player_update_post= [
  //validate and sanitize
  body('username').optional({checkFalsy:true}).trim().isLength({min:1}).withMessage('Empty Name').isAlphanumeric().withMessage('Invalid user name').escape(),
  body('pass').optional({checkFalsy:true}).trim().isStrongPassword().withMessage('Weak Password!!').escape(),
  body('con_pass').optional({checkFalsy:true}).trim().isStrongPassword().withMessage('Weak Password!!').escape(),

  //process clean fields
  (req, res, next)=>{ 
    const errors = validationResult(req)
    if (req.user){
      Player.findOne({'cookie': req.user}).exec((err, result)=>{
        if(err){return next(err)}
        const user = {url:result.url, name: result.user_name}
        if(!errors.isEmpty()){ 
          res.render('player_update', {title:'Update Profile',player: result, errors: errors.array(), creds:req.body, user:user})
          return
        } else {
          if (req.body.pass != req.body.con_pass){
            res.render('player_update', {title:'Update Profile',player: result, errors:[{msg:'Passwords do not match.'}], user:user, creds: req.body})
            return
          }
          var n_player = new Player({
            user_name: req.body.username || result.user_name,
            password: auth.get_hash(req.body.pass) || result.password,
            rec_key: result.rec_key,
            cookie: result.cookie,
            _id: result._id
          })

          Player.findByIdAndUpdate(result._id,n_player,{},(err, the_player)=>{
            if(err){return next(err)}
            res.redirect(the_player.url)
          })
        }
      })
    } else {
      res.render('index', {title:"Home page", errors:[{msg:'You are not logged in.'}]})
    }
  }

]

exports.player_delete_get= (req, res , next)=>{  
  if (req.user){

    //first handle to handlc player find
    const first_handler = (err, result)=>{
      if(err){ return next(err) }
      if(result ==null){
        res.clearCookie("AuthToken")
        res.render('index',{title:'Invalid User', errors:[{msg:'Invalid User: User does not exist'}]})
      } else {

        //function to handle delate operation
        const handle_delete = (err)=>{
          if (err){ return next(err) }
          res.clearCookie("AuthToken")
          res.redirect('/')
        }
        result.updateOne({'user_name': 'Deleted-User', password: auth.get_hash(auth.get_rec_code())}).exec(handle_delete)
      }
    }

    Player.findOne({'cookie': req.user}).exec( first_handler )

  }else{
    res.render('index', {title:"Home page", errors:[{msg:'You are not logged in.'}]})
  }
}

