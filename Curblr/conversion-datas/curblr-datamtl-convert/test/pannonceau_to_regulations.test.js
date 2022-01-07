const panonceauToRegulations = require("../scripts/pannonceau_to_regulations")

describe("associatePanneauxWithPannonceaux", () => {

    test("associatePanneauxWithPannonceaux", () => {
        // The properties have been simplified to keep only the necessary
        const signalization = {
            "type": "FeatureCollection",
            "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
            "features": [{
                "type": "Feature",
                "properties": { 
                    "POTEAU_ID_POT": 1,
                    "POSITION_POP": 2,
                    "PANNEAU_ID_RPA": 1,
                    "DESCRIPTION_RPA": "\\P 1h-2h",
                    "CODE_RPA": "RPA1",
                    "DESCRIPTION_CAT": "STATIONNEMENT",
                },
                "geometry": { "type": "Point", "coordinates": [ 0, 0 ] }
            },
            {
                "type": "Feature",
                "properties": { 
                    "POTEAU_ID_POT": 1,
                    "POSITION_POP": 1,
                    "PANNEAU_ID_RPA": 2,
                    "DESCRIPTION_RPA": "PANNONCEAU LUNDI MARDI",
                    "CODE_RPA": "RPA2",
                    "DESCRIPTION_CAT": "STAT-PANNONC.",
                },
                "geometry": { "type": "Point", "coordinates": [ 0, 0 ] }
            }]
        }
    
        const rpaWithRegulations = {
            "1": {
                "description": "\\P 1h-2h",
                "code": "RPA1",
                "regulations": [{
                    "rule": {
                        "activity": "no parking",
                        "priorityCategory": "3"
                    },
                    "timeSpans": [
                        {"timesOfDay":[{"from":"01:00","to":"02:00"}]}
                    ]
                }]
            },
            "2": {
                "description": "PANNONCEAU LUNDI MARDI",
                "code": "RPA2",
                "regulations": [{
                    "timeSpans": [
                        {"daysOfWeek": {"days": ["mo", "tu"]}}
                    ]
                }]
            }
        }

        const expected = {
            "fusionedSignalizations": [{
                "type": "Feature",
                "properties": { 
                    "POTEAU_ID_POT": 1,
                    "PANNEAU_ID_RPA": "1_2",
                    "DESCRIPTION_RPA": ["\\P 1h-2h", "PANNONCEAU LUNDI MARDI"],
                    "CODE_RPA": ["RPA1", "RPA2"]
                },
                "geometry": { "type": "Point", "coordinates": [ 0, 0 ] }
            }],

            "aggregatedRpaWithRegulation": {
                "1_2": {
                    "DESCRIPTION_RPA": ["\\P 1h-2h", "PANNONCEAU LUNDI MARDI"],
                    "CODE_RPA": ["RPA1", "RPA2"],
                    "mainPanneau": {
                        "PANNEAU_ID_RPA": 1,
                        "DESCRIPTION_RPA": "\\P 1h-2h",
                        "CODE_RPA": "RPA1",
                        "regulations": [{
                            "rule": {
                                "activity": "no parking",
                                "priorityCategory": "3"
                            },
                            "timeSpans": [
                                {"timesOfDay":[{"from":"01:00","to":"02:00"}]}
                            ]
                        }]
                    },
                    "panonceaux": [{
                        "PANNEAU_ID_RPA": 2,
                        "DESCRIPTION_RPA": "PANNONCEAU LUNDI MARDI",
                        "CODE_RPA": "RPA2",
                        "regulations": [{
                            "timeSpans": [
                                {"daysOfWeek": {"days": ["mo", "tu"]}}
                            ]
                        }]
                    }],
                }
            }
        }

        const [fusionedSignalizations, aggregatedRpaWithRegulation]
            = panonceauToRegulations.associatePanneauxWithPanonceaux(signalization.features, rpaWithRegulations);
        expect(fusionedSignalizations).toStrictEqual(expected.fusionedSignalizations);
        expect(aggregatedRpaWithRegulation).toStrictEqual(expected.aggregatedRpaWithRegulation);
    });
});

describe("fusionTimeSpans", () => {
    test("Add timeSpans to no timeSpans", () => {
        const regulations = [{}];
        const otherTimeSpans = [{"daysOfWeek": {"days": ["mo", "tu"]}}];
        const expected = [{
            "timeSpans": [{"daysOfWeek": {"days": ["mo", "tu"]}}]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion no daysOfWeek to daysOfWeek", () => {
        const regulations = [{
            "timeSpans": [{
                "timesOfDay":[{"from":"01:00","to":"02:00"}]
            }]
        }];
        const otherTimeSpans = [{
            "daysOfWeek": {"days": ["mo", "tu"]}
        }];
        const expected = [{
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
                "timesOfDay":[{"from":"01:00","to":"02:00"}]
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion daysOfWeek to daysOfWeek", () => {
        const regulations = [
        {
            "timeSpans": [{
                "daysOfWeek": {"days": ["th"]},
                "timesOfDay":[{"from":"01:00","to":"02:00"}]
            }]
        }];
        const otherTimeSpans = [{
            "daysOfWeek": {"days": ["mo", "tu"]}
        }];
        const expected = [{
            "timeSpans": [{
                "daysOfWeek": {"days": ["th", "mo", "tu"]},
                "timesOfDay":[{"from":"01:00","to":"02:00"}]
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion no timesOfDay to timesOfDay", () => {
        const regulations = [
        {
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
            }]
        }];
        const otherTimeSpans = [{
            "timesOfDay":[{"from":"01:00","to":"02:00"}]
        }];
        const expected = [{
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
                "timesOfDay":[{"from":"01:00","to":"02:00"}]
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion timesOfDay to TimesOfDay", () => {
        const regulations = [
        {
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
                "timesOfDay":[{"from":"03:00","to":"04:00"}]
            }]
        }];
        const otherTimeSpans = [{
            "timesOfDay":[{"from":"01:00","to":"02:00"}]
        }];
        const expected = [{
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
                "timesOfDay":[{"from":"03:00","to":"04:00"}, {"from":"01:00","to":"02:00"}]
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion no effectiveDates to effectiveDates", () => {
        const regulations = [
        {
            "timeSpans": [{
                "daysOfWeek": {"days": ["mo", "tu"]},
            }]
        }];
        const otherTimeSpans = [{
            "effectiveDates": [{"from": "05-15", "to": "09-15"}]
        }];
        const expected = [{
            "timeSpans": [{
                "effectiveDates": [{"from": "05-15", "to": "09-15"}],
                "daysOfWeek": {"days": ["mo", "tu"]}
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion no effectiveDates to effectiveDates", () => {
        const regulations = [
        {
            "timeSpans": [{
                "effectiveDates": [{"from": "01-15", "to": "01-15"}],
                "daysOfWeek": {"days": ["mo", "tu"]},
            }]
        }];
        const otherTimeSpans = [{
            "effectiveDates": [{"from": "05-15", "to": "09-15"}]
        }];
        const expected = [{
            "timeSpans": [{
                "effectiveDates": [{"from": "01-15", "to": "01-15"}, {"from": "05-15", "to": "09-15"}],
                "daysOfWeek": {"days": ["mo", "tu"]}
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });

    test("fusion timespans with two same attributes", () => {
        const regulations = [
        {
            "timeSpans": [{
                "effectiveDates": [{"from": "01-15", "to": "02-15"}],
                "daysOfWeek": {"days": ["mo", "tu"]},
            }]
        }];
        const otherTimeSpans = [{
            "effectiveDates": [{"from": "05-15", "to": "09-15"}],
            "daysOfWeek": {"days": ["we", "th"]},
        }];
        const expected = [{
            "timeSpans": [{
                "effectiveDates": [{"from": "01-15", "to": "02-15"}],
                "daysOfWeek": {"days": ["mo", "tu"]}
            },
            {
                "effectiveDates": [{"from": "05-15", "to": "09-15"}],
                "daysOfWeek": {"days": ["we", "th"]},
            }]
        }];

        panonceauToRegulations.fusionTimeSpans(regulations, otherTimeSpans, expected);
        expect(regulations).toStrictEqual(expected);
    });
})

describe("fusionRegulations", () => {
    test("fusion regulation with userClasses, no parking", () => {
        const aggregatedRpaWithRegulation = {
            "0": {
                "mainPanneau": {
                    "regulations": [{
                        "rule": {
                            "activity": "no parking",
                            "maxStay": 15,
                            "priorityCategory": "no parking"
                        },
                        "timeSpans": [{
                            "daysOfWeek": {"days": ["mo", "tu"]},
                        }]
                    }],
                },
                "panonceaux": [{
                    "regulations": [{
                        "rule": {
                            "activity": "panonceau"
                        },
                        "userClasses": [{"classes": ["s3r"]}],
                    }]
                }]
            }
        }
        const expected = {
            "0": {
                "DESCRIPTION_RPA": undefined,
                "CODE_RPA": undefined,
                "regulations": [{
                    "rule": {
                        "activity": "parking",
                        "maxStay": 15,
                        "priorityCategory": "free parking - userClasses"
                    },
                    "userClasses": [{"classes": ["s3r"]}],
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                },
                {
                    "rule": {
                        "activity": "no parking",
                        "maxStay": undefined,
                        "priorityCategory": "no parking"
                    },
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                }]
            }
        }

        const result
            = panonceauToRegulations.fusionRegulations(aggregatedRpaWithRegulation, expected);
        expect(result).toStrictEqual(expected);
    });

    test("fusion regulation with userClasses, parking", () => {
        const aggregatedRpaWithRegulation = {
            "0": {
                "mainPanneau": {
                    "regulations": [{
                        "rule": {
                            "activity": "parking",
                            "maxStay": 15,
                            "priorityCategory": "free parking"
                        },
                        "timeSpans": [{
                            "daysOfWeek": {"days": ["mo", "tu"]},
                        }]
                    }],
                },
                "panonceaux": [{
                    "regulations": [{
                        "rule": {
                            "activity": "panonceau"
                        },
                        "userClasses": [{"classes": ["s3r"]}],
                    }]
                }]
            }
        }
        const expected = {
            "0": {
                "DESCRIPTION_RPA": undefined,
                "CODE_RPA": undefined,
                "regulations": [{
                    "rule": {
                        "activity": "parking",
                        "maxStay": 15,
                        "priorityCategory": "free parking - userClasses"
                    },
                    "userClasses": [{"classes": ["s3r"]}],
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                },
                {
                    "rule": {
                        "activity": "no parking",
                        "maxStay": undefined,
                        "priorityCategory": "no parking"
                    },
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                }]
            }
        }

        const result
            = panonceauToRegulations.fusionRegulations(aggregatedRpaWithRegulation, expected);
        expect(result).toStrictEqual(expected);
    });

    test("fusion regulation with rule containing maxStay", () => {
        const aggregatedRpaWithRegulation = {
            "0": {
                "mainPanneau": {
                    "regulations": [{
                        "rule": {
                            "activity": "parking",
                            "priorityCategory": "free parking"
                        },
                        "timeSpans": [{
                            "daysOfWeek": {"days": ["mo", "tu"]},
                        }]
                    }],
                },
                "panonceaux": [{
                    "regulations": [{
                        "rule": {
                            "activity": "panonceau"
                        },
                        "userClasses": [{"classes": ["s3r"]}],
                    }]
                },
                {
                    "regulations": [{
                        "rule": {
                            "activity": "panonceau",
                            "maxStay": 15
                        },
                    }]
                }]
            }
        }
        const expected = {
            "0": {
                "DESCRIPTION_RPA": undefined,
                "CODE_RPA": undefined,
                "regulations": [{
                    "rule": {
                        "activity": "parking",
                        "maxStay": 15,
                        "priorityCategory": "free parking - userClasses"
                    },
                    "userClasses": [{"classes": ["s3r"]}],
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                },
                {
                    "rule": {
                        "activity": "no parking",
                        "maxStay": undefined,
                        "priorityCategory": "no parking"
                    },
                    "timeSpans": [{
                        "daysOfWeek": {"days": ["mo", "tu"]},
                    }]
                }]
            }
        }

        const result
            = panonceauToRegulations.fusionRegulations(aggregatedRpaWithRegulation, expected);
        expect(result).toStrictEqual(expected);
    });


    test("fusion regulation with exception time", () => {
        const aggregatedRpaWithRegulation = {
            "0": {
                "mainPanneau": {
                    "regulations": [{
                        "rule": {
                            "activity": "no parking",
                            "priorityCategory": "no parking"
                        },
                        "timeSpans": [{
                            "daysOfWeek":{"days":["mo","tu","we","th","fr"]},
                            "timesOfDay":[{"from":"09:00","to":"17:00"}]
                        }],
                    }]
                },
                "panonceaux": [{
                    "regulations": [{
                        "rule": {
                            "activity": "exception"
                        },
                        "timeSpans": [{
                            "daysOfWeek": {"days":["mo"]},
                            "timesOfDay": [{"from":"09:00","to":"17:00"}]
                        }],
                    }]
                }]
            }
        }
        const expected = {
            "0": {
                "DESCRIPTION_RPA": undefined,
                "CODE_RPA": undefined,
                "regulations": [{
                    "rule": {
                        "activity": "no parking",
                        // "maxStay": undefined, // ok, but should be there for concistency
                        "priorityCategory": "no parking"
                    },
                    // "userClasses": undefined, // ok, but should be there for concistency
                    "timeSpans": [{
                        "effectiveDates": undefined,
                        "daysOfWeek":{"days":["tu","we","th","fr"]},
                        "timesOfDay":[{"from":"09:00","to":"17:00"}]
                    }],
                },]
            }
        }

        const result
            = panonceauToRegulations.fusionRegulations(aggregatedRpaWithRegulation, expected);
        expect(result).toStrictEqual(expected);
    });
})
