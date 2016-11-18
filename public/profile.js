

window.onload = function() {
  const changeCanvasBtn = document.getElementById('change-canvas-token');
  const canvasTokenInput = document.getElementById('canvas-token');
  const API_URL = document.getElementById('api-url').innerHTML;
  const url = `${API_URL}connect/canvas`;
  const successMsg = document.getElementById('canvas-success');
  const errorMsg = document.getElementById('canvas-error');

  function XMLReqStateChange(e) {
    if (this.readyState === 4) {
      if (this.status === 200) {
        console.log(this.responseText);
        successMsg.className = 'displayed';
        console.log(successMsg);
        setTimeout(() => {
          successMsg.className = 'hidden';
        }, 3000);
      } else {
        console.log('Error:');
        console.log(this.statusText);
        errorMsg.className = 'displayed';
        setTimeout(() => {
          errorMsg.className = 'hidden';
        }, 3000);
      }
    }
  }

  changeCanvasBtn.onclick = function handleClick() {
    console.log(canvasTokenInput);
    if (canvasTokenInput.readOnly) {
      canvasTokenInput.readOnly = false;
    } else {
      canvasTokenInput.readOnly = true;
      console.log('submitting new token!');
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open('post', url);
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xmlHttp.onreadystatechange = XMLReqStateChange;
      xmlHttp.send(JSON.stringify({ newToken: canvasTokenInput.value }));


    }
  };
};
