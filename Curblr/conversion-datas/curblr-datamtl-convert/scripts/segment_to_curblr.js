// curblrizes a geojson output from sharedstreets-js

const fs = require('fs');

function convertToCurblr(rpaCode, input) {
  const geojson = {};
  geojson['manifest'] = {
    "priorityHierarchy": [
      "1",
      "2",
      "3",
      "4",
      "5",
      "free parking"
    ],
    "curblrVersion": "1.1.0",
  }
  geojson['type'] = 'FeatureCollection';
  geojson['features'] = [];

  for (var feature of input.features) {

    let {
        referenceId: shstRefId,
        sideOfStreet: sideOfStreet,
        section: [shstLocationStart, shstLocationEnd],
        pp_panneau_id_rpa: id_rpa,
        pp_panneau_id_pan: derivedFrom
    } = feature.properties
    
    shstLocationStart = Math.round(shstLocationStart);
    shstLocationEnd = Math.round(shstLocationEnd);

    if(rpaCode[id_rpa].regulations){
      var newTargetFeature = {
          ...feature,
          properties:{
            location:{
              shstRefId,
              sideOfStreet,
              shstLocationStart,
              shstLocationEnd,
              derivedFrom
            },
            regulations: rpaCode[id_rpa].regulations
        }
      }
      geojson['features'].push(newTargetFeature);
    }
  }

  return geojson;
}

if (typeof require !== 'undefined' && require.main === module) {
  const file_p = process.argv[2];
  const inputGeojson = fs.readFileSync(file_p);
  const input = JSON.parse(inputGeojson);
  const rpaCodeJson = fs.readFileSync('data/intermediary/signalisation-codification-rpa_withRegulation.json');
  let rpaCode = JSON.parse(rpaCodeJson);
  const agregateRpaCodeJson = fs.readFileSync('data/intermediary/agregate-pannonceau-rpa.json');
  const agregateRpaCode = JSON.parse(agregateRpaCodeJson);
  const outputFilename = process.argv[3];

  rpaCode = {...rpaCode, ...agregateRpaCode}

  const curblr = convertToCurblr(rpaCode, input);
  const json = JSON.stringify(curblr, null, 2);

  fs.writeFile(outputFilename, json, err => {if (err) throw err});
}
