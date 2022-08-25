# SmartGym

SmartGym is a Javascript based HTML program to connect (via Bluetooth) and gather data from different gym machines and sports sensors.  

## Description
  
SmartGym allows the user to connect bluetooth devices, view data in real time, control some features of the equipments and save data to a json file.  
The user can connect to one device of each type at a time. Multiple devices of different types can be connected simultaneously.  
The software is originally designed to connect and gather data from all the Bluetooth devices at the Integration Lab (Sports Technology Lab) at KTH university. It was developed as a summer project at the universiy within 2 months of part-time work (jul/22-aug/22).

**Currently connected devices and features:**
* **Monark medical treadmill** (broadcasting with rpi and code from [here](https://github.com/katsikaktus/treadmill/tree/treadmill_main/treadmillPi)): read and record (speed, inclination, distance, duration), control/write (start, stop, speed, inclination), plot (speed, inclination);
* **Concept2 PM5 (RowErg/ SkiErg/ BikeErg):** read and record (multiple features), control/write (reset, set distance workout), plot (stroke rate, pace);
* **Polar Verity Sense:** read and record (heart rate, accelerometer, gyroscope, magnetometer, photoplethysmogram), control/write (activate SDK mode, choose stream settings), plot (all streams channels, acc magnitude, gyro magnitude);
* **Heart rate sensors (any):** read and record (heart rate, rr intervals, energy expended), plot (heart rate);

The code is divided in one HTML file, one CSS file and various JS files. The main JS file is app.js. The other files contain the bluetooth devices constructors and the methods associated to each bluetooth device class.

## Getting Started

### Instructions

* Download the software [here](https://github.com/MariahSabioni/SmartGym).
* Run the HTML on your web-bluetooth-enabled browser (Chrome 10 or above recommended).
* Turn on bluetooth on your device (enable your device to be discovered if needed):  
For treadmill: connect the rpi to the treadmill via USB cable and run, treadmillService.py from [here](https://github.com/katsikaktus/treadmill/tree/treadmill_main/treadmillPi).  
For Concept2 PM5: press menu and connect.
For the Polar Verity Sense: update sensor firmware to [version 1.1.5](https://support.polar.com/en/updates/polar-verity-sense-11-firmware-update) and syncronize your device at least once using Polar Beat app before using SmartGym (for local time sync).
* Connect devices and start recording data.

### Dependencies

The web browser must support web bluetooth. All the dependencies are integrated with plain JavaScript.
* jQuery
* Popper
* Bootstrap JS
* Charts JS

### Executing program

* Connecting:  
Streaming starts automatically after bluetooth connection is established for all devices but the Polar Verity Sense. The Verity Sense requires the user to choose settings and request data to a stream after the bluetooth connection is established.  
In case of errors, they are displayed on the area above the connect button. Lost connection is reported on a toast on the bottom-right of the screen.

* Real-time charts:  
When data is received, the charts are automatically updated. When connection is lost, the charts are destroyed.  
The interval between chart updates and the range displayed on charts x-axis can be changed on lines 80 and 81 of app.js:  
```
// charts
let interval = 500; //miliseconds between updates of Charts and recording UI
let chartMaxTime = 1 * 60 * 1000 //range of charts x axis, in miliseconds
```

* Recording:  
To record and save the data, go to "Record Data". The user can set a pre-set autostop or stop at any time with the button. Data is saved to a json file on default downloads folder. Data is saved for all the connected devices with the same format. Samples are available at [/samples](https://github.com/MariahSabioni/SmartGym/tree/master/samples).  
Although the data displayed is limited, all the data parsed from the received data packages is stored and saved to json file when recording.  
All the charts use Charts JS API and follow the best practices recommended for improving [performance](https://www.chartjs.org/docs/3.3.0/general/performance.html).

### Good to know

The format of the control commands and the data broadcast is particular to each device. Command writting and data parsing have been developed according to the available documentation and github issues. The versions of the documentations used to write this code are available at folder [/references](https://github.com/MariahSabioni/SmartGym/tree/master/references). For source, refer to the links on the heading of each JS file.  
There is also an explanation of how to parse the delta frames received from Polar verity sense available [here](https://github.com/MariahSabioni/SmartGym/blob/master/references/decodingAccDataExplained.txt).

## Known issues

* If the Polar Verity Sense sends out data bigger than 32 bits, it is not readable and an error is thrown;
* Date time of polar verity sense can be off a couple of hours - reason not investigated but probably due to local time set issues (read more [here](https://github.com/polarofficial/polar-ble-sdk/issues/192#issuecomment-945407913));
* The program does not handle disconnection of a sensor in the middle of recording. It is expected that the data gathered until disconnection will be saved, but it has not been tested. If the device is reconnected during the experiment, it will erase all the previous recorded data. This is because any new established connection triggers a reset of the measurements array of that device type.


## Future work

What's next? (not really, just suggestions for further development)
* General:  
Fix known issues;
Upload and plot previously recorded experiment;
Allow connection of more than one device of same type;
View measurements of different devices on same chart;
* New devices:  
Connect to monark bike;
Connect movesense;
* Verity sense:  
Add PPI to verity sense;
Add filter for combined acceleration and gyro;
* Treadmill:  
Create and load customized track;
Add heart rate based speed control;
* Concept2 PM:  
Add more options of custom workout ;
Display workout summary on finish workout;
* Heart rate:  
Compute HR zones (user inputs max);
Write to sensor to reset energy expended value;

## Authors

Mariah Sabioni: [github](https://github.com/MariahSabioni) | [@sabionimah](https://www.instagram.com/sabionimah/)

## References

All references are listed on the heading of the JS files which they relate to.
The folder [/references](https://github.com/MariahSabioni/SmartGym/references) contains the pdf of the documentations of bluetooth devices used to build this code.
