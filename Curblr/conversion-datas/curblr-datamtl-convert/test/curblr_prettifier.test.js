const curblrPrettifier = require("../scripts/curblr_prettifier");

describe("groupByDayOfWeek", () => {
    test.each([
        [ // Both undefined
            undefined, // input
            undefined  // result
        ],
        [ // two days with same timesOfDay
            [ // input
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}]
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                    "timesOfDay": [{"from": "23:00", "to": "04:00"}]
                },
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}, {"from": "23:00", "to": "04:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}, {"from": "23:00", "to": "04:00"}]
                }
            ]
        ],
        [ // effectiveDates and timesOfDay undefined
            [ // input
                {
                    "daysOfWeek": {"days": ["mo"]},
                },
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": undefined
                }
            ]
        ],
        [ // different effectiveDates but same daysOfWeek and timesOfDay
            [ // input
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}]
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "23:00", "to": "04:00"}]
                },
            ],
            [ // result
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}]
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "23:00", "to": "04:00"}]
                },
            ],
        ],
        [ // undefined days of week
            [ // input
                {
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["we"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["th"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["fr"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["sa"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["su"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
            ],
        ],
        [ // One undefined timesOfDay makes it undefined for the whole day. (undefined first)
            [ // input
                {
                    "daysOfWeek": {"days": ["mo"]},
                },
                {
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}]
                }
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": undefined,
                }
            ],
        ],
        [ // One undefined timesOfDay makes it undefined for the whole day. (undefined second)
            [ // input
                {
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "03:00"}]
                },
                {
                    "daysOfWeek": {"days": ["mo"]},
                },
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": undefined,
                }
            ],
        ],
    ])("groupByDayOfWeek(%p)", (input, expected) => {
        const result = curblrPrettifier.groupByDayOfWeek(input);
        expect(result).toStrictEqual(expected);
    });
});

describe("sortTimeSpansByDaysOfWeek", () => {
    test.each([
        [
            undefined, // input
            undefined, // result
        ],
        [
            [
                {"daysOfWeek": {"days": ["sa"]}},
                {"daysOfWeek": {"days": ["mo"]}},
                {"daysOfWeek": {"days": ["we"]}},
                {"daysOfWeek": {"days": ["su"]}},
                {"daysOfWeek": {"days": ["tu"]}},
                {"daysOfWeek": {"days": ["th"]}},
                {"daysOfWeek": {"days": ["fr"]}},
            ],
            [
                {"daysOfWeek": {"days": ["mo"]}},
                {"daysOfWeek": {"days": ["tu"]}},
                {"daysOfWeek": {"days": ["we"]}},
                {"daysOfWeek": {"days": ["th"]}},
                {"daysOfWeek": {"days": ["fr"]}},
                {"daysOfWeek": {"days": ["sa"]}},
                {"daysOfWeek": {"days": ["su"]}},
            ],
        ]
    ])("sortTimeSpansByDaysOfWeek(%p)", (value, expected) => {
        const result = curblrPrettifier.sortTimeSpansByDaysOfWeek(value);
        expect(result).toStrictEqual(expected);
    });
});

describe("groupByTimeOfDay", () => {
    test.each([
        [
            undefined, // input
            undefined  // result
        ],
        [
            [ // input
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["we"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                }
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo", "we"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                }
            ]
        ],
        [ // "mo" and "we" should not be merged since there is "tu" in the middle
            [ // input
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["we"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "02:00", "to": "03:00"}]
                }
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "02:00", "to": "03:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["we"]},
                    "timesOfDay": [{"from": "00:00", "to": "01:00"}]
                }
            ]
        ],
    ])("groupByTimesOfDay(%p)", (dirtyTimeSpans, expected) => {
        const result = curblrPrettifier.groupByTimesOfDay(dirtyTimeSpans);
        expect(result).toStrictEqual(expected);
    });
});

describe("sortEffectiveDates", () => {
    test.each([
        [
            undefined, // input
            undefined  // result
        ],
        [
            [{"from": "01-01","to": "02-01"}, {"from": "03-01","to": "04-01"}], // input
            [{"from": "01-01","to": "02-01"}, {"from": "03-01","to": "04-01"}], // result
        ],
        [
            [{"from": "03-01","to": "04-01"}, {"from": "01-01","to": "02-01"}], // input
            [{"from": "01-01","to": "02-01"}, {"from": "03-01","to": "04-01"}], // result
        ]
    ])("sortEffectiveDates(%p)", (list, expected) => {
        const result = curblrPrettifier.sortEffectiveDates(list);
        expect(result).toStrictEqual(expected);
    });
});

describe("cleanDaysOfWeek", () => {
    test.each([
        [
            undefined, // input
            undefined, // result
        ],
        [ // nothing to do
            {"days": ["mo", "tu"]}, // input
            {"days": ["mo", "tu"]}, // result
        ],
        [ // duplicates
            {"days": ["mo", "mo", "tu"]}, // input
            {"days": ["mo", "tu"]}, // result
        ],
        [ // full week
            {"days": ["mo", "tu", "we", "th", "fr", "sa", "su"]}, // input
            undefined // result
        ],
    ])("cleanDaysOfWeek(%p)", (value, expected) => {
        const result = curblrPrettifier.cleanDaysOfWeek(value);
        expect(result).toStrictEqual(expected);
    });
});

describe("sortTimesOfDay", () => {
    test.each([
        [
            undefined, // input
            undefined, // result
        ],
        [
            [{"from": "00:00", "to": "03:00"}, {"from": "01:00", "to": "03:00"}], // input
            [{"from": "00:00", "to": "03:00"}, {"from": "01:00", "to": "03:00"}], // result
        ],
        [
            [{"from": "01:00", "to": "03:00"}, {"from": "00:00", "to": "03:00"}], // input
            [{"from": "00:00", "to": "03:00"}, {"from": "01:00", "to": "03:00"}], // result
        ],
    ])("sortTimesOfDay(%p)", (list, expected) => {
        const result = curblrPrettifier.sortTimesOfDay(list);
        expect(result).toStrictEqual(expected);
    });
});

describe("sortTimeSpans", () => {
    test.each([
        [ // Both undefined
            undefined, // input
            undefined, // result
        ],
        [ // Only effective dates
            [ // input
                {
                    "effectiveDates": [{"from": "02-01","to": "03-01"}],
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                },
            ],
            [ // result
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                },
                {
                    "effectiveDates": [{"from": "02-01","to": "03-01"}],
                },
            ],
        ],
        [ // One missing effectiveDates
            [ // input
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                },
                {
                    "effectiveDates": undefined
                }
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                },
            ],
        ],
        [ // First daysOfWeek undefined
            [ // input
                {
                    "daysOfWeek": undefined,
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
            [ // result
                {
                    "daysOfWeek": undefined,
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
        ],
        [ // Second daysOfWeek undefined
            [ // input
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                },
                {
                    "daysOfWeek": undefined,
                },
            ],
            [ // result
                {
                    "daysOfWeek": undefined,
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
        ],
        [ // Basic daysOfWeek comparison
            [ // input
                {
                    "daysOfWeek": {"days": ["tu", "we"]},
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
            [ // result
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                },
                {
                    "daysOfWeek": {"days": ["tu", "we"]},
                }
            ],
        ],
        [ // daysOfWeek are almost identical, but one has more days
            [ // input
                {
                    "daysOfWeek": {"days": ["mo", "tu", "we"]},
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
            [ // result
                {
                    "daysOfWeek": {"days": ["mo", "tu"]},
                },
                {
                    "daysOfWeek": {"days": ["mo", "tu", "we"]},
                }
            ],
        ],
        [ // Basic timesOfDay comparison
            [ // input
                {
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                },
                {
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                }
            ],
            [ // result
                {
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                },
                {
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                }
            ],
        ],
        [ // effectiveDates have priority over timesOfDay
            [ // input
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                }
            ],
            [ // result
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                }
            ],
        ],
        [ // effectiveDates have priority over daysOfWeek
            [ // input
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["we", "th"]},
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
            [ // result
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["we", "th"]},
                },
                {
                    "effectiveDates": [{"from": "03-01","to": "04-01"}],
                    "daysOfWeek": {"days": ["mo", "tu"]},
                }
            ],
        ],
        [ // daysOfWeek have priority over timesOfDay
            [ // input
                {
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                },
                {
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "01:00","to": "02:00"}]
                }
            ],
            [ // result
                {
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "01:00","to": "02:00"}]
                },
                {
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                }
            ],
        ],
    ])("sortTimeSpans(%p)", (list, expected) => {
        const result = curblrPrettifier.sortTimeSpans(list);
        expect(result).toStrictEqual(expected);
    });
});

describe("cleanTimeSpans", () => {
    test.each([
        [ // messy timeSpans
            [ // input
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["fr"]},
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": undefined,
                    "timesOfDay": [{"from": "04:00","to": "05:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["mo", "we"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "02:00","to": "03:00"}]
                },
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["th"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                }
            ],
            [ // result
                {
                    "effectiveDates": undefined,
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["mo"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}, {"from": "02:00","to": "03:00"}, {"from": "04:00","to": "05:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["tu"]},
                    "timesOfDay": [{"from": "04:00","to": "05:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["we", "th"]},
                    "timesOfDay": [{"from": "00:00","to": "01:00"}, {"from": "04:00","to": "05:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["fr"]},
                    "timesOfDay": [{"from": "02:00","to": "03:00"}, {"from": "04:00","to": "05:00"}]
                },
                {
                    "effectiveDates": [{"from": "01-01","to": "02-01"}],
                    "daysOfWeek": {"days": ["sa", "su"]},
                    "timesOfDay": [{"from": "04:00","to": "05:00"}]
                },
            ]
        ]
    ])("cleanTimeSpans(%p)", (list, expected) => {
        const result = curblrPrettifier.cleanTimeSpans(list);
        expect(result).toStrictEqual(expected);
    });
})