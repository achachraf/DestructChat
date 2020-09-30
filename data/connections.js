let connections = new Map()

const isIpExist = (ip) =>{
    return connections.has(ip)
}

const setIp = (ip,ipObj)=>{
    connections.set(ip,ipObj)
}

const getIp = (ip)=>{
    return connections.get(ip)
}

const isBanned = (ip)=>{
    let ipObj = connections.get(ip)
    if(ipObj) 
        return ipObj.banned
    return false
}

const isBanDone = (ip)=>{
    let ipObj = connections.get(ip)
    let diff = (new Date()).getTime() - ipObj.time
    let min = 1 //change this to specify how the ip will be banned
    if(diff > min*60*1000){
        return true
    }
    return false
}

const unBan = (ip)=>{
    connections.set(ip,{time:null,count:0,banned:false})
}

const antiSpam = (ip,socket)=>{
    if(ip){
        let ipObj = getIp(ip)
        let {time,count} = ipObj
        if(count === 0 ){
          let now = (new Date()).getTime()
          setIp(ip,{...ipObj,time:now,count:1})
        }
        else if(count === 8){
          let diff = ((new Date()).getTime() - time)
          if(diff < 5000){
            setIp(ip,{...ipObj,banned:true})
            socket.emit("alert","Spam detected")
            socket.disconnect()
          }
          else{
            setIp(ip,{...ipObj,time:null,count:0})
          }              
        }
        else{
          setIp(ip,{...ipObj,count:count+1})
        }
      }
}

module.exports = {
    isIpExist,
    setIp,
    getIp,
    isBanned,
    isBanDone,
    unBan,
    antiSpam
}