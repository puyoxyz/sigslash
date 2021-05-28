import * as Discord from 'discord.js';
import * as path from 'path';
import { table } from 'table';
import * as figlet from 'figlet';
import * as package_json from './package.json';
let name = package_json.name;

// SET UP CLIENT HERE

// SET UP DATABASE HERE

client.on('ready', async () => {
    await client.user.setActivity(config.activity.text, {type: config.activity.type}) // Setting the activity
        .then(presence => console.log(`Activity set successfully: ${presence.activities[0].type} ${presence.activities[0].name}`)) // Log activity
        .catch(console.error);
    
    // Logging basic info
    console.log(figlet.textSync(name));
    console.log(package_json.description);
    console.log(table([
        ['Account', client.user.tag],
        ['Activity', `${config.activity.type} ${config.activity.text}`],
        ['Help (Default)', `${config.prefix}help`],
        [`${name} info`, `${name} version ${package_json.version}\n${package_json.license}\nCopyright ${package_json.author} (c) 2021`]
    ]));
});

// REGISTER COMMANDS HERE?!?!?!?!?!

client.login(config.token)
