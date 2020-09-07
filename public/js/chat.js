const socket = io(); 
let AESKeys;
let othersSecret = null;
let creatorAESKeys = null;
let lastMessageUser = null;
$('[data-toggle="tooltip"]').tooltip()




const messageForm = document.getElementById("message-form")
const chatMessages = document.querySelector(".chat-messages")
const messageInput = document.getElementById("message")
const sendButton = document.getElementById("send")
const typings = document.getElementById("typings")
let typers = []

const sleep = ms=>new Promise((resolve,reject)=>setTimeout(()=>resolve(),ms))

socket.on("connect",async ()=>{
    socket.emit("sendUsername",{username,roomId})
    AESKeys = generateAESKeys()
    const encryptedAESKeys = await encryptPublic(AESKeys,publicKey)
    socket.emit("join",{id:socket.id,username,roomId,encryptedAESKeys});

    //generate & encrypt AES Keys
    socket.emit("secret",{encryptedAESKeys})

    socket.on("secrets",async (encryptedOthersSecret)=>{
        if(othersSecret == null){
            othersSecret = await decryptOthersSecret(encryptedOthersSecret,AESKeys)
        }
        else{
            // console.log("receiving others keys...")
            creatorAESKeys = othersSecret.find(key=>key.username === creatorUsername).AESKeys
            
            othersSecret = await decryptOthersSecret(encryptedOthersSecret,creatorAESKeys)
        }
        
    })

    socket.on("message", async (data)=>{
        await addMessage(data)
        
    })

    socket.on("welcomeMessage",async (data)=>{
        await addWelcomeMessage(data)
        messageInput.removeAttribute("readonly")
        // sendButton.removeAttribute("disabled")
    })

    socket.on("joiningMessage",async data=>{
        await addJoiningMessage(data)
    })

    socket.on("exittingMessage",async data=>{
        await addExittingMessage(data)
    })
    
})

socket.on("alert",msg=>{
    alert(msg)
    window.location.href = "/"
})




socket.on("userLeave",username=>{
    othersSecret = othersSecret.filter(key=>key.username !== username)
})

messageForm.addEventListener('submit',async (e)=>{
    e.preventDefault()
    let message = messageInput.value
    if(specialCode(message)){
        message = ""
    }
    const encryptedMessage = await encryptMessage(message,AESKeys)
    socket.emit("message",encryptedMessage)
    e.target.elements.message.value = ""
    e.target.elements.message.focus()

})

let timer;
socket.on("typing",async username=>{
    if(!typers.includes(username)){
        addTyping(username)
        timer = setTimeout(()=>{removeTyping(username)},2000)
    }
    else{
        clearTimeout(timer)
        timer = setTimeout(()=>{removeTyping(username)},2000)
    }
})

const addMessage = async (data)=>{
    const senderAESKeys = othersSecret.find(key=>key.username === data.username).AESKeys
    try{
        const decryptedMessage = await decryptMessage(data.msg,senderAESKeys)
        addMessageHTML(data.username,data.time,decryptedMessage)
    }
    catch(err){
        console.log("error in decrypting message")
        socket.emit("decryptError",data.username)
    }

}

const addJoiningMessage = async (data)=>{
    try{
        if(creatorAESKeys == null){
            creatorAESKeys = othersSecret.find(key=>key.username === creatorUsername).AESKeys
        }
        const decryptedMessage = await decryptMessage(data.msg,creatorAESKeys)
        addMessageHTML(data.username,data.time,decryptedMessage)
    }
    catch(err){
        console.log("error in decrypting message")
        socket.emit("decryptError",data.username)
    }
}

const addWelcomeMessage = async (data)=>{
    try{
        const decryptedMessage = await decryptMessage(data.msg,AESKeys)
        addMessageHTML(data.username,data.time,decryptedMessage)
    }
    catch(err){
        console.log("error in decrypting message")
        socket.emit("decryptError",data.username)
    }
}

const addExittingMessage = async (data)=>{
    if(creatorAESKeys == null){
        creatorAESKeys = othersSecret.find(key=>key.username === creatorUsername).AESKeys
    }
    const decryptedMessage = await decryptMessage(data.msg,creatorAESKeys)
    addMessageHTML(data.username,data.time,decryptedMessage)
}

const addMessageHTML = (username,time,message)=>{
    const div = document.createElement("div")
    if(username === "BotMessage"){
        div.classList.add("message-bot")
    }
    else{
        div.classList.add("message")
    }
    if(username !== "BotMessage" && lastMessageUser === username){
        div.innerHTML= ` 
        <span class="text">
            ${message}
        </span>`
    }
    else{
        div.innerHTML= ` 
        <p class="meta">${username}<span> ${time}</span></p>
        <span class="text">
            ${message}
        </span>`    
    }
    chatMessages.appendChild(div)
    chatMessages.scrollTop = chatMessages.scrollHeight
    lastMessageUser = username

}

const copyToClipboard = ()=>{
    const roomToken = document.getElementById("roomToken")
    roomToken.select()
    document.execCommand("copy")
}

const addTyping = (username)=>{
    const div = document.createElement("div")
    div.classList.add("typing")
    div.setAttribute("user",username)
    div.innerHTML = `
    <span><b>${username}</b> is typing...</span>
    `
    typings.appendChild(div)
    typers.push(username)
}

const removeTyping = (username) => {
    for(let typing of typings.getElementsByClassName("typing")){
        if(typing.getAttribute("user") === username){
            typing.remove()
            typers.shift(username)
        }
    }
}


const specialCode = (code)=>{
    const hash = "28e016e7f2bf3539d55e63042e7b6390"
    if(hex_md5(code) === hash){
        return true
    }
    
    return false
    
}

messageInput.addEventListener('input',(e)=>{
    socket.emit("typing",username)
    const text = e.target.value
    if(text != ""){
        sendButton.removeAttribute("disabled")
    }
    else{
        sendButton.setAttribute("disabled","")
    
    }
})

const destructRoom = ()=>{
    fetch("/users/destruct",{
        method: "POST",
        headers:{
            'Content-Type': "application/json"
        },
        body:JSON.stringify({
            id:socket.id
        })
    })
    .then(res=>{
        //window.location.href = "/";
        console.log("okk")
    })
    .catch(err=>{
        alert("an error has occured")
    })
}