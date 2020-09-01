const crypto = require("crypto")


const getSecretAES =  (encryptedAESKeys,privateKey)=>{
    
    let decryptedDataBuffer;
    try{
        decryptedDataBuffer = crypto.privateDecrypt({
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        }, Buffer.from(encryptedAESKeys,'base64'))
        const AESkeys = JSON.parse(decryptedDataBuffer.toString())
        return AESkeys;
    } 
    catch(err){
        console.log("Error in decrypting AES Keys")
    }
    

    return null

}

const encryptOthersSecret = (othersSecret,AESKeys)=>{
    console.log(AESKeys)
    try{
        let cipher = crypto.createCipheriv("aes-128-cbc",AESKeys.secret,AESKeys.iv)
        let encrypted = cipher.update(JSON.stringify(othersSecret),"utf8","base64")
        return encrypted+cipher.final("base64");
    }
    catch(err){
        console.log("Error in encrypting others secrets")
    }

    return null;
}

const encryptBotMessage = (message,AESKeys)=>{
    try{
        let cipher = crypto.createCipheriv("aes-128-cbc",AESKeys.secret,AESKeys.iv)
        let encrypted = cipher.update(message,"utf8","base64")
        return encrypted+cipher.final("base64");
    }
    catch(err){
        console.log("Error in encrypting Bot Message")
    }
    return null
}

const isAESKeys = (AESKeys)=>{
    if(AESKeys && AESKeys.secret && AESKeys.iv && AESKeys.secret.length == 16 && AESKeys.iv.length == 16  ){
        return true;
    }
    return false;
}

module.exports = {
    getSecretAES,
    encryptOthersSecret,
    encryptBotMessage,
    isAESKeys
}