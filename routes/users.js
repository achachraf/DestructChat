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

const User = require("./../models/User")

const router = require("express").Router()
const crypto = require("crypto");
const { isBanned, isBanDone, unBan } = require("../data/connections");
const Room = require("../models/Room");
const fs = require("fs")
const moment = require("moment");
const writeLog = require("../utils/logs");


const sleep = ms=> new Promise((resolve,reject)=>setTimeout(()=>{resolve()},ms));


router.post("/chat",async (req,res)=>{
    console.log(req.body)

    //banned check
    let ip = req.headers["x-forwarded-for"];
    if (ip){
        var list = ip.split(",");
        ip = list[list.length-1].replace("::ffff:","");
    } else {
        ip = req.connection.remoteAddress.replace("::ffff:","");
    }
    if(isBanned(ip)){
        if(!isBanDone(ip)){
            return res.render("error",{error:"You're Banned from the chat"})
        }
        else{
            unBan(ip)
        }
    }

    let {username,mode,roomId,maxMembers} = req.body
    if(username == ""){
        return res.status(400).render("index",{errorMessage:"User cannot be empty"})
    }
    console.log(userInRoom)
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
        const room = new Room(roomId,maxMembers,1)
        addRoom(room)
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
        // addMember(roomId)
        room.members = room.members + 1
        console.log(room);
    }
    else{
        return res.status(400).render("error",{error:"Invalid Request"})
    }


    //generating RSA Keys 
    
    const user = new User(null,username,roomId,creator)
    user.generatreRsaKeys()
    addUser(user)

    //log connection
    writeLog(mode,ip)

    return res.render("chat",{
        username,
        roomId,
        creatorUsername,
        creator,
        publicKey:JSON.stringify(user.rsaKeys.publicKey)
    })
})


router.post("/destruct",(req,res)=>{
    const {id} = req.body
    const user = getUserById(id)
    if(!user){
        return res.render("error",{error:"Invalid Request"})
    }
    if(!user.creator){
        return res.render("index",{errorMessage:"Unauthorized Action, you're kicked!"})
    }
    emitDestructing(user.roomId)
    removeUsersInRoom(user.roomId)
    removeRoom(user.roomId)
    return res.status(200).send()

})


router.get("/chat/test",(req,res)=>{
    res.render("chat",{username:"test"})
})


module.exports = router;