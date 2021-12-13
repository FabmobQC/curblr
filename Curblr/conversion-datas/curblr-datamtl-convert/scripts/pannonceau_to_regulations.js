const fs = require('fs');

function groupByPoteauId(mtlFeatures) {
    return mtlFeatures.reduce((acc,val) => {
        const poteauId = val.properties.POTEAU_ID_POT;
        if (!acc[poteauId]) {
            acc[poteauId] = [];
        }
        acc[poteauId].push(val); 
        return acc;
    }, {});
}

function getMtlPotWithPannonceau(mtlPot, rpaCode) {
    return Object.values(mtlPot)
    .reduce((acc,val) => {
        val.sort((a, b) => b.properties.PANNEAU_ID_PAN - a.properties.PANNEAU_ID_PAN); // reverse order
        let pannonceau = false;
        let pannelsRPA = [];
        let pannelsfull = [];
        val.forEach(pan => {
            if (!rpaCode[pan.properties.PANNEAU_ID_RPA]) {
                return;
            }
            if (pan.properties.DESCRIPTION_CAT == "STAT-PANNONC.") {
                pannonceau = true;
                pannelsRPA.unshift(
                    {
                        PANNEAU_ID_RPA: pan.properties.PANNEAU_ID_RPA,
                        DESCRIPTION_RPA: pan.properties.DESCRIPTION_RPA,
                        DESCRIPTION_CAT: pan.properties.DESCRIPTION_CAT,
                        CODE_RPA: pan.properties.CODE_RPA,
                        RULES: rpaCode[pan.properties.PANNEAU_ID_RPA].regulations
                    }
                );
                pannelsfull.unshift(pan);
            } else {
                let newpannel = null;
                if (pannonceau) {
                    pannelsRPA.unshift(
                        {
                            PANNEAU_ID_RPA: pan.properties.PANNEAU_ID_RPA,
                            DESCRIPTION_RPA: pan.properties.DESCRIPTION_RPA,
                            DESCRIPTION_CAT: pan.properties.DESCRIPTION_CAT,
                            CODE_RPA: pan.properties.CODE_RPA,
                            RULES: rpaCode[pan.properties.PANNEAU_ID_RPA].regulations || []
                        }
                    );
                    agregateID_RPA = pannelsRPA.map(val => val.PANNEAU_ID_RPA).sort().join("_");
                    agregateCODE_RPA = pannelsRPA.map(val => val.CODE_RPA).sort().join("_");
                    acc.rpa[agregateID_RPA] = {
                        agregateID_RPA: agregateID_RPA,
                        unmmanaged: pannelsRPA,
                        managed: []
                    };
                    newpannel = pan;
                    newpannel.properties.PANNEAU_ID_RPA = agregateID_RPA;
                    newpannel.properties.CODE_RPA = agregateCODE_RPA;
                    newpannel.properties.agregate = pannelsfull;
                } else {
                    newpannel = pan;
                }
                acc.all.push(newpannel);

                pannonceau = false;
                pannelsRPA = [];
                pannelsfull = [];
            }
        });

        return acc;
    },{all:[],rpa:{}});
}

// Take a panonceau from unmmanaged, add it to managed, and add its rule to tempRules
function handleFirstPanonceau(mtlPotWithPannonceau) {
    Object.values(mtlPotWithPannonceau.rpa)
    .forEach( elem => {
        pannonceau = elem.unmmanaged.shift();
        elem.managed.push(pannonceau);
        elem.tempRules = JSON.parse(JSON.stringify(pannonceau.RULES));
    })
}

function updateRule(mtlPotWithPannonceau, id_rpa,fonc) {
    Object.values(mtlPotWithPannonceau.rpa)
    .filter( elem => elem.unmmanaged.some(val => val.PANNEAU_ID_RPA == id_rpa) )
    .forEach(
        elem => {
            elem.unmmanaged = elem.unmmanaged.filter( val=> {
                if (val.PANNEAU_ID_RPA == id_rpa) {
                    pannonceau = val;
                    return false;
                }
                return true;
            });
            elem.managed.push(pannonceau);
            if (fonc) {
                fonc(elem, pannonceau);
            }
        }
    )
}

function updateRules(mtlPotWithPannonceau, id_rpa,fonc) {
    id_rpa.forEach(elem => updateRule(mtlPotWithPannonceau, elem,fonc));
}

function updateSomeRules(mtlPotWithPannonceau) {
    //PANONCEAU EXCEPTE PERIODE INTERDITE
    updateRule(mtlPotWithPannonceau, 1514,(elem, pannonceau) => {
        elem.tempRules.forEach(rule => rule.priorityCategory++);
    });

    //1512 PANONCEAU DEBAR. SEULEMENT
    //1516 PANONCEAU LIVRAISON SEULEMENT
    //16225 EXCEPTE  DEBARCADERE
    //9095 PANONCEAU RESERVE GARDERIE
    updateRules(mtlPotWithPannonceau, [1512, 1516, 16225, 9095],(elem, pannonceau) => {
        elem.tempRules.slice(-1)[0].rule.activity = "loading";
    });

    //9094 PANONCEAU EXCEPTE DEBARCADERE GARDERIE 15 MINUTES
    updateRule(mtlPotWithPannonceau, 9094,(elem, pannonceau) => {
        regulation = elem.tempRules.slice(-1)[0];
        regulation.rule.activity = "loading";
        regulation.rule.maxStay = 15;
    });

    //1482 PANONCEAU DEBARCADERE RESERVE HANDICAPE
    updateRule(mtlPotWithPannonceau, 1482,(elem, pannonceau) => {
        regulation = elem.tempRules.slice(-1)[0];
        regulation.rule.activity = "loading";
        regulation.UserClasses = {classe:["handicap"]};
    });

    // PANONCEAU ZONE DE REMORQUAGE
    updateRules(mtlPotWithPannonceau, [1528,16303])
}

function handlePanonceauWithTimeSpans(mtlPotWithPannonceau) {
    Object.values(mtlPotWithPannonceau.rpa)
    .forEach(
        elem => {
            elem.unmmanaged = elem.unmmanaged.filter(
                val => {
                    if (
                        val.RULES.some(
                            rule => (
                                !rule.priorityCategory
                                && rule.timeSpans
                            )
                        )
                    ) {
                        pannonceau = val;
                        elem.managed.push(pannonceau);

                        regulations = elem.tempRules.slice(-1)[0];
                        regulations.timeSpans.forEach(ts => {
                            ts = {...ts, ...pannonceau.RULES[0].timeSpans}
                        })
                        
                        return false;
                    }
                    return true; 
                }
            );
        }
    )
}

// Indicates all the small signposts modifying the bigger signpost have been handled
function markRegulationsCompleted(mtlPotWithPannonceau) {
    Object.values(mtlPotWithPannonceau.rpa)
    .forEach(elem => {
        // If there is no "unmanaged" rpa left, then the regulation is completed
        if (elem.unmmanaged.length == 0) {
            elem.regulations = elem.tempRules;
            elem.tempRules = null;
        }
    })
}

function doMainThing(mtlData, rpaCode, outputType) {
    const mtlFeatures = mtlData.features;
    const mtlPot = groupByPoteauId(mtlFeatures);
    const mtlPotWithPannonceau = getMtlPotWithPannonceau(mtlPot, rpaCode);
    handleFirstPanonceau(mtlPotWithPannonceau);
    updateSomeRules(mtlPotWithPannonceau);
    handlePanonceauWithTimeSpans(mtlPotWithPannonceau);
    markRegulationsCompleted(mtlPotWithPannonceau);

    if (outputType=="jsonmtl") {
        const geojson = {"crs":mtlData.crs};
        geojson['type'] = 'FeatureCollection';
        geojson['features'] = mtlPotWithPannonceau.all
        return JSON.stringify(geojson, null, 2);
    }
    if (outputType=="jsonpan") {
        return JSON.stringify(mtlPotWithPannonceau.rpa, null, 2);
    }
}

if (typeof require !== 'undefined' && require.main === module) {
    const outputType = process.argv[2]; // "jsonmtl" or "jsonpan"
    const outputFilename = process.argv[3];

    const file = "data/input/signalisation_stationnement.geojson"
    const mtlData = fs.readFileSync(file);
    const mtlDataJson = JSON.parse(mtlData);

    const rpaCodeJson = fs.readFileSync('data/intermediary/signalisation-codification-rpa_withRegulation.json');
    const rpaCode = JSON.parse(rpaCodeJson);

    const json = doMainThing(mtlDataJson, rpaCode, outputType);

    fs.writeFile(outputFilename, json, err => {if (err) throw err});
}