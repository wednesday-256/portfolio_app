const Player = require('../models/player')
const Game = require('../models/game')
const async = require('async')
const Request = require('../models/request.js')

exports.clean_up = (req, res, next)=>{
  async.parallel(
  {
    player:(callback)=>Player.deleteMany({'user_name': 'anon', date_added: {$lt:new Date(Date.now() - 31557600000) }}).exec(callback),
    game:(callback)=>Game.deleteMany({'finished':false, join_state:'waiting', date_played:{$lt:new Date(Date.now() - 86400000)  }}).exec(callback),
    request: (callback)=>Request.deleteMany({deny:true}).exec(callback)
  }, (err, results)=>{
    if (err){return next(err)}
    next()
  })
}
