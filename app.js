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
let treadmillMeasurements = [];
// concept2 pm5
let concept2pmMeasurements = [];
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
containerHR.style.display = "none";
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
containerIMU.style.display = "none";
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
  currSpeed = treadmillMeasurements.at(-1).speed;
  treadmillDevice.increaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedDownButton.addEventListener('click', function () {
  currSpeed = treadmillMeasurements.at(-1).speed;
  treadmillDevice.decreaseSpeedStep(currSpeed, 0.1)
    .catch(error => {
      console.log(error);
    });
});
speedUp2Button.addEventListener('click', function () {
  currSpeed = treadmillMeasurements.at(-1).speed;
  treadmillDevice.increaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
speedDown2Button.addEventListener('click', function () {
  currSpeed = treadmillMeasurements.at(-1).speed;
  treadmillDevice.decreaseSpeedStep(currSpeed, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationUpButton.addEventListener('click', function () {
  currInclination = treadmillMeasurements.at(-1).inclination;
  treadmillDevice.increaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationDownButton.addEventListener('click', function () {
  currInclination = treadmillMeasurements.at(-1).inclination;
  treadmillDevice.decreaseInclinationStep(currInclination, 0.5)
    .catch(error => {
      console.log(error);
    });
});
inclinationUp2Button.addEventListener('click', function () {
  currInclination = treadmillMeasurements.at(-1).inclination;
  treadmillDevice.increaseInclinationStep(currInclination, 1.0)
    .catch(error => {
      console.log(error);
    });
});
inclinationDown2Button.addEventListener('click', function () {
  currInclination = treadmillMeasurements.at(-1).inclination;
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

/* SET UP CHARTS*/

function drawChartHR() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Heart rate (bpm)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: { // for improved performance https://www.chartjs.org/docs/2.9.4/general/performance.html
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          suggestedMax: 100,
          suggestedMin: 50,
          ticks: {
            callback: function (val) {
              return val.toFixed(0);
            },
            stepSize: 5
          },
          display: true,
          position: 'left',
          title: {
            text: 'Heart rate (bpm)',
            display: true,
          }
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'Heart rate sensor', padding: {
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
function drawChartTreadmill() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Speed (km/h)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: 'Inclination (%)',
        backgroundColor: 'rgb(122, 99, 255)',
        borderColor: 'rgba(102, 99, 255, 0.2)',
        data: [],
        yAxisID: 'y2',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: { // for improved performance https://www.chartjs.org/docs/2.9.4/general/performance.html
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          ticks: {
            callback: function (val) {
              return val.toFixed(1);
            },
          },
          display: true,
          position: 'left',
          title: {
            text: 'Speed (km/h)',
            display: true,
          }
        },
        y2: {
          type: 'linear',
          ticks: {
            callback: function (val, index) {
              return val.toFixed(1);
            },
          },
          display: true,
          position: 'right',
          title: {
            text: 'Inclination (%)',
            display: true,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        title: {
          display: true,
          text: 'Treadmill', padding: {
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
  chartTreadmill = new Chart(
    document.getElementById('canvasTreadmill'),
    config
  );
}
function drawChartConcept2pm() {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Stroke rate (spm)',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: 'Pace (mm:ss/500m)',
        backgroundColor: 'rgb(122, 99, 255)',
        borderColor: 'rgba(102, 99, 255, 0.2)',
        data: [],
        yAxisID: 'y2',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: { // for improved performance https://www.chartjs.org/docs/2.9.4/general/performance.html
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          // ticks: {
          //   callback: function (val, index) {
          //     return val.toFixed(1);
          //   },
          // },
          display: true,
          position: 'left',
          title: {
            text: 'Stroke rate (spm)',
            display: true,
          }
        },
        y2: {
          type: 'linear',
          ticks: {
            callback: function (val, index) {
              return index % 2 === 0 ? new Date(val * 1000).toISOString().slice(14, 19) : '';
            },
          },
          display: true,
          position: 'right',
          title: {
            text: 'Pace (mm:ss/500m)',
            display: true,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        tooltip: {
          enabled: false,
        },
        title: {
          display: true,
          text: 'Concept2 PM', padding: {
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
  chartConcept2pm = new Chart(
    document.getElementById('canvasConcept2pm'),
    config
  );
}
function drawChartIMU(measType, numOfChannels) {
  const labels = [];
  const data = {
    labels: labels,
    datasets: [
      {
        label: measType,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: measType,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
      {
        label: measType,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgba(255, 99, 132, 0.2)',
        data: [],
        yAxisID: 'y1',
      },
    ]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
      spanGaps: true,
      animation: { // for improved performance https://www.chartjs.org/docs/2.9.4/general/performance.html
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'second'
          },
          ticks: {
            maxRotation: 20, // for improved performance
            minRotation: 20,
            font: {
              size: 10,
            }
          }
        },
        y1: {
          type: 'linear',
          suggestedMax: 100,
          suggestedMin: 50,
          ticks: {
            callback: function (val) {
              return val.toFixed(0);
            },
            stepSize: 5
          },
          display: true,
          position: 'left',
        },
      },
      plugins: {
        title: {
          display: true,
          text: 'IMU sensor', padding: {
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
  chartIMU = new Chart(
    document.getElementById('canvasIMU'),
    config
  );
}
function resetAllCharts() {
  if (!isDeviceConnected()) {
    alert("No devices connected!");
    return;
  }
  try {
    removeAllData(chartHR);
    chartHR.reset();
  } catch (e) { };
  try {
    removeAllData(chartTreadmill);
    chartTreadmill.reset();
  } catch (e) { };
  try {
    removeAllData(chartConcept2pm);
    chartConcept2pm.reset();
  } catch (e) { };
  try {
    removeAllData(chartIMU);
    chartIMU.reset();
  } catch (e) { };
}

/* LOOP UPDATE UI INFO AND CHARTS*/

function startLoopUpdate() {
  if (!nIntervId) {
    nIntervId = setInterval(updateChartAndRecording, interval);
  }
}
function stopLoopUpdate() {
  clearInterval(nIntervId);
  nIntervId = null;
}
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
  index = new Date(Date.now()); //not all data comes with timestamp so we use this to make it simpler.
  if (heartRateDevice.device !== null && heartRateMeasurements.length > 0) {
    let plotNewHR = heartRateMeasurements.at(-1).heartRate;
    let plotNewData = [plotNewHR];
    addData(chartHR, index, plotNewData);
  }
  if (treadmillDevice.device !== null && treadmillMeasurements.length > 0) {
    let plotNewSpeed = parseFloat(treadmillMeasurements.at(-1).speed);
    let plotNewInclination = parseFloat(treadmillMeasurements.at(-1).inclination);
    let plotNewData = [plotNewSpeed, plotNewInclination];
    addData(chartTreadmill, index, plotNewData);
  }
  if (concept2pmDevice.device !== null) {
    if (concept2pmMeasurements.additional_status_1.length > 0) {
      let plotNewStroke = ((concept2pmMeasurements.additional_status_1.at(-1).strokeRate));
      let plotNewPace = (concept2pmMeasurements.additional_status_1.at(-1).currentPace);
      let plotNewData = [plotNewStroke, plotNewPace];
      addData(chartConcept2pm, index, plotNewData);
    }
  }
  if (imuDevice.device !== null) {
    if (imuMeasurements != undefined) {
      let plotNewIMU = 0; //imuMeasurements.Acc.at(-1).channel_1;
      addData(chartIMU, index, plotNewIMU);
    }
  }
}
function addData(chart, label, data) {
  if (chart.data.labels.length > 3 * 60 * 1000 / interval) {
    // for improved performance
    chart.options.elements.point.radius = 0;
    // chart will display 5 minutes of data
    chart.data.labels.shift();
    chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();
    });
  }
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset, index) => {
    dataset.data.push(data[index]);
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
  statusTextHR.innerHTML = `> Heart rate: ${heartRateMeasurement.heartRate}bpm`;
  heartRateMeasurements.push(heartRateMeasurement);
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
function updateDisconnectedTreadmill(reason) {
  statusTextTreadmill.textContent = "No treadmill connected";
  titleTextTreadmill.textContent = "Scan for Bluetooth treadmill";
  containerTreadmill.style.display = "none";
  treadmillDevice = new TreadmillDevice();
  resetMeasurements(false, true, false, false);
  chartTreadmill.destroy();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to Treadmill failed. Try again.", "Treadmill device");
      break;
    case 'lost_connection':
      showToast("Connection to Treadmill lost. Try again.", "Treadmill device");
      break;
    case 'disconnected':
      showToast("Disconnected from Treadmill.", "Treadmill device");
      break;
    default:
      return;
  }
}
function updateConnectedTredmill() {
  titleTextTreadmill.textContent = "Connected to: " + treadmillDevice.getDeviceName();
  containerTreadmill.style.display = "block";
  drawChartTreadmill();
}
function updateDataTreadmill(treadmillMeasurement) {
  //UI
  statusTextTreadmill.innerHTML = /*'&#x1F3C3;'*/ `> Speed: ${(treadmillMeasurement.speed < 10 ? '&nbsp;' : '')}${treadmillMeasurement.speed} km/h<br />> Inclination: ${(treadmillMeasurement.inclination < 0 ? '' : '&nbsp;')}${treadmillMeasurement.inclination} %`;
  speedTextTreadmill.textContent = treadmillMeasurement.speed;
  inclinationTextTreadmill.textContent = treadmillMeasurement.inclination;
  treadmillMeasurements.push(treadmillMeasurement);
}

// concept2 pm5
function updateDisconnectedConcept2pm(reason) {
  statusTextConcept2pm.textContent = "No Concept2 PM connected";
  titleTextConcept2pm.textContent = "Scan for Bluetooth Concept2 PM";
  containerConcept2pm.style.display = "none";
  concept2pmDevice = new Concept2pmDevice();
  resetMeasurements(false, false, true, false);
  chartTreadmill.destroy();
  switch (reason) {
    case 'failed_connection':
      showToast("Connection to Concept2 PM failed. Try again.", "Concept2 PM device");
      break;
    case 'lost_connection':
      showToast("Connection to Concept2 PM lost. Try again.", "Concept2 PM device");
      break;
    case 'disconnected':
      showToast("Disconnected from Concept2 PM.", "Concept2 PM device");
      break;
    default:
      return;
  }

}
function updateConnectedConcept2pm() {
  titleTextConcept2pm.textContent = "Connected to: " + concept2pmDevice.getDeviceName();
  containerConcept2pm.style.display = "block";
  drawChartConcept2pm();
}
function updateDataConcept2pm(type, concept2pmMeasurement) {
  let measurementType = type;
  if (concept2pmMeasurements[measurementType] == undefined) {
    concept2pmMeasurements[measurementType] = []
  }
  concept2pmMeasurements[measurementType].push(concept2pmMeasurement);
  //UI
  let printPace = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).prettyCurrentPace : undefined);
  let printSpeed = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).speed : undefined);
  let printStrokeRate = (concept2pmMeasurements.additional_status_1 != undefined ? concept2pmMeasurements.additional_status_1.at(-1).strokeRate : undefined);
  let printDragFactor = (concept2pmMeasurements.general_status != undefined ? concept2pmMeasurements.general_status.at(-1).dragFactor : undefined);
  statusTextConcept2pm.innerHTML = `> Pace: ${printPace}/500m<br />> Speed: ${printSpeed}m/s<br />> Stroke rate: ${printStrokeRate}spm<br />> Drag factor: ${printDragFactor}`;
}

// ble device
function updateDisconnectedBle(reason, error) {
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
    case 'invalid_uuid':
      showToast("Disconnected from BLE device.", "BLE device");
      statusTextBle.textContent = error.message;
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
  chartIMU.destroy();
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
function updateConnectedStreamIMU(measType) {
  drawChartIMU(measType);
  statusTextIMU.innerHTML = `Receiving data types: ${imuDevice.imuStreamList}`;
}
function updateDataIMU(imuMeasurement) {
  //statusTextIMU.innerHTML = `Receiving data types: ${imuDevice.imuStreamList}`;
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
    deviceList.push('IMU: ' + imuDevice.getDeviceName());
  }
  if (deviceList.length == 0) {
    return false;
  } else {
    return true;
  }
}
function resetMeasurements(heartRate, treadmill, concept2pm, imu) {
  if (treadmill) {
    treadmillMeasurements = [];
  }
  if (heartRate) {
    heartRateMeasurements = [];
  }
  if (concept2pm) {
    concept2pmMeasurements = [];
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