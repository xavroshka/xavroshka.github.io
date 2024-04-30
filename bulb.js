'use strict';

let myCharacteristic;
let deviceName;
let turnedOn = true;
let colorWheel = null;
let oldColor = null;
let mouseIsDown = false;

let Finalcolor = "255, 255, 255";

colorWheel = iro.ColorPicker("#wheelPicker", {
	width: 320,
	color: "rgb(255, 255, 255)",
	borderWidth: 1,
  borderColor: "#fff",
  layout: [
    {
      component: iro.ui.Wheel,
    },
  ]
});

document.querySelector('.wheel').addEventListener('pointerdown', function (e) {
	handleMouseDown(e);
}, false);
document.querySelector('.wheel').addEventListener('pointermove', function (e) {
	handleMouseMove(e);
}, false);
document.querySelector('.wheel').addEventListener('pointercancel', function (e) {
	handleMouseUp(e);
}, false);

function handleMouseDown(e) {
	// mousedown stuff here
	mouseIsDown = true;
}

function handleMouseUp(e) {
	updateColor();
	// mouseup stuff here
	mouseIsDown = false;
}

function handleMouseMove(e) {
	if (!mouseIsDown) {
		return;
	}

	updateColor();
}

function onConnected() {
	document.querySelector('.connect-button').classList.add('hidden');
	document.querySelector('.wheel').classList.remove('hidden');
	document.querySelector('.power-button').classList.remove('hidden');
	turnedOn = false;
}

function connect() {

	let serviceUuid = "0000ffe0-0000-1000-8000-00805f9b34fb";
	let characteristicUuid = "0000ffe1-0000-1000-8000-00805f9b34fb";

	console.log('Requesting Bluetooth Device...');
	navigator.bluetooth.requestDevice({
			filters: [{
				services: [serviceUuid]
			}]
		})
		.then(device => {
			console.log('> Found ' + device.name);
			console.log('Connecting to GATT Server...');
			return device.gatt.connect();
		})
		.then(server => {
			console.log('Getting Service 0xffe5 - Light control...');
			return server.getPrimaryService(serviceUuid);
		})
		.then(service => {
			console.log('Getting Characteristic 0xffe9 - Light control...');
			return service.getCharacteristic(characteristicUuid);
		})
		.then(characteristic => {

			myCharacteristic = characteristic;
			onConnected();
            return myCharacteristic.startNotifications().then(_ => {
                console.log('> Notifications started');
                log("Connected to: " + deviceName);
                bluetoothConnected = true;
                setBluetoothDeviceName(deviceName);
                myCharacteristic.addEventListener('characteristicvaluechanged',
                    handleNotifications);		
            });

		})
		
		.catch(error => {
			console.log('Argh! ' + error);
		});	
}

function turnOn() {

	let toggle = "rgb(255, 255, 255)";
	turnedOn = true;
	toggleButtons();
    return myCharacteristic.writeValue(new TextEncoder().encode(toggle+"\n"));
}

function turnOff() {
	let toggle = "rgb(0, 0, 0)";
	turnedOn = false;
	toggleButtons();
    return myCharacteristic.writeValue(new TextEncoder().encode(toggle+"\n"));
}

function turnOnOff() {
	if (turnedOn) {
		turnOff();
	} else {
		turnOn();
	}
}

function toggleButtons() {
	Array.from(document.querySelectorAll('.color-buttons button')).forEach(function (colorButton) {
		colorButton.disabled = !turnedOn;
	});
    turnedOn ? document.querySelector('.wheel').classList.remove('hidden') : document.querySelector('.wheel').classList.add('hidden');
}

function setColor() {
	return myCharacteristic.writeValue(new TextEncoder().encode(toggle+"\n"));
}

colorWheel.on(["color:init", "color:change"], function(color){
	values.innerHTML = [
		"hex: " + color.hexString,
		"rgb: " + color.rgbString,
		"hsl: " + color.hslString,
	  ].join("<br>");

	  Finalcolor = color.rgbString;


	  
});

function updateColor() {
    return myCharacteristic.writeValue(new TextEncoder().encode(Finalcolor+"\n"));
}

function listen() {
	annyang.start({
		continuous: true
	});
}
