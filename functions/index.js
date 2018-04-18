
const functions = require('firebase-functions');
const express = require('express');
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const cors = require('cors');
const fs = require('fs');
const CombinedStream = require('combined-stream');
const storage = require('./storage.js');

const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin:true}));
app.use(require('express-promise')());

const downloadUrl = 'https://us-central1-logger-260e7.cloudfunctions.net/widgets/get/';
const separator = "_|_";

// build multiple CRUD interfaces:
app.get('/log', (req, res) => {
    storage.uploadTest().then(e => {
        console.error(e);
        res.send(e);
        return;
    }).catch(e => {
        console.error(e);
        res.send(e);
        return;
    });
    // res.send("done")
});

// i50if6m05km54kvm_|_RMc41111049f4c7d5c743cae9c3f474c1b_|_1521630322898_|_0.txt



app.get('/getFile/:fileName', (req, res) => {
    
    // storage.combineAllFiles().then(stream => {
        
    //     stream.on('error', (err) => {
    //         res.send(err);
    //     })
    //     .on('response', (response) => {
    //     // Server connected and responded with the specified status and headers.
    //     })
    //     .on('end', () => {
    //     // The file is fully downloaded.
    //     }).pipe(res);
        
    //     return;
    // }).catch(err => res.send(err));
    storage.getFile(req.params.fileName)
        .on('error', (err) => {
            res.send(err);
        })
        .on('response', (response) => {
        // Server connected and responded with the specified status and headers.
        })
        .on('end', () => {
        // The file is fully downloaded.
        }).pipe(res);


    // storage.downloadFile(req.params.fileName)
    //     .then(data => {console.log(data);return res.send(data)})
    //     .catch(data => res.send(data));
});


app.get('/allfiles', (req, res) => {
    console.log("thsdngjsd n");
    storage.getAllFiles()
        .then((data)=>{
            res.send(data.map(x => x.name));
            return;
        }).catch(e => res.send(e));
});

const mapData = (data) => {
    let uniqueFiles = {};

    data.sort((a, b) => {
        a = a.replace('.txt', '');
        b = b.replace('.txt', '');
        const x = a.split(separator)[3],
            y = b.split(separator)[3];
        return Number(x) - Number(y);
    });

    data.forEach(name => {
        const parts = name.split(separator);
        uniqueFiles[parts[2]] = {
            roomSid: parts[0],
            jid: parts[1]
        };
    });
    
    return Object.keys(uniqueFiles)
    .sort((a,b) => Number(b)-Number(a))
        .map(timestamp => {
            const {jid, roomSid} = uniqueFiles[timestamp];
            return {
                roomSID: roomSid,
                timestamp: (new Date(Number(timestamp))).toString(),
                url: downloadUrl + [roomSid, jid, timestamp].join(separator),
                jid: jid
            }
        });
}

const getAllFilesFromQuery = (req, res) => {
    const jid = req.params.jid || "";
    const sid = req.params.sid || "";
    const queryString = jid + separator + sid;
    storage.getAllFilesFromStream(queryString)
        .then((data)=>{
            // res.send({data});
            data = data.map(x => x.name)
                .filter(name => !name.includes('final'));

            let result = mapData(data);
            res.send({result,data});
            return;
        }).catch(e => res.send(e));
};

const getAllFilesForRoom = (req, res) => {
    const sid = req.params.sid || "";
    storage.getAllFilesFromStream()
        .then((data)=>{
            data = data.map(x => x.name)
                .filter(name => !name.includes('final') && name.includes(sid));

            let result = mapData(data);
            res.send({result,data});
            return;
        }).catch(e => res.send(e));
};

const getLogFile = (req, res) => {
    const fileName = req.params.fileName;
    storage.combineAllFiles(fileName)
        .then((data) => {
            storage.downloadFile(data.name)
            .then(data => {return res.send(data)})
        // .then(data => data.createReadStream())
        // .then(stream => {
        
        //     stream.on('error', (err) => {
        //         res.send(err);
        //     })
        //     .on('response', (response) => {
        //     // Server connected and responded with the specified status and headers.
        //     })
        //     .on('end', () => {
        //     // The file is fully downloaded.
        //     }).pipe(res);
            
        //     return;
        }).catch(err => res.send(err));
};

const downloadFile = (req, res) => {
    const fileName = req.params.fileName;
    storage.downloadFile(fileName)
        .then(data => {return res.send(data)})
        .catch(data => res.send(data));
};

const combineAllFilesToFinal = (req, res) => {
    storage.combineAllFilesToFinal()
        .then(data => {return res.send(data)})
        .catch(data => res.send(data));
};

const deleteFiles = (req, res) => {

    //DONOT run with out combineAllFilesToFinal. 
    storage.deleteOldFiles()
        .then(data => {return res.send(data)})
        .catch(data => res.send(data));
};

const renameAllFiles = (req, res) => {

    //DONOT run with out combineAllFilesToFinal. 
    storage.renameAllFiles()
        .then(data => {return res.send(data)})
        .catch(data => res.send(data));
};



app.get('/getLog/jid/:jid/roomSid/:sid', getAllFilesFromQuery);
app.get('/getLog/jid/:jid', getAllFilesFromQuery);
app.get('/getLog/roomSid/:sid', getAllFilesForRoom);

app.get('/get/:fileName', getLogFile);
app.get('/download/:fileName', downloadFile);
app.get('/compress', combineAllFilesToFinal);

app.get('/deleteOld', deleteFiles);
app.get('/rename', renameAllFiles);


// Expose Express API as a single Cloud Function:
exports.widgets = functions.https.onRequest(app);

