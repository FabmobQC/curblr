const rpaToRegulations = require("../scripts/rpa_to_regulations");
const rpaReg = require("../scripts/rpa_regexes");

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
        [["DÉBARCADÈRE",  undefined, undefined], "loading"],
        [["DEBAR.",  undefined, undefined], "loading"],
        [["\\P 15h30 - 18h LUN À VEN EXCEPTE DEBARCADERE",  [], undefined], "no parking"], // uncertain. Maybe "DEBARCADERE" should be handled
        [["PANONCEAU ",  undefined, undefined], "panonceau"],
        [["PANNONCEAU",  undefined, undefined], "panonceau"],
        [["\\P",  undefined, undefined], "irrelevant"],
        [["/P",  undefined, undefined], "irrelevant"],
        [["STAT. INT.",  undefined, undefined], "irrelevant"],
        [[" STAT. INT. ",  undefined, undefined], "irrelevant"], // uncertain
        [["INTERDICTION DE STAT.", undefined, undefined], "irrelevant"], // uncertain
        [[" INTERDICTION DE STAT. ", undefined, undefined], "irrelevant"], // uncertain
        [["STAT",  undefined, undefined], "irrelevant"],
        [["\\A",  undefined, undefined], "irrelevant"],
        [["\\AA",  undefined, undefined], "irrelevant"],
        [["\\a ",  undefined, undefined], "irrelevant"],
        [["A",  undefined, undefined], "irrelevant"],
        [[" A",  undefined, undefined], "irrelevant"],
        [["AA",  undefined, undefined], "irrelevant"],
        [["P",  undefined, undefined], "irrelevant"],
        [[" P",  undefined, undefined], "irrelevant"],
        [[" PANNONCEAU",  undefined, undefined], "irrelevant"],
    ])("getActivity('%s')", (args, expected) => {
        const activity = rpaToRegulations.getActivity(...args);
        expect(activity).toBe(expected);
    });
});

describe("getMaxStay", () => {
    test.each([
        ["10min", 10],
        ["20000000min", 20000000],
        ["2h", 120],
        ["1h-2h", undefined]
    ])("getMaxStay('%s')", (description, expected) => {
        const result = rpaToRegulations.getMaxStay(description);
        expect(result).toStrictEqual(expected);
    });
});

describe("getUserClasses", () => {
    test.each([
        [
            "\\P RESERVE HANDICAPES 09h30-21h",
            [{"classes": ["handicapes"]}]
        ],
        [
            "\\P EXCEPTE HANDICAPES 10h-20h 21 JUIN AU 1 SEPT.",
            [{"classes": ["handicapes"]}]
        ],
        [
            "\\P 04h-05h 16h30-23h30 EXCEPTE SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS",
            [{"classes": ["services", "cantines communautaires autorisés"]}]
        ],
        [
            "P RESERVE 21h-08h VEHICULES MUNIS D'UN PERMIS S3R",
            [{"classes": ["vehicules munis d'un permis s3r"]}]
        ],
        [
            "P RESERVE AUTOBUS TOURISTIQUE - AIRE D'ATTENTE 60 min de 8h-18h ET 2H de 18h-24h",
            [{"classes": ["autobus touristique"]}]],
        [
            "P RESER. CLIENT + DETENT. PERMIS RUE ETROITE",
            [{"classes": ["client", "detent. permis rue etroite"]}]
        ],
        [
            "RÉSERVÉ AUTOBUS 15 JUIN au 1er SEPT.",
            [{"classes": ["autobus"]}]
        ],
        [
            "P RÉSERVÉ SEULEMENT DÉTENTEURS DE PERMIS #",
            [{"classes": ["détenteurs de permis #"]}]
        ],
        [
            "P 2H - 9H @ 16H EXCEPTÉ MARDI",
            undefined
        ],
        [
            "P 60 min 09h-17h LUN. AU SAM.",
            undefined
        ],
        [
            "PANONCEAU DE DIRECTION BLANC ET NOIR - A DROITE EN BAS",
            undefined
        ],
    ])("getUserClasses('%s')", (description, expected) => {
        const result = rpaToRegulations.getUserClasses(description);
        expect(result).toStrictEqual(expected);
    });
});



describe("getRule", () => {
    test.each([
        [
            "no parking", 10, [], {},
            {"activity": "no parking", "maxStay": 10, "priorityCategory": "2"}
        ],
        [
            "no parking", 10, [], undefined,
            {"activity": "no parking", "maxStay": 10, "priorityCategory": "3"}
        ],
        [
            "no parking", 10, undefined, {},
            {"activity": "no parking", "maxStay": 10, "priorityCategory": "2"}
        ],
        [
            "no parking", 10, undefined, undefined,
            {"activity": "no parking", "maxStay": 10, "priorityCategory": "3"}
        ],
        [
            "no parking", undefined, [], {},
            {"activity": "no parking", "maxStay": undefined, "priorityCategory": "2"}
        ],
        [
            "no parking", undefined, [], undefined,
            {"activity": "no parking", "maxStay": undefined, "priorityCategory": "3"}
        ],
        [
            "no parking", undefined, undefined, {},
            {"activity": "no parking", "maxStay": undefined, "priorityCategory": "2"}
        ],
        [
            "no parking", undefined, undefined, undefined,
            {"activity": "no parking", "maxStay": undefined, "priorityCategory": "4"}
        ],
        [
            undefined, 10, [], {},
            {"activity": undefined, "maxStay": 10, "priorityCategory": "2"}
        ],
        [
            undefined, 10, [], undefined,
            {"activity": undefined, "maxStay": 10, "priorityCategory": "3"}
        ],
        [
            undefined, 10, undefined, {},
            {"activity": undefined, "maxStay": 10, "priorityCategory": "2"}
        ],
        [
            undefined, 10, undefined, undefined,
            {"activity": undefined, "maxStay": 10, "priorityCategory": "3"}
        ],
        [
            undefined, undefined, [], {},
            undefined
        ],
        [
            undefined, undefined, [], undefined,
            undefined
        ],
        [
            undefined, undefined, undefined, {},
            undefined
        ],
        [
            undefined, undefined, undefined, undefined,
            undefined
        ],
        [
            "panonceau", 10, [], {},
            {"activity": undefined, "maxStay": 10, "priorityCategory": "2"}
        ],
        [
            "panonceau", undefined, undefined, undefined,
            undefined
        ],
    ])("getRule(%p, %p, %p, %p)", (activity, maxStay, timespans, userClasses, expected) => {
        const result = rpaToRegulations.getRule(activity, maxStay, timespans, userClasses);
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
        ["09-17h", {"from": "09:00", "to": "17:00"}],
        ["18 @ 8h", {"from": "18:00", "to": "08:00"}],
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
        ["LUN 17H À MAR 17H", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": [{"from": "17:00", "to": "24:00"}]},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu"]}, "timesOfDay": [{"from": "00:00", "to": "17:00"}]}]],
        ["LUN 17H À VEN 17H", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": [{"from": "17:00", "to": "24:00"}]},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu", "we", "th"]}, "timesOfDay": undefined},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["fr"]}, "timesOfDay": [{"from": "00:00", "to": "17:00"}]}]],
        ["17H LUN À 17H MAR", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": [{"from": "17:00", "to": "24:00"}]},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu"]}, "timesOfDay": [{"from": "00:00", "to": "17:00"}]}]],
        ["17H LUN À 17H VEN", [{"effectiveDates": undefined, "daysOfWeek": {"days": ["mo"]}, "timesOfDay": [{"from": "17:00", "to": "24:00"}]},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["tu", "we", "th"]}, "timesOfDay": undefined},
                               {"effectiveDates": undefined, "daysOfWeek": {"days": ["fr"]}, "timesOfDay": [{"from": "00:00", "to": "17:00"}]}]],
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
            "15 NOV AU 15 MARS",
            [{
                    "effectiveDates": [{"from": "11-15", "to": "03-15"}],
                    "daysOfWeek": undefined,
                    "timesOfDay": undefined
            }]
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
                "effectiveDates": [{ "from": "03-15", "to": "11-15"}],
                "daysOfWeek": {"days": ["we"]},
                "timesOfDay": [{"from": "11:00", "to": "12:00"}]
            },
            {
              "effectiveDates": [{ "from": "11-15", "to": "03-15"}],
              "daysOfWeek": {"days": ["mo", "we", "fr"]},
              "timesOfDay": [{ "from": "09:00", "to": "17:00"}]
            }]
        ],
        [
            "LUN 17H À MAR 17H 01/03 AU 01/12", 
            [{
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["mo"]},
                "timesOfDay": [{"from": "17:00", "to": "24:00"}]
            },
            {
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["tu"]},
                "timesOfDay": [{"from": "00:00", "to": "17:00"}]
            }]
        ],
        [
            "17H LUN À 17H MAR 01/03 AU 01/12", 
            [{
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["mo"]},
                "timesOfDay": [{"from": "17:00", "to": "24:00"}]
            },
            {
                "effectiveDates": [{"from": "03-01", "to": "12-01"}],
                "daysOfWeek": {"days": ["tu"]},
                "timesOfDay": [{"from": "00:00", "to": "17:00"}]
            }]
        ],
        [
            "9H - 3H",
            [{
                "effectiveDates": undefined,
                "daysOfWeek": undefined,
                "timesOfDay": [{"from": "00:00", "to": "03:00"}, {"from": "09:00","to": "24:00"}]
            }]
        ],

        [
            "9H - 3H LUN ET MER ",
            [{
                "effectiveDates": undefined,
                "daysOfWeek": {"days": ["mo"]},
                "timesOfDay": [{"from": "09:00","to": "24:00"}]
            },
            {
                "effectiveDates": undefined,
                "daysOfWeek": {"days": ["tu"]},
                "timesOfDay": [{"from": "00:00", "to": "03:00"}]
            },
            {
                "effectiveDates": undefined,
                "daysOfWeek": {"days": ["we"]},
                "timesOfDay": [{"from": "09:00","to": "24:00"}]
            },
            {
                "effectiveDates": undefined,
                "daysOfWeek": {"days": ["th"]},
                "timesOfDay": [{"from": "00:00", "to": "03:00"}]
            }]
        ],
        [
            "PANONCEAU SAMEDI DIMANCHE", // test the final 'AU' in 'PANONCEAU'
            [{
                "effectiveDates": undefined,
                "daysOfWeek": {"days": ["sa", "su"]},
                "timesOfDay": undefined
            }]
        ],
        [
            "\\P RESERVE S3R 18h-23h LUN.AU VEN., 9h-23h SAM.ET DIM.", // Test 'LUN.AU VEN.' and 'SAM.ET DIM.'
            [{
                "effectiveDates": undefined,
                "daysOfWeek": {"days":["mo","tu","we","th","fr"]},
                "timesOfDay": [{"from":"18:00","to":"23:00"}]
            },
            {
                "effectiveDates": undefined,
                "daysOfWeek": {"days":["sa","su"]},
                "timesOfDay": [{"from":"09:00","to":"23:00"}]
            }]
        ]
    ])("getTimeSpans('%s')", (description, expected) => {
        const result = rpaToRegulations.getTimeSpans(description);
        expect(result).toStrictEqual(expected);
    })
});

describe("getRegulations", () => {
    test.each([
        [
            "PANONCEAU FLECHE A GAUCHE",
            undefined
        ],
        [
            "07h-09h30 LUN. AU VEN.",
            [{
                "rule": {
                    "activity": "no parking",
                    "maxStay": undefined,
                    "priorityCategory": "3"
                },
                "userClasses": undefined,
                "timeSpans": [{
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days":["mo","tu","we","th","fr"]},
                    "timesOfDay": [{"from":"07:00","to":"09:30"}]
                }]
            }]
        ],
        [
            "\\P 07h-09h LUNDI JEUDI 1 MARS AU 1 DEC.",
            [{
                "rule": {
                    "activity": "no parking",
                    "maxStay": undefined,
                    "priorityCategory": "3"
                },
                "userClasses": undefined,
                "timeSpans": [{
                    "effectiveDates": [{"from":"03-01","to":"12-01"}],
                    "daysOfWeek": {"days":["mo","th"]},
                    "timesOfDay": [{"from":"07:00","to":"09:00"}]
                }]
            }]
        ],
        [
            "P 04h 06h-18h LUN A VEN",
            [{
                "rule":{
                    "activity": "parking",
                    "maxStay": 240,
                    "priorityCategory": "3"
                },
                "userClasses": undefined,
                "timeSpans": [{
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days":["mo","tu","we","th","fr"]},
                    "timesOfDay": [{"from":"06:00","to":"18:00"}]
                }]
            }]
        ],
        [
            "\\P EXCEPTE S3R",
            [{
                "rule":{
                    "activity": "parking",
                    "maxStay": undefined,
                    "priorityCategory": "2"
                },
                "userClasses": [{"classes": ["s3r"]}],
                "timeSpans": undefined
            },
            {
                "rule": {
                    "activity": "no parking",
                    "maxStay": undefined,
                    "priorityCategory": "4"
                },
                "userClasses": undefined,
                "timeSpans": undefined
            }],
        ],
        [
            "\\A EXCEPTE S3R",
            [{
                "rule":{
                    "activity": "parking",
                    "maxStay": undefined,
                    "priorityCategory": "2"
                },
                "userClasses": [{"classes": ["s3r"]}],
                "timeSpans": undefined
            },
            {
                "rule": {
                    "activity": "no standing",
                    "maxStay": undefined,
                    "priorityCategory": "4"
                },
                "userClasses": undefined,
                "timeSpans": undefined
            }]
        ],
        [
            "P RESERVE S3R",
            [{
                "rule":{
                    "activity": "parking",
                    "maxStay": undefined,
                    "priorityCategory": "2"
                },
                "userClasses": [{"classes": ["s3r"]}],
                "timeSpans": undefined
            },
            {
                "rule": {
                    "activity": "no parking",
                    "maxStay": undefined,
                    "priorityCategory": "4"
                },
                "userClasses": undefined,
                "timeSpans": undefined
            }]
        ],
        [
            "P RESERVE S3R 2H",
            [{
                "rule":{
                    "activity": "parking",
                    "maxStay": 120,
                    "priorityCategory": "2"
                },
                "userClasses": [{"classes": ["s3r"]}],
                "timeSpans": undefined
            },
            {
                "rule": {
                    "activity": "no parking",
                    "maxStay": undefined,
                    "priorityCategory": "4"
                },
                "userClasses": undefined,
                "timeSpans": undefined
            }]
        ],
        [
            "PANNONCEAU RESERVE S3R",
            [{
                "rule": undefined,
                "userClasses": [{"classes": ["s3r"]}],
                "timeSpans": undefined
            }]
        ],
    ])("getRegulations('%p')", (description, expected) => {
        const result = rpaToRegulations.getRegulations(description);
        expect(result).toStrictEqual(expected);
    })
});