// ui
let connectButtonHR = document.getElementById('connectButtonHR');
let disconnectButtonHR = document.getElementById('disconnectButtonHR');
let titleTextHR = document.getElementById('titleTextHR');
let statusTextHR = document.getElementById("statusTextHR") ;
let canvasContainerHR = document.getElementById("canvasContainerHR") ;
let canvasHR = document.getElementById("canvasHR");

let connectButtonFTMS = document.getElementById('connectButtonFTMS');
let disconnectButtonFTMS = document.getElementById('disconnectButtonFTMS');
let titleTextFTMS = document.getElementById('titleTextFTMS');
let statusTextFTMS = document.getElementById("statusTextFTMS") ;
let canvasContainerFTMS = document.getElementById("canvasContainerFTMS") ;
let canvasFTMS = document.getElementById("canvasFTMS");

let heartRates = [];
let speeds = [];
let inclinations = [];

// initial ui settings
statusTextHR.textContent = "No HR sensor connected" ;
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
canvasContainerHR.style.display = "none";
disconnectButtonHR.disabled = true; //not working why??
connectButtonHR.disabled = false;

statusTextFTMS.textContent = "No fitness machine connected" ;
titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
canvasContainerFTMS.style.display = "none";

//listeners
connectButtonHR.addEventListener('click', function() {
  heartRateDevice.connect()
  .then(() => heartRateDevice.startNotificationsHeartRateMeasurement().then(handleHeartRateMeasurement))
  .catch(error => {
    statusTextHR.textContent = error;
  });
  connectButtonHR.disabled = true;
  disconnectButtonHR.disabled = false;
});
disconnectButtonHR.addEventListener('click', function() {
  heartRateDevice.disconnect();
  statusTextHR.textContent = "No HR sensor connected" ;
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  canvasContainerHR.style.display = "none";
  disconnectButtonHR.disabled = true;
  connectButtonHR.disabled = false;
});

connectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.connect()
  .then(() => fitnessMachineDevice.startNotificationsData().then(handleTreadmillMeasurement))
  .catch(error => {
    statusTextFTMS.textContent = error;
  });
  connectButtonFTMS.disabled = true;
  disconnectButtonFTMS.disabled = false;
});
disconnectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.disconnect();
  statusTextFTMS.textContent = "No fitness machine connected" ;
  titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
  canvasContainerFTMS.style.display = "none";
  disconnectButtonFTMS.disabled = true;
  connectButtonFTMS.disabled = false;
});

function handleTreadmillMeasurement(treadmillMeasurement) {
  treadmillMeasurement.addEventListener('characteristicvaluechanged', event => {
    var treadmillMeasurement = fitnessMachineDevice.parseTreadmillData(event.target.value);
    statusTextFTMS.innerHTML = treadmillMeasurement.speed;
    titleTextFTMS.textContent = "Connected to: " + fitnessMachineDevice.getDeviceName();
    speeds.push(treadmillMeasurement.speed);
    console.log(speeds);
    canvasContainerFTMS.style.display = "block";
    //drawChart();
  });
}

function handleHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var heartRateMeasurement = heartRateDevice.parseHeartRate(event.target.value);
    statusTextHR.innerHTML = ' &#x2764;' + heartRateMeasurement.heartRate;
    titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
    heartRates.push(heartRateMeasurement.heartRate);
    console.log(heartRates);
    canvasContainerHR.style.display = "block";
    drawChart();
  });
}

function drawChart() {
  requestAnimationFrame(() => {
    var context = canvasHR.getContext('2d');
    var max = Math.max(0, Math.round(canvasHR.width / 11));
    var offset = Math.max(0, heartRates.length - max);
    context.clearRect(0, 0, canvasHR.width, canvasHR.height);
    context.strokeStyle = '#FF0000';
    context.beginPath();
    context.lineWidth = 1;
    context.lineJoin = 'round';
    for (var i = 0; i < Math.max(heartRates.length, max); i++) {
      var lineHeight = Math.round(heartRates[i + offset ] * canvasHR.height / 200);
      if (i === 0) {
        context.moveTo(11 * i, canvasHR.height - lineHeight);
      } else {
        context.lineTo(11 * i, canvasHR.height - lineHeight);
      }
      context.stroke();
    }
  });
}

// function animationLoop(timestamp){
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   ctx.font = "12px Arial";
//   ctx.fillStyle = "#000000";
//   ctx.fillText("Accelerometer",5,12);

//   ctx.strokeStyle = "#FF0000";
//   ctx.beginPath(0,200-xAcc[0]);
//   for(foo = 0; foo < canvas.width; foo++){
//       ctx.lineTo(foo*2,200-xAcc[foo]);
//   }
//   ctx.stroke(); 

//   requestId = requestAnimationFrame(animationLoop);
// }
