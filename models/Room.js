module.exports = class Room{
    constructor(roomId,maxMembers,members) {
        this.roomId = roomId;
        this.maxMembers = maxMembers;
        this.members = members;
        this.keys = []
    }   

  
}