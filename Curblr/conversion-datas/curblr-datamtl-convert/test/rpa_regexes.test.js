const rpaReg = require("../scripts/rpa_regexes");

describe("times", () => {
    test.each([
        ["1h", "1h"],
        ["1h5", "1h5"],
        ["1h30", "1h30"],
        ["10h", "10h"],
        ["10h5", "10h5"],
        ["10h30", "10h30"],
        ["lundi1h", "1h"],
        ["1hlundi", "1h"],
        ["10", undefined],
        ["1ah", undefined],
        ["h30", undefined],
    ])("time.exec('%s')?.[0]", (value, expected) => {
        rpaReg.time.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.time, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["test 09-17h test", "09-17h"],
        ["1h-2h", undefined],
    ])("specialTimeInterval.exec(%p)", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.specialTimeInterval, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h", "1h-2h"],
        ["1h - 2h", "1h - 2h"],
        ["1hà2h", "1hà2h"],
        ["1h à 2h", "1h à 2h"],
        ["1hÀ2h", "1hÀ2h"],
        ["1h À 2h", "1h À 2h"],
        ["1ha2h", "1ha2h"],
        ["1h a 2h", "1h a 2h"],
        ["1hA2h", "1hA2h"],
        ["1h A 2h", "1h A 2h"],
        ["1h @ 2h", "1h @ 2h"],
        ["1h@2h", "1h@2h"],
        ["1h    -  2h", "1h    -  2h"],
        ["1h", undefined],
        ["1h 2h", undefined],
        ["1hb2h", undefined],
        ["1h b 2h", undefined],
        ["1hàa2h", undefined],
        ["lundi à vendredi", undefined],
    ])("timeInterval.exec('%s')?.[0]", (value, expected) => {
        rpaReg.timeInterval.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.timeInterval, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h", "1h-2h"],
        ["1h-2h 2h-3h", "1h-2h 2h-3h"],
        ["1h-2h 2h-3h 4h-5h", "1h-2h 2h-3h 4h-5h"],
        ["1h-2h 2h-3h 4h-5h 6h-7h", "1h-2h 2h-3h 4h-5h 6h-7h"],
        ["1h-2h et 2h-3h", "1h-2h et 2h-3h"],
        ["1h-2h et 2h-3h et 4h-5h", "1h-2h et 2h-3h et 4h-5h"],
        ["1h-2h et 2h-3h 4h-5h", "1h-2h et 2h-3h 4h-5h"],
        ["1h-2h lundi 2h-3h 4h-5h", "1h-2h"],
        ["06h30-09h30, 15h30-18h30", "06h30-09h30, 15h30-18h30"],
    ])("rpaReg.timesSequence.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.timesSequence.exec(value)[0];
        expect(result).toBe(expected);
    });

    test.each([
        ["1 min", "1 min"],
        ["10 min", "10 min"],
        ["120 min", "120 min"],
        ["1 H", "1 H"],
        ["P 15 MIN. 7h-18h JOURS D'ECOLE", "15 MIN"],
        ["P 2h 09h-17h MAR ET VEN", "2h"],
        ["1h-2h", undefined],
        ["07h-19h", undefined],
        ["06h30-08h30", undefined],
        ["19h MERCREDI A DIMANCHE", "19h"],
        ["19h MERCREDI A 20h DIMANCHE", undefined],
        ["MERCREDI A DIMANCHE 19h", "19h"],
        ["MERCREDI A DIMANCHE 19h-20h", undefined],
        ["MERCREDI 19h A DIMANCHE 20h", undefined],
        ["17H MAR À 17H MER - 18H JEU À 19H VEN - 20H SAM À 21H LUN", undefined],
        ["60 MIN - 8H À 18H", "60 MIN"],
        ["2H - 8H À 18H", undefined], // wrong. Hopefully the data has nothing such.
    ])("rpaRex.maxStay.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.maxStay, value);
        expect(result).toEqual(expected);
    });
});

describe("days", () => {
    test.each([
        ["LUN", "LUN"],
        ["LUN.", "LUN."],
        ["LUNDI", "LUNDI"],
        ["MAR", "MAR"],
        ["MAR.", "MAR."],
        ["MARDI", "MARDI"],
        ["MER", "MER"],
        ["MER.", "MER."],
        ["MERCREDI", "MERCREDI"],
        ["JEU", "JEU"],
        ["JEU.", "JEU."],
        ["JEUDI", "JEUDI"],
        ["VEN", "VEN"],
        ["VEN.", "VEN."],
        ["VEMDREDI", "VEMDREDI"],
        ["VENDREDI", "VENDREDI"],
        ["SAM", "SAM"],
        ["SAM.", "SAM."],
        ["SAMEDI", "SAMEDI"],
        ["DIM", "DIM"],
        ["DIM.", "DIM."],
        ["DIMANCHE", "DIMANCHE"],
        ["12h LUN 1 MARS", "LUN"],
        ["MONDAY", undefined ],
        ["MARS", undefined ],
    ])("anyDayOfWeek.exec('%s')?.[0]", (value, expected) => {
        rpaReg.anyDayOfWeek.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.anyDayOfWeek, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["LUN À VEN", "LUN À VEN"],
        ["LUN A VEN", "LUN A VEN"],
        ["LUN AU VEN", "LUN AU VEN"],
        ["LUN. AU VEN.", "LUN. AU VEN."],
        ["LUN.AU VEN.", "LUN.AU VEN."],
        ["LUN VEN", undefined ],
        ["1h À 2h", undefined ],
    ])("daysOfWeekInterval.exec('%s')?.[0]", (value, expected) => {
        rpaReg.daysOfWeekInterval.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfWeekInterval, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["LUN MAR", "LUN MAR"],
        ["LUN MAR MER", "LUN MAR MER"],
        ["LUN ET MAR", "LUN ET MAR"],
        ["LUN ET MAR ET MER", "LUN ET MAR ET MER"],
        ["LUN MAR ET MER", "LUN MAR ET MER"],
        ["LUN ET MAR MER", "LUN ET MAR MER"],
        ["LUN.ET VEN.", "LUN.ET VEN."],
        ["1h-2h LUN MAR", "LUN MAR"],
        ["LUN A MER", undefined],
    ])("rpaReg.daysOfWeekEnumeration.exec('%s')?.[0]", (value, expected) => {
        rpaReg.daysOfWeekEnumeration.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfWeekEnumeration, value);
        expect(result).toBe(expected);
    });
});


    
describe( "times of week", () => {
    test.each([
        ["LUN 1h-2h", "LUN 1h-2h"],
        ["LUN 1h-2h 3h-4h", "LUN 1h-2h 3h-4h"],
        ["LUN MAR 1h-2h", "LUN MAR 1h-2h"],
        ["LUN. MAR. 1h-2h", "LUN. MAR. 1h-2h"],
        ["LUN MAR 1h-2h 3h-4h", "LUN MAR 1h-2h 3h-4h"],
        ["LUN À MAR 1h-2h", "LUN À MAR 1h-2h"],
        ["LUN 1h-2h MAR 3h-4h ", "LUN 1h-2h"],
        ["MARDI - 8H à 16H30", "MARDI - 8H à 16H30"],
        ["LUN MER VEN 8H À 12H - MAR JEU 13H À 17H", "LUN MER VEN 8H À 12H"],
        ["1h-2h", undefined],
        ["LUN", undefined],
        ["1h-2h LUN", undefined],
        ["MER 17H À JEU 17H", undefined],
    ])("rpaReg.weekTimeDaysFirst.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysFirst.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysFirst, value);
        expect(result).toBe(expected);
    });


    test.each([
        ["1h-2h LUN", "1h-2h LUN"],
        ["1h-2h 3h-4h LUN", "1h-2h 3h-4h LUN"],
        ["1h-2h LUN MAR", "1h-2h LUN MAR"],
        ["1h-2h LUN. MAR.", "1h-2h LUN. MAR."],
        ["1h-2h 3h-4h LUN MAR", "1h-2h 3h-4h LUN MAR"],
        ["1h-2h LUN À MAR", "1h-2h LUN À MAR"],
        ["1h-2h LUN 3h-4h MAR", "1h-2h LUN"],
        ["8H à 16H30 - MARDI", "8H à 16H30 - MARDI"],
        ["1h-2h", undefined],
        ["LUN", undefined],
        ["LUN 1h-2h", undefined],
        ["MER 17H À JEU 17H", undefined],
    ])("rpaReg.weekTimeDaysSecond.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysSecond.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysSecond, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h LUN 3h-4h MAR", "3h-4h MAR"],
        ["1h-2h LUN, 3h-4h MAR", "3h-4h MAR"],
        ["1h-2h LUN, 3h-4h MAR. MER.", "3h-4h MAR. MER."],
        ["1h-2h LUN, 3h-4h 5h-6h MAR", "3h-4h 5h-6h MAR"],
        ["1h-2h LUN", undefined],
    ])("rpaReg.weekTimeDaysSecond.exec('%s')?.[0] second call", (value, expected) => {
        rpaReg.weekTimeDaysSecond.lastIndex = 0;
        rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysSecond, value); // first call
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysSecond, value); // second call
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h", "1h-2h"],
        ["1h-2h 3h-4h", "1h-2h 3h-4h"],
        ["LUN", undefined],
        ["LUN 1h-2h", undefined],
        ["1h-2h LUN", undefined],
        ["MER 17H À JEU 17H", undefined],
    ])("rpaReg.weekTimeDaysAbsent.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysAbsent.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysAbsent, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["LUN", "LUN"],
        ["LUN MAR", "LUN MAR"],
        ["1h-2h", undefined],
        ["LUN 1h-2h", undefined],
        ["1h-2h LUN", undefined],
        ["MER 17H À JEU 17H", undefined],
    ])("rpaReg.weekTimeDaysOnly.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysOnly.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysOnly, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["MER 17H À JEU 17H", "MER 17H À JEU 17H"],
        ["MER 17H A JEU 17H", "MER 17H A JEU 17H"],
        ["17H MER À 17H JEU", undefined],
        ["1h-2h", undefined],
        ["1h-2h LUN", undefined],
        ["1h-2h 3h-4h LUN", undefined],
        ["1h-2h LUN MAR", undefined],
        ["LUN 1h-2h", undefined],
    ])("rpaReg.weekTimeDaysOverlapDayFirst.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysOverlapDayFirst.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysOverlapDayFirst, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["17H MER À 17H JEU", "17H MER À 17H JEU"],
        ["17H MER A 17H JEU", "17H MER A 17H JEU"],
        ["MER 17H À JEU 17H", undefined],
        ["1h-2h", undefined],
        ["1h-2h LUN", undefined],
        ["1h-2h 3h-4h LUN", undefined],
        ["1h-2h LUN MAR", undefined],
        ["LUN 1h-2h", undefined],
    ])("rpaReg.weekTimeDaysOverlapDaySecond.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysOverlapDaySecond.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysOverlapDaySecond, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["MER 17H À JEU 17H", "MER 17H À JEU 17H"],
        ["17H MER À 17H JEU", "17H MER À 17H JEU"],
        ["1h-2h", undefined],
        ["1h-2h LUN", undefined],
        ["1h-2h 3h-4h LUN", undefined],
        ["1h-2h LUN MAR", undefined],
        ["LUN 1h-2h", undefined],
    ])("rpaReg.weekTimeDaysOverlap.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTimeDaysOverlap.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTimeDaysOverlap, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h", "1h-2h"],
        ["1h-2h LUN", "1h-2h LUN"],
        ["1h-2h 3h-4h LUN", "1h-2h 3h-4h LUN"],
        ["1h-2h LUN MAR", "1h-2h LUN MAR"],
        ["1h-2h LUN. MAR.", "1h-2h LUN. MAR."],
        ["1h-2h 3h-4h LUN MAR", "1h-2h 3h-4h LUN MAR"],
        ["1h-2h LUN À MAR", "1h-2h LUN À MAR"],
        ["1h-2h LUN 3h-4h MAR", "1h-2h LUN"],
        ["8H à 16H30 - MARDI", "8H à 16H30 - MARDI"],
        ["LUN 1h-2h", "LUN 1h-2h"],
        ["MER 17H À JEU 17H", "MER 17H À JEU 17H"],
        ["17H MER À 17H JEU", "17H MER À 17H JEU"],
    ])("rpaReg.weekTime.exec('%s')?.[0]", (value, expected) => {
        rpaReg.weekTime.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.weekTime, value);
        expect(result).toBe(expected);
    });
});
    
describe("months", () => {
    test.each([
        ["janvier", "janvier"],
        ["jan", "jan"],
        ["jan.", "jan."],
        ["1 janvier", "janvier"],
        ["1janvier", "janvier"],
        ["jantest", undefined ],
    ])("rpaReg.months['01'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['01'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["février", "février"],
        ["fevrier", "fevrier"],
        ["fév", "fév"],
        ["fev", "fev"],
        ["fév.", "fév."],
        ["fev.", "fev."],
        ["1 février", "février"],
        ["1février", "février"],
        ["févtest", undefined ],
    ])("rpaReg.months['02'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['02'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["mars", "mars"],
        ["mar", "mar"],
        ["mar.", "mar."],
        ["mrs.", "mrs"],
        ["mr", "mr"],
        ["1 mars", "mars"],
        ["1mars", "mars"],
        ["marsl", "marsl"],
        ["martest", undefined ],
        ["champ-de-mars", undefined ],
    ])("rpaReg.months['03'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['03'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["avril", "avril"],
        ["avr", "avr"],
        ["avr.", "avr."],
        ["1 avril", "avril"],
        ["1avril", "avril"],
        ["avil", "avil"],
        ["avrils", "avrils"],
        ["avrtest", undefined ],
    ])("rpaReg.months['04'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['04'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["mai", "mai"],
        ["1 mai", "mai"],
        ["1mai", "mai"],
        ["maitest", undefined],
    ])("rpaReg.months['05'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['05'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["juin", "juin"],
        ["1 juin", "juin"],
        ["1juin", "juin"],
        ["juintest", undefined],
    ])("rpaReg.months['06'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['06'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["juillet", "juillet"],
        ["juil", "juil"],
        ["juil.", "juil."],
        ["1 juillet", "juillet"],
        ["1juillet", "juillet"],
        ["juiltest", undefined ],
    ])("rpaReg.months['07'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['07'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["août", "août"],
        ["aout", "aout"],
        ["1 août", "août"],
        ["1août", "août"],
        ["aoûttest", undefined ],
    ])("rpaReg.months['08'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['08'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["septembre", "septembre"],
        ["sept", "sept"],
        ["sept.", "sept."],
        ["1 septembre", "septembre"],
        ["1septembre", "septembre"],
        ["septest", undefined ],
    ])("rpaReg.months['09'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['09'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["octobre", "octobre"],
        ["oct", "oct"],
        ["oct.", "oct."],
        ["1 octobre", "octobre"],
        ["1octobre", "octobre"],
        ["octtest", undefined ],
    ])("rpaReg.months['10'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['10'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["novembre", "novembre"],
        ["nov", "nov"],
        ["nov.", "nov."],
        ["1 novembre", "novembre"],
        ["1novembre", "novembre"],
        ["novtest", undefined ],
    ])("rpaReg.months['11'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['11'], value);
        expect(result).toBe(expected);
    });

    test.each([
        ["décembre", "décembre"],
        ["decembre", "decembre"],
        ["déc", "déc"],
        ["dec", "dec"],
        ["déc.", "déc."],
        ["dec.", "dec."],
        ["1 décembre", "décembre"],
        ["1décembre", "décembre"],
        ["déctest", undefined ],
    ])("rpaReg.months['12'].exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.months['12'], value);
        expect(result).toBe(expected);
    });
});

describe( "dates", () => {
    test.each([
        ["1 MARS", "1 MARS"],
        ["1ER MARS", "1ER MARS"],
        ["1 MARSL", "1 MARSL"],
        ["1 AVRILAU", "1 AVRIL"],
        ["1 DEC", "1 DEC"],
        ["9NOV", "9NOV"],
        ["15NOV", "15NOV"],
        ["AVRIL 01", undefined],
        ["MAI-JUIN", undefined],
    ])("rpaReg.dayOfMonthDayFirst.exec('%s')?.[0]", (value, expected) => {
        rpaReg.dayOfMonthDayFirst.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.dayOfMonthDayFirst, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["AVRIL 01", "AVRIL 01"],
        ["01 AVRIL AU 01 DEC", undefined],
        ["1 MARS", undefined],
    ])("rpaReg.dayOfMonthDaySecond.exec('%s')?.[0]", (value, expected) => {
        rpaReg.dayOfMonthDaySecond.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.dayOfMonthDaySecond, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["01/01", "01/01"],
        ["12/12", "12/12"],
        ["1/1", undefined],
        ["01/1", undefined],
        ["1/01", undefined],
    ])("rpaReg.dayOfMonthSlashed.exec('%s')?.[0]", (value, expected) => {
        rpaReg.dayOfMonthSlashed.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.dayOfMonthSlashed, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1 MARS 1 DEC", "1 MARS 1 DEC"],
        ["1 MARS - 1 DEC", "1 MARS - 1 DEC"],
        ["1 MARS A 1 DEC", "1 MARS A 1 DEC"],
        ["1 MARS À 1 DEC", "1 MARS À 1 DEC"],
        ["1 MARS AU 1 DEC", "1 MARS AU 1 DEC"],
        ["1 AVRIL ET 1 DEC", "1 AVRIL ET 1 DEC"], // this is in data
        ["MAI", undefined],
        ["1 MARS TEST 1 DEC", undefined],
        ["MAI-JUIN", undefined],
        ["MARS 01 A DEC 01", undefined],
        ["MARS 1 AU 1 DEC", undefined],
    ])("rpaReg.daysOfMonthIntervalDayFirst.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthIntervalDayFirst, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["MARS 1 DEC 1", "MARS 1 DEC 1"],
        ["MARS 1 - DEC 1", "MARS 1 - DEC 1"],
        ["MARS 1 A DEC 1", "MARS 1 A DEC 1"],
        ["MARS 1 À DEC 1", "MARS 1 À DEC 1"],
        ["MARS 1 AU DEC 1", "MARS 1 AU DEC 1"],
        ["MAI", undefined],
        ["MARS 1 TEST DEC 1", undefined],
        ["MAI-JUIN", undefined],
        ["1 MARS - 1 DEC", undefined],
        ["MARS 1 AU 1 DEC", undefined],
    ])("rpaReg.daysOfMonthIntervalDaySecond.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthIntervalDaySecond, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["MAI JUIN", "MAI JUIN"],
        ["MAI-JUIN", "MAI-JUIN"],
        ["MARS A DEC", "MARS A DEC"],
        ["MARS À DEC", "MARS À DEC"],
        ["MARS AU DEC", "MARS AU DEC"],
        ["1 MARS-DEC 1", "MARS-DEC"], // wrong
        ["MAI", undefined],
        ["MAI TEST JUIN", undefined],
        ["1 MARS - 1 DEC", undefined],
        ["MARS 1 AU 1 DEC", undefined],
        ["MARS 1 AU DEC 1", undefined],
    ])("rpaReg.daysOfMonthIntervalDayAbsent.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthIntervalDayAbsent, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["01/05 01/10", "01/05 01/10"],
        ["01/05-01/10", "01/05-01/10"],
        ["01/05 A 01/10", "01/05 A 01/10"],
        ["01/05 À 01/10", "01/05 À 01/10"],
        ["01/05 AU 01/10", "01/05 AU 01/10"],
        ["MAI", undefined],
        ["01/05 TEST 01/10", undefined],
        ["1 MARS - 1 DEC", undefined]      
    ])("rpaReg.daysOfMonthIntervalSlashed.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthIntervalSlashed, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["MAI JUIN", "MAI JUIN"],
        ["MAI-JUIN", "MAI-JUIN"],
        ["1 MARS - 1 DEC", "1 MARS - 1 DEC"],
        ["MARS 1 - DEC 1", "MARS 1 - DEC 1"],
        ["01/05-01/10", "01/05-01/10"],
        ["1 MARS-DEC 1", "MARS-DEC"], // wrong
        ["MAI", undefined],
        ["MARS 1 TEST 1 DEC", undefined],
        ["MARS 1 AU 1 DEC", undefined],
    ])("rpaReg.daysOfMonthInterval.exec('%s')?.[0]", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthInterval, value);
        expect(result).toBe(expected);
    });
});

describe("sameDatesTimeSpan", () => {
    test.each([
        ["\\A 08h-9h30 ET 15h-16h JOURS D`ECOLE", "08h-9h30 ET 15h-16h "],
        ["\\P RESERVE AUTOBUS TOURISTIQUES 07h-09h 01/05 AU 01/10", "07h-09h 01/05 AU 01/10"],
        ["\\P RESERVE S3R 18h-23h LUN.AU VEN., 9h-23h SAM.ET DIM.", "18h-23h LUN.AU VEN., 9h-23h SAM.ET DIM."],
        ["LUN 17H À MAR 17H - MER 17H À JEU 17H - VEN 17H À SAM 17H", "LUN 17H À MAR 17H - MER 17H À JEU 17H - VEN 17H À SAM 17H"],
        ["1h-2h 1er jan à 2 fev. 3h30 @ 4h mars 3 au avril 4", "1h-2h 1er jan à 2 fev."],
        ["9H À 17H LUN MER VEN 15 NOV AU 15 MARS, 11H À 12H MERCREDI 15 MARS AU 15 NOV", "9H À 17H LUN MER VEN 15 NOV AU 15 MARS"],
        ["1ER AVRIL - 30 NOV", "1ER AVRIL - 30 NOV"],
    ])("rpaReg.sameDatesTimeSpan.exec('%s')?.[0]", (value, expected) => {
        rpaReg.sameDatesTimeSpan.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.sameDatesTimeSpan, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["1h-2h 1er jan à 2 fev. 3h30 @ 4h mars 3 au avril 4", "3h30 @ 4h mars 3 au avril 4"],
        ["9H À 17H LUN MER VEN 15 NOV AU 15 MARS, 11H À 12H MERCREDI 15 MARS AU 15 NOV", "11H À 12H MERCREDI 15 MARS AU 15 NOV"],
    ])("rpaReg.sameDatesTimeSpan.exec('%s')  second call", (value, expected) => {
        rpaReg.sameDatesTimeSpan.lastIndex = 0;
        rpaReg.getExecFirstMatch(rpaReg.sameDatesTimeSpan, value); // first call
        const result = rpaReg.getExecFirstMatch(rpaReg.sameDatesTimeSpan, value); // second call
        expect(result).toBe(expected);
    });
})


describe("user class", () => {
    test.each([
        ["\\P RESERVE HANDICAPES 09h30-21h", true],
        ["\\P EXCEPTE HANDICAPES 10h-20h 21 JUIN AU 1 SEPT.", true],
        ["\\P 04h-05h 16h30-23h30 EXCEPTE SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS", true],
        ["P RESERVE 21h-08h VEHICULES MUNIS D'UN PERMIS S3R", true],
        ["\\P RESERVE HANDICAPES 09h30-21h", true],
        ["PANONCEAU EXCEPTE DEBARCADERE GARDERIE 15 MINUTES", true],
        ["P 2H - 9H @ 16H EXCEPTÉ MARDI", false],
        ["PANONCEAU EXCEPTE PERIODE DE LIVRAISON", false],
        ["PANONCEAU EXCEPTE  09-17h MER. 15 MARS AU 15 NOV.", false],
        ["PANONCEAU VOIE RESERVEE SEULEMENT", false],
        ["TEST", false],
    ])("hasUserClass.test(%p)", (value, expected) => {
        const result = rpaReg.hasUserClass.test(value);
        expect(result).toBe(expected);
    });

    test.each([
        [
            "\\P RESERVE HANDICAPES 09h30-21h",
            "HANDICAPES 09h30-21h"
        ],
        [
            "\\P EXCEPTE HANDICAPES 10h-20h 21 JUIN AU 1 SEPT.",
            "HANDICAPES 10h-20h 21 JUIN AU 1 SEPT."
        ],
        [
            "\\P 04h-05h 16h30-23h30 EXCEPTE SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS",
            "SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS"
        ],
        [
            "P RESERVE 21h-08h VEHICULES MUNIS D'UN PERMIS S3R",
            "VEHICULES MUNIS D'UN PERMIS S3R"
        ],
        [
            "P 2H - 9H @ 16H EXCEPTÉ MARDI",
            ""
        ],
        [
            "P RÉSERVÉ SEULEMENT DÉTENTEURS DE PERMIS #",
            "DÉTENTEURS DE PERMIS #"
        ],
        [
            "PANONCEAU EXCEPTE DEBARCADERE GARDERIE 15 MINUTES",
            "GARDERIE 15 MINUTES"
        ],
        [
            "PANONCEAU DE STATIONNEMENT (EXCEPTE VEH DE LA STM)",
            "VEH DE LA STM)",
        ],
    ])("'%s'.replace(rpaReg.userClassLeftTrimmer, '')", (value, expected) => {
        const result = value.replace(rpaReg.userClassLeftTrimmer, "");
        expect(result).toBe(expected);
    });

    test.each([
        [
            "HANDICAPES 09h30-21h",
            "HANDICAPES"
        ],
        [
            "HANDICAPES de 09h30 à 21h",
            "HANDICAPES"
        ],
        [
            "HANDICAPES 10h-20h 21 JUIN AU 1 SEPT.",
            "HANDICAPES"
        ],
        [
            "SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS",
            "SERVICES ET CANTINES COMMUNAUTAIRES AUTORISÉS"
        ],
        [
            "VEHICULES MUNIS D'UN PERMIS S3R",
            "VEHICULES MUNIS D'UN PERMIS S3R"
        ],
        [
            "AUTOBUS TOURISTIQUES 2h",
            "AUTOBUS TOURISTIQUES"
        ],
        [
            "S3R 09-23h       (2 SECTEURS)",
            "S3R"
        ],
        [
            "S3R          (EN TOUT TEMPS)",
            "S3R"
        ],
        [
            "S3R EN TOUT TEMPS",
            "S3R"
        ],
        [
            "VEH DE LA STM)",
            "VEH DE LA STM",
        ],
        [
            "",
            ""
        ]
    ])("'%s'.replace(rpaReg.userClassRightTrimmer, '')", (value, expected) => {
        const result = value.replace(rpaReg.userClassRightTrimmer, "");
        expect(result).toBe(expected);
    });
})

describe("exception time", () => {
    test.each([
        ["EXCEPTÉ MARDI", "EXCEPTÉ MARDI"],
        [
            "excepte 1h-2h 1er jan à 2 fev. 3h30 @ 4h mars 3 au avril 4",
            "excepte 1h-2h 1er jan à 2 fev. 3h30 @ 4h mars 3 au avril 4", // hopefully the data does not have anything such
        ],
        ["TEST", undefined],
    ])("rpaReg.exceptionTime.exec('%s')", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.exceptionTime, value);
        expect(result).toBe(expected);
    });
})

describe("keywords", () => {
    test.each([
        ["DÉBARCADÈRE", "DÉBARCADÈRE"],
        ["DEBARCADERE", "DEBARCADERE"],
        ["DEBAR.", "DEBAR."],
        ["DÉBAR.", "DÉBAR."],
        ["TEST", undefined],
    ])("rpaReg.debarcadere.exec('%s')", (value, expected) => {
        rpaReg.debarcadere.lastIndex = 0;
        const result = rpaReg.getExecFirstMatch(rpaReg.debarcadere, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["RÉSERVÉ", "RÉSERVÉ"],
        ["RESERVE", "RESERVE"],
        ["reser.", "reser."],
        ["réser.", "réser."],
        ["RESERVEE", undefined],
        ["TEST", undefined],
    ])("rpaReg.reservationKeyword.exec('%s')", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.reservationKeyword, value);
        expect(result).toBe(expected);
    });

    test.each([
        ["EXCEPTE", "EXCEPTE"],
        ["EXCEPTÉ", "EXCEPTÉ"],
        ["TEST", undefined],
    ])("rpaReg.exceptionKeyword.exec('%s')", (value, expected) => {
        const result = rpaReg.getExecFirstMatch(rpaReg.exceptionKeyword, value);
        expect(result).toBe(expected);
    });
})
