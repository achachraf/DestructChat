
const getRandomToken = ()=> ((Math.random().toString(36).substring(2, 15) 
+ Math.random().toString(36).substring(2, 15)).substring(0,16))

const generateAESKeys = ()=>{
    secret = getRandomToken()
    iv = getRandomToken()

    return {secret,iv}

}

const encryptPublic = async (data,publicKey) =>{
    pub = window.converterWrapper.convertPemToBinary2(publicKey);
    pub = window.converterWrapper.base64StringToArrayBuffer(pub);
    var rsaParams = { name: "RSA-OAEP", hash: "SHA-1", modulusLength: 2048 };
    const cryptokey = await window.crypto.subtle.importKey(
        "spki",
        pub,
        rsaParams,
        false,
        ["encrypt"]
    );
    
    let encoder = new TextEncoder();
    try {
        const encodedMessage = encoder.encode(JSON.stringify(data));
        encrypted = await window.crypto.subtle.encrypt(
          rsaParams,
          cryptokey,
          encodedMessage
        );
    } catch (err) {
        console.log(err.message);
    }

    return  window.converterWrapper.arrayBufferToBase64String(encrypted);

}

const decryptOthersSecret = async (encryptedOthersSecret,AESKeys)=>{
    const enc = new TextEncoder()
    const dec = new TextDecoder()

    // console.log(encryptedOthersSecret)

    console.log(AESKeys)

    const key = await window.crypto.subtle.importKey("raw",enc.encode(AESKeys.secret),"AES-CBC",false,["decrypt"])
    console.log(key)
    console.log("wsal")
    const buffer = window.converterWrapper.base64StringToArrayBuffer(encryptedOthersSecret)
    // console.log(buffer)
    const decryptedAES = await window.crypto.subtle.decrypt({
        name:"AES-CBC",
        iv: enc.encode(AESKeys.iv)
      },
      key,
      buffer
    )
    console.log("haaa")
    let secretsList = JSON.parse(dec.decode(decryptedAES))
    return secretsList
}

const encryptMessage = async (message,AESKeys) =>{
    let enc = new TextEncoder()
    const key = await window.crypto.subtle.importKey("raw",enc.encode(AESKeys.secret),"AES-CBC",false,["encrypt"])
    encryptedMessageAES = await window.crypto.subtle.encrypt({
            name: "AES-CBC",
            iv: enc.encode(AESKeys.iv)
        },
        key,
        enc.encode(message)
    )
    const base64EncryptedMessage = window.converterWrapper.arrayBufferToBase64String(encryptedMessageAES)
    return base64EncryptedMessage
}

const decryptMessage = async (encryptedMessage,AESKeys) =>{
    const enc = new TextEncoder()
    const dec = new TextDecoder()
    const key = await window.crypto.subtle.importKey("raw",enc.encode(AESKeys.secret),"AES-CBC",false,["decrypt"])
    console.log(key)
    const decryptedAES = await window.crypto.subtle.decrypt({
        name:"AES-CBC",
        iv: enc.encode(AESKeys.iv)
      },
      key,
      window.converterWrapper.base64StringToArrayBuffer(encryptedMessage)
    )
    return dec.decode(decryptedAES)

}