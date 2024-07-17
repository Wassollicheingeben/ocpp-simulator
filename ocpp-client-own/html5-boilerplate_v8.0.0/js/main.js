var timesRun = 0;

var c = 0;
var possible =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var id = randomId();
var _websocket = null;
var connector_locked = false;
var someOffset = 2;

var idNumber = 0;

var countStartElement = 0;
var countEndElement = 0;
var isConnectionFinished = false;
var isAllowed = true;

settings_id = 'settingsID';

var process = [];
var importProcess = [];
var processImportElements = [];

const inputID = document.getElementById("id");
const inputIDTag = document.getElementById("inputGroupSelect01");
const inputConnectorID = document.getElementById("inputConnectorId");
const inputChargePointStatus = document.getElementById("inputChargePointStatus");
const outputID = document.getElementById("idCopyFromSettings");
const outputIDTag = document.getElementById("idTagCopyFromSettings");
const outputConnectorID = document.getElementById("connectorIDCopyFromSettings");
const outputChargePointStatus = document.getElementById("chargePointStatusCopyFromSettings");



inputID.addEventListener("input", updateValueID);
inputIDTag.addEventListener("input", updateValueIDTag);
inputConnectorID.addEventListener("input", updateValueConnectorID);
inputChargePointStatus.addEventListener("input", updateValueChargePointStatus);

document.getElementById('inputfile').addEventListener('change', function () {

        let fr = new FileReader();

        fr.onload = function () {
            //document.getElementById('output').textContent = fr.result;

                const myArr = JSON.parse(fr.result);
                const myArrSort = myArr.slice();
                const locked = true;


                if(myArrSort.length > 0)
                {

                  for (let i = 0; i < myArrSort.length; i++)
                  {
                    if(importProcess.length > 0)
                    {
                      if(importProcess[0] == myArrSort[i].wires[0])
                      {
                        importProcess.unshift(myArrSort[i].id);
                        myArrSort.splice(i,1);
                        i = -1;
                      }
                    }

                    if(i >= 0)
                    {
                      if(myArrSort[i].wires[0].length == 0)
                      {
                        importProcess.push(myArrSort[i].id);
                        myArrSort.splice(i,1);
                        i = -1;
                      }
                    }

                  }

                  console.log("Finished, found " + importProcess.length + " elements");

                  for (let i = 0; i < importProcess.length; i++)
                  {
                    console.log(myArr.length);
                    for (let i2 = 0; i2 < myArr.length; i2++)
                    {
                      if(myArr[i2].id == importProcess[i])
                      {
                        processImportElements.push(myArr[i2].type);
                      }
                    }
                  }

                  for (let i = 0; i < processImportElements.length; i++)
                  {
                    console.log(i + ": " + processImportElements[i]);
                  }

                  runProcess(processImportElements);
                }
                else
                {
                  console.log("No elements in File");
                }




        }

        fr.readAsText(this.files[0]);
    })



function randomId() {
  id = "";
  for (var i = 0; i < 36; i++) {
    id += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return id;
}

const toastTrigger = document.getElementById('liveToastBtn')
const toastLiveExample = document.getElementById('liveToast')
if (toastTrigger) {
  toastTrigger.addEventListener('click', () => {
    const toast = new bootstrap.Toast(toastLiveExample)

    toast.show()
  })
}

function connect()
{
  wsConnect();
}

function startTransactionBtn()
{
  StartTransaction();
}

function stopTransactionBtn()
{
  StopTransaction();
}

function authorize()
{
  sessionStorage.setItem("LastAction", "Authorize");
  var Auth = JSON.stringify([
    2,
    id,
    "Authorize",
    {
      idTag: document.getElementById("inputGroupSelect01").value
    },
  ]);
  //_websocket.send(Auth);


sendMessage(Auth);


}

//Code from https://stackoverflow.com/questions/13546424/how-to-wait-for-a-websockets-readystate-to-change
function sendMessage(msg){
    // Wait until the state of the socket is not ready and send the message when it is...
    waitForSocketConnection(_websocket, function(){
        console.log("message sent!!!");
        _websocket.send(msg);
    });
}

function waitForSocketConnection(socket, callback){
    setTimeout(
        function () {
            if (socket.readyState === 1) {
                console.log("Connection is made")
                if (callback != null){
                    callback();
                }
            } else {
                console.log("wait for connection...")
                waitForSocketConnection(socket, callback);
            }

        }, 5); // wait 5 milisecond for the connection...
}

function waitForSocketConnectBeforeDisconnect(socket, callback){
    setTimeout(
        function () {
            if (isConnectionFinished == true) {
                console.log("Connection is made")
                if (callback != null){
                    callback();
                }
            } else {
                console.log("wait for connection...")
                waitForSocketConnectBeforeDisconnect(socket, callback);
            }

        }, 5); // wait 5 milisecond for the connection...
}


function disconnect()
{
  addOutputText("hallo");
}

function clearOutputText()
{

  let e = document.getElementById('addOutput');

//e.firstElementChild can be used.
let child = e.lastElementChild;
while (child) {
    e.removeChild(child);
    child = e.lastElementChild;
}
}

function addOutputText(text)
{
  var divR = document.createElement('div');
  divR.className = 'row';
  var divC = document.createElement('div');
  divC.className = 'col';
  divC.innerHTML = getCurrentDateTime() + text + "<br><br>";
  divR.appendChild(divC);

  document.getElementById('addOutput').appendChild(divR);
  updateScroll();
}

function updateScroll(){
    var element = document.getElementById("addOutput");
    element.scrollTop = element.scrollHeight;
}

function logMsg(err) {
  addOutputText(err);
}

function scollOnTop()
{
  const scrollTop = document.getElementById('addOutput')
window.onscroll = () => {
  if (window.scrollY > 0) {
    scrollTop.style.visibility = "visible";
    scrollTop.style.opacity = 1;
  } else {
    scrollTop.style.visibility = "hidden";
    scrollTop.style.opacity = 0;
  }
};
}

function wsConnect_own()
{
  var wsUrl = document.getElementById("endpointUrl").value;
  var wsId = document.getElementById("id").value;
  console.log(wsUrl + wsId);

  const socket = new WebSocket(wsUrl + wsId);
}

function wsConnect()
{
  var wsurl = document.getElementById("endpointUrl").value;
  var CP = document.getElementById("id").value;

  if (_websocket)
  {
    addOutputText("disconnecting.........");
    _websocket.close(3001);
    addOutputText("disconnect.........");
    var divR = document.createElement('div');
    divR.className = 'row';
    var divC = document.createElement('div');
    divC.className = 'col';
    divC.innerHTML = "CONNECT";
    var divC2 = document.createElement('div');
    divC2.className = 'col-3 colorOne';
    divC2.innerHTML = '<img src="./ui_access.png" class="img-fluid" alt="...">';
    divR.appendChild(divC);
    divR.appendChild(divC2);

    document.getElementById('btn-connect-disconnect').innerHTML = "";
    document.getElementById("btn-connect-disconnect").style.backgroundColor = "#ffffff";
    document.getElementById('btn-connect-disconnect').appendChild(divR);
  }
  else
  {
    addOutputText("connecting.........");
    _websocket = new WebSocket(wsurl + "" + CP, ["ocpp1.6", "ocpp1.5"]);

    _websocket.onopen = function (authorizationData)
    {
      sessionStorage.setItem("LastAction", "BootNotification");
      addOutputText("oppening.........");
      BootNotification();

      document.getElementById("btn-connect-disconnect").style.backgroundColor = "#9de697";

      var divR = document.createElement('div');
      divR.className = 'row';
      var divC = document.createElement('div');
      divC.className = 'col';
      divC.innerHTML = "DISCONNECT";
      var divC2 = document.createElement('div');
      divC2.className = 'col-3 colorOne';
      divC2.innerHTML = '<img src="./ui_access.png" class="img-fluid" alt="...">';
      divR.appendChild(divC);
      divR.appendChild(divC2);

      document.getElementById('btn-connect-disconnect').innerHTML = "";
      document.getElementById('btn-connect-disconnect').appendChild(divR);
    };

    _websocket.onmessage = function (msg)
    {
      c++;
      var ddata = JSON.parse(msg.data);
      console.log(ddata);
      if (c == 1)
      {
        var hb_interval = handleData(ddata);
        sessionStorage.setItem("Configuration", hb_interval);
        startHB(hb_interval * 1000);
      }

      if (ddata[0] === 3)
      {
        la = getLastAction();

        if (la == "startTransaction")
        {
          ddata = ddata[2];
          logMsg("Data exchange successful!");
          var array = $.map(ddata, function (value, index) {
            return [value];
          });
          var TransactionId = array[0];
          sessionStorage.setItem("TransactionId", TransactionId);
          logMsg("TransactionId: " + TransactionId);
          console.log("TransactionId: " + JSON.stringify(TransactionId));
          document.getElementById("ConnectorStatus").value = "Charging";
        }
        if (la === "stopTransaction") {
          document.getElementById("ConnectorStatus").value = "Charging";
        }
        //logMsg("Response: " + JSON.stringify(ddata[2]));
        //More details on MessageType, UniqueId and Payload [Page 12 in ocpp-j-1.6-specification.pdf]
        logMsg("ResponseConsole: " + JSON.stringify(ddata));
        isConnectionFinished = true;
      } else if (JSON.parse(msg.data)[0] === 4) {
        logMsg("Data exchange failed - JSON is not accepted!");
      } else if (JSON.parse(msg.data)[0] === 2) {
        logMsg(JSON.parse(msg.data)[2]);
        id = JSON.parse(msg.data)[1];

        switch (ddata[2]) {
          case "Reset":
            //Reset type SOFT, HARD
            var ResetS = JSON.stringify([3, id, { status: "Accepted" }]);
            _websocket.send(ResetS);
            location.reload();
            break;
          case "RemoteStopTransaction":
            //TransactionID
            var remStp = JSON.stringify([3, id, { status: "Accepted" }]);
            _websocket.send(remStp);

            var stop_id = JSON.parse(msg.data)[3].transactionId;

            stopTransaction(stop_id);
            break;
          case "RemoteStartTransaction":
            //Need to get idTag, connectorId (map - ddata[3])

            var remStrt = JSON.stringify([3, id, { status: "Accepted" }]);
            _websocket.send(remStrt);
            startTransaction();

            break;
          case "UnlockConnector": /////////ERROR!!!!!!!!
            //connectorId
            var UC = JSON.stringify([3, id, { status: "Accepted" }]);
            _websocket.send(UC);
            // connector_locked = false;
            // $('.indicator').hide();
            //$('#yellow').show();
            //logMsg("Connector status changed to: "+connector_locked);
            break;
          default:
            var error = JSON.stringify([4, id]);
            _websocket.send(error);
            break;
        }
      }
    };

    _websocket.onclose = function (evt) {
      if (evt.code == 3001) {
        logMsg("ws closed");
        _websocket = null;
      } else {
        logMsg("ws connection error: " + evt.code);
        _websocket = null;
        wsConnect();
      }
    };

    _websocket.onerror = function (evt) {
      if (_websocket.readyState == 1) {
        logMsg("ws normal error: " + evt.type);
      }
    };
  }
}

function BootNotification() {
  var BN = JSON.stringify([
    2,
    id,
    "BootNotification",
    {
      chargePointVendor: "AVT-Company",
      chargePointModel: "AVT-Express",
      chargePointSerialNumber: "avt.001.13.1",
      chargeBoxSerialNumber: "avt.001.13.1.01",
      firmwareVersion: "0.9.87",
      iccid: "",
      imsi: "",
      meterType: "AVT NQC-ACDC",
      meterSerialNumber: "avt.001.13.1.01",
    },
  ]);
  //logMsg(BN);

  _websocket.send(BN);
}

function statusNotification() {
  var BN = JSON.stringify([
    2,
    id,
    "StatusNotification",
    {
      connectorId: document.getElementById("inputConnectorId").value,
      errorCode: document.getElementById("inputErrorCode").value,
      status: document.getElementById("inputChargePointStatus").value,
      timestamp: getTimeStamp(),
    },
  ]);
  //logMsg(BN);

  //_websocket.send(BN);
  sendMessage(BN);
}

function StartTransaction() {
  var BN = JSON.stringify([
    2,
    id,
    "StartTransaction",
    {
      connectorId: "1",
      idTag: document.getElementById("inputGroupSelect01").value,
      meterStart: "123",
      timestamp: getTimeStamp(),
    },
  ]);
  //logMsg("Sending: " + BN);

  //_websocket.send(BN);
  sendMessage(BN);
}

function StopTransaction() {
  var BN = JSON.stringify([
    2,
    id,
    "StopTransaction",
    {
      idTag: document.getElementById("inputGroupSelect01").value,
      meterStop: "124",
      timestamp: getTimeStamp(),
      transactionId: "5",
      reason: "Local",
    },
  ]);
  //logMsg("stop: " + BN);

  //_websocket.send(BN);
  sendMessage(BN);
}

function getTimeStamp()
{
  var event = new Date();
  event.setTime(event.getTime() + 120 * 60000);
  return event.toISOString();
}

function handleData(data, request = false) {
  var lastAction = getLastAction();
  if ((lastAction = "BootNotification")) {
    data = data[2];
    heartbeat_interval = data.interval;
    return heartbeat_interval;
  } else if ((lastAction = "StartTransaction")) {
    return "StartTransaction";
  } else if (1 == 2) {
    alert("else");
  }
}

function getLastAction() {
  var LastAction = sessionStorage.getItem("LastAction");
  return LastAction;
}

function startHB(interval) {
  logMsg("Setting heartbeat interval to " + interval);
  setInterval(send_heartbeat, interval);
}

function send_heartbeat() {
  sessionStorage.setItem("LastAction", "Heartbeat");
  var HB = JSON.stringify([2, id, "Heartbeat", {}]);
  _websocket.send(HB);
}

function appendHtml(targetC, htmldata) {
    var theDiv = document.getElementById(targetC);
    theDiv.innerHTML = htmldata;
}

function getCurrentDateTime()
{
  var currentdate = new Date();
  return datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "|";
}

function jump_to_location(clicked_id)
{
  console.log(clicked_id);
  if(clicked_id == settings_id)
  {
    document.getElementById('jump_to_location_settings').scrollIntoView({
    behavior: 'smooth'
  });
  }
}

function updateValueID(e) {
  outputID.textContent = e.target.value;
}

function updateValueIDTag(e) {
  outputIDTag.textContent = e.target.value;
}

function updateValueConnectorID(e) {
  outputConnectorID.textContent = e.target.value;
}

function updateValueChargePointStatus(e) {
  outputChargePointStatus.textContent = e.target.value;
}




var card = document.getElementById('card');
var isDragging = false;




function setIdMouseOver(clicked_id)
{
  if(isDragging == false)
  {
    card = document.getElementById(clicked_id);
    card.addEventListener('mousedown', mouseDown);
    document.getElementById(card.id).style.opacity = "0.5";
  }
}

function setIdMouseLeave(clicked_id)
{
    document.getElementById(card.id).style.opacity = "1";
}





let newX = 0, newY = 0, startX = 0, startY = 0;



function mouseDown(e){
  isDragging = true;

    startX = e.clientX
    startY = e.clientY

    document.addEventListener('mousemove', mouseMove)
    document.addEventListener('mouseup', mouseUp)

    document.getElementById("myDIV").style.opacity = "0.5";

    console.log(card.id);
}

function mouseMove(e){
    newX = startX - e.clientX
    newY = startY - e.clientY

    startX = e.clientX
    startY = e.clientY

    card.style.top = (card.offsetTop - newY) + 'px'
    card.style.left = (card.offsetLeft - newX) + 'px'

    console.log(isDragging);
}

function mouseUp(e){
    document.removeEventListener('mousemove', mouseMove);
    isDragging = false;
    card.id.style.opacity = "1";
}

function addNewElementStart(e)
{
  if(countStartElement < 1)
  {
    const magnet = document.createElement('magnet-block');

    magnet.setAttribute('attract-distance', '10');
    magnet.setAttribute('align-to', 'outer|center');
    magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center cardStart magnetElement');
    magnet.setAttribute('id', 'idStart');
    // or
    magnet.attractDistance = 10;
    magnet.alignTos = ['outer', 'center'];


    const childOne = document.createElement('p');
    childOne.setAttribute('class', 'm-0');
    childOne.innerText = 'Start';

    magnet.appendChild(childOne);

    document.getElementById("addHere").append(magnet);
    countStartElement++;
  }
  else {
    var element = document.getElementById("elementStart");

  }
}

function addNewElementEnd(e)
{
  if(countEndElement < 1)
  {
    const magnet = document.createElement('magnet-block');

    magnet.setAttribute('align-to', 'outer|center');
    magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center cardEnd magnetElement');
    magnet.setAttribute('id', 'idEnd');

    // or
    magnet.attractDistance = 30;
    magnet.alignTos = ['outer', 'center'];


    const childOne = document.createElement('p');
    childOne.setAttribute('class', 'm-0');
    childOne.innerText = 'End';

    magnet.appendChild(childOne);

    document.getElementById("addHere").append(magnet);
    countEndElement++;
  }
}

function addNewElementConnect(e)
{
  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card magnetElement');
  magnet.setAttribute('id', 'idConnect' + idNumber);
  magnet.setAttribute('onmouseup', 'onMouseUpPosition()');

  idNumber = idNumber + 1;

  // or
  magnet.attractDistance = 30;
  magnet.alignTos = ['outer', 'center'];


  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Connect';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);



}

function addNewElementAuthorize(e)
{

  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card2 magnetElement');
  magnet.setAttribute('id', 'idAuthorize' + idNumber);

  idNumber = idNumber + 1;
  // or
  magnet.attractDistance = 10;
  magnet.alignTos = ['outer', 'center'];


  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Authorize';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementStartTransaction(e)
{

  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card3 magnetElement');
  magnet.setAttribute('id', 'idStartTransaction' + idNumber);

  idNumber = idNumber + 1;
  // or
  magnet.attractDistance = 10;
  magnet.alignTos = ['outer', 'center'];


  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Start Transaction';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementStopTransaction(e)
{

  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card4 magnetElement');
  magnet.setAttribute('id', 'idStopTransaction' + idNumber);

  idNumber = idNumber + 1;
  // or
  magnet.attractDistance = 10;
  magnet.alignTos = ['outer', 'center'];


  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Stop Transaction';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementStatus(e)
{
  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card5 magnetElement');
  magnet.setAttribute('id', 'idStatus' + idNumber);

  idNumber = idNumber + 1;

  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Status';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementDisconnect(e)
{
  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card6 magnetElement');
  magnet.setAttribute('id', 'idDisconnect' + idNumber);

  idNumber = idNumber + 1;

  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Disconnect';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementWait(e)
{
  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card7 magnetElement');
  magnet.setAttribute('id', 'idWait' + idNumber);

  idNumber = idNumber + 1;

  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0');
  childOne.innerText = 'Wait';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}

function addNewElementMultiplierStart(e)
{



  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card8 magnetElement');
  magnet.setAttribute('id', 'idMultiplierStart' + idNumber);

  idNumber = idNumber + 1;

  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0 font-size-10');
  childOne.innerText = 'Multiplier start';

  const childTwo = document.createElement('p');
  childTwo.setAttribute('class', 'm-0 counter font-size-10');
  childTwo.innerText = '1';

  const childThree = document.createElement('div');
  childThree.setAttribute('class', 'row');

  const childThreeOne = document.createElement('div');
  childThreeOne.setAttribute('class', 'col-6');

  const childThreeOneOne = document.createElement('button');
  childThreeOneOne.setAttribute('type', 'button');
  childThreeOneOne.setAttribute('class', 'btn btn-success p-0 ps-2 pe-2');
  childThreeOneOne.setAttribute('onclick', 'countplus(this)');
  childThreeOneOne.innerText = '+';

  const childThreeTwo = document.createElement('div');
  childThreeTwo.setAttribute('class', 'col-6');

  const childThreeOneTwo = document.createElement('button');
  childThreeOneTwo.setAttribute('type', 'button');
  childThreeOneTwo.setAttribute('class', 'btn btn-success p-0 ps-2 pe-2');
  childThreeOneTwo.setAttribute('onclick', 'countminus(this)');
  childThreeOneTwo.innerText = '-';

  magnet.appendChild(childOne);
  magnet.appendChild(childTwo);
  magnet.appendChild(childThree);

  childThree.appendChild(childThreeTwo);
  childThree.appendChild(childThreeOne);

  childThreeOne.appendChild(childThreeOneOne);
  childThreeTwo.appendChild(childThreeOneTwo);

  document.getElementById("addHere").append(magnet);
}











function addNewElementMultiplierEnd(e)
{



  const magnet = document.createElement('magnet-block');

  magnet.setAttribute('attract-distance', '10');
  magnet.setAttribute('align-to', 'outer|center');
  magnet.setAttribute('class', 'text-center d-flex flex-column justify-content-center align-items-center card9 magnetElement');
  magnet.setAttribute('id', 'idMultiplierEnd' + idNumber);

  idNumber = idNumber + 1;

  const childOne = document.createElement('p');
  childOne.setAttribute('class', 'm-0 font-size-10');
  childOne.innerText = 'Multiplier end';

  magnet.appendChild(childOne);

  document.getElementById("addHere").append(magnet);
}









function countplus(e)
{
  const parentElement = e.parentNode;
  const parentElement2 = parentElement.parentNode;
  const parentElement3 = parentElement2.parentNode;

  var element = document.getElementById(parentElement3.id);
  const collection = element.getElementsByClassName("counter");

  var number = collection[0].innerText;
  collection[0].innerText = parseInt(number) + 1;
}

function countminus(e)
{
  const parentElement = e.parentNode;
  const parentElement2 = parentElement.parentNode;
  const parentElement3 = parentElement2.parentNode;

  var element = document.getElementById(parentElement3.id);
  const collection = element.getElementsByClassName("counter");

  var number = collection[0].innerText;

  if(parseInt(number) > 1)
  {
    collection[0].innerText = parseInt(number) - 1;
  }
}

















function startProcess(e)
{

  var magnetElementsList = document.getElementsByClassName('magnetElement');
for (var i = 0; i < magnetElementsList.length; ++i) {
    var item = magnetElementsList[i];
    //console.log(item.id);
    //console.log('Magnet rect:', item.magnetRect.x);
    createJson(item.id, item.magnetRect.x);
    //console.log(item.attractionTo(item));
}



//snappedElements();












if(document.getElementById("idStart") == null)
{
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new bootstrap.Toast(toastLiveExample);

  toast.show();
  return;
}

if(document.getElementById("idEnd") == null)
{
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new bootstrap.Toast(toastLiveExample);

  toast.show();
  return;
}

multiplierStartList = document.querySelectorAll('[id^="idMultiplierStart"]');
multiplierEndList = document.querySelectorAll('[id^="idMultiplierEnd"]');

if(sameListLength(multiplierStartList,multiplierEndList) == false)
{
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new bootstrap.Toast(toastLiveExample);

  toast.show();
  return;
}





const magnetStart = document.getElementById("idStart");
const magnetEnd = document.getElementById("idEnd");
var nextElement;

process = [];
process.push(magnetStart.id);

var magnetElementsListLength = magnetElementsList.length;

for (var i = 0; i < magnetElementsListLength; ++i) {
    var item = magnetElementsList[i];
    //console.log(magnetElementsList[i]);
    if(magnetStart.attractionTo(item).results.length >= 1)
    {
      if(magnetStart != item)
      {
        //console.log(magnetStart.attractionTo(item).results[0].alignment);
        //console.log("magnetStart connect to " + item.id);
        nextElement = item;
        process.push(item.id);
      }
    }
    else {
      //console.log("Not snapped to target");
    }

}
//console.log(nextElement);
//http://localhost/ocpp-client-own/html5-boilerplate_v8.0.0/
if(nextElement != null)
{
  for (var i = 0; i < magnetElementsListLength; ++i)
  {
      if(nextElement.id != idEnd)
       {
         var item = magnetElementsList[i];
         //console.log(item);
         if(nextElement.attractionTo(item).results.length >= 1)
         {
           //console.log(nextElement.id + " " + item.id);
           if(nextElement.id != item.id)
           {
             if(nextElement.attractionTo(item).results[0].alignment == "rightToLeft")
             {
               //console.log(nextElement.attractionTo(item).results[0].alignment);
               //console.log(nextElement.id + " is connected to " + item.id);
               nextElement = item;
               i = 0;
               process.push(item.id);
             }
           }
         }
         else {
           //console.log("Not snapped to target");
         }
       }

  }
}

var disconnectListPlace = 0;

for (var i = 0; i < process.length; ++i)
{
  if (process[i].includes("Disconnect"))
  {
    disconnectListPlace = i;
  }
}

if(startElementBeforeEndElement(process,multiplierStartList, multiplierEndList) == true)
{
  process = createMultiplierProcess(process,multiplierStartList,multiplierEndList);


  runProcess(process);
}
else
{
  const toastLiveExample = document.getElementById('liveToast');
  const toast = new bootstrap.Toast(toastLiveExample);

  toast.show();
}

  //process = [];




















//console.log(magnet.attractionTo(magnet2).results[0].alignment);
//console.log(magnet.traceMagnetAttributeValue('console'));


  //const magnet = document.getElementById("id0");
  //const magnet2 = document.getElementById("id1");

  //const { x, y } = magnet.lastMagnetOffset;

  //magnet.getOtherMagnets('some-attr'); // 'some-value'

  //console.log(magnet.getAttractableMagnets('some-attr'));

  //console.log(magnet.getOtherMagnets());

  //const parentPack = magnet.parentPack;


  //console.log('Parent element:', parentPack.raw);
// get parent rectangle
//console.log('Parent rect:', parentPack.rect);

// get parent element
// get parent rectangle
//console.log('Parent rect:', parentPack.rect);

//console.log(magnet.attractionToParent());
//magnet.resetMagnetRect('some-attr'); // 'some-value'
//console.log('Magnet rect:', magnet.magnetRect);


}


var magnetElement = {};
var element = []
magnetElement.element = element;


function createJson(id_, x_)
{
var id = id_;
var x = x_;
var elementNew = {
  "id": id,
  "x": x
}
magnetElement.element.push(elementNew);
//console.log(magnetElement);

}

function snappedElements()
{
  console.log("------------");
  console.log(magnetElement.element[0].id);

  for (const key in magnetElement) {
    console.log(`${key}: ${magnetElement[key]}`);
}

}

function waitUntilFinished(socket, callback){
    setTimeout(
        function () {
            if (isAllowed == true) {
                console.log("Now i can do more")
                if (callback != null){
                    callback();
                }
            } else {
                console.log("waiting")
                waitUntilFinished(socket, callback);
            }

        }, 1000); // wait 5 milisecond for the connection...
}






function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}






async function runProcess(process) {
  try {

    for (var i = 0; i < process.length; ++i)
    {
      if(process[i].includes("Connect") || process[i].includes("lower-caseV3"))
      {
        await wsConnect();
        console.log("Connect");
        console.log(await fun())
      }
      else if (process[i].includes("Authorize") || process[i].includes("lower-caseV4"))
      {
        await authorize();
        console.log("Authorize");
        console.log(await fun())
      }
      else if (process[i].includes("StartTransaction") || process[i].includes("lower-caseV5"))
      {
        await StartTransaction();
        console.log("StartTransaction");
        console.log(await fun())
      }
      else if (process[i].includes("StopTransaction") || process[i].includes("lower-caseV6"))
      {
        await StopTransaction();
        console.log("StopTransaction");
        console.log(await fun())
      }
      else if (process[i].includes("Status"))
      {
        await statusNotification();
        console.log("Status");
        console.log(await fun())
      }
      else if (process[i].includes("Disconnect"))
      {
        await wsConnect();
        console.log("Disconnect");
        console.log(await fun())

      }
      else if (process[i].includes("Wait"))
      {
        console.log("Wait");
        console.log(await waitFor())

      }
    }

  } catch (error) {
    console.log(error);
  }

  console.log("-----------------");
}


const fun = () => {
  return new Promise(resolve => {
    setTimeout(() =>
      resolve(`done`), 500);
  })
}

  const waitFor = () => {
    return new Promise(resolve => {
      setTimeout(() =>
        resolve(`waited`), 10000);
    })
  }


function callback(element, iterator) {
    console.log(iterator, element.id);
}

function sameListLength(firstList, secondList)
{
  if(firstList.length == secondList.length)
  {
    return true;
  }

  return false;
}

function startElementBeforeEndElement(process, elementStartList, elementEndList)
{
  var elementStartPositionList = [];
  var elementEndPositionList = [];

  var arrayStartLength = elementStartList.length;
  var arrayEndLength = elementEndList.length;

  try
  {
    for (var i = 0; i < process.length; ++i)
    {
      if(process[i].includes("MultiplierStart"))
      {
        elementStartPositionList.push(i);
      }
      else if (process[i].includes("MultiplierEnd"))
      {
        elementEndPositionList.push(i);
      }
    }
  }
  catch (error)
  {
    console.log(error);
  }

  for (var i = 0; i < elementStartPositionList.length; i++)
  {
    if(elementStartPositionList[i] < elementEndPositionList[i])
    {

    }
    else {
      return false;
    }

  }

  return true;

}

function createMultiplierProcess(process, elementStartList, elementEndList)
{
  var elementStartPositionList = [];
  var elementInBetweenPositionList = [];
  var elementEndPositionList = [];
  var newprocess = [];

  try
  {
    for (var i = 0; i < process.length; ++i)
    {
      newprocess.push(process[i]);
      if(process[i].includes("MultiplierStart"))
      {

        const element = document.getElementById(process[i]);
        const counter = element.getElementsByClassName("counter");
        const counterText = counter[0].innerText;

        if(counterText != 1)
        {
          var i3 = 0;
          for(i3 = 0; i3 < counterText - 1; i3++)
          {
            var i2 = i;
            while(process[i2 + 1].includes("MultiplierStart") == false && process[i2 + 1].includes("MultiplierEnd") == false)
            {
                newprocess.push(process[i2 + 1]);
                i2++;
            }
          }
        }
      }
    }

    return newprocess;
  }
  catch (error)
  {
    console.log(error);
  }
}




















//https://codepen.io/Ragtime-Kitty/pen/yrNNdq
//https://github.com/lf2com/magnet.js
