const jsonHelper = require('./json_helper');
const curblrPrettifier = require("./curblr_prettifier");
const rpaToRegulations = require("../scripts/rpa_to_regulations");

function groupPanneauxByPoteau(panneaux) {
    return panneaux.reduce((acc,val) => {
        const poteauId = val.properties.POTEAU_ID_POT;
        if (!acc[poteauId]) {
            acc[poteauId] = [];
        }
        acc[poteauId].push(val); 
        return acc;
    }, {});
}

function buildRpa(mainPanneau, panonceaux) {
    const panneaux = [mainPanneau].concat(panonceaux);

    const ids = panneaux.map(panneau => panneau.properties.PANNEAU_ID_RPA);
    const descriptions = panneaux.map(panneau => panneau.properties.DESCRIPTION_RPA);
    const codes = panneaux.map(panneau => panneau.properties.CODE_RPA);

    return {
        "ID_RPA": ids.join("_"),
        "DESCRIPTION_RPA": descriptions,
        "CODE_RPA": codes,
    }
}

function getFusionedSignalization(mainPanneau, aggregationRpa) {
    // Deep copy.
    const fusionedSignalization = JSON.parse(JSON.stringify(mainPanneau));

    const properties = fusionedSignalization.properties;
    properties.PANNEAU_ID_RPA = aggregationRpa.ID_RPA;
    properties.CODE_RPA = aggregationRpa.CODE_RPA;
    properties.DESCRIPTION_RPA = aggregationRpa.DESCRIPTION_RPA;

    // delete properties that cannot be fusioned
    delete properties.POSITION_POP;
    delete properties.DESCRIPTION_CAT;

    return fusionedSignalization;
}

// Get the regulations of a "panneau" with its RPA and its regulations
function getPanneauRpaWithRegulation(panneau, rpaWithRegulation) {
    const properties = panneau.properties;

    const regulations = rpaWithRegulation[properties.PANNEAU_ID_RPA].regulations;
    if (regulations === undefined) {
        return {};
    }
    const deepCopiedRegulations = JSON.parse(JSON.stringify(regulations));

    return {
        "PANNEAU_ID_RPA": properties.PANNEAU_ID_RPA,
        "DESCRIPTION_RPA": properties.DESCRIPTION_RPA,
        "CODE_RPA": properties.CODE_RPA,
        "regulations": deepCopiedRegulations
    }
}

// Init an unprocessed aggretation of regulations for a "main panneau" with its associated "panonceaux"
function getSingleAggregatedRpaWithRegulations(mainPanneau, panonceaux, rpa, rpaWithRegulation) {
    const mainPanneauRpaWithRegulation = getPanneauRpaWithRegulation(mainPanneau, rpaWithRegulation);
    const panonceauxRpaWithRegulation = panonceaux.map((panonceau) => {
        return getPanneauRpaWithRegulation(panonceau, rpaWithRegulation);
    });

    return {
        "DESCRIPTION_RPA": rpa.DESCRIPTION_RPA,
        "CODE_RPA": rpa.CODE_RPA,
        "mainPanneau": mainPanneauRpaWithRegulation,
        "panonceaux": panonceauxRpaWithRegulation
    };
}

function associatePanneauxWithPanonceaux(panneaux, rpaWithRegulation) {

    const panneauxByPoteaux = groupPanneauxByPoteau(panneaux);

    const fusionedSignalizations = [];
    const aggregatedRpaWithRegulation = {};

    Object.values(panneauxByPoteaux).forEach((poteau) => {
        // POSITION_POP is the position of the "panneau" on the "poteau". Bigger is POSITION_POP, higher is the "panneau".
        // A "main panneau" is modified by the "panonceaux" that are immediately under it
        // ex: In [1, 2, 3, 4, 5], if [2, 4, 5] are "panonceaux", then "main panneau" 2 is modified by [1], while "main panneau" 5 is modified [3, 4].
        // We sort so we know we're done gathering all the "panonceaux" under a "main panneau" when we reach one.
        poteau.sort((a, b) => a.properties.POSITION_POP - b.properties.POSITION_POP);
        
        const panonceaux = [];

        poteau.forEach(panneau => {
            if (!rpaWithRegulation[panneau.properties.PANNEAU_ID_RPA]) {
                // This is not supposed to happen
                return;
            }

            // This is a "panonceau"
            if (panneau.properties.DESCRIPTION_CAT == "STAT-PANNONC.") {
                panonceaux.push(panneau);
                return;
            }
            // else we have a "main panneau"

            // we want a consistent order for debugging
            panonceaux.sort((a, b) => a.PANNEAU_ID_RPA - b.PANNEAU_ID_RPA);

            const aggregationRpa = buildRpa(panneau, panonceaux);

            // We add to aggregatedRpaWithRegulation only the new rpaWithRegulations
            if (panonceaux.length > 0) {
                const singleAggregatedRpaWithRegulations
                    = getSingleAggregatedRpaWithRegulations(
                        panneau,
                        panonceaux,
                        aggregationRpa,
                        rpaWithRegulation
                    );
                aggregatedRpaWithRegulation[aggregationRpa.ID_RPA]
                    = singleAggregatedRpaWithRegulations;
            }

            const fusionedSignalization = getFusionedSignalization(panneau, aggregationRpa);
            fusionedSignalizations.push(fusionedSignalization);

            // Clear "panonceaux" list for next "main panneau" on "poteau"
            panonceaux.length = 0;
        });
    });

    return [fusionedSignalizations, aggregatedRpaWithRegulation]
}

function fusionEffectiveDates(timeSpan, otherEffectiveDates) {
    if (otherEffectiveDates === undefined) {
        return;
    }
    if (timeSpan.effectiveDates === undefined) {
        // deep copy otherEffectiveDates since it could be modified by adding other panonceaux
        timeSpan.effectiveDates = JSON.parse(JSON.stringify(otherEffectiveDates));
    }
    else {
        timeSpan.effectiveDates.push(...otherEffectiveDates);
    }
}

function fusionTimesOfDay(timeSpan, otherTimesOfDay) {
    if (otherTimesOfDay === undefined) {
        return;
    }
    if (timeSpan.timesOfDay === undefined) {
        // deep copy otherTimesOfDay since it could be modified by adding other panonceaux
        timeSpan.timesOfDay = JSON.parse(JSON.stringify(otherTimesOfDay));
    }
    else {
        timeSpan.timesOfDay.push(...otherTimesOfDay);
    }
}

function fusionDaysOfWeek(timeSpan, otherDaysOfWeek) {
    if (otherDaysOfWeek === undefined) {
        return;
    }
    if (timeSpan.daysOfWeek === undefined) {
        // deep copy othersDaysOfWeek since it could be modified by adding other panonceaux
        timeSpan.daysOfWeek = JSON.parse(JSON.stringify(otherDaysOfWeek));
    }
    else {
        timeSpan.daysOfWeek.days.push(...otherDaysOfWeek.days);
    }
}

function countTimeSpanCommonSetAttributes(timeSpan, otherTimeSpan) {
    let total = 0;
    if (timeSpan.effectiveDates !== undefined && otherTimeSpan.effectiveDates !== undefined) {
        total++;
    }
    if (timeSpan.daysOfWeek !== undefined && otherTimeSpan.daysOfWeek !== undefined) {
        total++;
    }
    if (timeSpan.timesOfDay !== undefined && otherTimeSpan.timesOfDay !== undefined) {
        total++;
    }
    return total;
}

function fusionTimeSpans(regulations, otherTimeSpans) {
    regulations.forEach((regulation) => {
        if (regulation.timeSpans === undefined) {
            regulation.timeSpans = otherTimeSpans;
            return;
        }

        const timeSpansToAppend = [];
        regulation.timeSpans.forEach((timeSpan) => {
            otherTimeSpans.forEach((otherTimeSpan) => {
                const nbCommonSetAttributes = countTimeSpanCommonSetAttributes(timeSpan, otherTimeSpan);
                // We make an assumption: If the new timeSpans has only one or zero common attribute with the
                // original timeSpan, then it is an extension to it. Otherwise, it is is a totally new timespan.
                // Ex1: "1h-2h MARDI" + "MERCREDI" = "1h-2h MARDI MERCREDI" (one common attribute)
                // Ex2: "1h-2h MARDI" + "3h-4h MERCREDI" = "1h-2h MARDI, 3h-4h MERCREDI" (two common attributes)
                if (nbCommonSetAttributes < 2) {
                    fusionEffectiveDates(timeSpan, otherTimeSpan.effectiveDates);
                    fusionTimesOfDay(timeSpan, otherTimeSpan.timesOfDay);
                    fusionDaysOfWeek(timeSpan, otherTimeSpan.daysOfWeek);
                }
                else {
                    timeSpansToAppend.push(otherTimeSpan);
                }
            })
        })
        regulation.timeSpans.push(...timeSpansToAppend);
    })
}

function handleUserClasses(regulations, userClasses) {
    if (userClasses === undefined) {
        return;
    }

    const newRegulations = [];

    regulations.forEach((originalRegulation) => {
        const originalActivity = originalRegulation.rule.activity;
        if (originalActivity == "no parking" || originalActivity == "no standing") {
            const derivedRegulation = {
                "rule": rpaToRegulations.getRule("parking", originalRegulation.rule.maxStay, userClasses),
                userClasses,
                "timeSpans": originalRegulation.timeSpans
            }
            originalRegulation.rule.maxStay = undefined; // swapped

            newRegulations.push(derivedRegulation);
            newRegulations.push(originalRegulation);
        } else {
            const newRule = rpaToRegulations.getRule(
                originalRegulation.rule.activity, 
                originalRegulation.rule.maxStay,
                userClasses
            );
            const modifiedRegulation = {
                "rule": newRule,
                userClasses,
                "timeSpans": originalRegulation.timeSpans
            };

            const derivedRegulation = {
                "rule": rpaToRegulations.getRule("no parking", undefined, undefined),
                "timeSpans": originalRegulation.timeSpans
            };

            newRegulations.push(modifiedRegulation);
            newRegulations.push(derivedRegulation);
        }
    })

    // Replacing regulations with new ones
    regulations.length = 0;
    regulations.push(...newRegulations)
}

// Must be executed after handleUserClasses. Otherwise the activities might not be right.
function fusionRule(regulations, rule) {
    if (rule === undefined) {
        return;
    }
    if (rule.maxStay === undefined) {
        return;
    }
    regulations.forEach((regulation) => {
        if (regulation.rule.activity == "parking" || regulation.rule.activity == "loading") {
            // We assume we're not replacing a maxStay.
            regulation.rule.maxStay = rule.maxStay;
        }
    })
}

function fusionRegulations(aggregatedRpaWithRegulation) {
    const fusionedRpaWithRegulations = {};

    // Could you please find a better name than 'singleAggregatedRpaWithRegulation'. Thanks.
    Object.entries(aggregatedRpaWithRegulation).forEach(([idRpa, singleAggregatedRpaWithRegulation]) => {

        const regulations = [];

        const mainPanneau = singleAggregatedRpaWithRegulation.mainPanneau;
        const panonceaux = singleAggregatedRpaWithRegulation.panonceaux;

        // No need to deep copy. It is already done, plus the original mainPanneau's regulations are not needed anymore.
        if (mainPanneau.regulations === undefined) {
            return;
        }
        regulations.push(...mainPanneau.regulations);

        panonceaux.forEach((panonceau) => {
            if (panonceau.regulations === undefined) {
                return;
            }

            panonceau.regulations.forEach((otherRegulation) => {
                if (otherRegulation.timeSpans !== undefined) {
                    fusionTimeSpans(regulations, otherRegulation.timeSpans);
                    regulations.timeSpans = curblrPrettifier.cleanTimeSpans(regulations.timeSpans);
                }
    
                handleUserClasses(regulations, otherRegulation.userClasses);

                fusionRule(regulations, otherRegulation.rule)
            })
        })
        
        const singleFusionedRpaWithRegulations = {
            "DESCRIPTION_RPA": singleAggregatedRpaWithRegulation.DESCRIPTION_RPA,
            "CODE_RPA": singleAggregatedRpaWithRegulation.CODE_RPA,
            "regulations": regulations
        };

        fusionedRpaWithRegulations[idRpa] = singleFusionedRpaWithRegulations;
    });
    return fusionedRpaWithRegulations
}

function aggregate(mtlData, rpaWithRegulation) {
    const panneaux = mtlData.features;
    const [fusionedSignalizations, aggregatedRpaWithRegulation]
        = associatePanneauxWithPanonceaux(panneaux, rpaWithRegulation);
    
    const fusionedSignalizationsGeojson = {
        "crs": mtlData.crs,
        "type": "FeatureCollection",
        "features": fusionedSignalizations
    }

    const fusionedRegulations = fusionRegulations(aggregatedRpaWithRegulation);

    
    return [fusionedSignalizationsGeojson, fusionedRegulations];
}

if (typeof require !== 'undefined' && require.main === module) {
    const signalization = jsonHelper.load("data/input/signalisation_stationnement.geojson");
    const rpaWithRegulation = jsonHelper.load("data/intermediary/signalisation-codification-rpa_withRegulation.json");

    const [fusionedSignalizations, fusionedRegulations]
        = aggregate(signalization, rpaWithRegulation);

    const fusionedSignalizationsFilename = "data/intermediary/agregate-signalisation.json";
    const fusionedRegulationsFilename = "data/intermediary/agregate-pannonceau-rpa.json"

    jsonHelper.write(fusionedSignalizationsFilename, fusionedSignalizations, true);
    jsonHelper.write(fusionedRegulationsFilename, fusionedRegulations, true);
}

module.exports = {
    aggregate,
    associatePanneauxWithPanonceaux,
    fusionTimeSpans,
    fusionRegulations,
}
