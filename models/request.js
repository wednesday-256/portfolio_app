const mongoose = require("mongoose");

const Schema = mongoose.Schema;

var RequestSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "Player" },
  receiver: { type: Schema.Types.ObjectId, ref: "Player" },
  deny: { type: Boolean },
  accept: { type: Boolean },
  date_created: { type: Date, default: Date.now },
  game_id: { type: String },
  game_type: { type: String },
});

module.exports = mongoose.model("Request", RequestSchema);
