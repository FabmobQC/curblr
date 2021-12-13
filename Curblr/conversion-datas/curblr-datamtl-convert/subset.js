// curblrizes a geojson output from sharedstreets-js


const fs = require('fs');

function filter(input, arronds) {
    // This function is actually not filtering anything. arronds is not even used.
    var geojson = {
        "crs": input.crs
    };
    geojson['type'] = 'FeatureCollection';

    geojson['features'] = input.features.map(feature => {
        feature.properties.title = feature.properties.PANNEAU_ID_PAN;
        feature.properties.description = `${feature.properties.PANNEAU_ID_RPA} --- ${feature.properties.DESCRIPTION_RPA}`
        + `\n    ${feature.properties.POSITION_POP} --- ${feature.properties.FLECHE_PAN}`;
        feature.properties.original_geometry = feature.geometry;
        return feature;
    });

    return geojson;
}

if (typeof require !== 'undefined' && require.main === module) {

    const outputFilename = process.argv[2];
    const inputGeojson = fs.readFileSync('data/agregate-signalisation.json');
    const input = JSON.parse(inputGeojson);
    process.argv.shift();
    process.argv.shift();
    const arrond_from_cmd = process.argv.join(" ");
    arronds = [arrond_from_cmd]

    const filtered = filter(input, arronds);
    const json = JSON.stringify(filtered, null, 2);

    fs.writeFile(outputFilename, json, err => {if (err) throw err});
}
