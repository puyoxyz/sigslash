// Config version required:
let requiredConfigVersion: number = 1;

// Check if config version correct
import * as fs from 'fs';
let buffer = fs.readFileSync('./local/config.json');
let config = JSON.parse(buffer.toString());
buffer = void 0;

if (config.configVersion === requiredConfigVersion) {
    console.log('Config version correct, starting.');
} else {
    console.log('Your configuration file is either too old or missing! Please update it.');
    process.exit();
}

let main = require('./main');
