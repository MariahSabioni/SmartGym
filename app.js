/*
Web bluetooth documentation: https://web.dev/bluetooth/
Code example: https://googlechrome.github.io/samples/web-bluetooth/read-characteristic-value-changed.html
Charts JS documentation: https://www.chartjs.org/docs/3.3.0/
Bootstrap documentation: https://getbootstrap.com/docs/5.0/getting-started/introduction/
*/

/* UI HOOKS*/
// general
let resetChartsButton = document.getElementById('resetChartsButton');
let toastDisconnection = document.getElementById('toastDisconnection');
let toastTitle = document.getElementById('toastTitle');
let toastMessage = document.getElementById('toastMessage');
// HR
let connectButtonHR = document.getElementById('connectButtonHR');
let disconnectButtonHR = document.getElementById('disconnectButtonHR');
let titleTextHR = document.getElementById('titleTextHR');
let statusTextHR = document.getElementById("statusTextHR");
let containerHR = document.getElementById("containerHR");
let zonesHR = document.getElementById("zonesHR");
let canvasHR = document.getElementById("canvasHR");
// treadmill
let collapseTreadmill = document.getElementById('collapseTreadmill');
let selectedTreadmill = document.getElementById('selectedTreadmill');
let connectButtonTreadmill = document.getElementById('connectButtonTreadmill');
let disconnectButtonTreadmill = document.getElementById('disconnectButtonTreadmill');
let titleTextTreadmill = document.getElementById('titleTextTreadmill');
let statusTextTreadmill = document.getElementById("statusTextTreadmill");
let containerTreadmill = document.getElementById("containerTreadmill");
let controlsTreadmill = document.getElementById("controlsTreadmill");
let speedUpButton = document.getElementById('speedUpButton');
let speedDownButton = document.getElementById('speedDownButton');
let speedUp2Button = document.getElementById('speedUp2Button');
let speedDown2Button = document.getElementById('speedDown2Button');
let inclinationUpButton = document.getElementById('inclinationUpButton');
let inclinationDownButton = document.getElementById('inclinationDownButton');
let inclinationUp2Button = document.getElementById('inclinationUp2Button');
let inclinationDown2Button = document.getElementById('inclinationDown2Button');
let speedTextTreadmill = document.getElementById('speedTextTreadmill');
let inclinationTextTreadmill = document.getElementById('inclinationTextTreadmill');
let startTreadmillButton = document.getElementById('startTreadmillButton');
let stopTreadmillButton = document.getElementById('stopTreadmillButton');
let selectionClickableFitnessMachine = document.getElementById('selectionClickableFitnessMachine');
let headingTreadmill = document.getElementById('headingTreadmill');
// concept2 pm5
let selectedConcept2pm = document.getElementById('selectedConcept2pm');
let connectButtonConcept2pm = document.getElementById('connectButtonConcept2pm');
let disconnectButtonConcept2pm = document.getElementById('disconnectButtonConcept2pm');
let titleTextConcept2pm = document.getElementById('titleTextConcept2pm');
let statusTextConcept2pm = document.getElementById("statusTextConcept2pm");
let containerConcept2pm = document.getElementById("containerConcept2pm");
let controlsConcept2pm = document.getElementById("controlsConcept2pm");
let startConcept2pmButton = document.getElementById('startConcept2pmButton');
let stopConcept2pmButton = document.getElementById('stopConcept2pmButton');
let selectionClickableDistance = document.getElementById('selectionClickableDistance');
// imu
let connectButtonIMU = document.getElementById('connectButtonIMU');
let disconnectButtonIMU = document.getElementById('disconnectButtonIMU');
let titleTextIMU = document.getElementById('titleTextIMU');
let statusTextIMU = document.getElementById("statusTextIMU");
let containerIMU = document.getElementById("containerIMU");
let canvasIMU = document.getElementById("canvasIMU");
let checkboxAcc = document.getElementById("checkboxAcc");
let containerAccSettings = document.getElementById("containerAccSettings");
let switchHR = document.getElementById("switchHR");
let switchSDK = document.getElementById("switchSDK");
// ble chars
let connectButtonBle = document.getElementById('connectButtonBle');
let disconnectButtonBle = document.getElementById('disconnectButtonBle');
let titleTextBle = document.getElementById('titleTextBle');
let statusTextBle = document.getElementById("statusTextBle");
let uuidInput = document.getElementById("uuidInput");
// recording
let titleTextRecord = document.getElementById('titleTextRecord');
let statusTextRecord = document.getElementById('statusTextRecord');
let stopRecordingButton = document.getElementById('stopRecordingButton');
let settingsModal = document.getElementById('settingsModal');
let settingsDevices = document.getElementById('settingsDevices');
let saveSettingsButton = document.getElementById('saveSettingsButton');
let fileNameInput = document.getElementById('fileNameInput');
let durationInput = document.getElementById('durationInput')
let settingsButton = document.getElementById('settingsButton');

/* GLOBAL VARIABLES*/

// HR
let heartRateMeasurements = [];
// treadmill
let speeds = [];
let inclinations = [];
let treadmillMeasurements = [];
// concept2 pm5
let paces = [];
let strokes = [];
let dragFactors = [];
let concept2pmMeasurements = [];
let concept2pmAddMeasurements = [];
let concept2pmAddMeasurements2 = [];
// imu
let combinedAcc = [];
let combinedGyro = [];
let imuMeasurements = {};
// recording data
let fileName = null;
let duration = null;
let isRecording = false;
let recordingStartTime = null;
let recordingDuration = null;
let recordingDeviceList = [];
// charts
let interval = 500; //miliseconds
let nIntervId;
let indexHR;
let indexTreadmill;
let indexConcept2pm;
// devices
let heartRateDevice = new HeartRateDevice();
let treadmillDevice = new TreadmillDevice();
let concept2pmDevice = new Concept2pmDevice();
let imuDevice = new ImuDevice();
let bleDevice = new BleDevice();

/* INITIAL UI SETTINGS*/

// HR
statusTextHR.textContent = "No HR sensor connected";
titleTextHR.textContent = "Scan for Bluetooth HR sensor";
//containerHR.style.display = "none";
// treadmill
statusTextTreadmill.textContent = "No treadmill connected";
titleTextTreadmill.textContent = "Scan for Bluetooth treadmill";
containerTreadmill.style.display = "none";
speedTextTreadmill.textContent = '0.0';
inclinationTextTreadmill.textContent = '0.0';
// concept2 pm5
statusTextConcept2pm.textContent = "No Concept2 PM connected";
titleTextConcept2pm.textContent = "Scan for Bluetooth Concept2 PM";
containerConcept2pm.style.display = "none";
// imu
statusTextIMU.textContent = "No IMU sensor connected";
titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
//containerIMU.style.display = "none";
// ble chars
statusTextBle.textContent = "No BLE device connected";
titleTextBle.textContent = "Scan for Bluetooth devices";
// recording
statusTextRecord.textContent = "Not recording";
titleTextRecord.textContent = "Record and save data to .json file";

/* LISTENERS*/

// general
resetChartsButton.addEventListener('click', function () {
  resetAllCharts();
});
// HR
connectButtonHR.addEventListener('click', function () {
  heartRateDevice.connect()
    .catch(error => {
      statusTextHR.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonHR.addEventListener('click', function () {
  heartRateDevice.disconnect();
});
// treadmill
connectButtonTreadmill.addEventListener('click', function () {
  treadmillDevice.connect()
    .catch(error => {
      statusTextTreadmill.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonTreadmill.addEventListener('click', function () {
  treadmillDevice.disconnect();
});
startTreadmillButton.addEventListener('click', function () {
  treadmillDevice.changeTreadmillStatus('start')
    .catch(error => {
      console.log(error);
    });
});
stopTreadmillButton.addEventListener('click', function () {
  treadmillDevice.changeTreadmillStatus('stop')
    .catch(error => {
      console.log(error);
    });
});
speedUpButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  treadmillDevice.increaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedDownButton.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  treadmillDevice.decreaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedUp2Button.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  treadmillDevice.increaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
speedDown2Button.addEventListener('click', function () {
  currSpeed = speeds[speeds.length - 1];
  treadmillDevice.decreaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationUpButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  treadmillDevice.increaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationDownButton.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  treadmillDevice.decreaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationUp2Button.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  treadmillDevice.increaseInclinationStep(currInclination, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationDown2Button.addEventListener('click', function () {
  currInclination = inclinations[inclinations.length - 1];
  treadmillDevice.decreaseInclinationStep(currInclination, 1.0)
    .catch(error => {
      console.log(error);
    });
});
headingTreadmill.addEventListener('click', function (event) {
  $('#collapseTreadmill').collapse('toggle');
});
selectionClickableFitnessMachine.addEventListener('click', function (e) {
  e.stopPropagation();
  $('.selectionClickableFitnessMachine').trigger('change');
});
selectionClickableFitnessMachine.addEventListener('change', function () {
  if (this.value == 0) {
    showTreadmillCanva();
  } else if (this.value == 1) {
    showConcept2pmCanva();
  }
});
// concept2 pm5
connectButtonConcept2pm.addEventListener('click', function () {
  concept2pmDevice.connect()
    .catch(error => {
      statusTextConcept2pm.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonConcept2pm.addEventListener('click', function () {
  concept2pmDevice.disconnect();
});
startConcept2pmButton.addEventListener('click', function () {
  concept2pmDevice.startWorkoutConcept2pm();
});
stopConcept2pmButton.addEventListener('click', function () {
  concept2pmDevice.resetConcept2pm();
});
// imu
connectButtonIMU.addEventListener('click', function () {
  imuDevice.connect()
    .catch(error => {
      statusTextIMU.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonIMU.addEventListener('click', function () {
  imuDevice.disconnect();
});
let checkboxes = ['checkboxAcc', 'checkboxGyr', 'checkboxMag', 'checkboxPPG'];
checkboxes.forEach(function (myCheckbox) {
  let meas = myCheckbox.slice(8);
  document.getElementById(myCheckbox).addEventListener('click', function () {
    if (this.checked) {
      imuDevice.sendCommand(meas, 'get_measurement_settings', null);
    }
  });
});
switchSDK.addEventListener('change', function () {
  if (switchSDK.checked) {
    imuDevice.sendCommand('SDK', 'start_measurement', null);
  } else {
    imuDevice.sendCommand('SDK', 'stop_measurement', null);
  }
  checkboxes.forEach(function (myCheckbox) {
    document.getElementById(myCheckbox).checked = false;
    $('#container' + myCheckbox.slice(8) + 'Settings').collapse("hide");
  });
});
let switches = ['switchAcc', 'switchGyr', 'switchMag', 'switchPPG'];
switches.forEach(function (mySwitch) {
  let meas = mySwitch.slice(6);
  document.getElementById(mySwitch).addEventListener('change', function () {
    if (this.checked) {
      let requestedSettings = [], settingsSelects = [];
      settingsSelects = [meas + 'sample_rate', meas + 'resolution', meas + 'range', meas + 'channels'];
      settingsSelects.forEach(function (select) {
        requestedSettings.push(document.getElementById(select).value);
      });
      imuDevice.sendCommand(meas, 'start_measurement', requestedSettings);
      document.getElementById('checkbox' + meas).checked = true;
      document.getElementById('checkbox' + meas).disabled = true;
    } else {
      imuDevice.sendCommand(meas, 'stop_measurement', null);
      document.getElementById('checkbox' + meas).disabled = false;
    }
  });
});
switchHR.addEventListener('change', function () {
  if (switchHR.checked) {
    imuDevice.findHeartRateCharacteristic();
  } else {
    imuDevice.stopHeartRateCharacteristic();
  }
});
// ble chars
connectButtonBle.addEventListener('click', function () {
  bleDevice.connect()
    .catch(error => {
      statusTextBle.textContent = error.message;
      console.log(error);
    })
});
disconnectButtonBle.addEventListener('click', function () {
  bleDevice.disconnect();
});
// recording
stopRecordingButton.addEventListener('click', function () {
  stopRecording();
});
settingsModal.addEventListener('show.bs.modal', event => {
  updateSettingsModalContent();
})
saveSettingsButton.addEventListener('click', function () {
  saveSettingsAndRecord();
  $('#settingsModal').modal('hide'); // bootstrap methods require JQuery
});

/* SETTING UP CHARTS*/

function drawChartHR() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [{
      label: 'Heart Rate (bpm)',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      data: [],
    },]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true
        },
        x: {
          type: 'time',
          time: {
            unit: 'second'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Heart rate', padding: {
            top: 5,
            bottom: 5
          }
        },
        legend: {
          position: 'bottom',
        }
      },
      responsive: true,
      maintainAspectRatio: false,
    }
  };
  chartHR = new Chart(
    document.getElementById('canvasHR'),
    config
  );
}

function resetAllCharts() {
  if (!isDeviceConnected()) {
    alert("No devices connected!");
    return;
  }
  removeAllData(chartHR);
  chartHR.reset();
  // drawChartTreadmill();
  // drawChartConcept2pm();
}

/* LOOP UPDATE*/

function startLoopUpdate() {
  if (!nIntervId) {
    nIntervId = setInterval(updateChartAndRecording, interval);
  }
}

function stopLoopUpdate() {
  clearInterval(nIntervId);
  nIntervId = null;
}

// loop function: we use only one setInterval since javascript is single threaded
function updateChartAndRecording() {
  // part 0: stop loop if no device is connected
  if (!isDeviceConnected()) {
    stopLoopUpdate();
    return;
  }
  // part 1: update the recording UI
  if (isRecording) {
    prettyDuration = new Date(duration).toISOString().slice(11, 19);
    recordingDuration = Date.now() - recordingStartTime;
    prettyRecordingDuration = new Date(recordingDuration).toISOString().slice(11, 19);
    timeRemaining = duration - recordingDuration + 1000;
    prettyTimeRemaining = new Date(timeRemaining).toISOString().slice(11, 19);
    statusTextRecord.innerHTML = `Now recording:<br />${recordingDeviceList.join(' <br /> ')}<br />Auto stop: ${prettyDuration}<br />Current duration: ${prettyRecordingDuration}<br />Time remaining: ${prettyTimeRemaining}`
    // automatic stop recording to preset autostop
    if (recordingDuration >= duration) {
      saveToFile();
      isRecording = false;
      // reset UI
      statusTextRecord.textContent = "Not recording";
      titleTextRecord.textContent = "Record and save data to .json file";
      settingsButton.disabled = false;
      fileName = null;
      duration = null;
      recordingStartTime = null;
      resetMeasurements(true, true, true, true);
      setTimeout(resetAllCharts(), 1000);
    }
  }
  // part 2: update the charts
  indexHR = new Date(Date.now());
  indexTreadmill = indexHR;
  indexConcept2pm = indexHR;
  if (heartRateDevice.device !== null) {
    let plotNewHR = heartRateMeasurements[heartRateMeasurements.length - 1].heartRate;
    addData(chartHR, indexHR, plotNewHR);
  }
  if (treadmillDevice.device !== null) {
    let plotNewSpeed = parseFloat(speeds[speeds.length - 1]);
    let plotNewInclination = parseFloat(inclinations[inclinations.length - 1]);

  }
  if (concept2pmDevice.device !== null) {
    let plotNewPace = new Date(parseFloat(paces[paces.length - 1]) * 1000);
    let plotNewStroke = parseFloat(strokes[strokes.length - 1]);

  }
}

function addData(chart, label, data) {
  if (chart.data.labels.length > 3 * 60 * 1000 / interval) {
    // chart will display 3 minutes of data
    chart.data.labels.shift();
    chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
  }
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}

function removeAllData(chart) {
  chart.data.labels = [];
  chart.data.datasets.forEach((dataset) => {
    dataset.data = [];
  });
  chart.update();
}

/* UPDATE USER INTERFACE*/

// HR
function updateDisconnectedHR(reason) {
  statusTextHR.textContent = "No HR sensor connected";
  titleTextHR.textContent = "Scan for Bluetooth HR sensor";
  containerHR.style.display = "none";
  heartRateDevice = new HeartRateDevice();
  resetMeasurements(true, false, false, false);
  chartHR.destroy();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to HR sensor failed. Try again.", "Heart rate sensor");
      break;
    case 'lost_connection':
      showToast("Connection to HR sensor lost. Try again.", "Heart rate sensor");
      break;
    case 'disconnected':
      showToast("Disconnected from HR sensor.", "Heart rate sensor");
      break;
    default:
      return;
  }
}
function updateConnectedHR() {
  titleTextHR.textContent = "Connected to: " + heartRateDevice.getDeviceName();
  containerHR.style.display = "block";
  drawChartHR();
}
function updateDataHR(heartRateMeasurement) {
  statusTextHR.innerHTML = `&#x2764; Heart rate: ${heartRateMeasurement.heartRate}bpm`;
}

// fitness machines
function showTreadmillCanva() {
  selectedConcept2pm.style.display = "none";
  selectedTreadmill.style.display = "block";
}
function showConcept2pmCanva() {
  selectedTreadmill.style.display = "none";
  selectedConcept2pm.style.display = "block";
}
// treadmill
function updateDisconnectedTreadmillUI() {
  treadmillDevice = new TreadmillDevice();
  statusTextTreadmill.textContent = "No treadmill connected";
  titleTextTreadmill.textContent = "Scan for Bluetooth treadmill";
  containerTreadmill.style.display = "none";
}
function updateTreadmillUI(treadmillMeasurement) {
  //UI
  statusTextTreadmill.innerHTML = /*'&#x1F3C3;'*/ `&#x1F4A8; Speed: ${(treadmillMeasurement.speed < 10 ? '&nbsp;' : '')}${treadmillMeasurement.speed} km/h<br />&#x26F0; Inclination: ${(treadmillMeasurement.inclination < 0 ? '' : '&nbsp;')}${treadmillMeasurement.inclination} %`;
  titleTextTreadmill.textContent = "Connected to: " + treadmillDevice.getDeviceName();
  containerTreadmill.style.display = "block";
  speedTextTreadmill.textContent = treadmillMeasurement.speed;
  inclinationTextTreadmill.textContent = treadmillMeasurement.inclination;
  //save results to lists
  inclinations.push(treadmillMeasurement.inclination);
  speeds.push(treadmillMeasurement.speed);
  treadmillMeasurements.push(treadmillMeasurement);
  console.log('Treadmill array length: ', treadmillMeasurements.length);
}
// concept2 pm5
function updateDisconnectedConcept2pmUI() {
  concept2pmDevice = new Concept2pmDevice();
  statusTextConcept2pm.textContent = "No Concept2 PM connected";
  titleTextConcept2pm.textContent = "Scan for Bluetooth Concept2 PM";
  containerConcept2pm.style.display = "none";
}
function updateConcept2pmUI(concept2pmAddMeasurement) {
  //UI
  statusTextConcept2pm.innerHTML = /*'&#x1F3C3;'*/ `Pace: ${(concept2pmAddMeasurement.prettyCurrentPace)}/500m<br />Speed: ${(concept2pmAddMeasurement.speed)}m/s<br />Stroke rate: ${(concept2pmAddMeasurement.strokeRate)}spm<br />Drag factor: ${(dragFactors[dragFactors.length - 1])}`;
  titleTextConcept2pm.textContent = "Connected to: " + concept2pmDevice.getDeviceName();
  containerConcept2pm.style.display = "block";
  //save results to lists
  strokes.push(concept2pmAddMeasurement.strokeRate);
  paces.push(concept2pmAddMeasurement.currentPace);
  concept2pmAddMeasurements.push(concept2pmAddMeasurement);
  console.log('Concept2 PM array length: ', concept2pmAddMeasurements.length);
}
function updateConcept2pmMeasurements(concept2pmMeasurement) {
  concept2pmMeasurements.push(concept2pmMeasurement);
  dragFactors.push(concept2pmMeasurement.dragFactor)
}
function updateConcept2pmAdd2Measurements(concept2pmAddMeasurement2) {
  concept2pmAddMeasurements2.push(concept2pmAddMeasurement2);
}
// ble device
function updateDisconnectedBle(reason) {
  statusTextBle.textContent = "No BLE device connected";
  titleTextBle.textContent = "Scan for Bluetooth devices";
  $("#uuidInput").removeAttr('disabled');
  bleDevice = new BleDevice();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to BLE device failed. Try again.", "BLE device");
      break;
    case 'lost_connection':
      showToast("Connection to BLE device lost. Try again.", "BLE device");
      break;
    case 'disconnected':
      showToast("Disconnected from BLE device.", "BLE device");
      break;
    default:
      return;
  }
}
function updateConnectedBle(response) {
  statusTextBle.innerHTML = response;
  titleTextBle.textContent = "Connected to: " + bleDevice.getDeviceName();
}
// imu
function updateDisconnectedIMU(reason) {
  statusTextIMU.textContent = "No IMU sensor connected";
  titleTextIMU.textContent = "Scan for Bluetooth IMU sensor";
  containerIMU.style.display = "none";
  imuDevice = new ImuDevice();
  resetMeasurements(false, false, false, true);
  //chartIMU.destroy();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to IMU sensor failed. Try again.", "IMU sensor");
      break;
    case 'lost_connection':
      showToast("Connection to IMU sensor lost. Try again.", "IMU sensor");
      break;
    case 'disconnected':
      showToast("Disconnected from IMU sensor.", "IMU sensor");
      break;
    default:
      return;
  }
}
function updateConnectedIMU() {
  statusTextIMU.innerHTML = `Subscribe to a data stream to receive data.`;
  titleTextIMU.textContent = "Connected to: " + imuDevice.getDeviceName();
  containerIMU.style.display = "block";
}
function updateImuSettings(measType, measId) {
  Object.values(imuDevice.settingTypes).forEach(settingValue => {
    let dropdownId = measType + settingValue;
    [...document.getElementById(dropdownId).options].forEach(o => o.remove())
    let settingList = imuDevice.measTypes[measId][settingValue];
    Object.values(settingList).forEach(setting => {
      var option = document.createElement("option");
      option.setAttribute("value", setting);
      var optionName = document.createTextNode(setting);
      option.appendChild(optionName);
      document.getElementById(dropdownId).appendChild(option);
    });
  });
}
function updateImuData(imuMeasurement) {
  statusTextIMU.innerHTML = `Receiving data.`;
  titleTextIMU.textContent = "Connected to: " + imuDevice.getDeviceName();
  containerIMU.style.display = "block";
  // //save results to lists
  let measurementType = imuMeasurement[0].measurementType;
  if (imuMeasurements[measurementType] == undefined) {
    imuMeasurements[measurementType] = []
  }
  imuMeasurement.forEach(function (sample) {
    imuMeasurements[measurementType].push(sample);
  });
}

/* BLE DEVICE UTILS*/

function isDeviceConnected() {
  let deviceList = [];
  if (heartRateDevice.device !== null) {
    deviceList.push('HR sensor: ' + heartRateDevice.getDeviceName());
  }
  if (treadmillDevice.device !== null) {
    deviceList.push('Treadmill: ' + treadmillDevice.getDeviceName());
  }
  if (concept2pmDevice.device !== null) {
    deviceList.push('Concept2 PM: ' + concept2pmDevice.getDeviceName());
  }
  if (imuDevice.device !== null) {
    deviceList.push('IMU: ' + concept2pmDevice.getDeviceName());
  }
  if (deviceList.length == 0) {
    return false;
  } else {
    return true;
  }
}

function resetMeasurements(heartRate, treadmill, concept2pm, imu) {
  if (treadmill) {
    speeds = [];
    inclinations = [];
    treadmillMeasurements = [];
  }
  if (heartRate) {
    heartRateMeasurements = [];
  }
  if (concept2pm) {
    paces = [];
    strokes = [];
    concept2pmMeasurements = [];
    concept2pmAddMeasurements = [];
    concept2pmAddMeasurements2 = [];
  }
  if (imu) {
    combinedAcc = [];
    combinedGyro = [];
    imuMeasurements = [];
  }
}

/* RECORDING DATA*/

function updateSettingsModalContent() {
  let deviceList = [];
  if (heartRateDevice.device !== null) {
    deviceList.push('HR sensor: ' + heartRateDevice.getDeviceName());
  }
  if (treadmillDevice.device !== null) {
    deviceList.push('Treadmill: ' + treadmillDevice.getDeviceName());
  }
  if (concept2pmDevice.device !== null) {
    deviceList.push('Concept2 PM: ' + concept2pmDevice.getDeviceName());
  }
  if (imuDevice.device !== null) {
    deviceList.push('IMU sensor: ' + imuDevice.getDeviceName());
  }
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

function startRecording() {
  if (fileName == null) {
    fileName = 'experiment_' + Date.now();
  }
  if (duration == null) {
    duration = 60;
  }
  duration = duration * 60 * 1000 //miliseconds

  isRecording = true;
  recordingStartTime = Date.now();
  settingsButton.disabled = true;
  resetMeasurements(true, true, true, true);
  setTimeout(resetAllCharts(), 500);
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
    recordingStartTime = null;
    resetMeasurements(true, true, true, true);
    setTimeout(resetAllCharts(), 1000)
  } else {
    showToast("Not recording!", "Record data");
  }
}

function saveToFile() {
  var file;
  var properties = { type: 'application/json' }; // Specify the file's mime-type.
  let heartRateSensor = null;
  let treadmill = null;
  let concept2pm = null;
  let imu = null;
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
  if (treadmillDevice.device !== null) {
    treadmill = {
      device: treadmillDevice.getDeviceName(),
      measurements: treadmillMeasurements,
    };
  }
  if (concept2pmDevice.device !== null) {
    concept2pm = {
      device: concept2pmDevice.getDeviceName(),
      measurements: concept2pmMeasurements,
      measurementsAdditional: concept2pmAddMeasurements,
      measurementsAdditional2: concept2pmAddMeasurements2,
    };
  }
  if (imuDevice.device !== null) {
    imu = {
      device: imuDevice.getDeviceName(),
      measurements: imuMeasurements,
    };
  }
  var myObj = { experiment, heartRateSensor, treadmill, concept2pm, imu };
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
  showToast("File downloaded!", "Record data")
}