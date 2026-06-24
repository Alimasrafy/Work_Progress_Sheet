const crypto = require('crypto');
const secret = crypto.randomBytes(48).toString('hex');
console.log(secret);
