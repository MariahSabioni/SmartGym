// ui hooks
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
let inclinationUpButton = document.getElementById('inclinationUpButton');
let inclinationDownButton = document.getElementById('inclinationDownButton');

let connectButtoIMU = document.getElementById('connectButtoIMU');
let disconnectButtonIMU = document.getElementById('disconnectButtonIMU');
let titleTextIMU = document.getElementById('titleTextIMU');
let statusTextIMU = document.getElementById("statusTextIMU") ;
let canvasContainerIMU = document.getElementById("canvasContainerIMU") ;
let canvasIMU = document.getElementById("canvasIMU");

let heartRates = [];
let heartRateMeasurements = [];
let speeds = [];
let inclinations = [];
let treadmillMeasurements = [];
let heartRateDeviceCache = null;

// initial ui settings
statusTextHR.textContent = "No HR sensor connected" ;
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
//canvasContainerHR.style.display = "none";

statusTextFTMS.textContent = "No fitness machine connected" ;
titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
//controlsContainerFTMS.style.display = "none";

statusTextIMU.textContent = "No IMU sensor connected" ;
titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
canvasContainerIMU.style.display = "none";

// google chart
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

//listeners
connectButtonHR.addEventListener('click', function() {
  heartRateDevice.connect()
  .catch(error => {
    statusTextHR.textContent = error;
    console.log(error);
  });
});
disconnectButtonHR.addEventListener('click', function() {
  heartRateDevice.disconnect();
  statusTextHR.textContent = "No HR sensor connected" ;
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  canvasContainerHR.style.display = "none";
});
connectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.connect()
  .catch(error => {
    statusTextFTMS.textContent = error.message;
    console.log(error);
  });
});
disconnectButtonFTMS.addEventListener('click', function() {
  fitnessMachineDevice.disconnect();
  statusTextFTMS.textContent = "No fitness machine connected" ;
  titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
  controlsContainerFTMS.style.display = "none";
});
speedUpButton.addEventListener('click', function() {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.increaseSpeedStep(currSpeed)
  .catch(error => {
    console.log(error);
  });
});
speedDownButton.addEventListener('click', function() {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.decreaseSpeedStep(currSpeed)
  .catch(error => {
    console.log(error);
  });
});
inclinationUpButton.addEventListener('click', function() {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.increaseInclinationStep(currInclination)
  .catch(error => {
    console.log(error);
  });
});
inclinationDownButton.addEventListener('click', function() {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.decreaseInclinationStep(currInclination)
  .catch(error => {
    console.log(error);
  });
});

function updateFTMSUI(treadmillMeasurement){
  statusTextFTMS.innerHTML = /*'&#x1F3C3;'*/ `&#x1F4A8; Speed: ${(treadmillMeasurement.speed<10?'&nbsp;':'')}${treadmillMeasurement.speed} km/h<br />&#x26F0; Inclination: ${(treadmillMeasurement.inclination<0?'':'&nbsp;')}${treadmillMeasurement.inclination} % <br />&#x1f5fa; Distance: ${treadmillMeasurement.distance} m<br />&#x23f1; Time: ${treadmillMeasurement.duration}`;
  titleTextFTMS.textContent = "Connected to: " + fitnessMachineDevice.getDeviceName();
  
  inclinations.push(treadmillMeasurement.inclination);
  speeds.push(treadmillMeasurement.speed);
  treadmillMeasurements.push(treadmillMeasurement);
  console.log('Treadmill array length: ',treadmillMeasurements.length);
  
  controlsContainerFTMS.style.display = "block";
  //drawChartSpeed();
}

function updateHRUI(heartRateMeasurement){
  statusTextHR.innerHTML = `&#x2764; Heart rate: ${heartRateMeasurement.heartRate}bpm`;
  titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
  
  heartRates.push(heartRateMeasurement.heartRate);
  heartRateMeasurements.push(heartRates);
  console.log('HR array length: ',heartRateMeasurements.length);
  
  canvasContainerHR.style.display = "block";
  //drawChartHR();
}

function drawChart() {
  let dataHR = new google.visualization.DataTable();
  dataHR.addColumn('number', 'timestamp');
  dataHR.addColumn('number', 'heart rate (bpm)');
  
  dataHR.addRows([
    [0,  0],
  ]);
  
  var optionsHR = {
    title: 'Heart rate (bpm)',
    vAxis: {minValue:0, maxValue:200},
    hAxis: {textPosition: 'none'},
    legend: 'bottom',
    axisTitlesPosition: 'none',
    
  };
  
  var chartHR = new google.visualization.LineChart(document.getElementById('canvasHR'));  
  chartHR.draw(dataHR, optionsHR);

  let dataSpeed = new google.visualization.DataTable();
  dataSpeed.addColumn('number', 'timestamp');
  dataSpeed.addColumn('number', 'speed (km/h)');
  
  dataSpeed.addRows([
    [0,  0],
  ]);
  
  var optionsSpeed = {
    title: 'Speed (km/h)',
    vAxis: {minValue:0, maxValue:20.0},
    hAxis: {textPosition: 'none'},
    legend: 'bottom',
    axisTitlesPosition: 'none',
    
  };
  
  var chartSpeed = new google.visualization.LineChart(document.getElementById('canvasFTMS'));  
  chartSpeed.draw(dataSpeed, optionsSpeed);

  let index = 0;
  let plotting = false;
  setInterval(function() {
    if (heartRateDevice.device !== null){
    let plotNewHR = heartRates[heartRates.length - 1];
      dataHR.addRow([index, plotNewHR]);
      //console.log(data.getNumberOfRows());
      if (dataHR.getNumberOfRows() > 49){
        dataHR.removeRow(0);
        //console.log('row removed: ',data.getNumberOfRows());
      }
      chartHR.draw(dataHR, optionsHR);
      plotting = true;
    }
    if (fitnessMachineDevice.device !== null){
      let plotNewSpeed = parseFloat(speeds[speeds.length - 1]);
        dataSpeed.addRow([index, plotNewSpeed]);
        //console.log(data.getNumberOfRows());
        if (dataSpeed.getNumberOfRows() > 49){
          dataSpeed.removeRow(0);
          //console.log('row removed: ',data.getNumberOfRows());
        }
        chartSpeed.draw(dataSpeed, optionsSpeed);
        plotting = true;
    }
    if (plotting){
      index++;
    }
  }, 500);
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
