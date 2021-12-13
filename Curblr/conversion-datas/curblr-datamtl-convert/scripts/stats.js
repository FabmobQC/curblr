const fs = require('fs');

const curblrData = fs.readFileSync('data/intermediary/mtl-subset-segment.curblr.json');
const mtlData = fs.readFileSync('data/intermediary/mtl-subset-segment.geojson');
const mtlFeatur = JSON.parse(mtlData).features;
try{
    const unmatchedData = fs.readFileSync('data/intermediary/mtl-subset-segment.unmatched.geojson');
    var unmatched = JSON.parse(unmatchedData).features;
} catch{
    var unmatched = [];
}

let curblrUsed = new Set();
JSON.parse(curblrData).features.forEach(feat=>feat.properties.location.derivedFrom.forEach(val=>curblrUsed.add(val)));

console.error("panneau existant ", mtlFeatur.length);
console.error("segment généré ", JSON.parse(curblrData).features.length);
console.error("panneau géré ", curblrUsed.size);
console.error("panneau shst unmatched ", unmatched.length);
unmatched.forEach(feat=>curblrUsed.add(feat.properties.panneau_id_pan));

var unmanagedGeojson = {};
unmanagedGeojson['type'] = 'FeatureCollection';

unmanagedGeojson['features'] = mtlFeatur.filter(feature=>!curblrUsed.has(feature.properties.PANNEAU_ID_PAN));
//console.error(curblrUsed);
console.error("panneau non géré ", unmanagedGeojson.features.length);

// console.log(geojson.features.length);
console.log(JSON.stringify(unmanagedGeojson, null, 2))


