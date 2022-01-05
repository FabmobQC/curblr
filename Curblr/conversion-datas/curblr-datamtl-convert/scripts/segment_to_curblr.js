// curblrizes a geojson output from sharedstreets-js

const jsonHelper = require("./json_helper");

function convertToCurblr(rpaCode, input, outputDescription) {
  const geojson = {};
  geojson['manifest'] = {
    "createdDate": (new Date()).toISOString(), // required
    "curblrVersion": "1.1.0", // required
    "timeZone": "America/Toronto", // required
    "currency": "CAD", // required
    "priorityHierarchy": [
      "parking - userClass",
      "loading",
      "no standing",
      "no parking",
      "free parking"
    ], // required
    "authority": {
      "name": "Fabrique des Mobilités Québec", // required
      "url": "https://fabmobqc.ca/", // required
    }
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
    
    // Why is this rounded??
    shstLocationStart = Math.round(shstLocationStart);
    shstLocationEnd = Math.round(shstLocationEnd);

    if(rpaCode[id_rpa] && rpaCode[id_rpa].regulations){
      var newTargetFeature = {
          ...feature,
          properties:{
            "DESCRIPTION_RPA": outputDescription ? rpaCode[id_rpa].DESCRIPTION_RPA : undefined,
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
  const inputFilename = process.argv[2];
  const outputFilename = process.argv[3];
  const outputDescription = process.argv[4]

  const input = jsonHelper.load(inputFilename);
  let rpaCode = jsonHelper.load('data/intermediary/signalisation-codification-rpa_withRegulation.json');
  const agregateRpaCode = jsonHelper.load('data/intermediary/agregate-pannonceau-rpa.json');

  rpaCode = {...rpaCode, ...agregateRpaCode};

  const output = convertToCurblr(rpaCode, input, outputDescription);
  
  jsonHelper.write(outputFilename, output, false);
}

module.exports = {
  convertToCurblr,
}