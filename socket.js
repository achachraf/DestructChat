const {
  updateUser,
  addUser,
  userPOSTED,
  getUserById,
  userExist,
  removeUser,
  getUserPrivateKey,
  getCreator,
  isCreator,
  getUserByUsername,
  getUsersByRoomId,
  removeUsersInRoom,
  getUsers,
  removeUserByUsername,
  clearInexistUsers
  
} = require("./data/users");
const { formatMessage } = require("./utils/formatMessage");

const {getOthersSecret, getRoomKeys,addKey, getUserAESKeys, removeRoom} = require("./data/rooms")

const {encryptOthersSecret,getSecretAES,encryptBotMessage,isAESKeys} = require("./utils/customCrypto")

const {isIpExist,setIp,getIp,isBanned, antiSpam} = require("./data/connections");
const writeLog = require("./utils/logs");

let socketId;

function getScoketId() {
  return socketId;
}

let ioSocket;

let connections = new Map()

const runsocket = (io) => {
  ioSocket = io;
  io.on("connection", (socket) => {
    console.log("new WS Connection: " + socket.id);
    // console.log("socket ip : " + socket.handshake.address)
    
    let joiningTimeout
    socket.on("sendUsername",({username,roomId})=>{
      joiningTimeout = setTimeout(()=>{
        socket.emit("alert", "You're trying to access chat from insecure contexte")
        socket.disconnect()
        // clearInexistUsers()
        removeUserByUsername(username,roomId)
      },5000)
    })

    //timeout for the insecure connections
   
    socket.on("join", async (user) => {

      //clear timeout (yout don't say)
      clearTimeout(joiningTimeout)

      //check & init antiSpam 
      let ip = socket.handshake.address.replace("::ffff","")
      if(isIpExist(ip)){
        if(isBanned(ip)){
          socket.emit("alert","This IP is banned")
          socket.disconnect()
          return;
        }
      }
      setIp(ip,{count:0,time:null,banned:false})

      const {username,id,roomId,encryptedAESKeys} = user;

      console.log(`User Connected (${username},${id},${roomId})`);
      
      //POST Verification
      if (!userPOSTED(user)) {
        socket.emit(
          "message",
          formatMessage("BotMessage", `You can't Join! Disconnecting...`)
        );
        socket.emit("alert","Malicious activity has been detected, disconnecting.")
        socket.disconnect(true);
        console.log("disconnecting Hacker!");

        //log message
        writeLog("None",ip,"Hacker Detected")
      } 
      // if user exist in room
      else if (userExist(user)) {
        socket.disconnect(true);
        console.log("User exist already!, disconnecting...");
      } 
      else {
        const privateKey = getUserPrivateKey(username,roomId)
        const AESKeys = getSecretAES(encryptedAESKeys,privateKey)
        if(!AESKeys || !isAESKeys(AESKeys)){
          socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
          socket.disconnect()
          writeLog("None",ip,"Security Error - Level 1")
          return 
        }
        
        addKey(AESKeys,username,roomId)
        const othersSecret = getRoomKeys(roomId)
        const encryptedOthersSecret = encryptOthersSecret(othersSecret,AESKeys)

        if(!encryptedOthersSecret){
          socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
          socket.disconnect()
          writeLog("None",ip,"Security Error - Level 2")
          return 
        }

        socket.emit("secrets",encryptedOthersSecret)
        
        if(!isCreator(username,roomId)){
          let creator = getCreator(roomId)
          const creatorAESKeys = getUserAESKeys(roomId,creator.username)
          const creatorEncryptedOthersSecret = encryptOthersSecret(othersSecret,creatorAESKeys)

          if(!creatorEncryptedOthersSecret){
            socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
            socket.disconnect()
            writeLog("None",ip,"Security Error - Level 3")
            return 
          }

          socket.broadcast.to(roomId).emit("secrets",creatorEncryptedOthersSecret)

          //broadcast joining if it's not the creator
          const encryptedJoin = encryptBotMessage(`${username} Has joined the room`,creatorAESKeys)
          if(!encryptedJoin){
            socket.emit("alert","An error has occured when decrypting DATA, Disconnecting!")
            writeLog("None",ip,"Security Error - Level 4")
            socket.disconnect()
            return 
          }
          socket.broadcast
          .to(roomId)
          .emit(
            "joiningMessage",
            formatMessage("BotMessage",encryptedJoin )
          );

        }

        //updating the user (giving him the id)
        const newUser = getUserByUsername(username,roomId);
        newUser.id = id;
      
        // updateUser(user,othersSecret);
        socket.join(roomId);
        

        //Hello message
        const encryptedWelcome = encryptBotMessage(`Welcome ${username} to the room`,AESKeys)
        if(!encryptedWelcome){
          socket.emit("alert","An error has occured when decrypting DATA, Disconnecting!")
          socket.disconnect()
          writeLog("None",ip,"Security Error - Level 5")
          return 
        }
        socket.emit(
          "welcomeMessage",
          formatMessage("BotMessage",encryptedWelcome )
        );
       

        //Decrypting error
        //only the creator can disconnect users
        if(isCreator(username,roomId)){
          socket.on("securityError",(username,roomId)=>{
            const user = getUserByUsername(username,roomId)
            ioSocket.sockets.sockets[user.id].emit("alert","You don't follow the security rules, disconnecting.")
            disconnectSocket(user.id)
            writeLog("None",ip,"Security Error - Level 6")
          })
        }

        //typing
        socket.on("typing",username=>{
          socket.broadcast.to(roomId).emit("typing",username)
        })

        //Broadcast exiting
        socket.on("disconnect", () => {
          if(isCreator(username)){
            
            //emitting destructing
            socket.broadcast.to(roomId).emit("alert","Room has been destroyed by the creator ! ")
            socket.emit("alert","Your Room has been destroyed")

            const users = getUsersByRoomId(user.roomId)
            for(let usr of users){
                if(usr.id !== id)
                disconnectSocket(usr.id)
            }
            removeUsersInRoom(roomId)
            removeRoom(roomId)
            console.log("Room destructed !")
          }
          else{
            let creator = getCreator(roomId)
            const creatorAESKeys = getUserAESKeys(roomId,creator.username)
            io.to(roomId).emit(
              "exittingMessage",
              formatMessage("BotMessage", encryptBotMessage(`${username} Has exited the room`,creatorAESKeys))
            );
            removeUser(id);
            socket.broadcast.to(roomId).emit("userLeave",username)
            console.log(`${username} disconnected`);
          }
         
        });

        socket.on("message", (msg) => {
          //the msg is encrypted here, and no need to decrypt
          const data = formatMessage(username, msg);
          io.to(roomId).emit("message", data);
          antiSpam(ip,socket)
        });
      }
      
    });
  });

  
};  

const disconnectSocket = (id) => {
  ioSocket.sockets.sockets[id.trim()].disconnect();
};

const emitDestructing = (roomId) =>{
  const creator = getCreator(roomId)
  ioSocket.sockets.sockets[creator.id.trim()].emit("alert","Your Room has been destroyed")
  disconnectSocket(creator.id)

}

const emitAlert = (id,message)=>{
  const socket = ioSocket.sockets.sockets[id.trim()];
  if(socket){
    socket.emit("alert",message)
  }
  else{
    console.log("id not found");
  }

}


module.exports = {
  runsocket: runsocket,
  disconnectSocket,
  emitDestructing,
  emitAlert
};
