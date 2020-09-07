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
    if(diff > 60*1000){
        return true
    }
    return false
}

const unBan = (ip)=>{
    connections.set(ip,{time:null,count:0,banned:false})
}

module.exports = {
    isIpExist,
    setIp,
    getIp,
    isBanned,
    isBanDone,
    unBan
}