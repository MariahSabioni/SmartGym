// ui hooks
let connectButtonHR = document.getElementById('connectButtonHR');
let disconnectButtonHR = document.getElementById('disconnectButtonHR');
let titleTextHR = document.getElementById('titleTextHR');
let statusTextHR = document.getElementById("statusTextHR");
let containerHR = document.getElementById("containerHR");
let zonesHR = document.getElementById("zonesHR");
let canvasHR = document.getElementById("canvasHR");

let connectButtonFTMS = document.getElementById('connectButtonFTMS');
let disconnectButtonFTMS = document.getElementById('disconnectButtonFTMS');
let titleTextFTMS = document.getElementById('titleTextFTMS');
let statusTextFTMS = document.getElementById("statusTextFTMS");
let containerFTMS = document.getElementById("containerFTMS");
let controlsFTMS = document.getElementById("controlsFTMS");
let canvasFTMS = document.getElementById("canvasFTMS");

let speedUpButton = document.getElementById('speedUpButton');
let speedDownButton = document.getElementById('speedDownButton');
let speedUpStepButton = document.getElementById('speedUpStepButton');
let speedDownStepButton = document.getElementById('speedDownStepButton');
let inclinationUpButton = document.getElementById('inclinationUpButton');
let inclinationDownButton = document.getElementById('inclinationDownButton');
let inclinationUpStepButton = document.getElementById('inclinationUpStepButton');
let inclinationDownStepButton = document.getElementById('inclinationDownStepButton');
let speedTextFTMS = document.getElementById('speedTextFTMS');
let inclinationTextFTMS = document.getElementById('inclinationTextFTMS');

let connectButtoIMU = document.getElementById('connectButtoIMU');
let disconnectButtonIMU = document.getElementById('disconnectButtonIMU');
let titleTextIMU = document.getElementById('titleTextIMU');
let statusTextIMU = document.getElementById("statusTextIMU");
let canvasContainerIMU = document.getElementById("canvasContainerIMU");
let canvasIMU = document.getElementById("canvasIMU");

let titleTextRecord = document.getElementById('titleTextRecord');
let statusTextRecord = document.getElementById('statusTextRecord');
let stopRecordingButton = document.getElementById('stopRecordingButton');
let settingsModal = document.getElementById('settingsModal');
let settingsDevices = document.getElementById('settingsDevices');
let saveSettingsButton = document.getElementById('saveSettingsButton');
let fileNameInput = document.getElementById('fileNameInput');
let durationInput = document.getElementById('durationInput')
let settingsButton = document.getElementById('settingsButton');
let startTreadmillButton = document.getElementById('startTreadmillButton');
let stopTreadmillButton = document.getElementById('stopTreadmillButton');

let toastDisconnection = document.getElementById('toastDisconnection');
let toastTitle = document.getElementById('toastTitle');
let toastMessage = document.getElementById('toastMessage');

//global variables
//list of results
let heartRates = [];
let heartRateMeasurements = [];
let speeds = [];
let inclinations = [];
let treadmillMeasurements = [];
//recording
let fileName = null;
let duration = null;
let isRecording = false;
let recordingStartTime = null;
let recordingDuration = null;
let recordingDeviceList = [];
//devices
let fitnessMachineDevice = new FitnessMachineDevice();
let heartRateDevice = new HeartRateDevice();
//let conceptErgDevice = new ConceptErgDevice();

// initial ui settings
statusTextHR.textContent = "No HR sensor connected";
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
containerHR.style.display = "none";

statusTextFTMS.textContent = "No fitness machine connected";
titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
containerFTMS.style.display = "none";
speedTextFTMS.textContent = '0.0';
inclinationTextFTMS.textContent = '0.0';

statusTextIMU.textContent = "No IMU sensor connected";
titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
canvasContainerIMU.style.display = "none";

statusTextRecord.textContent = "Not recording";
titleTextRecord.textContent = "Record and save data to .json file";
canvasContainerRecord.style.display = "none";

// google chart
google.charts.load('current', {
  // callback: function () {
  //   drawChart();
  //   $(window).resize(drawChart);
  // },
  packages: ['corechart', 'line']
});
google.charts.setOnLoadCallback(drawChart);

//listeners
connectButtonHR.addEventListener('click', function () {
  heartRateDevice.connect()
    .catch(error => {
      statusTextHR.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonHR.addEventListener('click', function () {
  heartRateDevice.disconnect();
  console.log(heartRateDevice);
});
connectButtonFTMS.addEventListener('click', function () {
  fitnessMachineDevice.connect()
    .catch(error => {
      statusTextFTMS.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonFTMS.addEventListener('click', function () {
  fitnessMachineDevice.disconnect();
  console.log(fitnessMachineDevice);
});
startTreadmillButton.addEventListener('click', function () {
  fitnessMachineDevice.changeTreadmillStatus('start')
    .catch(error => {
      console.log(error);
    });
});
stopTreadmillButton.addEventListener('click', function () {
  fitnessMachineDevice.changeTreadmillStatus('stop')
    .catch(error => {
      console.log(error);
    });
});
speedUpButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.increaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedDownButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.decreaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedUpStepButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.increaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
speedDownStepButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  fitnessMachineDevice.decreaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationUpButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.increaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationDownButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.decreaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationUpStepButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.increaseInclinationStep(currInclination, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationDownStepButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  fitnessMachineDevice.decreaseInclinationStep(currInclination, 1.0)
    .catch(error => {
      console.log(error);
    });
});
stopRecordingButton.addEventListener('click', function () {
  stopRecording();
});
settingsModal.addEventListener('show.bs.modal', event => {
  updateSettingsModalContent();
})
saveSettingsButton.addEventListener('click', function () {
  saveSettingsAndRecord();
  $('#settingsModal').modal('hide'); //why does it work only with jQuery?
});

function drawChart() {
  //create HR chart
  let dataHR = new google.visualization.DataTable();
  dataHR.addColumn('number', 'timestamp');
  dataHR.addColumn('number', 'heart rate (bpm)');
  var optionsHR = {
    title: 'Heart rate (bpm)',
    vAxis: { minValue: 0, maxValue: 200 },
    hAxis: { textPosition: 'none' },
    legend: 'bottom',
    axisTitlesPosition: 'none',
    chartArea: { width: '80%', height: '80%' },
    theme: 'material',
    width: '100%'
  };
  var chartHR = new google.visualization.LineChart(document.getElementById('canvasHR'));
  chartHR.draw(dataHR, optionsHR);

  //create treadmill chart
  let dataTreadmill = new google.visualization.DataTable();
  dataTreadmill.addColumn('number', 'timestamp');
  dataTreadmill.addColumn('number', 'speed (km/h)');
  dataTreadmill.addColumn('number', 'inclination (%)');
  var optionsSpeed = {
    title: 'Speed (km/h) and inclination (%)',
    series: {
      0: { targetAxisIndex: 0, },
      1: { targetAxisIndex: 1, }
    },
    vAxes: {
      0: { ticks: [0, 5, 10, 15, 20, 25] },
      1: { ticks: [-2.5, 0, 2.5, 5, 7.5, 10] },
    },
    hAxis: { textPosition: 'none' },
    legend: 'bottom',
    axisTitlesPosition: 'none',
    chartArea: { width: '80%', height: '80%' },
    theme: 'material',
    width: '100%'
  };
  var chartSpeed = new google.visualization.LineChart(document.getElementById('canvasFTMS'));
  chartSpeed.draw(dataTreadmill, optionsSpeed);

  //loop to update charts and UI
  let interval = 500; //miliseconds
  let indexHR = 0;
  let indexFTMS = 0;
  setInterval(function () {
    //part 1: update the recording UI
    if (isRecording) {
      prettyDuration = new Date(duration).toISOString().slice(11, 19);
      recordingDuration = Date.now() - recordingStartTime;
      prettyRecordingDuration = new Date(recordingDuration).toISOString().slice(11, 19);
      timeRemaining = duration - recordingDuration + 1000;
      prettyTimeRemaining = new Date(timeRemaining).toISOString().slice(11, 19);
      statusTextRecord.innerHTML = `Now recording:<br />${recordingDeviceList.join(' <br /> ')}<br />Auto stop: ${prettyDuration}<br />Current duration: ${prettyRecordingDuration}<br />Time remaining: ${prettyTimeRemaining}`
      //automatic stop recording
      if (recordingDuration >= duration) {
        saveToFile();
        isRecording = false;
        //reset UI
        statusTextRecord.textContent = "Not recording";
        titleTextRecord.textContent = "Record and save data to .json file";
        settingsButton.disabled = false;
        fileName = null;
        duration = null;
      }
    }
    //part 2: update the charts
    if (heartRateDevice.device !== null) {
      let plotNewHR = heartRates[heartRates.length - 1];
      dataHR.addRow([indexHR, plotNewHR]);
      if (dataHR.getNumberOfRows() > 5 * 60 * 2) {
        dataHR.removeRow(0);
      }
      chartHR.draw(dataHR, optionsHR);
      indexHR++;
    }
    if (fitnessMachineDevice.device !== null) {
      let plotNewSpeed = parseFloat(speeds[speeds.length - 1]);
      let plotNewInclination = parseFloat(inclinations[inclinations.length - 1]);
      dataTreadmill.addRow([indexFTMS, plotNewSpeed, plotNewInclination]);
      if (dataTreadmill.getNumberOfRows() > 5 * 60 * 2) {
        dataTreadmill.removeRow(0);
      }
      chartSpeed.draw(dataTreadmill, optionsSpeed);
      indexFTMS++;
    }
  }, interval);
}

function updateDisconnectedHRUI() {
  statusTextHR.textContent = "No HR sensor connected";
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  containerHR.style.display = "none";
}

function updateDisconnectedFTMSUI() {
  statusTextFTMS.textContent = "No fitness machine connected";
  titleTextFTMS.textContent = "Scan for Bluetooth fitness machine";
  containerFTMS.style.display = "none";
}

function updateFTMSUI(treadmillMeasurement) {
  //UI
  statusTextFTMS.innerHTML = /*'&#x1F3C3;'*/ `&#x1F4A8; Speed: ${(treadmillMeasurement.speed < 10 ? '&nbsp;' : '')}${treadmillMeasurement.speed} km/h<br />&#x26F0; Inclination: ${(treadmillMeasurement.inclination < 0 ? '' : '&nbsp;')}${treadmillMeasurement.inclination} %`;
  titleTextFTMS.textContent = "Connected to: " + fitnessMachineDevice.getDeviceName();
  containerFTMS.style.display = "block";
  speedTextFTMS.textContent = treadmillMeasurement.speed;
  inclinationTextFTMS.textContent = treadmillMeasurement.inclination;
  //save results to lists
  inclinations.push(treadmillMeasurement.inclination);
  speeds.push(treadmillMeasurement.speed);
  treadmillMeasurements.push(treadmillMeasurement);
  console.log('Treadmill array length: ', treadmillMeasurements.length);
}

function updateHRUI(heartRateMeasurement) {
  //UI
  statusTextHR.innerHTML = `&#x2764; Heart rate: ${heartRateMeasurement.heartRate}bpm`;
  titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
  containerHR.style.display = "block";
  //save results to lists
  heartRates.push(heartRateMeasurement.heartRate);
  heartRateMeasurements.push(heartRateMeasurement);
  console.log('HR array length: ', heartRateMeasurements.length);
}

function showToast(message, device) {
  toastMessage.textContent = message;
  toastTitle.textContent = device;
  var toast = new bootstrap.Toast(toastDisconnection)
  toast.show();
}

function updateSettingsModalContent() {
  let deviceList = [];
  if (heartRateDevice.device !== null) {
    deviceList.push('HR sensor: ' + heartRateDevice.getDeviceName());
  }
  if (fitnessMachineDevice.device !== null) {
    deviceList.push('Treadmill: ' + fitnessMachineDevice.getDeviceName());
  }
  // if (conceptErgDevice.device !== null){
  //   deviceList.push('Ergometer: ' + conceptErgDevice.getDeviceName());
  // }
  if (deviceList.length !== 0) {
    settingsDevices.innerHTML = deviceList.join(' <br /> ');
  } else {
    settingsDevices.innerHTML = "No devices connected";
  }
  recordingDeviceList = deviceList;
  fileName = "experiment_" + Date.now();
  fileNameInput.value = fileName;
  duration = 60;
  durationInput.value = duration;
}

function saveSettingsAndRecord() {
  if (!isDeviceConnected()) {
    alert('No devices connected. Connect a device to record data.');
    return;
  } else {
    //validate and get filename and auto stop setting
    if (fileNameInput.value == "") {
      console.log('empty input');
      fileNameInput.value = fileName;
      return;
    } else if (fileNameInput.value.replace(/\s+/g, '').length == 0) {
      console.log('incorrect input');
      fileNameInput.value = fileName;
      return;
    } else {
      console.log('correct input')
    }
    if (durationInput.value == "") {
      console.log('empty input');
      durationInput.value = duration;
      return;
    } else if ((!/\D/.test(durationInput.value)) && (durationInput.value > 0) && (durationInput.value < 300)) {
      console.log('correct input')
    } else {
      console.log('incorrect input');
      durationInput.value = duration;
      return;
    }
    fileName = fileNameInput.value;
    duration = durationInput.value;
    console.log('new filename: ', fileName);
    console.log('new duration: ', duration);
    startRecording();
  }
}

function isDeviceConnected() {
  let deviceList = [];
  if (heartRateDevice.device !== null) {
    deviceList.push('HR sensor: ' + heartRateDevice.getDeviceName());
  }
  if (fitnessMachineDevice.device !== null) {
    deviceList.push('Treadmill: ' + fitnessMachineDevice.getDeviceName());
  }
  // if (conceptErgDevice.device !== null){
  //   deviceList.push('Ergometer: ' + conceptErgDevice.getDeviceName());
  // }
  if (deviceList.length == 0) {
    return false;
  } else {
    return true;
  }
}

function startRecording() {
  if (fileName == null) {
    fileName = 'experiment_' + Date.now();
  }
  if (duration == null) {
    duration = 60;
  }
  duration = duration * 60 * 1000 //miliseconds
  resetMeasurements(true, true);

  isRecording = true;
  recordingStartTime = Date.now();
  settingsButton.disabled = true;
  drawChart();
}

function resetMeasurements(heartRate, treadmill) {
  if (heartRate) {
    heartRates = [];
    heartRateMeasurements = [];
  }
  if (treadmill) {
    speeds = [];
    inclinations = [];
    treadmillMeasurements = [];
  }
}

function stopRecording() {
  if (isRecording) {
    isRecording = false;
    saveToFile();
    //reset UI
    statusTextRecord.textContent = "Not recording";
    titleTextRecord.textContent = "Record and save data to .json file";
    settingsButton.disabled = false;
    fileName = null;
    duration = null;
    isRecording = false;
    recordingStartTime = null;
    resetMeasurements(true, true);
  } else {
    alert("Not recording!");
  }
}

function saveToFile() {
  var file;
  var properties = { type: 'application/json' }; // Specify the file's mime-type.
  let heartRateSensor = null;
  let treadmill = null;
  let endTime = Date.now();
  let prettyRecordingStartTime = new Date(recordingStartTime).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
  let prettyRecordingEndTime = new Date(endTime).toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
  let prettyPresetDuration = new Date(duration).toISOString().slice(11, 19);
  let prettyActualDuration = new Date(endTime - recordingStartTime + 1000).toISOString().slice(11, 19);
  let experiment = {
    fileName: fileName,
    devices: recordingDeviceList,
    presetDuration: prettyPresetDuration,
    actualDuration: prettyActualDuration,
    startTime: prettyRecordingStartTime,
    endTime: prettyRecordingEndTime,
  };
  if (heartRateDevice.device !== null) {
    heartRateSensor = {
      device: heartRateDevice.getDeviceName(),
      measurements: heartRateMeasurements,
    };
  }
  if (fitnessMachineDevice.device !== null) {
    //fix the distance and duration values to account only for the experiment.
    //the treasmill does not allow control of distance and duration (counts from when the treadmill started)
    let initialDistance = treadmillMeasurements[0].distance;
    let initialDuration = treadmillMeasurements[0].duration;
    const treadmillMeasurementsFixed = treadmillMeasurements.map(element => {
      return {
        ...element,
        distance: element.distance - initialDistance,
        duration: new Date(element.duration - initialDuration).toISOString().slice(11, 19),
      };
    });
    treadmill = {
      device: fitnessMachineDevice.getDeviceName(),
      measurements: treadmillMeasurementsFixed,
    };
  }
  var myObj = { experiment, heartRateSensor, treadmill };
  var myJSON = JSON.stringify(myObj);
  try {
    var downloadFileName = fileName.replace(/\s+/g, '-') + ".json";
    file = new File(myJSON, downloadFileName, properties);
  } catch (e) {
    file = new Blob([myJSON], { type: "application/json" });
  }
  var a = document.createElement('a');
  a.href = window.URL.createObjectURL(file);
  a.download = downloadFileName;
  a.click();
  alert("File downloaded!")
}