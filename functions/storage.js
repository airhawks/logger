
const gcs = require('@google-cloud/storage')();


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
    uploadTest: () =>{
        return bucket.upload('/Users/amit.dh/Desktop/flock_dev/logger/functions/test.txt');
    },
    getAllFiles: getAllFiles,
    combineAllFiles: (filename) => {
        return getAllFiles(filename).then((data)=>{
            data = data.map(x => x.name);
            data = data.filter(name => !name.includes('final'));

            if(data.length === 1){    
                return bucket.file(data[0]).createReadStream();
            }
            
            const sourceFiles = data.map( name => bucket.file(name));

            return bucket.combine(
                sourceFiles,
                bucket.file(filename + 'final.txt')
            ).then(data => {
                return data[0].createReadStream();
            }).catch(e => {
                throw new Error(e)
            });
        });
    }
};



module.exports = storage;