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
let controlsContainerFTMS = document.getElementById("controlsContainerFTMS") ;
let canvasFTMS = document.getElementById("canvasFTMS");

let speedUpButton = document.getElementById('speedUpButton');
let speedDownButton = document.getElementById('speedDownButton');

let heartRates = [];
let speeds = [];
let inclinations = [];

// initial ui settings
statusTextHR.textContent = "No HR sensor connected" ;
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
canvasContainerHR.style.display = "none";
//disconnectButtonHR.style.display = "none";

statusTextFTMS.textContent = "No fitness machine connected" ;
titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
//controlsContainerFTMS.style.display = "none";
//disconnectButtonFTMS.style.display = "none";

//listeners
connectButtonHR.addEventListener('click', function() {
  heartRateDevice.connect()
  .then(() => heartRateDevice.startNotificationsHeartRateMeasurement().then(handleHeartRateMeasurement))
  .catch(error => {
    statusTextHR.textContent = error;
  });
  //connectButtonHR.style.display = "none";
  //disconnectButtonHR.style.display = "block";
});
disconnectButtonHR.addEventListener('click', function() {
  heartRateDevice.disconnect();
  statusTextHR.textContent = "No HR sensor connected" ;
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  canvasContainerHR.style.display = "none";
  //disconnectButtonHR.style.display = "none";
  //connectButtonHR.style.display = "block";
});

connectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.connect()
  .then(() => fitnessMachineDevice.startNotificationsData().then(handleTreadmillMeasurement))
  .catch(error => {
    statusTextFTMS.textContent = error;
  });
  //connectButtonFTMS.style.display = "none";
  //disconnectButtonFTMS.style.display = "block";
});
disconnectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.disconnect();
  statusTextFTMS.textContent = "No fitness machine connected" ;
  titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
  controlsContainerFTMS.style.display = "none";
  //disconnectButtonFTMS.style.display = "none";
  //connectButtonFTMS.style.display = "block";
});

speedUpButton.addEventListener('click', function() {
  fitnessMachineDevice.increaseSpeedStep();
});

function handleTreadmillMeasurement(treadmillMeasurement) {
  treadmillMeasurement.addEventListener('characteristicvaluechanged', event => {
    var treadmillMeasurement = fitnessMachineDevice.parseTreadmillData(event.target.value);
    statusTextFTMS.innerHTML = /*'&#x1F3C3;'*/ `&#x1F4A8; Speed: ${(treadmillMeasurement.speed<10?'&nbsp;':'')}${treadmillMeasurement.speed} km/h<br />&#x26F0; Inclination: ${(treadmillMeasurement.inclination<0?'':'&nbsp;')}${treadmillMeasurement.inclination} % <br />&#x1f5fa; Distance: ${treadmillMeasurement.distance} m<br />&#x23f1; Time: ${treadmillMeasurement.time}`;
    titleTextFTMS.textContent = "Connected to: " + fitnessMachineDevice.getDeviceName();
    inclinations.push(treadmillMeasurement.inclination);
    speeds.push(treadmillMeasurement.speed);
    controlsContainerFTMS.style.display = "block";
    drawChartSpeed();
  });
}

function drawChartSpeed() {
  requestAnimationFrame(() => {
    var context = canvasFTMS.getContext('2d');
    var max = Math.max(0, Math.round(canvasFTMS.width / 11));
    var offset = Math.max(0, speeds.length - max);
    context.clearRect(0, 0, canvasFTMS.width, canvasFTMS.height);
    context.strokeStyle = '#FF0000';
    context.beginPath();
    context.lineWidth = 1;
    context.lineJoin = 'round';
    for (var i = 0; i < Math.max(speeds.length, max); i++) {
      var lineHeight = Math.round(speeds[i + offset ] * canvasFTMS.height / 25);
      if (i === 0) {
        context.moveTo(11 * i, canvasFTMS.height - lineHeight);
      } else {
        context.lineTo(11 * i, canvasFTMS.height - lineHeight);
      }
      context.stroke();
    }
  });
}

function handleHeartRateMeasurement(heartRateMeasurement) {
  heartRateMeasurement.addEventListener('characteristicvaluechanged', event => {
    var heartRateMeasurement = heartRateDevice.parseHeartRate(event.target.value);
    statusTextHR.innerHTML = `&#x2764; Heart rate: ${heartRateMeasurement.heartRate}bpm<br />&#x1F50B; Energy expended: ${heartRateMeasurement.energyExpended}`;
    titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
    heartRates.push(heartRateMeasurement.heartRate);
    canvasContainerHR.style.display = "block";
    drawChartHR();
  });
}

function drawChartHR() {
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
