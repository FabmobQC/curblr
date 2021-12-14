const fs = require('fs');

function load(filepath) {
    const file = fs.readFileSync(filepath);
    return JSON.parse(file);
}

function write(filepath, output, prettify) {
    let space = null;
    if (prettify) {
        space = 2;
    }
    json = JSON.stringify(output, null, space);
    fs.writeFile(filepath, json, err => {if (err) throw err});
}

module.exports = {
    load,
    write,
}
