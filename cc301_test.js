
var CC301 = require("./helpers/cc301").CC301;
var serialport = require("serialport")
var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort("COM1", {
  "baudrate": 19200,
  "databits": 8,
  "stopbits": 1,
  "parity": "even" 
});

var cc301 = new CC301("CC301", this);
var currentRawReadCb = null;
var currentRawReadTimerId = null;

var buffertoString = function (buffer) {
	var str = "";

	for (var i = 0; i < buffer.length; i++) {
		str += " " + buffer[i].toString();
	}

	return str;
};

var rawReadHandler = function(timeout, rawReadCb) {
	var rawReadTimerId = setInterval(function() {
		try {
			clearInterval(rawReadTimerId);

			if (currentRawReadBuffer) {
				console.log("Read: " + buffertoString(currentRawReadBuffer));
				rawReadCb(null, currentRawReadBuffer);
				currentRawReadBuffer = null;
			} else {
				console.log("No read value");
				rawReadCb(new Error("No data received"), null);
			}			
		} catch (e) {
			console.log(e.stack.toString());
		}
	}, timeout);
};

var rawWriteHandler = function (data, rawWriteCb) {
	serialPort.write(data, function(err, length) {
		console.log("Write: " + buffertoString(data));
		rawWriteCb(err);
	});
};

var currentRawReadBuffer = null;

serialPort.on('data', function(data) {
	if (currentRawReadBuffer) {
		currentRawReadBuffer = Buffer.concat([currentRawReadBuffer, data]);
	} else {
		currentRawReadBuffer = data;
	}
});

serialPort.on("open", function (err) {	
	cc301.getInstantValues(rawReadHandler, rawWriteHandler, 2, function (err, info) {
		console.log(info);
		console.log(info.toString());
	});
});