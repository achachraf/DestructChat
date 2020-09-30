const crypto = require("crypto")

module.exports = class User{

   

    constructor(id,username,roomId,creator) {
        this.id = id;
        this.username = username;
        this.roomId = roomId;
        this.creator = creator;
        this.rsaKeys = []
    }

    generatreRsaKeys(){
        const rsaKeys = crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048, 
            publicKeyEncoding: { 
                type: 'spki', 
                format: 'pem'
            }, 
            privateKeyEncoding: { 
                type: 'pkcs8', 
                format: 'pem'
            } 
        })
        this.rsaKeys = rsaKeys
    }

}