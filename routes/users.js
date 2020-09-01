const { addUser,
    getUserByUsername,
    getUsers, 
    removeUser,
    userInRoom, 
    getUsersByRoomId, 
    removeUsersInRoom, 
    getUserById,
    getCreator} = require("../data/users");
const { render } = require("ejs");
const { disconnectSocket, emitDestructing } = require("../socket");
const { randomToken } = require("../utils/tokens");
const { 
    addRoom,
    getRoomById, 
    addMember, 
    getRooms, 
    removeRoom,
    getRoomKeys } = require("../data/rooms");

const router = require("express").Router()
const crypto = require("crypto");

const sleep = ms=> new Promise((resolve,reject)=>setTimeout(()=>{resolve()},ms));


router.post("/chat",async (req,res)=>{
    console.log(req.body)
    let {username,mode,roomId,maxMembers} = req.body
    if(username == "")
        return res.status(400).render("index",{errorMessage:"User cannot be empty"})
    if(userInRoom(username,roomId)){
        return res.status(301).render("index",{errorMessage:"User already exist in room"})
    }
    maxMembers = parseInt(maxMembers)
    let creator = false;
    let creatorUsername;
    let othersSecret = []
    if(mode === 'create'){
        if(maxMembers<2 || maxMembers>4)
            return res.status(400).render("error",{error:"Invalid Request"})

        roomId =  randomToken()
        addRoom({roomId,maxMembers,members:1,keys:[]})
        creator = true
        creatorUsername = username
    }
    else if (mode === "join"){
        const room = getRoomById(roomId);
        if(!room){
            return res.render("index",{errorMessage:"Room Not Found!"})
        }
        maxMembers = room.maxMembers
        if(maxMembers <= room.members){
            console.log("room is full")
            return res.render("index",{errorMessage:"Room is Full"})
        }

        //getting keys before adding the member
        othersSecret = getRoomKeys(roomId)
        creatorUsername = getCreator(roomId).username
        addMember(roomId)
        console.log(room);
    }
    else{
        return res.status(400).render("error",{error:"Invalid Request"})
    }

    //generating RSA Keys 
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

    addUser({username,id:null,roomId,creator,rsaKeys})


    return res.render("chat",{
        username,
        roomId,
        creatorUsername,
        creator,
        publicKey:JSON.stringify(rsaKeys.publicKey)
    })
})


router.post("/destruct",(req,res)=>{
    const {id} = req.body
    const user = getUserById(id)
    console.log("creator: ")
    console.log(user)
    if(!user){
        return res.render("error",{error:"Invalid Request"})
    }
    if(!user.creator){
        return res.render("index",{errorMessage:"Unauthorized Action, you're kicked!"})
    }
    //const users = getUsersByRoomId(user.roomId)
    emitDestructing(user.roomId)
    // for(let usr of users){
    //     disconnectSocket(usr.id)
    // }
    removeUsersInRoom(user.roomId)
    removeRoom(user.roomId)
    return res.status(200).send()

})


router.get("/chat/test",(req,res)=>{
    res.render("chat",{username:"test"})
})


module.exports = router;