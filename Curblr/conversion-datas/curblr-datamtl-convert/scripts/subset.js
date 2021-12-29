const jsonHelper = require("./json_helper");
const booleanPointInPolygon = require("@turf/boolean-point-in-polygon").default;
const {point: buildPoint, polygon: buildPolygon} = require("@turf/helpers");


const PLAZA_POLYGON_PATH = "data/input/plaza-saint-hubert.geojson";
const ARRONDISSEMENTS_BY_POLYGONS_PATH = "data/input/limadmin.geojson.json";
const SUB_QUARTIERS_VILLE_MARIE_PATH = "data/input/quartiers_arrondissement_villemarie.geojson";

// This is not currently used, but it is useful to know the available names
const ARRONDISSEMENTS_BY_PROPERTIE = [
    "Ahuntsic - Cartierville",
    "Anjou",
    "Côte-des-Neiges - Notre-Dame-de-Grâce",
    "L'Île-Bizard - Sainte-Geneviève",
    "LaSalle",
    "Lachine",
    "Le Plateau-Mont-Royal",
    "Le Sud-Ouest",
    "Mercier - Hochelaga-Maisonneuve",
    "Montréal-Nord",
    "Outremont",
    "Pierrefonds - Roxboro",
    "Rivière-des-Prairies - Pointe-aux-Trembles",
    "Rosemont - La Petite-Patrie",
    "Saint-Laurent",
    "Saint-Léonard",
    "Verdun",
    "Ville-Marie",
    "Villeray - Saint-Michel - Parc-Extension",
    null // yes, some of them have the value "null"
];

const ARRONDISSEMENTS_BY_POLYGON = [
    "Ahuntsic-Cartierville",
    "Anjou",
    "Baie-d'Urfé",
    "Beaconsfield",
    "Côte-Saint-Luc",
    "Côte-des-Neiges-Notre-Dame-de-Grâce",
    "Dollard-des-Ormeaux",
    "Dorval",
    "Hampstead",
    "Kirkland",
    "L'Île-Bizard-Sainte-Geneviève",
    "L'Île-Dorval",
    "LaSalle",
    "Lachine",
    "Le Plateau-Mont-Royal",
    "Le Sud-Ouest",
    "Mercier-Hochelaga-Maisonneuve",
    "Mont-Royal",
    "Montréal-Est",
    "Montréal-Nord",
    "Montréal-Ouest",
    "Outremont",
    "Pierrefonds-Roxboro",
    "Pointe-Claire",
    "Rivière-des-Prairies-Pointe-aux-Trembles",
    "Rosemont-La Petite-Patrie",
    "Saint-Laurent",
    "Saint-Léonard",
    "Sainte-Anne-de-Bellevue",
    "Senneville",
    "Verdun",
    "Ville-Marie",
    "Villeray-Saint-Michel-Parc-Extension",
    "Westmount"
];

const SUB_QUARTIERS_VILLE_MARIE = [
    "DOWNTOWN",
    "GAY VILLAGE",
    "JEAN-DRAPEAU",
    "OLD MONTREAL",
    "QUARTIER DES SPECTACLES"
];

function addPropertiesToFeature(feature) {
    feature.properties.title = feature.properties.PANNEAU_ID_PAN;
    feature.properties.description = `${feature.properties.PANNEAU_ID_RPA} --- ${feature.properties.DESCRIPTION_RPA}`
        + `\n    ${feature.properties.POSITION_POP} --- ${feature.properties.FLECHE_PAN}`;
    feature.properties.original_geometry = feature.geometry;
}

// Extract signalizations which have the property "NOM_ARROND" equal to "name"
function filterWithPropertie(signalization, name) {
    const filteredFeatures = [];
    signalization.features.forEach((feature) => {
        if (feature.properties.NOM_ARROND == name) {
            addPropertiesToFeature(feature);
            filteredFeatures.push(feature);
        }
    });

    return filteredFeatures;
}

// Extract signalizations which have their coordinates inside the polygon
function filterWithPolygon(signalization, polygon) {
    const filteredFeatures = [];
    signalization.features.forEach((feature) => {
        const point_data = feature["geometry"]["coordinates"];
        const point = buildPoint(point_data);

        if (booleanPointInPolygon(point, polygon)) {
            addPropertiesToFeature(feature);
            filteredFeatures.push(feature)
        }
    })

    return filteredFeatures;
}

function getPolygon(name) {
    const polygonData = (() => {
        if (name == "plaza") {
            const data = jsonHelper.load(PLAZA_POLYGON_PATH);
            return data["features"][0]["geometry"]["coordinates"];
        }
        else if (ARRONDISSEMENTS_BY_POLYGON.includes(name)) {
            const data = jsonHelper.load(ARRONDISSEMENTS_BY_POLYGONS_PATH);
            const feature = data.features.find((feature) => feature.properties.NOM == name);
            return feature.geometry.coordinates[0];
        }
        else if (SUB_QUARTIERS_VILLE_MARIE.includes(name)) {
            const data = jsonHelper.load(SUB_QUARTIERS_VILLE_MARIE_PATH);
            const feature = data.features.find((feature) => feature.properties.NOM == name);
            return feature.geometry.coordinates;
        }
    })();

    return buildPolygon(polygonData);
}

function filter(signalization, mode, name) {
    const filteredFeatures = (() => {
        if (mode == "propertie") {
            return filterWithPropertie(signalization, name);
        }
        else if (mode == "polygon") {
            const polygon = getPolygon(name);
            return filterWithPolygon(signalization, polygon)
        }
    })();
    
    return {
        "crs": signalization.crs,
        "type": "FeatureCollection",
        "features": filteredFeatures
    };
}


if (typeof require !== 'undefined' && require.main === module) {

    const mode = process.argv[2];

    process.argv.shift();
    process.argv.shift();
    process.argv.shift();
    const name = process.argv.join(" ");

    const signalization = jsonHelper.load('data/intermediary/agregate-signalisation.json');
    const output = filter(signalization, mode, name);

    // Regex deletes all whitespaces and apostrophes. "replaceAll" is not supported in node 12.13.0
    const outputFilename = `data/intermediary/mtl-subset-${name}.geojson`.replace(/\s|'/g, "");

    jsonHelper.write(outputFilename, output, true);
}
