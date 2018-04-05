
const apiUrl = 'https://us-central1-logger-260e7.cloudfunctions.net/widgets/';
// const apiUrl = 'http://localhost:3001/logger-260e7/us-central1/widgets/';





// fetch(apiUrl + 'get/948l4g8yg8d04ze8_|_RM028faf997a93492be5d3bdb9f07e01df_|_1521471282506')
//     .then(x => {
        
//         x.text().then(y => console.log(y));
//     });


function getAllLogs(){
    tableBody.innerHTML = '';
    const guid = document.getElementById('userGuid').value;
    const roomSid = document.getElementById('roomSid').value;
    if(!guid && !roomSid){
        return;
    }
    if(guid){
        if(roomSid){
            fetch(apiUrl + `getLog/jid/${guid}/roomSid/${roomSid}`, {
              method: 'GET',
              mode: 'cors'
            })
            .then(x => {
                x.json().then(showAllLogs);
            });
        }else{
            fetch(apiUrl + `getLog/jid/${guid}`, {
                method: 'GET',
                mode: 'cors'
              })
            .then(x => {
                x.json().then(showAllLogs);
            });
        }
    }else{
        fetch(apiUrl + `getLog/roomSid/${roomSid}`, {
            method: 'GET',
            mode: 'cors'
          })
        .then(x => {
            x.json().then(showAllLogs);
        });
    }
}

const tableBody = document.getElementById('table-body');
const columns = ['jid', 'roomSID', 'timestamp', 'url'];
function showAllLogs(data){
    console.log(data);
    
    let template = data.result.map(row => {
        return `<tr>
        ${
            columns.map(key=>{
                let value = row[key];
                if(key === 'timestamp') value = new Date(value);
                if(key === 'url') value = `<a href=${value} target="_blank">${value}</a>`;
                return `<td>${value}</td>`;
            }).join('')
        }
        </tr>`;
    }).join('');
    
    tableBody.innerHTML = template;
}