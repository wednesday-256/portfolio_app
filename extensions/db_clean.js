const Player = require('../models/player')
const Game = require('../models/game')
const async = require('async')
const Request = require('../models/request.js')
let count = 0
exports.clean_up = (req, res, next)=>{
  if (count < 500){ count += 1; return next() }
  count = 0;
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
