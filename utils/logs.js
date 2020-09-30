const moment = require("moment")
const fs = require("fs")

const writeLog = (mode,ip,msg=null)=>{
    const log = `\n[${mode}] ${moment().format()} [${ip}] ${msg?"[Message]: "+msg:""}`; 
    try{
        fs.writeFileSync("logs.txt",log,{flag:"a"})
    }
    catch(err){
        console.log(err) 
    }
}

module.exports = writeLog;