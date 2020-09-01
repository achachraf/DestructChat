const dns = require("dns")
const dnsPromises = dns.promises;

module.exports = async (req,res,next)=>{
    const ip = req.connection.remoteAddress.replace("::ffff:","")
    // console.log("my ip:"+ip)
    const result = await dnsPromises.lookup("secretchat12345.ddns.net")
    // console.log("dns:"+result.address)
    const auths = ["::1","127.0.0.1",result.address]
    if(!auths.includes(ip)){
        return res.status(400).render("error",{error:"Unauthorized Request"})
    }
    next()
}