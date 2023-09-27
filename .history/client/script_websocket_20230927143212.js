var ws;
var wsUri = "wss://quiwsth.convolab.ai/linklogic/ws/chatgpt_websocket";
// var wsUri = "wss://presale.amitysolutions.com/linklogic/ws/asap";

function wsConnect() {
    console.log("connect",wsUri);
    ws = new WebSocket(wsUri);
    //var line = "";    // either uncomment this for a building list of messages
    ws.onmessage = function(msg) {
        // bot's chatstripe
        const data = JSON.parse(msg.data)
        if(session_id == data.session_id){
            var lastChild = document.getElementsByClassName("wrapper");
            var lastChildID = lastChild[lastChild.length-1].remove();
            // console.log(lastChildID.id)
            
            const uniqueId = generateUniqueId()
    
            chatContainer.innerHTML += chatStripe(true, '', uniqueId)
            // to focus scroll to the bottom 
            chatContainer.scrollTop = chatContainer.scrollHeight;
    
            // specific message div 
            const messageDiv = document.getElementById(uniqueId)
    
            console.log(msg)
            if(msg){
                clearInterval(loadInterval);
                messageDiv.innerHTML = "";
                const parsedData = data.message.trim() // trims any trailing spaces/'\n' 
                typeText(messageDiv,parsedData,data.lang);
    
            }
            document.getElementById("prompt").disabled = false;
            document.getElementById("prompt").placeholder = "Typing ...";
        }

    }
    ws.onopen = function() {
        // update the status div with the connection status
        // document.getElementById('status').innerHTML = "connected";
        //ws.send("Open for data");
        console.log("connected");
    }
    ws.onclose = function() {
        // update the status div with the connection status
        // document.getElementById('status').innerHTML = "not connected";
        // in case of lost connection tries to reconnect every 3 secs
        setTimeout(wsConnect,3000);
    }
}

function sendmessage(m) {
    if (ws) { ws.send(m); }
}

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let corpus_id_param = params.corpus_id||"asc-001";
let translate = params.translate||"true";
let endpoint = params.endpoint||"botsplus"
let welcome_message = params.welcome_message || "สวัสดีค่ะ หนูคือน้องอารี อยากพูดคุยเรื่องอะไรสามารถพิมพ์ได้ที่ช่องแชทด้านล่างเลยนะค่ะ";
let image_powerby = params.image_powerby || "https://inwfile.com/s-dz/plu2q4.png";  
let session_id = generateUniqueId()
console.log('Session ID : '+ session_id)
let loadInterval

document.addEventListener("DOMContentLoaded", async function(event) { 
    //do work
    console.log('ready')
    wsConnect()
    if(corpus_id_param){
        console.log('corpus id from parameter : '+ corpus_id_param)
    }
    if(endpoint){
        console.log('endpoint from parameter : '+ endpoint)
    }

    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true,'', uniqueId)

    // to focus scroll to the bottom 
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // specific message div 
    const messageDiv = document.getElementById(uniqueId)
    typeText(messageDiv,welcome_message);
    const imagePowerbyDiv = document.getElementById("imagepowerby")
    imagePowerbyDiv.innerHTML += `<img src="${image_powerby}" class="logo"></img>`
    
});


form.addEventListener('keydown', (e) => {
    if (e.keyCode == 13 && !e.shiftKey) {
        const propmtStype = document.getElementById("prompt")
        propmtStype.style.height = "40px"
        handleSubmit(e)
    }
    // if (e.keyCode === 13) {
    //     handleSubmit(e)
    // }
})

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        // Update the text content of the loading indicator
        element.textContent += '.';

        // If the loading indicator has reached three dots, reset it
        if (element.textContent === '....') {
            element.textContent = '';
        }
    }, 300);
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${(isAi)?'ai lighter shadow-sm':'user darker shadow-sm '}">
            <div class="${(isAi)?'chat':'chat-user'}">
                <div class="profile ${(isAi)?'':'shadow-sm'}">
                    <img 
                      src=${isAi ? 'https://upload.convolab.ai/amitybotplus/img/bot.png' : 'https://s3.amazonaws.com/upload.convolab.ai/amitybotplus/img/techsource.png'} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message${(isAi)?'-bot':''}" id="${uniqueId}">${value}</div>
            </div>
        </div>
    `
    )
}

function urlify(text) {
    let urlRegex = /(http(s?):\/\/[^\s]+)/g;
    let imgRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png)/g
    let res_text = text

    if(res_text.match(imgRegex)){
        res_text = res_text.replace(imgRegex, function(url) {
            return `<br>!link<img src="${url}" class="image-message"/>!link<br>`;
        })
    }

    if(res_text.match(urlRegex)){
        res_text =  res_text.replace(urlRegex, function(url) {
            if(!url.match(imgRegex)){
                return `!link<span style="display:inline;" ><a href="${url}">${url}</a></span>!link`;
            }else{
                return url
            }
        })
    }
    return res_text
}

function isOpen(ws) { return ws.readyState === ws.OPEN }

async function typeText(element, text , lang) {
    let speed = (lang == 'en')?10:10
    text = urlify(text)
    // Split the message into lines
    const lines = text.split('\n');
    console.log(lines)
    // Check if the message contains the table delimiter character
    let mode = 'text' // text, table, code, link
    for await(let text of lines){
        if(mode == 'text'){
            
            if (text.includes('|')) {
                console.log('find |')
                // Find the index of the first non-empty line after the delimiter
                const startIndex = lines.findIndex(line=> line == text);
                const headerRow = lines[startIndex];
                
                // console.log('header line',headerRow)
                // Check if the next line is a table header row
                if (headerRow.includes('|') && headerRow.trim().endsWith('|')) {
                    const beforeThisLine = (startIndex==0)?lines[startIndex]:lines[startIndex-1];
                    console.log(beforeThisLine)
                    const isHeaderRow = (beforeThisLine.includes('|') && /^[\s|:-]*$/.test(beforeThisLine.trim()));
                    if (isHeaderRow) {
                        console.log('Table detected');
                        mode = 'table'
                        
                        element.innerHTML = element.innerHTML.replace(lines[startIndex-2],'')
                        element.innerHTML = element.innerHTML.replace(lines[startIndex-1],'')
                        element.innerHTML = element.innerHTML.replace(lines[startIndex],'')
                        element.innerHTML = element.innerHTML.trim()

                        let tableTag = element.appendChild(document.createElement('table'))
                        tableTag.className = "table table-light table-striped"
                        let theadTag = tableTag.appendChild(document.createElement('thead'))
                        let TrTag = theadTag.appendChild(document.createElement('tr'))
                        const headerCells = lines[startIndex-2].trim().split('|');
                        let maxLengthCells = headerCells.filter(word => word.trim().length !== 0).length;
                        for (const cell of headerCells) {
                            if (cell.trim() !== '') {
                                let thTag = TrTag.appendChild(document.createElement('th'))
                                let getIndexCells = headerCells.findIndex(text=>text == cell)
                                if(getIndexCells==1){
                                    thTag.style = "border-top-left-radius:10px;"
                                }
                                if(getIndexCells==maxLengthCells){
                                    thTag.style = "border-top-right-radius:10px;"
                                }

                                // thTag.style += " border-top-right-radius:10px;"
                                let cellText = cell.trim();
                                console.log(cellText)
                                await new Promise(resolve =>{
                                    let index = 0;
                                    let interval = setInterval(() => {
                                        let enText = cellText.split('')
                                        let maxLength = enText.length
                                        if (index < maxLength) {
                                            thTag.textContent += enText[index];
                                            index++;
                                            // to focus scroll to the bottom 
                                            chatContainer.scrollTop = chatContainer.scrollHeight;
                                        } else {
                                            resolve('done')
                                            clearInterval(interval)
                    
                                        }
                                    }, speed)
                                })
                                
                            }
                        }
                        tableTag.appendChild(document.createElement('tbody'))
                    }
                    
                }
            }
            if(text.includes('!link')){
                mode = 'link'
                element.innerHTML = element.innerHTML.trim()
            }
            await new Promise(resolve =>{
                let index = 0;
                let interval = setInterval(() => {
                    
                    let enText = text.split('')
                    let maxLength = enText.length

                    if (index < maxLength && mode == 'text') {
                        element.innerHTML += enText[index];
                        index++;
                        // to focus scroll to the bottom 
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    }else {
                        resolve('done')
                        clearInterval(interval)

                    }
                }, speed)
                
            }) 
            if(mode == 'text'){
                console.log('new line')
                element.innerHTML += '\n'
            }
            
        }
        if(mode == 'table'){
            let tableTag = element.getElementsByTagName('table')[element.getElementsByTagName('table').length-1];
            let tbodyTag = element.getElementsByTagName('tbody')[element.getElementsByTagName('tbody').length-1];
            if (text.includes('|')) { 
                let trTag = tbodyTag.appendChild(document.createElement('tr'))
                let cells = text.split('|')
                for (const cell of cells) {
                    if (cell.trim() !== '') {
                        let tdTag = trTag.appendChild(document.createElement('td'))
                        let cellText = cell.trim();
                        console.log(cellText)
                        await new Promise(resolve =>{
                            let index = 0;
                            let interval = setInterval(() => {
                                let enText = cellText.split('')
                                let maxLength = enText.length
                                if (index < maxLength) {
                                    tdTag.textContent += enText[index];
                                    index++;
                                    // to focus scroll to the bottom 
                                    chatContainer.scrollTop = chatContainer.scrollHeight;
                                } else {
                                    resolve('done')
                                    clearInterval(interval)
            
                                }
                            }, speed)
                        })
                    }
                }

            }else{
                mode = 'text'
                let lastTrTag = element.getElementsByTagName('tr')[element.getElementsByTagName('tr').length-1]
                let tdInTrTage = lastTrTag.getElementsByTagName('td')
                tdInTrTage[0].style = "border-bottom-left-radius:10px;"
                tdInTrTage[tdInTrTage.length-1].style = "border-bottom-right-radius:10px;"
            }
        }
        if(mode == 'link'){
            element.innerHTML = element.innerHTML.trim()
            element.innerHTML += text.split('!link').join(' ')
            element.innerHTML += '\n'
            mode = 'text'
        }
    }
}

const handleSubmit = async (e) => {
    e.preventDefault()
    const data = new FormData(form)
    // let message = data.get('prompt').split('\n').join('')
    let message = data.get('prompt')
    document.getElementById("prompt").disabled = true;
    document.getElementById("prompt").placeholder = "On processing...";
    if(message.length > 0){
        // user's chatstripe
        chatContainer.innerHTML += chatStripe(false, message, 'user')
        // to focus scroll to the bottom 
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // to clear the textarea input 
        // form.reset()
        document.getElementById("prompt").value = "";

        setTimeout(async () => {

            // bot's chatstripe
            const uniqueId = generateUniqueId()
            chatContainer.innerHTML += chatStripe(true,' ', uniqueId)

            // to focus scroll to the bottom 
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // specific message div 
            const messageDiv = document.getElementById(uniqueId)
            // messageDiv.innerHTML = "..."
            loader(messageDiv)
            // fetch data from server
            try{    
                let corpus_id = corpus_id_param
                console.log(`Send message to endpoint ${endpoint} with corpus id ${corpus_id}`)
                // if(corpus_id_param){
                //     corpus_id = corpus_id_param
                //     console.log('corpus id from parameter : '+ corpus_id)
                // }else{
                //     corpus_id = (data.get('corpus'))?data.get('corpus'):'lotus-001';
                //     console.log('message to corpus id : '+ corpus_id)
                // }
                if(isOpen(ws)){
                    sendmessage(
                        JSON.stringify({
                            question: message,
                            session_id: session_id,
                            corpus_id : corpus_id,
                            endpoint : endpoint,
                            translate : translate
                        })
                    )
                }else{
                    wsConnect()
                    sendmessage(
                        JSON.stringify({
                            question: message,
                            session_id: session_id,
                            corpus_id : corpus_id,
                            translate : translate
                        })
                    )

                }
                
                
            }catch (e){
                setTimeout(async () => {
                    clearInterval(loadInterval);
                    // console.log(e)
                    messageDiv.innerHTML = "";
                    typeText(messageDiv,"Something went wrong" , "en");
                    // alert(e);
                },100)                
            }
        }, 1500);
    }
    
}
