const beautify = ace.require("ace/ext/beautify");

let can_update = false
const train_corpus_live_alert = document.getElementById('training-corpus-live-alert')
const update_corpus_live_alert = document.getElementById('update-corpus-live-alert')

const train_corpus_live_alert_create = (message, type) => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  train_corpus_live_alert.append(wrapper)
}

const update_corpus_live_alert_create = (message, type) => {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
    `   <div>${message}</div>`,
    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
    '</div>'
  ].join('')

  update_corpus_live_alert.append(wrapper)
}

const command_prompt = ace.edit('command_prompt', {
  mode: 'ace/mode/json',
  // selectionStyle: 'text',
  // showPrintMargin: false,
  theme: 'ace/theme/xcode',
  // setShowPrintMargin: false 
});

  
const formatText = (spacing = 0) => {
  try {
    const current = JSON.parse(command_prompt.getValue());
    command_prompt.setValue(JSON.stringify(current, null, spacing));
    command_prompt.focus();
    command_prompt.selectAll();
    document.execCommand('copy');
  } catch (err) {
    alert('ERROR: Unable to parse text as JSON');
  }
};
  
command_prompt.on('paste', event => {
  try {
    event.text = JSON.stringify(JSON.parse(event.text), null, 4);
  } catch (err) {
    // meh
  }
});
  

const check_corpus_response = ace.edit('check_corpus_response', {
  mode: 'ace/mode/json',
  selectionStyle: 'text',
  showPrintMargin: false,
  theme: 'ace/theme/chrome' });


const formatText2 = (spacing = 0) => {
  try {
    const current = JSON.parse(check_corpus_response.getValue());
    check_corpus_response.setValue(JSON.stringify(current, null, spacing));
    check_corpus_response.focus();
    check_corpus_response.selectAll();
    document.execCommand('copy');
  } catch (err) {
    alert('ERROR: Unable to parse text as JSON');
  }
};

check_corpus_response.setReadOnly(true)
  
check_corpus_response.on('paste', event => {
  try {
    event.text = JSON.stringify(JSON.parse(event.text), null, 4);
  } catch (err) {
    // meh
  }
});

function check_data(){
  let endpoint = document.getElementById('endpoint').value
  let corpus_id = document.getElementById('corpus_id').value
  let url = `https://quiwsth.convolab.ai/linklogic/check_corpus`
  let options = {
      method: 'POST',
      body: JSON.stringify({
          endpoint: endpoint,
          corpus_id: corpus_id
      })
  }
  fetch(url,options)
    .then(response => {
        if (response.ok) {
            return response.json()
        } else {
          if(response.status == 404){
            alert('Corpus not found')
          }else{
            alert('Something wrong')
          }          
        }
    }).then(function(data) {
      if(data){
        let prompt_header = data.prompt_header;
        let command = {
          command_endpoint : data.command_endpoint,
          command_prompt_header : data.command_prompt_header,
          commands : data.commands
        }
        command_prompt.setValue(JSON.stringify(command))
        command_prompt.getSession().setValue(js_beautify(command_prompt.getValue(), {}));
        document.getElementById('update-corpus-prompt-header-input').value = ""
        document.getElementById('update-corpus-prompt-header-input').value = prompt_header
        can_update = true
      }
    }).catch(error => {
      console.log(error)
    })
}

document.getElementById("endpoint").onchange = function(){
  check_data()
}

document.getElementById("corpus_id").onchange = function(){
  check_data()
}


addEventListener("submit", (event) => {
  console.log(event.target.id)
  let form_id = event.target.id
  let endpoint = document.getElementById('endpoint').value
  let corpus_id = document.getElementById('corpus_id').value
  if(endpoint.length > 0 && corpus_id.length >0){
    if(form_id === "check-corpus-form"){
      let url = `https://quiwsth.convolab.ai/linklogic/check_corpus`
      let options = {
          method: 'POST',
          body: JSON.stringify({
              endpoint: endpoint,
              corpus_id: corpus_id
          })
      }
      fetch(url,options)
        .then(response => {
          if (response.ok) {
              return response.json()
          } else {
            if(response.status == 404){
              alert('Corpus not found')
            }else{
              alert('Something wrong')
            }          
          }
        }).then(function(data) {
            if(data){
              check_corpus_response.setValue(JSON.stringify(data))
              check_corpus_response.getSession().setValue(js_beautify(check_corpus_response.getValue(), {}));
            }
          
        }).catch(error => {
          console.log(error)
        })
    }
    if(form_id === "update-corpus-form"){
      if(can_update){
        let command_prompt_editor = command_prompt.getValue()
        let prompt_header_editor = document.getElementById('update-corpus-prompt-header-input').value
        let payload = {}
        if(command_prompt_editor.length>20){
          let commands = JSON.parse(command_prompt_editor)
          payload.command_endpoint = commands.command_endpoint
          payload.command_prompt_header = commands.command_prompt_header
          payload.commands = commands.commands
        }
        if(prompt_header_editor.length>20){
          payload.prompt_header = prompt_header_editor
        }
        console.log(payload)
        let url = `https://quiwsth.convolab.ai/linklogic/update_corpus`
        let options = {
            method: 'POST',
            body: JSON.stringify({
                endpoint: endpoint,
                corpus_id: corpus_id,
                payload : payload
            })
        }
        fetch(url,options)
          .then(response => {
            if (response.ok) {
              return response.json()
            } else {
              if(response.status == 404){
                update_corpus_live_alert_create('Corpus not found !','danger')
              }else{
                update_corpus_live_alert_create('Something wrong.', 'danger')
              }          
            }
          }).then(function(data) {
            if(data){
              console.log(data)
              update_corpus_live_alert_create('Updated !','success')
            }            
          }).catch(error => {
            console.log(error)
            update_corpus_live_alert_create('Updated !','danger')
          })
      }else{
        alert('Please check your endpoint or corpus id')
      }
  
    }
    if(form_id === "training-corpus-form"){
      let google_sheet_url = document.getElementById('training-corpus-sheet-input').value 
      let google_sheet_worksheet = document.getElementById('training-corpus-tab-input').value
      if(google_sheet_url.length > 0 && google_sheet_worksheet.length > 0){
        let url = `https://quiwsth.convolab.ai/linklogic/train_corpus`
        let payload = {
            "corpus_id":corpus_id,
            "google_sheet_url": google_sheet_url,
            "google_sheet_worksheet": google_sheet_worksheet
        }
        let options = {
            method: 'POST',
            body: JSON.stringify({
                endpoint: endpoint,
                corpus_id: corpus_id,
                payload : payload
            })
        }
        fetch(url,options)
          .then(response => {
              if (response.ok) {
                return response.json()
              } else {
                if(response.status == 404){
                  train_corpus_live_alert_create('Corpus not found.', 'danger')
                }else{
                  train_corpus_live_alert_create('Something wrong.', 'danger')
                }          
              }
          }).then(function(data) {
            if(data){
              console.log(data)
              train_corpus_live_alert_create('Train Success ! Please wait for server write data.', 'success')
            }            
          }).catch(error => {
            console.log(error)
            train_corpus_live_alert_create('Something wrong.', 'danger')
          })
      }else{
        alert('Input google sheet and tab name')
      }
    }
  }else{
    alert('Input Endpoint and corpus id')
  }
});