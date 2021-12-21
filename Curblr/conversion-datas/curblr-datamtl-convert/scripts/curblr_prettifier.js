const orderedDaysOfWeek = ["mo", "tu", "we", "th", "fr", "sa", "su"];

// Group timesOfDay by effectiveDates and daysOfWeek
// Goal is to have each day of week only once per effectiveDates
// This: [{"daysOfWeek": {"days": ["mo"]},"timesOfDay": [{"from": "00:00", "to": "03:00"}]}, {"daysOfWeek": {"days": ["mo"]}, "timesOfDay": [{"from": "23:00", "to": "04:00"}]}]
// Becomes this: [{"daysOfWeek": {"days": ["mo"]},"timesOfDay": [{"from": "00:00", "to": "03:00"}, {"from": "23:00", "to": "04:00"}]}]
function groupByDayOfWeek(messyTimeSpans) {
    if (messyTimeSpans === undefined) {
        return undefined;
    }

    const effectiveDatesMap = {}
    messyTimeSpans.forEach((timeSpan) => {
        // group by effectiveDates
        const stringifiedEffectiveDates = JSON.stringify(timeSpan.effectiveDates);
        if (!(stringifiedEffectiveDates in effectiveDatesMap)) {
            effectiveDatesMap[stringifiedEffectiveDates] = {};
        }

        // Note 'day' in 'dayOfWeekMap' is singular
        const dayOfWeekMap = effectiveDatesMap[stringifiedEffectiveDates];

        // group by daysOfWeek
        const days = (() => {
            if(timeSpan.daysOfWeek === undefined) {
                return orderedDaysOfWeek;
            }
            return timeSpan.daysOfWeek.days;
        })();
        days.forEach((day) => {
            if (!(day in dayOfWeekMap)) {
                dayOfWeekMap[day] = [];
            }
            const timesOfDayGrouped = dayOfWeekMap[day];
            if (timeSpan.timesOfDay) {
                timesOfDayGrouped.push(...timeSpan.timesOfDay);
            }
        });
    });

    // Reconstruct valid timespans
    const timeSpans = [];
    // Note 'day' in 'dayOfWeekMap' is still singular
    Object.entries(effectiveDatesMap).forEach(([stringifiedEffectiveDates, dayOfWeekMap]) => {
        // Convert back effectivesDates
        const effectiveDates = (stringifiedEffectiveDates !== "undefined") ? JSON.parse(stringifiedEffectiveDates) : undefined;
        Object.entries(dayOfWeekMap).forEach(([day, timesOfDay]) => {
            timeSpans.push({
                effectiveDates, 
                "daysOfWeek": {"days": [day]}, 
                "timesOfDay": timesOfDay.length != 0 ? timesOfDay : undefined
            });
        });
    });

    return timeSpans;
}

// Group daysOfWeek by effectiveDates and timesOfDay
// Goal is to have identical timesOfDay under the same daysOfWeek
// This: [{"daysOfWeek": {"days": ["mo"]},"timesOfDay": [{"from": "00:00", "to": "03:00"}]}, {"daysOfWeek": {"days": ["tu"]}, "timesOfDay": [{"from": "00:00", "to": "03:00"}]}]
// Becomes this: [{"daysOfWeek": {"days": ["mo", "tu"]},"timesOfDay": [{"from": "00:00", "to": "03:00"}]}]
function groupByTimesOfDay(messyTimeSpans) {
    if (messyTimeSpans === undefined) {
        return undefined;
    }
    const effectiveDatesMap = {};

    messyTimeSpans.forEach((timeSpan) => {
        // group by effectiveDates
        const stringifiedEffectiveDates = JSON.stringify(timeSpan.effectiveDates);
        if (!(stringifiedEffectiveDates in effectiveDatesMap)) {
            effectiveDatesMap[stringifiedEffectiveDates] = {};
        }

        const timesOfDayMap = effectiveDatesMap[stringifiedEffectiveDates];
        const stringifiedTimesOfDay = JSON.stringify(timeSpan.timesOfDay);
        
        const days = (() => {
            if(timeSpan.daysOfWeek === undefined) {
                return orderedDaysOfWeek;
            }
            return timeSpan.daysOfWeek.days;
        })();

        if (!(stringifiedTimesOfDay in timesOfDayMap)) {
            timesOfDayMap[stringifiedTimesOfDay] = [];
        }
        const daysGrouped = timesOfDayMap[stringifiedTimesOfDay];
        daysGrouped.push(...days);
    });

    // Build back clean effective dates
    const timeSpans = [];
    Object.entries(effectiveDatesMap).forEach(([stringifiedEffectiveDates, timesOfDayMap]) => {
        const effectiveDates = (stringifiedEffectiveDates !== "undefined") ? JSON.parse(stringifiedEffectiveDates) : undefined;
        Object.entries(timesOfDayMap).forEach(([stringifiedTimesOfDay, days]) => {
            const timesOfDay = JSON.parse(stringifiedTimesOfDay);
            timeSpans.push({effectiveDates, "daysOfWeek": {"days": days}, timesOfDay});
        });
    });
    return timeSpans;
}

function stringifyComparator(a, b) {
    const stringifiedA = JSON.stringify(a);
    const stringifiedB = JSON.stringify(b);
    if (stringifiedA > stringifiedB ) {
        return 1;
    }
    if (stringifiedA < stringifiedB ) {
        return -1;
    }
    return 0;
}

function sortEffectiveDates(effectiveDates) {
    if (effectiveDates == undefined || effectiveDates.length == 0) {
        return undefined;
    }
    return effectiveDates.sort(stringifyComparator);
}

function sortDaysOfWeek(daysOfWeek) {
    if (daysOfWeek === undefined) {
        return undefined;
    }
    const daysNoDuplicates = [...new Set(daysOfWeek.days)];
    if (daysNoDuplicates.length == 7) {
        // Everyday of week. No need to specify days;
        return undefined;
    }
    const sortedDays = daysNoDuplicates.sort((a, b) => {
        const indexA = orderedDaysOfWeek.indexOf(a);
        const indexB = orderedDaysOfWeek.indexOf(b);
        if (indexA > indexB ) {
            return 1;
        }
        if (indexA < indexB ) {
            return -1;
        }
        return 0;
    })

    return {"days": sortedDays};
}

function sortTimesOfDay(timesOfDay) {
    if (timesOfDay == undefined || timesOfDay.length == 0) {
        return undefined;
    }
    return timesOfDay.sort(stringifyComparator);
}

function sortTimeSpans(timeSpans) {
    if (timeSpans === undefined) {
        return undefined;
    }
    return timeSpans.sort((a, b) => {
        // Sort by effectiveDates
        if (a.effectiveDates && b.effectiveDates === undefined) {
            return 1;
        }
        if (a.effectiveDates === undefined && b.effectiveDates) {
            return -1;
        }

        const stringifiedEffectiveDatesA = JSON.stringify(a.effectiveDates);
        const stringifiedEffectiveDatesB = JSON.stringify(b.effectiveDates);
        if (stringifiedEffectiveDatesA > stringifiedEffectiveDatesB) {
            return 1;
        }
        if (stringifiedEffectiveDatesA < stringifiedEffectiveDatesB) {
            return -1;
        }

        // Sort by days
        // undefined before list of days
        if (a.daysOfWeek && b.daysOfWeek === undefined) {
            return 1;
        }
        if (a.daysOfWeek === undefined && b.daysOfWeek) {
            return -1;
        }

        if (a.daysOfWeek && b.daysOfWeek) {
            const daysA = a.daysOfWeek.days;
            const daysB = b.daysOfWeek.days
            const minNbDays = Math.min(daysA.length, daysB.length);

            for (let i = 0; i < minNbDays; i++) {
                const indexA = orderedDaysOfWeek.indexOf(daysA[i]);
                const indexB = orderedDaysOfWeek.indexOf(daysB[i]);
                if (indexA > indexB ) {
                    return 1;
                }
                if (indexA < indexB ) {
                    return -1;
                }
            }
            // For now, both daysOfWeek have been identical
            // Lets order by their length
            if (daysA.length > daysB.length) {
                console.log("ici1")
                return 1;
            }
            if (daysA.length < daysB.length) {
                console.log("ici2")
                return -1;
            }
            console.log("ici3")
            return 0;
        }
        console.log("ici4")
        // daysOfWeek are both undefined
        const stringifiedTimesOfDayA = JSON.stringify(a.timesOfDay);
        const stringifiedTimesOfDayB = JSON.stringify(b.timesOfDay);
        if (stringifiedTimesOfDayA > stringifiedTimesOfDayB ) {
            return 1;
        }
        if (stringifiedTimesOfDayA < stringifiedTimesOfDayB ) {
            return -1;
        }

        console.warn("sortTimeSpans: TimeSpans seems to be identical", timeSpans);
        return 0;
    });
}

function cleanTimeSpans(messyTimeSpans) {
    if (messyTimeSpans === undefined) {
        return undefined;
    }
    const groupedByDayOfWeekTimeSpans = groupByDayOfWeek(messyTimeSpans);
    const groupedTimeSpans = groupByTimesOfDay(groupedByDayOfWeekTimeSpans);
    const internalyOrderedTimeSpans = []; // the content is ordered
    groupedTimeSpans.forEach((timeSpan) => {
        internalyOrderedTimeSpans.push({
            "effectiveDates": sortEffectiveDates(timeSpan.effectiveDates),
            "daysOfWeek": sortDaysOfWeek(timeSpan.daysOfWeek),
            "timesOfDay": sortTimesOfDay(timeSpan.timesOfDay)
        })
    })

    return sortTimeSpans(internalyOrderedTimeSpans);
}

module.exports = {
    groupByDayOfWeek,
    groupByTimesOfDay,
    sortEffectiveDates,
    sortDaysOfWeek,
    sortTimesOfDay,
    sortTimeSpans,
    cleanTimeSpans,
}
