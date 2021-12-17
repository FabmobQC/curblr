// one or two digits, followed by zero or more spaces, followed by "h", followed by 0 to two digits
const timeStr = "\\d{1,2}\\s*h\\d{0,2}";
const time = new RegExp(timeStr, "ig");

const timeIntervalConnecterStr = "\\s*[Aaà@-]\\s*";
// Match the usual time interval syntax: both times are indicated with an "h" and are separated with a connector
// ex: 9h-17h
const usualTimeIntervalStr = `(?:${timeStr})${timeIntervalConnecterStr}(?:${timeStr})`;
// Match special time intervals, for which the first time does not have an "h"
// ex: 09-17h
const specialTimeIntervalStr = "\\b\\d{2}-\\d{2}h";
const specialTimeInterval = new RegExp(specialTimeIntervalStr, "i");
// Match any time interval
const timeIntervalStr = `(${usualTimeIntervalStr})|(${specialTimeIntervalStr})`
const timeInterval = new RegExp(timeIntervalStr, "ig");

// match a sequence of time intervals
// examples: "6h-7h30", "6h-7h30, 8h-10",  or "6h-7h30 8h À 10h et 11h@12h"
const timesSequenceStr = `(?:${timeIntervalStr})(?:,?\\s+(?:et\\s+)?(?:${timeIntervalStr}))*`;
const timesSequence = new RegExp(timesSequenceStr, "i");

// mapping of days of the week with the regex that will match that day
const daysOfWeekStrs = {
    // beginning of a word, followed by the truncated name of a day or its complete name
    "mo": "\\blun(?:\\.|\\b|di)",
    "tu": "\\bmar(?:\\.|\\b|di)",
    "we": "\\bmer(?:\\.|\\b|credi)",
    "th": "\\bjeu(?:\\.|\\b|di)",
    "fr": "\\bve[nm](?:\\.|\\b|dredi)", // there is a typo in the data
    "sa": "\\bsam(?:\\.|\\b|edi)",
    "su": "\\bdim(?:\\.|\\b|anche)"
};
const daysOfWeek = Object.entries(daysOfWeekStrs)
                          .reduce( (acc, [key, value]) => {
                              acc[key] = new RegExp(value, "i");
                              return acc;
                            }, {});

// regex that will match any day of the week
const anyDayOfWeekStr = Object.values(daysOfWeekStrs).join("|");
const anyDayOfWeek = new RegExp(anyDayOfWeekStr, "ig");

const daysIntervalConnecterStr = "(?:A|À|AU)";

// regex that will match any interval of days
// Day of week not preceded or followed by A|À|AU, optionnaly followed by ET, and optionnaly followed by more days
const daysOfWeekIntervalStr = `(${anyDayOfWeekStr})\\s*${daysIntervalConnecterStr}\\s+(${anyDayOfWeekStr})`;
const daysOfWeekInterval = new RegExp(daysOfWeekIntervalStr, "ig");

// Matches an enumeration of days
const daysOfWeekEnumerationStr = `(?<!${daysIntervalConnecterStr}\\s+)(${anyDayOfWeekStr})(?!\\s*${daysIntervalConnecterStr})(?:\\s*(?:et\\s+)?(?:${anyDayOfWeekStr}))*`
const daysOfWeekEnumeration = new RegExp(daysOfWeekEnumerationStr, "ig");

// Either an interval of days or an enumeration of days
const daysOfTimeSpanStr = `(?:${daysOfWeekIntervalStr})|(?:${daysOfWeekEnumerationStr})`;

const separatorDaysWithTimeStr = "\\s*(?:-\\s*)?"

// Matches week times, for which the days come before the times
// days of week, followed by spaces and optionally a -, followed by time sequence
const weekTimeDaysFirstStr = `(?:${daysOfTimeSpanStr})${separatorDaysWithTimeStr}(?:${timesSequenceStr})`
const weekTimeDaysFirst = new RegExp(weekTimeDaysFirstStr, "ig");

// Matches week times, for which the days come after the times
// time sequence, followed by spaces and optionally a -, followed by days of week
const weekTimeDaysSecondStr = `(?:${timesSequenceStr})${separatorDaysWithTimeStr}(?:(?:${daysOfTimeSpanStr}))`
const weekTimeDaysSecond = new RegExp(weekTimeDaysSecondStr, "ig");

// Matches week times, for which the days are absent
// time sequence, not preceded by days and spaces, not followed by days and spaces.
const weekTimeDaysAbsentStr = `(?<!(?:${anyDayOfWeekStr})${separatorDaysWithTimeStr})(?:${timesSequenceStr})(?!${separatorDaysWithTimeStr}(?:${anyDayOfWeekStr}))`
const weekTimeDaysAbsent = new RegExp(weekTimeDaysAbsentStr, "ig");

// Matches week times, for which the hours are absent
// days sequence, not preceded by hours and spaces, not followed by hours and spaces.
const weekTimeDaysOnlyStr = `(?<!(?:${timeStr})${separatorDaysWithTimeStr})(?:${daysOfTimeSpanStr})(?!${separatorDaysWithTimeStr}(?:${timeStr}))`
const weekTimeDaysOnly = new RegExp(weekTimeDaysOnlyStr, "ig");

// Match periods of time that overlap over multiple days, for which the days come before the times
// ex: MER 17H À JEU 17H
const weekTimeDaysOverlapDayFirstStr = `(${anyDayOfWeekStr})(${separatorDaysWithTimeStr}${timeStr})\\s+(${daysIntervalConnecterStr})\\s+(${anyDayOfWeekStr})(${separatorDaysWithTimeStr}${timeStr})`;
const weekTimeDaysOverlapDayFirst = new RegExp(weekTimeDaysOverlapDayFirstStr, "ig");

// Match periods of time that overlap over multiple days, for wihch the days come after the times
// ex: 17H MAR À 17H MER
const weekTimeDaysOverlapDaySecondStr = `(${timeStr})(${separatorDaysWithTimeStr})(${anyDayOfWeekStr})\\s+(${daysIntervalConnecterStr})\\s+(${timeStr})(${separatorDaysWithTimeStr})(${anyDayOfWeekStr})`;
const weekTimeDaysOverlapDaySecond = new RegExp(weekTimeDaysOverlapDaySecondStr, "ig");

// Match periods of time that overlap over multiple days, both forms
// ex: "MER 17H À JEU 17H" or "17H MAR À 17H MER"
const weekTimeDaysOverlapStr = `(${weekTimeDaysOverlapDayFirstStr})|(${weekTimeDaysOverlapDaySecondStr})`;
const weekTimeDaysOverlap = new RegExp(weekTimeDaysOverlapStr, "ig");

// Match any syntax of week times
const weekTimeStr = `(?:(${weekTimeDaysFirstStr})|(${weekTimeDaysSecondStr})|(${weekTimeDaysAbsentStr})|(${weekTimeDaysOnlyStr})|(${weekTimeDaysOverlapStr}))`;
const weekTime = new RegExp(weekTimeStr, "ig");

// mapping of months names with the regex that will match that month
const monthsStrs = {
    // the truncated name of a month or its complete name.
    "01": "jan(?:\\.|\\b|vier)",
    "02": "f[eé]v(?:\\.|\\b|rier)",
    "03": "(?<!de-)m(?:a)?r(?:\\.|\\b|s)(:?l)?", // exclude champ-de-mars
    "04": "av(?:r)?(?:\\.|\\b|il)(:?s)?",
    "05": "mai\\b",
    "06": "juin\\b",
    "07": "juil(?:\\.|\\b|let)",
    "08": "ao[uû]t\\b",
    "09": "sept(?:\\.|\\b|embre)",
    "10": "oct(?:\\.|\\b|obre)",
    "11": "nov(?:\\.|\\b|embre)",
    "12": "d[eé]c(?:\\.|\\b|embre)",
}
const months = Object.entries(monthsStrs)
                          .reduce( (acc, [key, value]) => {
                              acc[key] = new RegExp(value, "i");
                              return acc;
                            }, {});

// regex that will match any month
const anyMonthStr = Object.values(monthsStrs).join("|");
const anyMonth = new RegExp(anyMonthStr, "ig");

// regex that will match any day of the month for which the day comes before the month
// One or two digits, followed by zero or more whitespaces, followed by any month
const dayOfMonthDayFirstStr = `(?:\\d{1,2}|1er) *(?:${anyMonthStr})`;
const dayOfMonthDayFirst = new RegExp(dayOfMonthDayFirstStr, "ig");

// regex that will match any day of the month for which the day comes after the month
// Any month, followed by zero or more whitespaces, followed by one or two digits
const dayOfMonthDaySecondStr = `(?:${anyMonthStr}) *(?:\\d{1,2}|1er)`;
const dayOfMonthDaySecond = new RegExp(dayOfMonthDaySecondStr, "ig");

// regex that will match days of the month with the day and the month separated by a slash
// The month is expressed with its number. Ex: 12/12
const dayOfMonthSlashedStr = "\\d{2}/\\d{2}";
const dayOfMonthSlashed = new RegExp(dayOfMonthSlashedStr, "ig");

// regex will match any interval of days of the month, for which the day comes before the month
const daysOfMonthIntervalDayFirstStr = `(?:${dayOfMonthDayFirstStr})\\s*(?:A|À|AU|ET|-)?\\s*(?:${dayOfMonthDayFirstStr})`;
const daysOfMonthIntervalDayFirst = new RegExp(daysOfMonthIntervalDayFirstStr, "i");

// regex will match any interval of days of the month, for which the day comes after the month
const daysOfMonthIntervalDaySecondStr = `(?:${dayOfMonthDaySecondStr})\\s*(?:A|À|AU|-)?\\s*(?:${dayOfMonthDaySecondStr})`;
const daysOfMonthIntervalDaySecond = new RegExp(daysOfMonthIntervalDaySecondStr, "i");

// regex will match any interval of days of the month, for which the day is not indicated
const daysOfMonthIntervalDayAbsentStr = `(?:${anyMonthStr})\\s*(?:A|À|AU|-)?\\s*(?:${anyMonthStr})`;
const daysOfMonthIntervalDayAbsent = new RegExp(daysOfMonthIntervalDayAbsentStr, "i");


const daysOfMonthIntervalSlashedStr = `(?:${dayOfMonthSlashedStr})\\s*(?:A|À|AU|-)?\\s*(?:${dayOfMonthSlashedStr})`;
const daysOfMonthIntervalSlashed = new RegExp(daysOfMonthIntervalSlashedStr, "i");

// regex will match any interval of days of the month
const daysOfMonthIntervalStr = `(?:${daysOfMonthIntervalDayFirstStr})|(?:${daysOfMonthIntervalDaySecondStr})|${daysOfMonthIntervalDayAbsentStr}|${daysOfMonthIntervalSlashedStr}`;
const daysOfMonthInterval = new RegExp(daysOfMonthIntervalStr, "i");

// Match timespans that occur on the same date
// weekTime alone, or daysOfMonthInterval alone, or weekTime with daysOfMonthInterval
// For example, "1h-2h 1er jan à 2 fev. 3h30 @ 4h mars 3 au avril 4" will match on "1h-2h 1er jan à 2 fev." and "3h30 @ 4h mars 3 au avril 4"
const sameDatesTimeSpanStr = `((${weekTimeStr}\\s*([-,]?)?\\s*)+(${daysOfMonthIntervalStr})?)|((${weekTimeStr}\\s*([-,]?)?\\s*)?(${daysOfMonthIntervalStr}))`;
const sameDatesTimeSpan = new RegExp(sameDatesTimeSpanStr, "ig");

// maxStay with "min" is easy: "min" is always going to match with a maxStay.
// maxStay with "h" is more complicated, because "h" could match with time spans.
// Here our regex to identify maxStay with "h" eliminates "h" followed by "-", so it does not match with "8H - 10H"
// However, some maxStay with "min" are followed by "-". For example : "60 MIN - 8H À 18H"
// For this reasons, maxStay with "min" and maxStay with "h" are handled differently.
// For now, a regex that would identify "2H" as a maxStay in "2H - 8H À 18H" seems to be to much trouble. We hope the data has nothing such.

// maxStay with min
// digits, followed by zero or more whitespaces, followed by "min"
const maxStayMinStr = `(\\d+\\s*min)`;
// basic form of maxStay with H. Would also match timespans
// digits, followed by zero or more whitespaces, followed by "h"
const maxStayHBasicStr = `(\\d+\\s*h)`;
// What should not be before a maxStay
// A digit, or a timeIntervalConnecter, or a time followed by dayIntervalConnecter followed by a day of the week 
const notBeforeMaxStayHStr = `(?<!\\d|(?:${timeIntervalConnecterStr})|(?:(${timeStr})\\s*(${daysIntervalConnecterStr})\\s*(${anyDayOfWeekStr})\\s*))`;
// What should not be after a maxStay
// A digit, or timeIntervalConnecter, or a day of the week followed by a dayIntervalConnecter followed by a time
const notAfterMaxStayHStr = `(?!\\d|(?:${timeIntervalConnecterStr})|(?:\\s*(${anyDayOfWeekStr})\\s*(${daysIntervalConnecterStr})\\s*(${timeStr})))`;
// maxStay with H, does not match timespans
const maxStayHStr = `(:?${notBeforeMaxStayHStr}${maxStayHBasicStr}${notAfterMaxStayHStr})`;
// Match maxStay
const maxStayStr = `(${maxStayMinStr})|(${maxStayHStr})`;
const maxStay = new RegExp(maxStayStr, "i");

const anyTimeIndicationStr = [
    timeStr,
    maxStayStr,
    anyDayOfWeekStr,
    anyMonth,
].join("|")
const anyTimeIndication = new RegExp(anyTimeIndicationStr, "i");

// Match variations of the word "débarcadère"
// contains 'DEBAR.' or 'DEBARCADERE', with or without accents
const debarcadereStr = "d(e|é|É)bar(\\.|(cad(e|è|È)re))";
const debarcadere = new RegExp(debarcadereStr, "i");

// Match variations of the word 'réservé'
// Note 'réservée' with an additional 'e' is excluded
const reservationKeywordStr = "r[eéÉ]ser(\\.|v[eéÉ](?!e))"
const reservationKeyword = new RegExp(reservationKeywordStr, "i");
// Match variations of the word 'excepté'
const exceptionKeywordStr = "except[eéÉ]";
const exceptionKeyword = new RegExp(exceptionKeywordStr, "i");

// match time exception
// ex: 'EXCEPTÉ MARDI'
const exceptionTimeStr = `(${exceptionKeywordStr})(\\s+(${sameDatesTimeSpanStr}))*`;
const exceptionTime = new RegExp(exceptionTimeStr, "i");

// To determine whether the string contains a user class or not
// Contains variation of 'réservé', or variation of word 'except' not followed by timespan
const hasUserClassStr = `(${reservationKeywordStr})|(${exceptionKeywordStr})(?!\\s+((${sameDatesTimeSpanStr})|periode))`;
const hasUserClass = new RegExp(hasUserClassStr, "i");

// Match anything before a user class
// This is intented to trim the part of the string that comes before the user class.
// Every tentatives to match user classes directly failed
// ex: '\\P RESERVE ', 'P RESERVE 21h-08h ', 'P 2H - 9H @ 16H EXCEPTÉ '
const userClassLeftTrimmerStr = `.*((${reservationKeywordStr})|(${exceptionKeywordStr}))(\\s+(${sameDatesTimeSpanStr}))*(\\sseulement)?(\\s${debarcadereStr})?\\s*`;
const userClassLeftTrimmer = new RegExp(userClassLeftTrimmerStr, "i");

// Match anything after a user class
// This is intented to trim the part of the string that comes after the user class.
// This must be used after userClassLeftTrimmer
// ex: ')', ' 09h30-21h', ' de 09h30 à 21h', ' 120min', ' 2h', ' EN TOUT TEMPS',
const userClassRightTrimmerStr = `(\\)|\\s+([-\\(]|((de\\s+)?${sameDatesTimeSpanStr})|\\d+\\s*(min|h)|EN TOUT TEMPS)).*`;
const userClassRightTrimmer = new RegExp(userClassRightTrimmerStr, "i");

// Equivalent to regex.exec(value)?.[0], which is not available in node 12
function getExecFirstMatch(regex, value) {
    const result = regex.exec(value);
    if (result) {
        return result[0];
    }
    else {
        return undefined;
    }
}

module.exports = {
    getExecFirstMatch,
    time,
    specialTimeInterval,
    timeInterval,
    maxStay,
    timesSequence,
    daysOfWeek,
    anyDayOfWeek,
    daysOfWeekInterval,
    daysOfWeekEnumeration,
    months,
    anyMonth,
    dayOfMonthDayFirst,
    dayOfMonthDaySecond,
    dayOfMonthSlashed,
    daysOfMonthIntervalDayFirst,
    daysOfMonthIntervalDaySecond,
    daysOfMonthIntervalDayAbsent,
    daysOfMonthIntervalSlashed,
    daysOfMonthInterval,
    weekTimeDaysFirst,
    weekTimeDaysSecond,
    weekTimeDaysAbsent,
    weekTimeDaysOnly,
    weekTimeDaysOverlapDayFirst,
    weekTimeDaysOverlapDaySecond,
    weekTimeDaysOverlap,
    weekTime,
    sameDatesTimeSpan,
    debarcadere,
    reservationKeyword,
    exceptionKeyword,
    anyTimeIndication,
    exceptionTime,
    hasUserClass,
    userClassLeftTrimmer,
    userClassRightTrimmer,
}