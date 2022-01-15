var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var GameSchema = new Schema({
  game_type: {type:String, required:true, maxLength:100},
  date_played: {type:Date},
  game_state: {type:String, required:true }, //for color game => colors, p1, p2, chosen
  finished: {type:Boolean, Default: false},
  player1: {type: Schema.Types.ObjectId, ref:'Player'},
  player2: {type:Schema.Types.ObjectId, ref:'Player'},
  join_state:{type:String},
  join_code: {type:String},
  attempted:{type:String,  Default: "[]"},
  turn: {type:String},
  winner:{type:String},
  winner_url:{type:String},
  moves: [],
})

GameSchema.virtual('url').get(function(){ return `/${this.game_type}/${this._id}` })

module.exports = mongoose.model('Game', GameSchema)
