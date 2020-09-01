
const socket = io(); 

socket.on("connect",()=>{
    const username = sessionStorage.getItem("username");
    console.log("user session: "+username)
    socket.emit("join",{id:socket.id,username:"HackerMan"});
})

socket.on("disconnect",()=>{
    console.log("Socket Disconnected")
    alert("You tried to join the chat with iregular way, please join using the common form!, Disconnecting...")
})

const messageForm = document.getElementById("message-form")
const chatMessages = document.querySelector(".chat-messages")

// const welcome = document.querySelector(".welcome-message")

// const {username} = Qs.parse(location.search,{
//     ignoreQueryPrefix: true
// })

// socket.emit("join",username)

socket.on("message",(data)=>{
    console.log("joined")
    // welcome.textContent =  msg;
    addMessage(data)
    chatMessages.scrollTop = chatMessages.scrollHeight
})

messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    const message = e.target.elements.message.value
    console.log(message)
    socket.emit("message",message)
    e.target.elements.message.value = ""
    e.target.elements.message.focus()

})

const addMessage = (data)=>{
    const div = document.createElement("div")
    div.classList.add("message")
    div.innerHTML= ` 
    <p class="meta">${data.username}<span> ${data.time}</span></p>
    <p class="text">
       ${data.msg}
    </p>`
    chatMessages.appendChild(div)

}