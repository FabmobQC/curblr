// curblrizes a geojson output from sharedstreets-js

const fs = require('fs');

// const inputGeojson = fs.readFileSync('data/mtl-subset.buffered.geojson');
file_p = process.argv[2];
const inputGeojson = fs.readFileSync(file_p);
const input = JSON.parse(inputGeojson);

var geojson = {"crs":input.crs};
geojson['type'] = 'FeatureCollection';

fleche_map={ 
    left:
        {0:2,  // no arrow -> middle
        2:3,   // left arrow -> end
        3:1},  // right arrow -> start
    right:
        {0:2,  // no arrow -> middle
        2:1,   // left arrow -> start
        3:3}   // right arrow -> end
    };

geojson['features'] = input.features.map(feature=>{
    return {
        properties: {
            point_sequence : fleche_map[feature.properties.sideOfStreet][feature.properties.pp_fleche_pan],
            PANNEAU_ID_RPA: feature.properties.pp_panneau_id_rpa,
            CODE_RPA : feature.properties.pp_code_rpa,
            POTEAU_ID_POT: feature.properties.pp_poteau_id_pot,
            PANNEAU_ID_PAN: feature.properties.pp_panneau_id_pan,
            DESCRIPTION_RPA: feature.properties.pp_description_rpa
        },
        type: feature.type,
        geometry: feature.properties.pp_original_geometry
    }
});

// console.log(geojson.features.length);
console.log(JSON.stringify(geojson, null, 2))


