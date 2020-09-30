
const Room = require("../models/Room");
const {removeUsersInRoom} = require("./users")

let rooms = []


/**
 * @returns {[Room]} return rooms
 */
function getRooms(){
    return rooms;
}


/**
 * 
 * @param {Room} room add room to the list
 */
function addRoom(room){
    rooms.push(room)
}


function addMember(roomId){
    rooms = rooms.map(room=>{
        if(room.roomId == roomId){
            return {
                ...room,
                members: room.members+1
            }
        }
        else{
            return room
        }
    })
}

// remove the room if it's empty
function removeMember(roomId){
    let newRooms = []
    for(let room of rooms){
        if(room.roomId == roomId){
            if(room.members !== 1){
                newRooms = [...newRooms,{...room,members:room.members-1}]
            }
        }
    }
    rooms = newRooms
}

/**
 * 
 * @param {String} roomId 
 * @returns {Room} return Room Object
 */
function getRoomById(roomId){
    return rooms.find(room=>room.roomId === roomId)
}

function removeRoom(roomId){
    //remove users in room
    if(!getRoomById(roomId)){
        return false
    }
    // console.log(removeUsersInRoom)
    // removeUsersInRoom(roomId)
    rooms = rooms.filter(room=>room.roomId !== roomId)
    return true
}

function getRoomKeys(roomId){
    return (rooms.find(room=>room.roomId === roomId).keys)
}

function getOthersSecret(roomId,username){
    return (rooms.find(room=>room.roomId === roomId)
    .keys
    .filter(key=>key.username !== username))
}

function addKey(AESKeys,username,roomId){
    rooms = rooms.map(room=>{
        if(room.roomId === roomId){
            return {...room,keys:[...room.keys,{username,AESKeys}]}
        }
        return room
    })
}

function getUserAESKeys(roomId,username){
    return rooms.find(room=>room.roomId === roomId)
    .keys
    .find(key=>key.username === username)
    .AESKeys
}

module.exports={
    getRooms,
    addRoom,
    addMember,
    getRoomById,
    removeRoom,
    removeMember,
    getRoomKeys,
    getOthersSecret,
    addKey,
    getUserAESKeys
}