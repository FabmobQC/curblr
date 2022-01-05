const jsonHelper = require("./json_helper")
const rpaReg = require("./rpa_regexes")
const curblrPrettifier = require("./curblr_prettifier");

const irrelevantExpressions = [
    "COLLECTE DES ORDURES",
    "DECHETS INTERDITS",
    "HEURES D'OUVERTURE",
    "PASSAGE INTERDIT",
    "RUELLE FERMEE",
    "TOUR EN FIACRE",
    "VOIE",
];

function containsIrrelevantExpression(description) {
    return irrelevantExpressions.some( expression => description.includes(expression));
}

function getActivity(description, timeSpans, maxStay) {
    // if there is an explicit indication about the activity:
    if (description.includes("\\P ") || description.startsWith("/P ") || description.startsWith("STAT. INT. ") || description.startsWith("INTERDICTION DE STAT. ")) {
        return 'no parking';
    } else if (description.includes("\\A ") || description.startsWith("A ")) {
        return 'no standing';
    } else if (description.startsWith("P ")) {
        return'parking';
    } else if (description.startsWith("PANONCEAU ") || description.startsWith("PANNONCEAU")) {
        // Panonceaux modify an other sign.
        // Therefore they do not have an activity of their own, but they nevertheless have the activity of the sign they modify.
        return "panonceau";
    }

    if (maxStay) {
        // We assume descriptions containing maxStay are parking
        // This might be a wrong assumption
        return 'parking';
    }
    
    if (timeSpans && !maxStay) {
        // We assume descriptions containing timespan without further indications are no parking
        // This might be a wrong assumption
        return 'no parking';
    }

    // If nothing else has been found but there is a variation of the work "DÉBARCADÈRE"
    if (rpaReg.debarcadere.test(description)) { 
        // Some rules have loading with an other activity (ex: "\\P 15h30 - 18h LUN À VEN EXCEPTE DEBARCADERE")
        // We're not sure what to do in that situation. For now, we assume such a rule is NOT 'loading'
        return 'loading';
    }

    return 'irrelevant';
}

function getMaxStay(description) {
    const maxStayDescription = rpaReg.getExecFirstMatch(rpaReg.maxStay, description);
    if (!maxStayDescription) {
        return undefined;
    }
    const digits = rpaReg.getExecFirstMatch(/\d*/, maxStayDescription);
    const digitsInt = parseInt(digits);
    if (maxStayDescription.slice(-1).toUpperCase() == "H") {
        return digitsInt*60;
    }
    else { // assume this is "min"
        return digitsInt;
    }
}

function extractFirstTwoDigitsNumber(string) {
    const number = rpaReg.getExecFirstMatch(/\d{1,2}/, string);
    return number? number.padStart(2,'0') : undefined;
}

// Extract a month from a string. Not sure which one when more than two
function extractMonth(string) {
    const entry = Object.entries(rpaReg.months).find( ([monthNumber, regex]) => {
        if (regex.test(string)) {
            return true;
        }
    });
    return entry? entry[0] : undefined;
}

// Get effective dates for dates which the day is before the month
// ex: 1 MARS AU 1 DEC
function getEffectiveDatesFromDayFirstSyntax(dayOfMonthInterval) {
    rpaReg.dayOfMonthDayFirst.lastIndex = 0;
    const from = rpaReg.dayOfMonthDayFirst.exec(dayOfMonthInterval)[0];
    const to = rpaReg.dayOfMonthDayFirst.exec(dayOfMonthInterval)[0];
    const fromDay = extractFirstTwoDigitsNumber(from);
    const fromMonth = extractMonth(from);
    const toDay = extractFirstTwoDigitsNumber(to);
    const toMonth = extractMonth(to);
    return [{
        "from": `${fromMonth}-${fromDay}`,
        "to": `${toMonth}-${toDay}`
    }];
}

// Get effective dates for dates which the day is after the month
// ex: MARS 1 AU DEC 1
function getEffectiveDatesFromDaySecondSyntax(dayOfMonthInterval) {
    rpaReg.dayOfMonthDaySecond.lastIndex = 0;
    const from = rpaReg.dayOfMonthDaySecond.exec(dayOfMonthInterval)[0];
    const to = rpaReg.dayOfMonthDaySecond.exec(dayOfMonthInterval)[0];
    const fromDay = extractFirstTwoDigitsNumber(from);
    const fromMonth = extractMonth(from);
    const toDay = extractFirstTwoDigitsNumber(to);
    const toMonth = extractMonth(to);
    return [{
        "from": `${fromMonth}-${fromDay}`,
        "to": `${toMonth}-${toDay}`
    }];
}

// Get effective dates for dates which the day is absent
// ex: MARS - DEC 
function getEffectiveDatesFromDayAbsentSyntax(dayOfMonthInterval) {
    rpaReg.anyMonth.lastIndex = 0;
    const from = rpaReg.anyMonth.exec(dayOfMonthInterval)[0];
    const to = rpaReg.anyMonth.exec(dayOfMonthInterval)[0];
    const fromMonth = extractMonth(from);
    const toMonth = extractMonth(to);

    const toDay = (() => {
        if (["04", "06", "09", "01"].includes(toMonth)) {
            return "30";
        }
        else if (toMonth == "02") {
            return "28";
        }
        else {
            return "31";
        }
    })();

    return [{
        "from": `${fromMonth}-01`,
        "to": `${toMonth}-${toDay}`
    }];
}

// Get effective dates for dates which the day and month are numbers separated with a slash
// ex: 01/03 - 01/11
function getEffectiveDatesFromSlashedSyntax(dayOfMonthInterval) {
    rpaReg.dayOfMonthSlashed.lastIndex = 0;
    const from = rpaReg.dayOfMonthSlashed.exec(dayOfMonthInterval)[0];
    const to = rpaReg.dayOfMonthSlashed.exec(dayOfMonthInterval)[0];
    const fromDay = from.slice(0, 2);
    const fromMonth = from.slice(3, 5);
    const toDay = to.slice(0, 2);
    const toMonth = to.slice(3, 5);
    return [{
        "from": `${fromMonth}-${fromDay}`,
        "to": `${toMonth}-${toDay}`
    }];
}

function getEffectiveDates(description) {
    const daysOfMonthInterval = rpaReg.getExecFirstMatch(rpaReg.daysOfMonthInterval, description);

    if (!daysOfMonthInterval) {
        return undefined;
    }

    if (rpaReg.daysOfMonthIntervalDayFirst.test(daysOfMonthInterval)) {
        return getEffectiveDatesFromDayFirstSyntax(daysOfMonthInterval);
    }
    if (rpaReg.daysOfMonthIntervalDaySecond.test(daysOfMonthInterval)) {
        return getEffectiveDatesFromDaySecondSyntax(daysOfMonthInterval);
    }
    if (rpaReg.daysOfMonthIntervalDayAbsent.test(daysOfMonthInterval)) {
        return getEffectiveDatesFromDayAbsentSyntax(daysOfMonthInterval);
    }
    if (rpaReg.daysOfMonthIntervalSlashed.test(daysOfMonthInterval)) {
        return getEffectiveDatesFromSlashedSyntax(daysOfMonthInterval);
    }
}

function extractDayOfWeek(string) {
    const entry = Object.entries(rpaReg.daysOfWeek).find( ([dayAbbreviation, regex]) => {
        if (regex.test(string)) {
            return true;
        }
    });
    return entry? entry[0] : undefined;
}

// Get an interval of days. Days separated with "A", "À", "AU",
// ex: "LUN A MAR"
const orderedDays = ["mo", "tu", "we", "th", "fr", "sa", "su", "mo", "tu", "we", "th", "fr", "sa"];
function getDaysOfWeekFromInterval(weekTimeDescription) {
    rpaReg.anyDayOfWeek.lastIndex = 0;
    const startDayDescription = rpaReg.getExecFirstMatch(rpaReg.anyDayOfWeek, weekTimeDescription);
    const endDayDescription = rpaReg.getExecFirstMatch(rpaReg.anyDayOfWeek, weekTimeDescription);
    const startDay = extractDayOfWeek(startDayDescription);
    const endDay = extractDayOfWeek(endDayDescription);
    const startDayIndex = orderedDays.indexOf(startDay);
    const endDayIndex = orderedDays.indexOf(endDay, startDayIndex);
    const days = orderedDays.slice(startDayIndex, endDayIndex + 1);
    return (days.length != 0) ? {days} : undefined;
}

// Get an enumeration of days. Days separated with spaces or "ET"
// ex: "LUN MAR JEU", "LUN ET MAR ET JEU"
function getDaysOfWeekFromEnumeration(weekTimeDescription) {
    const days = [];
    let dayDescription;
    rpaReg.anyDayOfWeek.lastIndex = 0;
    while (dayDescription = rpaReg.getExecFirstMatch(rpaReg.anyDayOfWeek, weekTimeDescription)) {
        const day = extractDayOfWeek(dayDescription);
        days.push(day)
    }
    return (days.length != 0) ? {days} : undefined;
}

function getDaysOfWeek(weekTimeDescription) {
    let days;
    rpaReg.daysOfWeekInterval.lastIndex = 0;
    rpaReg.daysOfWeekEnumeration.lastIndex = 0;
    if (rpaReg.daysOfWeekInterval.test(weekTimeDescription)) {
        return getDaysOfWeekFromInterval(weekTimeDescription)
    }
    if (rpaReg.daysOfWeekEnumeration.test(weekTimeDescription)) {
        return getDaysOfWeekFromEnumeration(weekTimeDescription);
    }
}

function convertHtime(time) {
    let [h,m] = time.toUpperCase().split("H");
    if (!m) {
        m = "00"
    }
    return `${h.padStart(2,'0')}:${m}`
}

function getTimeOfDayFromUsualSyntax(timeOfDayDescription) {
    rpaReg.time.lastIndex = 0;
    const startTime = rpaReg.getExecFirstMatch(rpaReg.time, timeOfDayDescription);
    const endTime = rpaReg.getExecFirstMatch(rpaReg.time, timeOfDayDescription);
    if (startTime && endTime) {
        return {
            from: convertHtime(startTime),
            to: convertHtime(endTime)
        };
    }
    return undefined;
}

function getTimeOfDayFromSpecialSyntax(timeOfDayDescription) {
    const matches = [...timeOfDayDescription.matchAll(/\d{1,2}/g)]; // match one or two digits
    const startTime = matches[0][0];
    const endTime = matches[1][0];
    return {
        from: `${startTime.padStart(2,'0')}:00`,
        to: `${endTime.padStart(2,'0')}:00`
    };
}

function getTimeOfDay(timeOfDayDescription) {
    if (rpaReg.specialTimeInterval.test(timeOfDayDescription)) {
        return getTimeOfDayFromSpecialSyntax(timeOfDayDescription);
    }
    return getTimeOfDayFromUsualSyntax(timeOfDayDescription);
}

function getTimesOfDay(description) {
    const timesOfDay = [];
    let timeOfDayDescription;
    rpaReg.timeInterval.lastIndex = 0;
    while (timeOfDayDescription = rpaReg.getExecFirstMatch(rpaReg.timeInterval, description)) {
        const timeOfDay = getTimeOfDay(timeOfDayDescription)
        timesOfDay.push(timeOfDay)
    }
    return (timesOfDay.length != 0) ? timesOfDay : undefined;
}


// Get a list of timespans from the syntax where the time overlaps multiple days.
// ex: LUN 17H À MAR 17H
function getTimeSpansFromDaysOverlapSyntax(description, effectiveDates) {
    rpaReg.time.lastIndex = 0;
    const startTimeDescription = rpaReg.getExecFirstMatch(rpaReg.time, description);
    const startTime = convertHtime(startTimeDescription);
    const endTimeDescription = rpaReg.getExecFirstMatch(rpaReg.time, description);
    const endTime = convertHtime(endTimeDescription);
    const days = getDaysOfWeekFromInterval(description)["days"];

    const timeSpans = [];
    // start timeSpan
    timeSpans.push({
        "effectiveDates": effectiveDates,
        "daysOfWeek": {"days": [days[0]]},
        "timesOfDay": [{"from": startTime, "to": "24:00"}]
    });

    // middle timeSpans
    if (days.length > 2) {
        timeSpans.push({
            "effectiveDates": effectiveDates,
            "daysOfWeek": {"days": days.slice(1, days.length-1)},
            "timesOfDay": undefined // equivalent to [{"from": "00:00", "to": "24:00"}]
        });
    }

    // end timeSpan
    timeSpans.push({
        "effectiveDates": effectiveDates,
        "daysOfWeek": {"days": [days[days.length-1]]},
        "timesOfDay": [{"from": "00:00", "to": endTime}]
    });

    return timeSpans
}

function checkTimeOrderNeedsAdjustment(timesOfDay) {
    let needAdjustment = false;

    timesOfDay.forEach((timeOfDay) => {
        // Check if 'from' is earlier than 'to'
        if (timeOfDay.from < timeOfDay.to) {
            // It is not. No adjustment required.
            return;
        }

        if (timeOfDay.to == "00:00") {
            // Last time of day is represented by "24:00" in Curblr
            // Lets fix this silently and forget about it
            timeOfDay.to == "24:00";
            return;
        }

        // 'from' is after 'to' and we could not fix it easily
        needAdjustment = true;
    });

    return needAdjustment
}

// Adjust timeSpans for which the "from" time is earlier than the "to" time.
// Case for which no specific day is indicated
// Please don't hesitate to rename this
function getTimeSpansWithAdjustedTimeOfDayOrderNoSpecificDay(provisionalTimeSpan) {
    const provisionalTimesOfDay = provisionalTimeSpan.timesOfDay;
    // Same rule for every day of the week
    const timeSpan = {
        "effectiveDates": provisionalTimeSpan.effectiveDates,
        "daysOfWeek": undefined,
        timesOfDay: [
            {
                "from": provisionalTimesOfDay[0].from,
                "to": "24:00"
            },
            {
                "from": "00:00",
                "to": provisionalTimesOfDay[0].to
            }
        ]
    };
    return [timeSpan];
}

// Adjust timeSpans for which the "from" time is earlier than the "to" time.
// Case for which specific days have been indicated
// Please don't hesitate to rename this
function getTimeSpansWithAdjustedTimeOfDayOrderForSpecificDays(provisionalTimeSpan) {
    const timesOfDayForDay = { "mo": [], "tu": [], "we": [], "th": [], "fr": [], "sa": [], "su": [] };
    const effectiveDates = provisionalTimeSpan.effectiveDates;
    const provisionalDaysOfWeek = provisionalTimeSpan.daysOfWeek;
    const firstTime = provisionalTimeSpan.timesOfDay[0].from;
    const secondTime = provisionalTimeSpan.timesOfDay[0].to;

    // The time interval overlap on the next day.
    // ex: "LUNDI 23h-1H" is in fact "LUNDI 23H-24H, MARDI 0H-1H"
    provisionalDaysOfWeek.days.forEach((currentDay) => {
        const dayIndex = orderedDays.indexOf(currentDay);
        const nextDay = orderedDays[dayIndex+1];
        const currentDayTimesOfDay = timesOfDayForDay[currentDay];
        const nextDayTimesOfDay = timesOfDayForDay[nextDay];
        currentDayTimesOfDay.push({
            "from": firstTime,
            "to": "24:00"
        });
        nextDayTimesOfDay.push({
            "from": "00:00",
            "to": secondTime
        });
    })

    const timeSpans = [];
    Object.entries(timesOfDayForDay).forEach(([dayOfWeek, timesOfDay]) => {
        if (timesOfDay.length == 0) {
            // Discard days with no timesOfDay
            return;
        }
        timeSpans.push({effectiveDates, "daysOfWeek": {"days": [dayOfWeek]}, timesOfDay});
    });
    return timeSpans;
}

// Verify timesOfDay has a "from" earlier than "to", and adjust the timeSpan if it is not the case.
// Ex: "23H-1H" become "23H-24H ET 0H-1H"
function adjustTimesOfDayOrder(provisionalTimeSpan, description) {
    const provisionalTimesOfDay = provisionalTimeSpan.timesOfDay;
    if (provisionalTimesOfDay === undefined || provisionalTimesOfDay.length == 0) {
        // No times of day. Nothing to do.
        return [provisionalTimeSpan];
    }

    if(!checkTimeOrderNeedsAdjustment(provisionalTimesOfDay)) {
        // Don't need adjustement. Nothing to do.
        return [provisionalTimeSpan];
    }

    if (provisionalTimesOfDay.length > 1) {
        // The rule probably looks like "11h-12h, 23h-1h, mardi à vendredi"
        // This is not handled for simplicity, and we hope no such rule will be added
        console.warn(
            "adjustTimesOfDayOrder: More than one timeOfDay, and one has 'from' earlier than 'to'. Please handle this case (sorry): ",
            description
        );
        return [provisionalTimeSpan];
    }

    const provisionalDaysOfWeek = provisionalTimeSpan.daysOfWeek;
    if (provisionalDaysOfWeek === undefined || provisionalDaysOfWeek.days.length == 0) {
        return getTimeSpansWithAdjustedTimeOfDayOrderNoSpecificDay(provisionalTimeSpan);
    }

    return getTimeSpansWithAdjustedTimeOfDayOrderForSpecificDays(provisionalTimeSpan)
}

// Return timespans for all syntaxes except the one handled by getTimeSpansFromDaysOverlapSyntax
// ex: "1H-2H", "LUN À VEN", "LUN ET VEN", "LUN 1H-2H", "1H-2H LUN"
function getTimeSpansFromUsualSyntax(description, effectiveDates) {
    const provisionalTimeSpan = {
        effectiveDates,
        "daysOfWeek": getDaysOfWeek(description),
        "timesOfDay": getTimesOfDay(description)
    }
    
    return adjustTimesOfDayOrder(provisionalTimeSpan, description);
}

function getTimeSpans(description) {
    const timeSpans = [];

    let sameDatesTimeSpanDescription;
    rpaReg.sameDatesTimeSpan.lastIndex = 0;
    while (sameDatesTimeSpanDescription = rpaReg.getExecFirstMatch(rpaReg.sameDatesTimeSpan, description)) {
        const effectiveDates = getEffectiveDates(sameDatesTimeSpanDescription);
        let timeSpanAdded = false;
        let timeSpanDescription;
        rpaReg.weekTime.lastIndex = 0;
        while (timeSpanDescription = rpaReg.getExecFirstMatch(rpaReg.weekTime, sameDatesTimeSpanDescription)) {
            rpaReg.weekTimeDaysOverlap.lastIndex = 0;
            if (rpaReg.weekTimeDaysOverlap.exec(timeSpanDescription)) {
                // special syntax
                const daysOverlapTimespans = getTimeSpansFromDaysOverlapSyntax(timeSpanDescription, effectiveDates);
                timeSpans.push(...daysOverlapTimespans);
            }
            else {
                // All the other syntaxes can be handled the same way
                const newTimeSpans = getTimeSpansFromUsualSyntax(timeSpanDescription, effectiveDates);
                timeSpans.push(...newTimeSpans);
            }
            timeSpanAdded = true;
        }

        if (!timeSpanAdded) {
            // effectiveDates alone, without daysOfWeek or timesOfDay
            timeSpans.push({"effectiveDates": effectiveDates});
        }
    }
    const cleanedTimeSpans = curblrPrettifier.cleanTimeSpans(timeSpans);
    
    return (cleanedTimeSpans.length != 0) ? cleanedTimeSpans : undefined;
}

function getPriorityCategory(activity, userClasses) {

    if (activity === undefined) {
        return undefined;
    }

    if (userClasses) {
        return `${activity} - userClasses`;
    }

    if (activity == "parking") {
        return "free parking";
    }

    return activity;
}

function getRule(activity, maxStay, userClasses) {

    if (activity === "panonceau") {
        // keeping rule clean
        activity = undefined;
    }

    if (activity === undefined && maxStay == undefined) {
        return undefined;
    }

    return {
        activity,
        maxStay,
        "priorityCategory": getPriorityCategory(activity, userClasses)
    };
}

function getUserClasses(description) {
    if (!rpaReg.hasUserClass.test(description)) {
        return undefined;
    }

    const classes = description
    .replace(rpaReg.userClassLeftTrimmer, "")
    .replace(rpaReg.userClassRightTrimmer, "")
    .toLowerCase()
    .split(/ (?:et|\+) /); // split on ' et ' or ' + '

    if (classes[0] === "") {
        return undefined;
    }

    return [{classes}]
}

function getRegulation(activity, maxStay, timeSpans, userClasses) {
    const rule = getRule(activity, maxStay, userClasses);

    if (rule === undefined && timeSpans === undefined && userClasses === undefined) {
        return undefined;
    }

    return {rule, userClasses, timeSpans};
}

// when there is more than one regulation
function getComplexRegulations(activity, maxStay, timeSpans, userClasses) {
    if (activity == "panonceau") {
        // We don't know yet what activity the userClass is modifying. We put no activity.
        const regulationUserClass = getRegulation(undefined, maxStay, timeSpans, userClasses);
        return [regulationUserClass];
    }
    else if (activity == "no parking" || activity == "no standing") {
        // The user class is allowed to be there at that moment
        const regulationUserClass = getRegulation("parking", maxStay, timeSpans, userClasses);
        // Others are not allowed at that moment
        const regulationOthers = getRegulation(activity, undefined, timeSpans, undefined);
        return [regulationUserClass, regulationOthers];
    }
    else {
        const regulationUserClass = getRegulation(activity, maxStay, timeSpans, userClasses);
        // We assume other classes are never allowed to be there
        const regulationOthers = getRegulation("no parking", undefined, undefined, undefined);
        return [regulationUserClass, regulationOthers];
    }
}

function getRegulations(description) {
    const timeSpans = getTimeSpans(description);
    const maxStay = getMaxStay(description);
    const activity = getActivity(description, timeSpans, maxStay);
    const userClasses = getUserClasses(description);

    if (activity === "irrelevant") {
        // There's nothing useful to do
        return undefined;
    }

    if (!userClasses) {
        const regulation = getRegulation(activity, maxStay, timeSpans, userClasses);
        if (regulation) {
            return [regulation];
        }
        return undefined;
    }
    else {
        return getComplexRegulations(activity, maxStay, timeSpans, userClasses);
    }
}

function convert(rpaCodification) {
    const rpaIds = rpaCodification.PANNEAU_ID_RPA;
    const rpaDescriptions = rpaCodification.DESCRIPTION_RPA;
    const rpaCodes = rpaCodification.CODE_RPA;
    const rpaInfos = {};

    for (const [key, rpaId] of Object.entries(rpaIds)) {
        const rpaInfo = {}
        rpaInfos[rpaId] = rpaInfo
        rpaInfo.DESCRIPTION_RPA = rpaDescriptions[key];
        rpaInfo.CODE_RPA = rpaCodes[key];

        const description = rpaDescriptions[key].toUpperCase();

        if (containsIrrelevantExpression(description)) {
            continue;
        }

        rpaInfo["regulations"] = getRegulations(description);
    }

    return rpaInfos;
}

if (typeof require !== 'undefined' && require.main === module) {
    const inputFilename = process.argv[2];
    const outputFilename = process.argv[3];

    const rpaCodification = jsonHelper.load(inputFilename);

    const output = convert(rpaCodification);
    jsonHelper.write(outputFilename, output, true);
}

module.exports = {
    convert,
    getActivity,
    getMaxStay,
    getDaysOfWeek,
    getEffectiveDates,
    getRule,
    getRegulations,
    getTimeSpans,
    extractFirstTwoDigitsNumber,
    extractMonth,
    getEffectiveDatesFromDayFirstSyntax,
    getEffectiveDatesFromDaySecondSyntax,
    getEffectiveDatesFromDayAbsentSyntax,
    getEffectiveDatesFromSlashedSyntax,
    convertHtime,
    getTimeOfDay,
    getTimesOfDay,
    extractDayOfWeek,
    getDaysOfWeekFromEnumeration,
    getDaysOfWeekFromInterval,
    getTimeSpansFromDaysOverlapSyntax,
    getUserClasses,
};
