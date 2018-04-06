
const gcs = require('@google-cloud/storage')();
const separator = '_|_';

const bucket = gcs.bucket('logger-260e7.appspot.com');

const getAllFiles = (prefix) => {
    const options = {
        prefix: prefix || "",
      };

    return bucket.getFiles(options)
        .then(results => {
            return results[0];
        });
};

const combineAllFiles = (filename) => {
    return getAllFiles(filename).then((data)=>{
        data = data.map(x => x.name);
        data = data.filter(name => !name.includes('final'));

        // get first 32 files for now
        if(data.length === 1){    
            return bucket.file(data[0]).move(filename + 'final.txt')
                .then(x => x[0]);
        }
        data = data.slice(0, 30);

        const sourceFiles = data.map( name => bucket.file(name));

        return bucket.combine(
            sourceFiles,
            bucket.file(filename + 'final.txt')
        ).then(data => {
            return data[0];
        }).catch(e => {
            return bucket.combine(
                sourceFiles,
                bucket.file(filename + 'final.txt')
            ).then(data => {
                return data[0];
            }).catch(e => { 
                throw new Error(e)
            });
        });
    });
};

const combineAllFilesToFinal = () => {
    
    
    return getAllFilesFromStream().then((data) => {
        let uniqueFiles = {};
        

        data = data.filter(file => !file.name.includes('final'));

        data.forEach(file => {
            const parts = file.name.split(separator);
            const key = [parts[0], parts[1], parts[2]].join(separator);
            uniqueFiles[key] = true
        });
        return Object.keys(uniqueFiles);
    }).then(fileNames => {
        setTimeout((data) => {
            var count = fileNames.length;
            fileNames.forEach(name => {
                // console.log(name);
                --count;
                setTimeout(()=>{
                    combineAllFiles(name).then(file => {
                        console.log(file.name, " now deleting");
                        
                        deleteExtraFiles(name);
                        
                    });
                }, 5000 * (fileNames.length - count));
            });    
        });

        return "will be done after " + fileNames.length * 5 /60 + "minutes";
    });

}

const deleteExtraFiles = (name) => {
    name = name || "";
    return getAllFilesFromStream(name).then((data) => {
        data = data.filter(file => !file.name.includes('final'));

        return data.map(x => x.name);
    }).then((fileNames) => {
        let count  = fileNames.length;
        fileNames.forEach( name => {
            bucket.file(name).delete().then(x => console.log(--count)).catch(e => {
                bucket.file(name).delete().then(x => console.log(--count));
            });
        });
    });
}

const deleteOldFiles = () => {
    return getAllFilesFromStream().then((data) => {
        const now = Date.now(),
         oneweek = 7 * 24 * 60 * 60 * 1000;
        data = data.filter(file => {
            const name = file.name;
            const timestamp = Number(name.split(separator)[2]);
            return timestamp + oneweek < now;
        });
        return data.map(x => x.name);
    }).then((fileNames) => {
        let count  = fileNames.length;
        fileNames.forEach( name => {
            --count;
            const run = () => {
                const x = count;
                setTimeout( () => {
                    bucket.file(name).delete().then(() => console.log(x));
                }, 50 * (fileNames.length - count));
            };
            run();
        });
        return "will be done after " + fileNames.length * 0.05 /60 + "minutes";
    });
}

const renameAllFiles = () => {
    return getAllFilesFromStream().then((data) => {
        data = data.filter(file => file.name.includes('final'));
        return data.map(x => x.name);
    }).then((fileNames) => {
        let count  = fileNames.length;
        fileNames.forEach( name => {
            --count;
            const run = () => {
                const x = count;
                setTimeout( () => {
                    bucket.file(name).move(name.replace('final', '_|_0')).then(() => console.log(x));
                }, 50 * (fileNames.length - count));
            };
            run();
        });
        return "will be done after " + fileNames.length * 0.05 /60 + "minutes";
    });
}

const getAllFilesFromStream = (prefix) => {
    const options = {
        prefix: prefix || ''
    };
    let files = [];
    return new Promise( (resolve, reject) => {
        bucket.getFilesStream(options)
        .on('error', (e) => {
            console.error(e);
            reject(e);
        })
        .on('data', (file) => {
            files.push(file);
        })
        .on('end', () => {
            resolve(files);
        });
    }); 
    
};

let storage = {
    getLog : () => {
        const options = {
            action: 'read',
            expires: '03-17-2025',
        };
        return bucket.file('test.txt').getSignedUrl(options)
        .then(results => {
          const url = results[0];
    
          console.log(`The signed url for ${filename} is ${url}.`);
          return url;
        });
    },
    getFile: (filename) => {
        filename = filename || "test";
        if(!filename.includes(".txt")) filename = filename + '.txt';
        return bucket.file(filename).createReadStream();
    },
    downloadFile: (filename) => {
        filename = filename || "test";
        if(!filename.includes(".txt")) filename = filename + '.txt';
        return bucket.file(filename).download().then((data) =>{
            return data[0];
          });
    },
    getAllFiles: getAllFiles,
    combineAllFiles: combineAllFiles,
    getAllFilesFromStream: getAllFilesFromStream,
    combineAllFilesToFinal: combineAllFilesToFinal,
    deleteOldFiles: deleteOldFiles,
    renameAllFiles: renameAllFiles
};



module.exports = storage;