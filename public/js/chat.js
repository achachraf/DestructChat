const socket = io(); 
let AESKeys;
let othersSecret = null;
let creatorAESKeys = null;
$('[data-toggle="tooltip"]').tooltip()


// console.log("real chat.js");
// const username = "<%= username %>"
// const roomId = "<%= roomId %>"

console.log(username,roomId)



const messageForm = document.getElementById("message-form")
const chatMessages = document.querySelector(".chat-messages")
const messageInput = document.getElementById("message")
const sendButton = document.getElementById("send")

socket.on("connect",async ()=>{
    // const username = sessionStorage.getItem("username");
    AESKeys = generateAESKeys()
    const encryptedAESKeys = await encryptPublic(AESKeys,publicKey)
    socket.emit("join",{id:socket.id,username,roomId,encryptedAESKeys});

    //generate & encrypt AES Keys
    

    socket.emit("secret",{encryptedAESKeys})

    socket.on("secrets",async (encryptedOthersSecret)=>{
        console.log("getting secrets...")
        console.log(encryptedOthersSecret);
        if(othersSecret == null){
            othersSecret = await decryptOthersSecret(encryptedOthersSecret,AESKeys)
        }
        else{
            console.log("receiving others keys...")
            creatorAESKeys = othersSecret.find(key=>key.username === creatorUsername).AESKeys
            console.log("creatorAESKeys")
            console.log(creatorAESKeys)
            othersSecret = await decryptOthersSecret(encryptedOthersSecret,creatorAESKeys)
        }
        
    })

    socket.on("message", async (data)=>{
        await addMessage(data)
        
    })

    socket.on("welcomeMessage",async (data)=>{
        console.log("joined")
        console.log("others secrets :")
        console.log(othersSecret)
        await addWelcomeMessage(data)
        messageInput.removeAttribute("readonly")
        sendButton.removeAttribute("disabled")
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

// socket.on("disconnect",()=>{
//     console.log("Socket Disconnected")
//     //alert("You tried to join the chat with iregular way, please join using the common form!, Disconnecting...")
//     alert("Disconnecting")
//     window.location.href = "/"
// })


socket.on("userLeave",username=>{
    othersSecret = othersSecret.filter(key=>key.username !== username)
})

messageForm.addEventListener('submit',async (e)=>{
    console.log(othersSecret)
    e.preventDefault()
    const message = messageInput.value
    console.log(message)
    const encryptedMessage = await encryptMessage(message,AESKeys)
    socket.emit("message",encryptedMessage)
    e.target.elements.message.value = ""
    e.target.elements.message.focus()

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
    div.classList.add("message")
    div.innerHTML= ` 
    <p class="meta">${username}<span> ${time}</span></p>
    <p class="text">
       ${message}
    </p>`
    chatMessages.appendChild(div)
    chatMessages.scrollTop = chatMessages.scrollHeight
}

const copyToClipboard = ()=>{
    const roomToken = document.getElementById("roomToken")
    console.log(roomToken)
    roomToken.select()
    document.execCommand("copy")
}

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