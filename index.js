const SerialPort = require('serialport');
const schedule = require('node-schedule');

// Readline parser
const Readline = SerialPort.parsers.Readline;

const PORT_NAME = 'COM4';
const BAUD_RATE = 9600;
const STX = '\x02';
const ETX = '\x03';

// List of commands for Panasonic PT-DW10000
// for some reason the status requests are not working,
// or at least the reading from the port does not.
const commands = {
    powerOn: 'ADZZ;PON',
    powerOff: 'ADZZ;POF',
    powerStatus: 'ADZZ;QPW',
    lampStatus: 'ADZZ;Q$S'
}

// List serial ports
SerialPort.list().then(
    ports => {
        console.log('PORT LIST');
        ports.forEach(port => console.log(port.path, port.productId));
    },
    err => {
        console.error(err);
    }
)

let port = new SerialPort(PORT_NAME, { baudRate: BAUD_RATE, parity: 'none', databits: 8, autoOpen: true });
let parser = new Readline();

// SEND ALL TO READER
port.pipe(parser);

port.on('open', (err) => {
    if (err) console.log(err.message);

    console.log('PORT OPEN. WRITE DATA.');

    // STX and ETX have to be in hex format instead of plain
    port.write(STX + commands.powerStatus + ETX, (err) => {
        if (err) console.log(err);
    });
});

port.on('readable', function () {
    console.log('DATA:', port.read());
})

port.on('error', (error) => {
    console.log('SERIAL ERROR.', error);
});

console.log('Schedule jobs');

// Schedule start at 15:00 System time -> 0 0 15 * * *
// SS (0-59, OPTIONAL) MM (0-59)  HH (0-23) DD (1-31) MM (1-12) WK (0-7)
const startProjectionScheduler = schedule.scheduleJob('0 0 15 * * *', () => {
    console.log('PROJECTOR : POWER ON');
    port.write(STX + commands.powerOn + ETX, (err) => {
        if (err) console.log(err);
    });
});

// Schedule end 22:00 System time -> 0 0 22 * * *
// SS (0-59, OPTIONAL) MM (0-59)  HH (0-23) DD (1-31) MM (1-12) WK (0-7)
const endProjectionScheduler = schedule.scheduleJob('0 0 22 * * *', () => {
    console.log('PROJECTOR : POWER OFF');
    port.write(STX + commands.powerOff + ETX, (err) => {
        if (err) console.log(err);
    });
});