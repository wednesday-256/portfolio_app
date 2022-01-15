var mongoose = require('mongoose')

var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
  user_name:{type:String, unique: true, required:true, maxLength: 100},
  password: {type:String, required: true, maxLength:100, minLength:16},
  rec_key:{type:String, required: true, maxLength:100},
  cookie: {type:String, required:false, maxLength:100},
  date_added:{type:Date, default:Date.now}
})

PlayerSchema.virtual('url').get(function(){ return '/profile/' + this._id })

module.exports = mongoose.model('Player', PlayerSchema);
