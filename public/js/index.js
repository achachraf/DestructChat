
const loginForm = document.getElementById("login-form")
// loginForm.addEventListener("submit", (e)=>{
//     // e.preventDefault()
//     // e.preventDefault()
//     const username = document.getElementById("username").value;
//     // sessionStorage.setItem("username",username)
//     const checked = document.getElementById("create").checked
//     let stringfiedData;
//     if(checked){
//         const maxMembers = document.getElementById("max-members").value
//         stringfiedData = JSON.stringify({
//             username,
//             maxMembers,
//             roomId: null
//         })
//     }
//     else{
//         const roomId = document.getElementById("roomId").value
//         stringfiedData = JSON.stringify({
//             username,
//             roomId
//         })
//     }
//      fetch("/users/chat",{
//         method: 'POST',
//         headers:{
//             'Content-Type': 'application/json'
//         },
//         redirect: 'follow',
//         body:stringfiedData
//     })
//     .then(res=>{
//         console.log(res)
//         if(res.redirected){
//             window.location.href = res.redirected
//         }
//     })
//     .catch((err)=>{
//         console.log(err)
//     })
// })

const joinRadio = document.getElementById("join")
const createRadio = document.getElementById("create")

joinRadio.addEventListener("change",(e)=>{
    const roomBox = document.querySelector(".room-box")
    const roomMembers = document.querySelector(".room-members")
    roomBox.style.display = "block"
    roomMembers.style.display = "none"
    document.getElementById("roomId").disabled = false
    document.getElementById("max-members").disabled = true
    
})

createRadio.addEventListener("change",(e)=>{
    const roomBox = document.querySelector(".room-box")
    const roomMembers = document.querySelector(".room-members")
    roomBox.style.display = "none"
    roomMembers.style.display = "block"
    document.getElementById("roomId").disabled = true
    document.getElementById("max-members").disabled = false
})
