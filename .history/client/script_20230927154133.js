const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let corpus_id_param = params.corpus_id;
let session_id = generateUniqueId()
console.log('Session ID : '+ session_id)
let loadInterval

document.addEventListener("DOMContentLoaded", async function(event) { 
    //do work
    console.log('ready')
    
    if(corpus_id_param){
        console.log('corpus id from parameter : '+ corpus_id_param)
        document.getElementById('corpus').value=corpus_id_param;
    }
});


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

function typeText(element, text) {
    let index = 0;
    // text = urlify(text)
    // console.log(text)
    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            // to focus scroll to the bottom 
            chatContainer.scrollTop = chatContainer.scrollHeight;
        } else {
            clearInterval(interval)
        }
    }, 20)
}

// generate unique ID for each message div of bot
// necessary for typing text effect for that specific reply
// without unique ID, typing text will work on every element
function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${(isAi)?'ai lighter shadow-sm':'darker shadow-sm border border-dark'}">
            <div class="chat">
                <div class="profile">
                    <img 
                      src=${isAi ? 'https://e7.pngegg.com/pngimages/791/512/png-clipart-user-profile-computer-icons-internet-bot-others-miscellaneous-monochrome.png' : 'https://upload.convolab.ai/rdprod-02%2F85d160f0-ae26-4a41-bafd-ce0f87124562.png'} 
                      alt="${isAi ? 'bot' : 'user'}" 
                    />
                </div>
                <div class="message" id="${uniqueId}">${value}</div>
            </div>
        </div>
    `
    )
}

function makeRequestWithExponentialBackoff(url,options,element,retries = 0) {
    let promise = new Promise(function(resolve, reject) {
        const maxRetries = 5;
        const initialDelay = 1000; // in milliseconds
        const delay = Math.pow(2, retries) * initialDelay;
        
        setTimeout(() => {
            fetch(url,options)
                .then(response => {
                    if (response.ok) {
                        // handle successful response
                        console.log('Request successful!');
                        resolve(response.json())
                    } else {
                        // handle unsuccessful response
                        if (retries < maxRetries) {
                            // retry the request with exponential backoff
                            console.error('Retry : '+ retries);
                            makeRequestWithExponentialBackoff(url,options ,retries + 1);
                        } else {
                            console.error('Max retries reached. Request failed.');
                            reject(new Error('fail'))
                        }
                    }
                })
                .catch(error => {
                    // handle network error
                    if (retries < maxRetries) {
                        // retry the request with exponential backoff
                        console.error('Retry : '+ retries);
                        makeRequestWithExponentialBackoff(url,options ,retries + 1);
                    } else {
                        console.error('Max retries reached. Request failed.');
                        reject(new Error('fail'))
                    }
                });
        }, delay);
      })

    return promise;
}
  

const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData(form)
    let message = data.get('prompt').split('\n').join('')
    if(message.length > 0){
        // user's chatstripe
        chatContainer.innerHTML += chatStripe(false, message)
        // to focus scroll to the bottom 
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // to clear the textarea input 
        // form.reset()
        document.getElementById("prompt").value = "";

        setTimeout(async () => {

            // bot's chatstripe
            const uniqueId = generateUniqueId()
            chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

            // to focus scroll to the bottom 
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // specific message div 
            const messageDiv = document.getElementById(uniqueId)
            const retryMax = 5
            // messageDiv.innerHTML = "..."
            loader(messageDiv)
            // fetch data from server
            try{    
                let corpus_id
                if(corpus_id_param){
                    corpus_id = corpus_id_param
                    console.log('corpus id from parameter : '+ corpus_id)
                }else{
                    corpus_id = (data.get('corpus'))?data.get('corpus'):'lotus-001';
                    console.log('message to corpus id : '+ corpus_id)
                }

                makeRequestWithExponentialBackoff('https://quiwsth.convolab.ai/linklogic/gpt_main', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question: message,
                        session_id: session_id,
                        corpus_id : corpus_id
                    })
                },messageDiv)                
                .then((res) =>{
                    if(res){
                        clearInterval(loadInterval);
                        messageDiv.innerHTML = "";
                        const parsedData = res.intent.trim() // trims any trailing spaces/'\n' 
                        typeText(messageDiv,parsedData);
                    }
                }).catch(err=>{
                    setTimeout(async () => {
                        clearInterval(loadInterval);
                        // console.log(e)
                        messageDiv.innerHTML = "";
                        typeText(messageDiv,"Something went wrong");
                        // alert(e);
                    },100)   
                })
            }catch (e){
                setTimeout(async () => {
                    clearInterval(loadInterval);
                    // console.log(e)
                    messageDiv.innerHTML = "";
                    typeText(messageDiv,"Something went wrong");
                    // alert(e);
                },100)                
            }
        }, 1500);
    }
    
}

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
      return '<a href="' + url + '">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
  }
  

form.addEventListener('change', (e)=>{
    // console.log(e)
    var e = document.querySelector("#chat_container");
    
    session_id = generateUniqueId()
    console.log('Session ID : '+ session_id)
    //e.firstElementChild can be used.
    var child = e.lastElementChild; 
    while (child) {
        e.removeChild(child);
        child = e.lastElementChild;
    }
    window.location.href = window.location.pathname+"?corpus_id="+document.getElementById('corpus').value
})

// Listener to a submit event
form.addEventListener('submit', handleSubmit)
form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
        handleSubmit(e)
    }
})

