const rpaToRegulations = require("../rpa_to_regulations");

/*
    uncertain: behaviour that is not certainly right or wrong
    wrong: wrong behaviour that seems not worth fixing
*/

describe("tool functions", () => {
    test.each([
        ["01", "01"],
        ["1", "01"],
        ["11", "11"],
        ["01 02", "01"],
        ["1MARS", "01"],
        ["111", "11"], // uncertain
        ["a", undefined]
    ])("extractFirstTwoDigitsNumber('%s')", (description, expected) => {
        const result = rpaToRegulations.extractFirstTwoDigitsNumber(description);
        expect(result).toBe(expected);
    });

    test.each([
        ["JAN", "01"],
        ["1 AVRILAU", "04"],
        ["MARDI", undefined]
    ])("extractMonth('%s')", (description, expected) => {
        const result = rpaToRegulations.extractMonth(description);
        expect(result).toBe(expected);
    });

    test.each([
        ["8h", "08:00"],
        ["08h", "08:00"],
        ["09h30", "09:30"],
        ["8H", "08:00"],
        ["08H", "08:00"],
        ["09H30", "09:30"],
        ["09H3", "09:3"], // wrong
    ])("convertHtime('%s')", (description, expected) => {
        const result = rpaToRegulations.convertHtime(description);
        expect(result).toBe(expected);
    })
})

describe("getActivity", () => {
    test.each([
        [["\\P ",  undefined, undefined], "no parking"],
        [["/P ",  undefined, undefined], "no parking"],
        [["STAT. INT. ",  undefined, undefined], "no parking"],
        [["INTERDICTION DE STAT. ",  undefined, undefined], "no parking"],
        [["",  [], undefined], "no parking"],
        [["\\A ",  undefined, undefined], "no standing"],
        [["A ",  undefined, undefined], "no standing"],
        [[" \\A ",  undefined, undefined], "no standing"],
        [["P ",  undefined, undefined], "parking"],
        [["P PANONCEAU",  undefined, undefined], "parking"],
        [["",  undefined, 10], "parking"],
        [["",  [], 10], "parking"],
        [["PANONCEAU ",  undefined, undefined], undefined],
        [["PANNONCEAU",  undefined, undefined], undefined],
        [["\\P",  undefined, undefined], "no activity"],
        [["/P",  undefined, undefined], "no activity"],
        [["STAT. INT.",  undefined, undefined], "no activity"],
        [[" STAT. INT. ",  undefined, undefined], "no activity"], // uncertain
        [["INTERDICTION DE STAT.", undefined, undefined], "no activity"], // uncertain
        [[" INTERDICTION DE STAT. ", undefined, undefined], "no activity"], // uncertain
        [["STAT",  undefined, undefined], "no activity"],
        [["\\A",  undefined, undefined], "no activity"],
        [["\\AA",  undefined, undefined], "no activity"],
        [["\\a ",  undefined, undefined], "no activity"],
        [["A",  undefined, undefined], "no activity"],
        [[" A",  undefined, undefined], "no activity"],
        [["AA",  undefined, undefined], "no activity"],
        [["P",  undefined, undefined], "no activity"],
        [[" P",  undefined, undefined], "no activity"],
        [[" PANNONCEAU",  undefined, undefined], "no activity"],
    ])("getActivity('%s')", (args, expected) => {
        const activity = rpaToRegulations.getActivity(...args);
        expect(activity).toBe(expected);
    });
});

describe("getMaxStay", () => {
    test.each([
        ["10min", 10],
        ["2h", 120],
        ["1h-2h", undefined]
    ])("getMaxStay('%s')", (description, expected) => {
        const result = rpaToRegulations.getMaxStay(description);
        expect(result).toStrictEqual(expected);
    });
});

describe("getTimesOfDay", () => {
    test.each([
        ["1h-2h", {"from": "01:00", "to": "02:00"}],
        ["1h - 2h", {"from": "01:00", "to": "02:00"}],
        ["1hà2h", {"from": "01:00", "to": "02:00"}],
        ["1h à 2h", {"from": "01:00", "to": "02:00"}],
        ["1hÀ2h", {"from": "01:00", "to": "02:00"}],
        ["1h À 2h", {"from": "01:00", "to": "02:00"}],
        ["1ha2h", {"from": "01:00", "to": "02:00"}],
        ["1h a 2h", {"from": "01:00", "to": "02:00"}],
        ["1h@2h", {"from": "01:00", "to": "02:00"}],
        ["1h @ 2h", {"from": "01:00", "to": "02:00"}],
        ["1h 2h", {"from": "01:00", "to": "02:00"}], // invalid syntax but ok
        ["1h", undefined],
    ])("getTimeOfDay('%s')", (description, expected) => {
        const result = rpaToRegulations.getTimeOfDay(description);
        expect(result).toStrictEqual(expected);
    });

    test.each([
        ["1h-2h", [{"from": "01:00", "to": "02:00"}]],
        ["1h-2h 2h-3h", [{"from": "01:00", "to": "02:00"},
                         {"from": "02:00", "to": "03:00"}]],
        ["1h-2h 2h-3h 4h-5h", [{"from": "01:00", "to": "02:00"},
                               {"from": "02:00", "to": "03:00"},
                               {"from": "04:00", "to": "05:00"}]],
        ["1h-2h 2h-3h 4h-5h 6h-7h", [{"from": "01:00", "to": "02:00"}, 
                                     {"from": "02:00", "to": "03:00"},
                                     {"from": "04:00", "to": "05:00"},
                                     {"from": "06:00", "to": "07:00"}]],
        ["1h-2h et 2h-3h", [{"from": "01:00", "to": "02:00"},
                            {"from": "02:00", "to": "03:00"}]],
        ["1h-2h et 2h-3h et 4h-5h", [{"from": "01:00", "to": "02:00"},
                                     {"from": "02:00", "to": "03:00"},
                                     {"from": "04:00", "to": "05:00"}]],
        ["1h-2h et 2h-3h 4h-5h", [{"from": "01:00", "to": "02:00"},
                                  {"from": "02:00", "to": "03:00"},
                                  {"from": "04:00", "to": "05:00"}]],
        ["1h-2h lundi 2h-3h mardi", [{"from": "01:00", "to": "02:00"}, 
                                     {"from": "02:00", "to": "03:00"}]], // The function does not detect the days. This is fine.
        ["06h30-09h30, 15h30-18h30", [{"from": "06:30", "to": "09:30"},
                                      {"from": "15:30", "to": "18:30"}]]
    ])("getTimesOfDay('%s')", (description, expected) => {
        const result = rpaToRegulations.getTimesOfDay(description);
        expect(result).toStrictEqual(expected);
    });

});

describe("getEffectiveDates", () => {

    test.each([
        ["1 MARS AU 1 DEC", [{"from":"03-01","to":"12-01"}]],
        ["3 AVR - 5 NOVEMBRE", [{"from":"04-03","to":"11-05"}]],

        ["1ER MARS 1ER DEC", [{"from":"03-01","to":"12-01"}]],
        
    ])("getEffectiveDatesFromDayFirstSyntax('%s')", (description, expected) => {
        const activity = rpaToRegulations.getEffectiveDatesFromDayFirstSyntax(description);
        expect(activity).toStrictEqual(expected);
    });

    test.each([
        ["MARS 1 AU DEC 1", [{"from":"03-01","to":"12-01"}]],
        ["AVR 3 - NOVEMBRE 5", [{"from":"04-03","to":"11-05"}]]
    ])("getEffectiveDatesFromDaySecondSyntax('%s')", (description, expected) => {
        const activity = rpaToRegulations.getEffectiveDatesFromDaySecondSyntax(description);
        expect(activity).toStrictEqual(expected);
    });

    test.each([
        ["MARS AU DEC", [{"from":"03-01","to":"12-31"}]],
        ["AVR - NOVEMBRE", [{"from":"04-01","to":"11-31"}]]
    ])("getEffectiveDatesFromDayAbsentSyntax('%s')", (description, expected) => {
        const activity = rpaToRegulations.getEffectiveDatesFromDayAbsentSyntax(description);
        expect(activity).toStrictEqual(expected);
    });

    test.each([
        ["01/03 AU 01/12", [{"from":"03-01","to":"12-01"}]],
        ["01/04 - 01/11", [{"from":"04-01","to":"11-01"}]]
    ])("getEffectiveDatesFromSlashedSyntax('%s')", (description, expected) => {
        const activity = rpaToRegulations.getEffectiveDatesFromSlashedSyntax(description);
        expect(activity).toStrictEqual(expected);
    });

    test.each([
        ["1 MARS AU 1 DEC", [{"from":"03-01","to":"12-01"}]],
        ["1ER MARS 1ER DEC", [{"from":"03-01","to":"12-01"}]],
        ["1ER MARS - 1ER DÉC", [{"from":"03-01","to":"12-01"}]],
        ["1ER MARS - 1ER  DÉC", [{"from":"03-01","to":"12-01"}]],
        ["1ER MARS AU 1ER DECEMBRE", [{"from":"03-01","to":"12-01"}]],
        ["1ER MARS AU 1ER DEC", [{"from":"03-01","to":"12-01"}]],
        ["MARS 01 A DEC. 01", [{"from":"03-01","to":"12-01"}]],
        ["1 MARSL AU 1 DEC", [{"from":"03-01","to":"12-01"}]],
        ["1MARS AU 1 DEC.", [{"from":"03-01","to":"12-01"}]],
        ["15 MRS - 15 NOV.", [{"from":"03-15","to":"11-15"}]],
        ["15 MARS AU 15 NOV", [{"from":"03-15","to":"11-15"}]],
        ["15 MARS À 15 NOV", [{"from":"03-15","to":"11-15"}]],
        ["15 MARS - 15 NOVEMBRE", [{"from":"03-15","to":"11-15"}]],
        ["15 MARS AU 15 NOVEMBRE", [{"from":"03-15","to":"11-15"}]],
        ["1 AVRIL AU 30 SEPT", [{"from":"04-01","to":"09-30"}]],
        ["1 AVRIL AU 15 OCT", [{"from":"04-01","to":"10-15"}]],
        ["1 AVRIL AU 31 OCT", [{"from":"04-01","to":"10-31"}]],
        ["1 AVRIL AU 1 NOVEMBRE", [{"from":"04-01","to":"11-01"}]],
        ["1 AVRIL AU 15 NOV", [{"from":"04-01","to":"11-15"}]],
        ["1 AVRIL AU 15 NOVEMBRE", [{"from":"04-01","to":"11-15"}]],
        ["1 AVRIL AU 30 NOV", [{"from":"04-01","to":"11-30"}]],
        ["1ER AVRIL - 30 NOV", [{"from":"04-01","to":"11-30"}]],
        ["1 AVRILAU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1 AVRIL AU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1 AVIL AU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1 AVRIL ET 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1AVRIL AU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1AVRIL AU 1DEC", [{"from":"04-01","to":"12-01"}]],
        ["1ER AVRIL AU 1ER DEC", [{"from":"04-01","to":"12-01"}]],
        ["AVRIL 01 A DEC. 01", [{"from":"04-01","to":"12-01"}]],
        ["1 AVRILS AU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["1 AVRIL  AU 1 DEC", [{"from":"04-01","to":"12-01"}]],
        ["15 AVRIL AU 15 OCTOBRE", [{"from":"04-15","to":"10-15"}]],
        ["15 AVRIL AU 1 NOV", [{"from":"04-15","to":"11-01"}]],
        ["15 AVRIL AU 1ER NOV.", [{"from":"04-15","to":"11-01"}]],
        ["15 AVRIL AU 1 NOVEMBRE", [{"from":"04-15","to":"11-01"}]],
        ["15 AVRIL AU 15 NOVEMBRE", [{"from":"04-15","to":"11-15"}]],
        ["15 AVR - 15 NOV", [{"from":"04-15","to":"11-15"}]],
        ["15 AVR AU 15 NOV", [{"from":"04-15","to":"11-15"}]],
        ["15 AVRIL AU 1ER DEC", [{"from":"04-15","to":"12-01"}]],
        ["MAI-JUIN", [{"from":"05-01","to":"06-30"}]],
        ["1MAI AU 1 SEPT", [{"from":"05-01","to":"09-01"}]],
        ["1MAI AU 1OCT", [{"from":"05-01","to":"10-01"}]],
        ["1 MAI AU 1 NOV", [{"from":"05-01","to":"11-01"}]],
        ["15 MAI AU 15 OCT", [{"from":"05-15","to":"10-15"}]],
        ["15 MAI AU 15 SEPT", [{"from":"05-15","to":"09-15"}]],
        ["1 JUIN AU 1 OCT", [{"from":"06-01","to":"10-01"}]],
        ["15 JUIN AU 1ER SEPT.", [{"from":"06-15","to":"09-01"}]],
        ["21 JUIN AU 1 SEPT", [{"from":"06-21","to":"09-01"}]],
        ["30 JUIN AU 30 AOUT", [{"from":"06-30","to":"08-30"}]],
        ["16 JUIL. AU 4 SEPT.", [{"from":"07-16","to":"09-04"}]],
        ["15 AOUT - 28 JUIN", [{"from":"08-15","to":"06-28"}]],
        ["20 AOÛT AU 30 JUIN", [{"from":"08-20","to":"06-30"}]],
        ["1 SEPT. AU 23 JUIN", [{"from":"09-01","to":"06-23"}]],
        ["SEPT A JUIN", [{"from":"09-01","to":"06-30"}]],
        ["SEPT À JUIN", [{"from":"09-01","to":"06-30"}]],
        ["SEPT. A JUIN", [{"from":"09-01","to":"06-30"}]],
        ["SEPT. À JUIN", [{"from":"09-01","to":"06-30"}]],
        ["1 SEPT. AU 30 JUIN", [{"from":"09-01","to":"06-30"}]],
        ["1 SEPT. AU 31 MAI", [{"from":"09-01","to":"05-31"}]],
        ["1ER SEPT AU 31 MAI", [{"from":"09-01","to":"05-31"}]],
        ["1 NOV. AU 31 MARS", [{"from":"11-01","to":"03-31"}]],
        ["1 NOV. AU 1 AVRIL", [{"from":"11-01","to":"04-01"}]],
        ["1 NOVEMBRE AU 15 AVRIL", [{"from":"11-01","to":"04-15"}]],
        ["1 NOV. AU 1 MAI", [{"from":"11-01","to":"05-01"}]],
        ["15 NOV. AU 15 MARS", [{"from":"11-15","to":"03-15"}]],
        ["15 NOV. AU 1 AVRIL", [{"from":"11-15","to":"04-01"}]],
        ["15 NOV - 15 AVR", [{"from":"11-15","to":"04-15"}]],
        ["15NOV - 15AVRIL", [{"from":"11-15","to":"04-15"}]],
        ["16 NOV. AU 14 MARS", [{"from":"11-16","to":"03-14"}]],
        ["30 NOV - 1ER AVRIL", [{"from":"11-30","to":"04-01"}]],
        ["1 DEC. AU 1 MARS", [{"from":"12-01","to":"03-01"}]],
        ["1ER DECEMBRE AU 1ER MARS", [{"from":"12-01","to":"03-01"}]],
        ["1 DEC. AU 1 AVRIL", [{"from":"12-01","to":"04-01"}]]
    ])("getEffectiveDates('%s')", (description, expected) => {
        const effectiveDates = rpaToRegulations.getEffectiveDates(description);
        expect(effectiveDates).toStrictEqual(expected);
    });
});

describe("getDaysOfWeek", () => {

    test.each([
        ["LUN", "mo"],
        ["DIMANCHE", "su"],
        ["1 DEC.", undefined]
    ])("extractDayOfWeek('%s')", (description, expected) => {
        const result = rpaToRegulations.extractDayOfWeek(description);
        expect(result).toStrictEqual(expected);
    });

    test.each([
        ["LUN", {"days": ["mo"] }],
        ["LUN MAR", {"days": ["mo", "tu"] }],
        ["1 DEC.", undefined]
    ])("getDaysOfWeekFromEnumeration('%s')", (description, expected) => {
        const result = rpaToRegulations.getDaysOfWeekFromEnumeration(description);
        expect(result).toStrictEqual(expected);
    });

    test.each([
        ["LUN À VEN", {"days": ["mo", "tu", "we", "th", "fr"] }],
        ["LUN TEST VEN", {"days": ["mo", "tu", "we", "th", "fr"] }], // The separator does not actually matters
        ["VEN DIM", {"days": ["fr", "sa", "su"] }], // The separator does not actually matters
        ["DIM À LUN", {"days": ["su", "mo"] }],
        ["1h À 2h", undefined]
    ])("getDaysOfWeekFromInterval('%s')", (description, expected) => {
        const result = rpaToRegulations.getDaysOfWeekFromInterval(description);
        expect(result).toStrictEqual(expected);
    })

    test.each([
        ["LUNDI", {"days": ["mo"]}],
        ["LUN.", {"days": ["mo"]}],
        ["LUN", {"days": ["mo"]}],
        ["MARDI", {"days": ["tu"]}],
        ["MAR.", {"days": ["tu"]}],
        ["MAR", {"days": ["tu"]}],
        ["MERCREDI", {"days": ["we"]}],
        ["MER.", {"days": ["we"]}],
        ["MER", {"days": ["we"]}],
        ["JEUDI", {"days": ["th"]}],
        ["JEU.", {"days": ["th"]}],
        ["JEU", {"days": ["th"]}],
        ["VENDREDI", {"days": ["fr"]}],
        ["VEN.", {"days": ["fr"]}],
        ["VEN", {"days": ["fr"]}],
        ["VEMDREDI", {"days": ["fr"]}], // typo in data
        ["SAMEDI", {"days": ["sa"]}],
        ["SAM.", {"days": ["sa"]}],
        ["SAM", {"days": ["sa"]}],
        ["DIMANCHE", {"days": ["su"]}],
        ["DIM.", {"days": ["su"]}],
        ["DIM", {"days": ["su"]}],
        ["LUN VEN", {"days": ["mo", "fr"]}], 
        ["LUN A VEN", {"days": ["mo","tu","we","th","fr"]}],
        ["LUN À VEN", {"days": ["mo","tu","we","th","fr"]}],
        ["LUN AU VEN", {"days": ["mo","tu","we","th","fr"]}],
        ["LUN ET VEN", {"days": ["mo", "fr"]}],
        ["VEN LUN", {"days": ["fr", "mo"]}],
        ["LUN VEN MAR", {"days": ["mo", "fr", "tu"]}],
        ["LUN VEN MAR MER", {"days": ["mo", "fr", "tu", "we"]}],
        ["SAM A LUN", {"days": ["sa", "su", "mo"]}],
        ["LUN B VEN", {"days": ["mo", "fr"]}], // uncertain 
        ["LUN ET LUN", {"days": ["mo", "mo"]}], // uncertain
        ["LUN AU VENA", undefined], // uncertain
        ["1 DEC. AU 1 AVRIL", undefined],
    ])("getDaysOfWeek('%s')", (description, expected) => {
        const daysOfWeek = rpaToRegulations.getDaysOfWeek(description);
        expect(daysOfWeek).toStrictEqual(expected);
    });
});

describe("getTimeSpans", () => {
    test.each([
        ["LUN 17H À MAR 17H", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": {"from": "17:00", "to": "23:59"}},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu"]}, "timesOfDay": {"from": "00:00", "to": "17:00"}}]],
        ["LUN 17H À VEN 17H", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": {"from": "17:00", "to": "23:59"}},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu", "we", "th"]}, "timesOfDay": {"from": "00:00", "to": "23:59"}},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["fr"]}, "timesOfDay": {"from": "00:00", "to": "17:00"}}]],
    ])("getTimeSpansFromDaysOverlapSyntax('%s')", (description, expected) => {
        const result = rpaToRegulations.getTimeSpansFromDaysOverlapSyntax(description);
        expect(result).toStrictEqual(expected);
    })

    test.each([
        [
            "9H À 17H",
            [{
              "effectiveDates": undefined,
              "daysOfWeek": undefined,
              "timesOfDay": [{ "from": "09:00", "to": "17:00"}]
            }]
        ],
        [
            "LUN MER VEN",
            [{
              "effectiveDates": undefined,
              "daysOfWeek": {"days": ["mo", "we", "fr"]},
              "timesOfDay": undefined
            }]
        ],
        [
            "15 NOV AU 15 MARS", [{"effectiveDates": [{"from": "11-15", "to": "03-15"}]}]
        ],
        [
            "18h-23h LUN.AU VEN., 9h-23h SAM.ET DIM.",
            [{
              "effectiveDates": undefined,
              "daysOfWeek": {"days": ["mo", "tu", "we", "th", "fr"]},
              "timesOfDay": [{ "from": "18:00", "to": "23:00"}]
            },
            {
              "effectiveDates": undefined,
              "daysOfWeek": {"days": ["sa", "su"]},
              "timesOfDay": [{"from": "09:00", "to": "23:00"}]
            }]
        ],
        [
            "9H À 17H LUN MER VEN 15 NOV AU 15 MARS, 11H À 12H MERCREDI 15 MARS AU 15 NOV",
            [{
              "effectiveDates": [{ "from": "11-15", "to": "03-15"}],
              "daysOfWeek": {"days": ["mo", "we", "fr"]},
              "timesOfDay": [{ "from": "09:00", "to": "17:00"}]
            },
            {
              "effectiveDates": [{ "from": "03-15", "to": "11-15"}],
              "daysOfWeek": {"days": ["we"]},
              "timesOfDay": [{"from": "11:00", "to": "12:00"}]
            }]
        ],
        [
            "LUN 17H À MAR 17H 01/03 AU 01/12", 
            [{
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["mo"]},
                "timesOfDay": {"from": "17:00", "to": "23:59"}
            },
            {
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["tu"]},
                "timesOfDay": {"from": "00:00", "to": "17:00"}
            }]
        ],
    ])("getTimeSpans('%s')", (description, expected) => {
        const result = rpaToRegulations.getTimeSpans(description);
        expect(result).toStrictEqual(expected);
    })
});
