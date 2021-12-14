// curblrizes a geojson output from sharedstreets-js


const jsonHelper = require("./json_helper");

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
    const input = jsonHelper.load('data/intermediary/agregate-signalisation.json');
    process.argv.shift();
    process.argv.shift();
    const arrond_from_cmd = process.argv.join(" ");
    arronds = [arrond_from_cmd]

    const output = filter(input, arronds);
    jsonHelper.write(outputFilename, output, true);
}
