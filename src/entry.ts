// Config version required:
let required_config_version: number = 1;

// Check if config version correct
import * as fs from 'fs';
let buffer = fs.readFileSync('./local/config.json');
let config = JSON.parse(buffer.toString());
buffer = undefined;

if (config.config_version == required_config_version) {
    console.log("Config version correct, starting.");
} else {
    console.log("Your configuration file is either too old or missing! Please update it.");
    process.exit();
}

let main = require('./main');
