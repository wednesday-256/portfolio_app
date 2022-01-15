const crypto = require('crypto')

//returns a hash of the password
exports.get_hash = (pass)=>{
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(pass).digest('base64')
  return hash
}

//returns a random cookie 
exports.get_auth_cookie= ()=>{
  return crypto.randomBytes(20).toString('hex');
}

//return a random recovery code
exports.get_rec_code = ()=>{
  return crypto.randomBytes(10).toString('hex');
}

exports.get_game_code = ()=>{
  return crypto.randomBytes(3).toString('hex');
}
