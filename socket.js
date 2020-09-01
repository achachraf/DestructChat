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
  removeUsersInRoom
  
} = require("./data/users");
const { formatMessage } = require("./utils/formatMessage");

const {getOthersSecret, getRoomKeys,addKey, getUserAESKeys, removeRoom} = require("./data/rooms")

const {encryptOthersSecret,getSecretAES,encryptBotMessage,isAESKeys} = require("./utils/customCrypto")

let socketId;

function getScoketId() {
  return socketId;
}

let ioSocket;

const runsocket = (io) => {
  ioSocket = io;
  io.on("connection", (socket) => {
    console.log("new WS Connection: " + socket.id);
    socket.on("join", async (user) => {
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
      } 
      else if (userExist(user)) {
        socket.disconnect(true);
        console.log("User exist already!, disconnecting...");
      } 
      else {

        const privateKey = getUserPrivateKey(username)
        const AESKeys = getSecretAES(encryptedAESKeys,privateKey)
        if(!AESKeys || !isAESKeys(AESKeys)){
          socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
          socket.disconnect()
          return 
        }
        
        addKey(AESKeys,username,roomId)
        const othersSecret = getRoomKeys(roomId)
        const encryptedOthersSecret = encryptOthersSecret(othersSecret,AESKeys)

        if(!encryptedOthersSecret){
          socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
          socket.disconnect()
          return 
        }

        socket.emit("secrets",encryptedOthersSecret)
        
        if(!isCreator(username)){
          let creator = getCreator(roomId)
          const creatorAESKeys = getUserAESKeys(roomId,creator.username)
          const creatorEncryptedOthersSecret = encryptOthersSecret(othersSecret,creatorAESKeys)

          if(!creatorEncryptedOthersSecret){
            socket.emit("alert","Error in configuring securtiy layers, Disconnecting!")
            socket.disconnect()
            return 
          }

          socket.broadcast.to(roomId).emit("secrets",creatorEncryptedOthersSecret)

          //broadcast joining if it's not the creator
          const encryptedJoin = encryptBotMessage(`${username} Has joined the room`,creatorAESKeys)
          if(!encryptedJoin){
            socket.emit("alert","An error has occured when decrypting DATA, Disconnecting!")
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
        updateUser(user,othersSecret);
        socket.join(roomId);
        

        //Hello message
        const encryptedWelcome = encryptBotMessage(`Welcome ${username} to the room`,AESKeys)
        if(!encryptedWelcome){
          socket.emit("alert","An error has occured when decrypting DATA, Disconnecting!")
          socket.disconnect()
          return 
        }
        socket.emit(
          "welcomeMessage",
          formatMessage("BotMessage",encryptedWelcome )
        );
       

        //Decrypting error
        if(isCreator(username)){
          socket.on("decryptError",cibledUser=>{
            const user = getUserByUsername(cibledUser)
            ioSocket.sockets.sockets[user.id].emit("alert","You don't follow the security rules, disconnecting.")
            disconnectSocket(user.id)
          })
        }

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



module.exports = {
  runsocket: runsocket,
  disconnectSocket,
  emitDestructing
};
