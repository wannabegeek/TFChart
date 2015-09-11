(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// To create this, run the following...
// browserify client.js > public/javascripts/3rdparty.js

// var $ = require('jquery');
require('moment');

},{"moment":2}],2:[function(require,module,exports){
//! moment.js
//! version : 2.4.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.4.0",
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO seperator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        // preliminary iso regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000)
        isoRegex = /^\s*\d{4}-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d:?\d\d|Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            'YYYY-MM-DD',
            'GGGG-[W]WW',
            'GGGG-[W]WW-E',
            'YYYY-DDD'
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d{1,3}/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return this.weekYear();
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return this.isoWeekYear();
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(10 * a / 6), 4);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // store reference to input for deterministic cloning
        this._input = duration;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength) {
        var output = number + '';
        while (output.length < targetLength) {
            output = '0' + output;
        }
        return output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, ignoreUpdateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months,
            minutes,
            hours;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        // store the minutes and hours so we can restore them
        if (days || months) {
            minutes = mom.minute();
            hours = mom.hour();
        }
        if (days) {
            mom.date(mom.date() + days * isAdding);
        }
        if (months) {
            mom.month(mom.month() + months * isAdding);
        }
        if (milliseconds && !ignoreUpdateOffset) {
            moment.updateOffset(mom);
        }
        // restore the minutes and hours after possibly changing dst
        if (days || months) {
            mom.minute(minutes);
            mom.hour(hours);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop,
            index;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function initializeParsingFlags(config) {
        config._pf = {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a;
        switch (token) {
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return parseTokenFourDigits;
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return parseTokenSixDigits;
        case 'S':
        case 'SS':
        case 'SSS':
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        var tzchunk = (parseTokenTimezone.exec(string) || [])[0],
            parts = (tzchunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
            break;
        case 'YYYY' :
        case 'YYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gg':
        case 'gggg':
        case 'GG':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = input;
            }
            break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                return val ?
                  (val.length < 3 ? (parseInt(val, 10) > 68 ? '19' + val : '20' + val) : val) :
                  (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                  (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            initializeParsingFlags(tempConfig);
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 4; i > 0; i--) {
                if (match[i]) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i - 1] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0; i < 4; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (parseTokenTimezone.exec(string)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            config._d = new Date(string);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else {
            config._d = new Date(input);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = new Date(Date.UTC(year, 0)).getUTCDay(),
            daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (typeof config._pf === 'undefined') {
            initializeParsingFlags(config);
        }

        if (input === null) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = extend({}, input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        return makeMoment({
            _i : input,
            _f : format,
            _l : lang,
            _strict : strict,
            _isUTC : false
        });
    };

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var m;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        m = makeMoment({
            _useUTC : true,
            _isUTC : true,
            _l : lang,
            _i : input,
            _f : format,
            _strict : strict
        }).utc();

        return m;
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var isDuration = moment.isDuration(input),
            isNumber = (typeof input === 'number'),
            duration = (isDuration ? input._input : (isNumber ? {} : input)),
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            timeEmpty,
            dateTimeEmpty;

        if (isNumber) {
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (isDuration && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment;
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function (input) {
        return moment(input).parseZone();
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            return formatMoment(moment(this).utc(), 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = this._isUTC ? moment(input).zone(this._offset || 0) : moment(input).local(),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            var diff = this.diff(moment().zone(this.zone()).startOf('day'), 'days', true),
                format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : function (input) {
            var utc = this._isUTC ? 'UTC' : '',
                dayOfMonth;

            if (input != null) {
                if (typeof input === 'string') {
                    input = this.lang().monthsParse(input);
                    if (typeof input !== 'number') {
                        return this;
                    }
                }

                dayOfMonth = this.date();
                this.date(1);
                this._d['set' + utc + 'Month'](input);
                this.date(Math.min(dayOfMonth, this.daysInMonth()));

                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + 'Month']();
            }
        },

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) === +moment(input).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        zone : function (input) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    addOrSubtractDurationFromMoment(this, moment.duration(offset - input, 'm'), 1, true);
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    // helper for adding shortcuts
    function makeGetterAndSetter(name, key) {
        moment.fn[name] = moment.fn[name + 's'] = function (input) {
            var utc = this._isUTC ? 'UTC' : '';
            if (input != null) {
                this._d['set' + utc + key](input);
                moment.updateOffset(this);
                return this;
            } else {
                return this._d['get' + utc + key]();
            }
        };
    }

    // loop through and add shortcuts (Month, Date, Hours, Minutes, Seconds, Milliseconds)
    for (i = 0; i < proxyGettersAndSetters.length; i ++) {
        makeGetterAndSetter(proxyGettersAndSetters[i].toLowerCase().replace(/s$/, ''), proxyGettersAndSetters[i]);
    }

    // add shortcut for year (uses different syntax than the getter/setter 'year' == 'FullYear')
    makeGetterAndSetter('year', 'FullYear');

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(deprecate) {
        var warned = false, local_moment = moment;
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        // here, `this` means `window` in the browser, or `global` on the server
        // add `moment` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode
        if (deprecate) {
            this.moment = function () {
                if (!warned && console && console.warn) {
                    warned = true;
                    console.warn(
                            "Accessing Moment through the global scope is " +
                            "deprecated, and will be removed in an upcoming " +
                            "release.");
                }
                return local_moment.apply(null, arguments);
            };
        } else {
            this['moment'] = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
        makeGlobal(true);
    } else if (typeof define === "function" && define.amd) {
        define("moment", function (require, exports, module) {
            if (module.config().noGlobal !== true) {
                // If user provided noGlobal, he is aware of global
                makeGlobal(module.config().noGlobal === undefined);
            }

            return moment;
        });
    } else {
        makeGlobal();
    }
}).call(this);

},{}]},{},[1]);

/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
;
(function() {
    /**
     *
     * @type {Function}
     * @constructor
     */
    var ElementQueries = this.ElementQueries = function() {

        this.withTracking = false;
        var elements = [];

        /**
         *
         * @param element
         * @returns {Number}
         */
        function getEmSize(element) {
            if (!element) {
                element = document.documentElement;
            }
            var fontSize = getComputedStyle(element, 'fontSize');
            return parseFloat(fontSize) || 16;
        }

        /**
         *
         * @copyright https://github.com/Mr0grog/element-query/blob/master/LICENSE
         *
         * @param {HTMLElement} element
         * @param {*} value
         * @returns {*}
         */
        function convertToPx(element, value) {
            var units = value.replace(/[0-9]*/, '');
            value = parseFloat(value);
            switch (units) {
                case "px":
                    return value;
                case "em":
                    return value * getEmSize(element);
                case "rem":
                    return value * getEmSize();
                // Viewport units!
                // According to http://quirksmode.org/mobile/tableViewport.html
                // documentElement.clientWidth/Height gets us the most reliable info
                case "vw":
                    return value * document.documentElement.clientWidth / 100;
                case "vh":
                    return value * document.documentElement.clientHeight / 100;
                case "vmin":
                case "vmax":
                    var vw = document.documentElement.clientWidth / 100;
                    var vh = document.documentElement.clientHeight / 100;
                    var chooser = Math[units === "vmin" ? "min" : "max"];
                    return value * chooser(vw, vh);
                default:
                    return value;
                // for now, not supporting physical units (since they are just a set number of px)
                // or ex/ch (getting accurate measurements is hard)
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @constructor
         */
        function SetupInformation(element) {
            this.element = element;
            this.options = {};
            var key, option, width = 0, height = 0, value, actualValue, attrValues, attrValue, attrName;

            /**
             * @param {Object} option {mode: 'min|max', property: 'width|height', value: '123px'}
             */
            this.addOption = function(option) {
                var idx = [option.mode, option.property, option.value].join(',');
                this.options[idx] = option;
            };

            var attributes = ['min-width', 'min-height', 'max-width', 'max-height'];

            /**
             * Extracts the computed width/height and sets to min/max- attribute.
             */
            this.call = function() {
                // extract current dimensions
                width = this.element.offsetWidth;
                height = this.element.offsetHeight;

                attrValues = {};

                for (key in this.options) {
                    if (!this.options.hasOwnProperty(key)){
                        continue;
                    }
                    option = this.options[key];

                    value = convertToPx(this.element, option.value);

                    actualValue = option.property == 'width' ? width : height;
                    attrName = option.mode + '-' + option.property;
                    attrValue = '';

                    if (option.mode == 'min' && actualValue >= value) {
                        attrValue += option.value;
                    }

                    if (option.mode == 'max' && actualValue <= value) {
                        attrValue += option.value;
                    }

                    if (!attrValues[attrName]) attrValues[attrName] = '';
                    if (attrValue && -1 === (' '+attrValues[attrName]+' ').indexOf(' ' + attrValue + ' ')) {
                        attrValues[attrName] += ' ' + attrValue;
                    }
                }

                for (var k in attributes) {
                    if (attrValues[attributes[k]]) {
                        this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
                    } else {
                        this.element.removeAttribute(attributes[k]);
                    }
                }
            };
        }

        /**
         * @param {HTMLElement} element
         * @param {Object}      options
         */
        function setupElement(element, options) {
            if (element.elementQueriesSetupInformation) {
                element.elementQueriesSetupInformation.addOption(options);
            } else {
                element.elementQueriesSetupInformation = new SetupInformation(element);
                element.elementQueriesSetupInformation.addOption(options);
                element.elementQueriesSensor = new ResizeSensor(element, function() {
                    element.elementQueriesSetupInformation.call();
                });
            }
            element.elementQueriesSetupInformation.call();

            if (this.withTracking) {
                elements.push(element);
            }
        }

        /**
         * @param {String} selector
         * @param {String} mode min|max
         * @param {String} property width|height
         * @param {String} value
         */
        function queueQuery(selector, mode, property, value) {
            var query;
            if (document.querySelectorAll) query = document.querySelectorAll.bind(document);
            if (!query && 'undefined' !== typeof $$) query = $$;
            if (!query && 'undefined' !== typeof jQuery) query = jQuery;

            if (!query) {
                throw 'No document.querySelectorAll, jQuery or Mootools\'s $$ found.';
            }

            var elements = query(selector);
            for (var i = 0, j = elements.length; i < j; i++) {
                setupElement(elements[i], {
                    mode: mode,
                    property: property,
                    value: value
                });
            }
        }

        var regex = /,?([^,\n]*)\[[\s\t]*(min|max)-(width|height)[\s\t]*[~$\^]?=[\s\t]*"([^"]*)"[\s\t]*]([^\n\s\{]*)/mgi;

        /**
         * @param {String} css
         */
        function extractQuery(css) {
            var match;
            css = css.replace(/'/g, '"');
            while (null !== (match = regex.exec(css))) {
                if (5 < match.length) {
                    queueQuery(match[1] || match[5], match[2], match[3], match[4]);
                }
            }
        }

        /**
         * @param {CssRule[]|String} rules
         */
        function readRules(rules) {
            var selector = '';
            if (!rules) {
                return;
            }
            if ('string' === typeof rules) {
                rules = rules.toLowerCase();
                if (-1 !== rules.indexOf('min-width') || -1 !== rules.indexOf('max-width')) {
                    extractQuery(rules);
                }
            } else {
                for (var i = 0, j = rules.length; i < j; i++) {
                    if (1 === rules[i].type) {
                        selector = rules[i].selectorText || rules[i].cssText;
                        if (-1 !== selector.indexOf('min-height') || -1 !== selector.indexOf('max-height')) {
                            extractQuery(selector);
                        }else if(-1 !== selector.indexOf('min-width') || -1 !== selector.indexOf('max-width')) {
                            extractQuery(selector);
                        }
                    } else if (4 === rules[i].type) {
                        readRules(rules[i].cssRules || rules[i].rules);
                    }
                }
            }
        }

        /**
         * Searches all css rules and setups the event listener to all elements with element query rules..
         *
         * @param {Boolean} withTracking allows and requires you to use detach, since we store internally all used elements
         *                               (no garbage collection possible if you don not call .detach() first)
         */
        this.init = function(withTracking) {
            this.withTracking = withTracking;
            for (var i = 0, j = document.styleSheets.length; i < j; i++) {
                try {
                    readRules(document.styleSheets[i].cssText || document.styleSheets[i].cssRules || document.styleSheets[i].rules);
                } catch(e) {
                    if (e.name !== 'SecurityError') {
                        throw e;
                    }
                }
            }
        };

        /**
         *
         * @param {Boolean} withTracking allows and requires you to use detach, since we store internally all used elements
         *                               (no garbage collection possible if you don not call .detach() first)
         */
        this.update = function(withTracking) {
            this.withTracking = withTracking;
            this.init();
        };

        this.detach = function() {
            if (!this.withTracking) {
                throw 'withTracking is not enabled. We can not detach elements since we don not store it.' +
                'Use ElementQueries.withTracking = true; before domready.';
            }

            var element;
            while (element = elements.pop()) {
                ElementQueries.detach(element);
            }

            elements = [];
        };
    };

    /**
     *
     * @param {Boolean} withTracking allows and requires you to use detach, since we store internally all used elements
     *                               (no garbage collection possible if you don not call .detach() first)
     */
    ElementQueries.update = function(withTracking) {
        ElementQueries.instance.update(withTracking);
    };

    /**
     * Removes all sensor and elementquery information from the element.
     *
     * @param {HTMLElement} element
     */
    ElementQueries.detach = function(element) {
        if (element.elementQueriesSetupInformation) {
            element.elementQueriesSensor.detach();
            delete element.elementQueriesSetupInformation;
            delete element.elementQueriesSensor;
            console.log('detached');
        } else {
            console.log('detached already', element);
        }
    };

    ElementQueries.withTracking = false;

    ElementQueries.init = function() {
        if (!ElementQueries.instance) {
            ElementQueries.instance = new ElementQueries();
        }

        ElementQueries.instance.init(ElementQueries.withTracking);
    };

    var domLoaded = function (callback) {
        /* Internet Explorer */
        /*@cc_on
        @if (@_win32 || @_win64)
            document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
            document.getElementById('ieScriptLoad').onreadystatechange = function() {
                if (this.readyState == 'complete') {
                    callback();
                }
            };
        @end @*/
        /* Mozilla, Chrome, Opera */
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback, false);
        }
        /* Safari, iCab, Konqueror */
        if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
            var DOMLoadTimer = setInterval(function () {
                if (/loaded|complete/i.test(document.readyState)) {
                    callback();
                    clearInterval(DOMLoadTimer);
                }
            }, 10);
        }
        /* Other web browsers */
        window.onload = callback;
    };

    if (window.addEventListener) {
        window.addEventListener('load', ElementQueries.init, false);
    } else {
        window.attachEvent('onload', ElementQueries.init);
    }
    domLoaded(ElementQueries.init);

})();

/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
;
(function() {

    /**
     * Class for dimension change detection.
     *
     * @param {Element|Element[]|Elements|jQuery} element
     * @param {Function} callback
     *
     * @constructor
     */
    this.ResizeSensor = function(element, callback) {
        /**
         *
         * @constructor
         */
        function EventQueue() {
            this.q = [];
            this.add = function(ev) {
                this.q.push(ev);
            };

            var i, j;
            this.call = function() {
                for (i = 0, j = this.q.length; i < j; i++) {
                    this.q[i].call();
                }
            };
        }

        /**
         * @param {HTMLElement} element
         * @param {String}      prop
         * @returns {String|Number}
         */
        function getComputedStyle(element, prop) {
            if (element.currentStyle) {
                return element.currentStyle[prop];
            } else if (window.getComputedStyle) {
                return window.getComputedStyle(element, null).getPropertyValue(prop);
            } else {
                return element.style[prop];
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @param {Function}    resized
         */
        function attachResizeEvent(element, resized) {
            if (!element.resizedAttached) {
                element.resizedAttached = new EventQueue();
                element.resizedAttached.add(resized);
            } else if (element.resizedAttached) {
                element.resizedAttached.add(resized);
                return;
            }

            element.resizeSensor = document.createElement('div');
            element.resizeSensor.className = 'resize-sensor';
            var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: scroll; z-index: -1; visibility: hidden;';
            var styleChild = 'position: absolute; left: 0; top: 0;';

            element.resizeSensor.style.cssText = style;
            element.resizeSensor.innerHTML =
                '<div class="resize-sensor-expand" style="' + style + '">' +
                    '<div style="' + styleChild + '"></div>' +
                '</div>' +
                '<div class="resize-sensor-shrink" style="' + style + '">' +
                    '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
                '</div>';
            element.appendChild(element.resizeSensor);

            if (!{fixed: 1, absolute: 1}[getComputedStyle(element, 'position')]) {
                element.style.position = 'relative';
            }

            var expand = element.resizeSensor.childNodes[0];
            var expandChild = expand.childNodes[0];
            var shrink = element.resizeSensor.childNodes[1];
            var shrinkChild = shrink.childNodes[0];

            var lastWidth, lastHeight;

            var reset = function() {
                expandChild.style.width = expand.offsetWidth + 10 + 'px';
                expandChild.style.height = expand.offsetHeight + 10 + 'px';
                expand.scrollLeft = expand.scrollWidth;
                expand.scrollTop = expand.scrollHeight;
                shrink.scrollLeft = shrink.scrollWidth;
                shrink.scrollTop = shrink.scrollHeight;
                lastWidth = element.offsetWidth;
                lastHeight = element.offsetHeight;
            };

            reset();

            var changed = function() {
                if (element.resizedAttached) {
                    element.resizedAttached.call();
                }
            };

            var addEvent = function(el, name, cb) {
                if (el.attachEvent) {
                    el.attachEvent('on' + name, cb);
                } else {
                    el.addEventListener(name, cb);
                }
            };

            addEvent(expand, 'scroll', function() {
                if (element.offsetWidth > lastWidth || element.offsetHeight > lastHeight) {
                    changed();
                }
                reset();
            });

            addEvent(shrink, 'scroll',function() {
                if (element.offsetWidth < lastWidth || element.offsetHeight < lastHeight) {
                    changed();
                }
                reset();
            });
        }

        if ("[object Array]" === Object.prototype.toString.call(element)
            || ('undefined' !== typeof jQuery && element instanceof jQuery) //jquery
            || ('undefined' !== typeof Elements && element instanceof Elements) //mootools
            ) {
            var i = 0, j = element.length;
            for (; i < j; i++) {
                attachResizeEvent(element[i], callback);
            }
        } else {
            attachResizeEvent(element, callback);
        }

        this.detach = function() {
            ResizeSensor.detach(element);
        };
    };

    this.ResizeSensor.detach = function(element) {
        if (element.resizeSensor) {
            element.removeChild(element.resizeSensor);
            delete element.resizeSensor;
            delete element.resizedAttached;
        }
    };

})();
function TFChartCandlestickRenderer() {
}

TFChartCandlestickRenderer.prototype.setOptions = function(options) {
    var default_theme = {
            upFillColor: "rgb(215, 84, 66)",
            upStrokeColor: "rgb(107, 42, 33)",
            downFillColor: "rgb(107, 165, 131)",
            downStrokeColor: "rgb(53, 82, 65)",
            wickColor: "rgb(180, 180, 180)"        
    };

    this.theme = $.extend({}, default_theme, options.theme.candlestick || {});
}


TFChartCandlestickRenderer.prototype._fillCandle = function(ctx, isUp) {
    if (!isUp) {
        ctx.fillStyle = this.theme.upFillColor;
        ctx.strokeStyle = this.theme.upStrokeColor;
    } else {
        ctx.fillStyle = this.theme.downFillColor;
        ctx.strokeStyle = this.theme.downStrokeColor;
    }
    ctx.fill();
    ctx.stroke();
}

TFChartCandlestickRenderer.prototype.render = function(data, chart_view) {

    var ctx = chart_view.context;
    var x_start = chart_view.pixelValueAtXValue(data[0].timestamp);
    var x_end = chart_view.pixelValueAtXValue(data[data.length - 1].timestamp);
    var x_delta = x_end - x_start;
    var candle_width = (x_delta / data.length) / 1.5;
    var half_candle_width = candle_width / 2.0;

    self = this;
    $.each(data, function(index, point) {
        var body_top = Math.round(chart_view.pixelValueAtYValue(Math.max(point.open, point.close))) + 0.5;
        var body_bottom = Math.round(chart_view.pixelValueAtYValue(Math.min(point.open, point.close))) + 0.5;

        var offset = chart_view.pixelValueAtXValue(point.timestamp);
        if (offset > -half_candle_width) {
            ctx.beginPath();
            ctx.rect(Math.round(offset - half_candle_width) + 0.5,
                            body_top,
                            candle_width,
                            body_bottom - body_top);
            self._fillCandle(ctx, point.close >= point.open);

            ctx.strokeStyle = self.theme.wickColor;
            ctx.beginPath();
            var wick_location = Math.round(offset) + 0.5;
            ctx.moveTo(wick_location, chart_view.pixelValueAtYValue(point.high));
            ctx.lineTo(wick_location, body_top);
            ctx.moveTo(wick_location, body_bottom);
            ctx.lineTo(wick_location, chart_view.pixelValueAtYValue(point.low));
            ctx.stroke();
        }
    });

}

function TFChartAnnotation() {
}

TFChartAnnotation.prototype.render = function(bounds, chart_view) {
}

//////////////////////////////////////////////////////////////////

TFChartLine.prototype = new TFChartAnnotation();
TFChartLine.prototype.constructor = TFChartLine;
TFChartLine.prototype.parent = TFChartLine.prototype;
function TFChartLine(lineColor, start, end) {
    this.lineColor = lineColor;
    this.points = [start, end];
    this.bounding_box = TFChartRectMake(Math.min(start.x, end.x), Math.min(start.y, end.y), Math.max(start.x, end.x), Math.max(start.y, end.y));
}

TFChartLine.prototype.render = function(bounds, chart_view) {
    if (this.bounding_box.intersectsRect(bounds)) {
        var ctx = chart_view.context;
        ctx.beginPath();
        ctx.moveTo(chart_view.pixelValueAtXValue(this.points[0].x), chart_view.pixelValueAtYValue(this.points[0].y));
        ctx.lineTo(chart_view.pixelValueAtXValue(this.points[1].x), chart_view.pixelValueAtYValue(this.points[1].y));
        ctx.strokeStyle = this.lineColor;
        ctx.stroke();
    }
}

//////////////////////////////////////////////////////////////////

TFChartHorizontalRay.prototype = new TFChartAnnotation();
TFChartHorizontalRay.prototype.constructor = TFChartHorizontalRay;
TFChartHorizontalRay.prototype.parent = TFChartHorizontalRay.prototype;
function TFChartHorizontalRay(lineColor, start) {
    this.lineColor = lineColor;
    this.point = start;
}

TFChartHorizontalRay.prototype.render = function(bounds, chart_view) {
    if (this.point.x <= bounds.origin.x + bounds.size.width && this.point.y >= bounds.origin.y - bounds.size.height && this.point.y <= bounds.origin.y) {
        var ctx = chart_view.context;
        var plot = chart_view._plotArea();
        ctx.beginPath();
        var y = Math.round(chart_view.pixelValueAtYValue(this.point.y)) + 0.5;
        ctx.moveTo(chart_view.pixelValueAtXValue(this.point.x), y);
        ctx.lineTo(plot.origin.x + plot.size.width, y);
        ctx.strokeStyle = this.lineColor;
        ctx.stroke();
    }
}

//////////////////////////////////////////////////////////////////

TFChartVerticalRay.prototype = new TFChartAnnotation();
TFChartVerticalRay.prototype.constructor = TFChartVerticalRay;
TFChartVerticalRay.prototype.parent = TFChartVerticalRay.prototype;
function TFChartVerticalRay(lineColor, start, is_down) {
    this.lineColor = lineColor;
    this.point = start;
    this.direction_down = is_down || false;
}

TFChartVerticalRay.prototype.render = function(bounds, chart_view) {
    if (this.point.x <= bounds.origin.x + bounds.size.width && this.point.x >= bounds.origin.x && ((!this.direction_down && this.point.y >= bounds.origin.y - bounds.size.height) || (this.direction_down && this.point.y >= bounds.origin.y))) {
        var ctx = chart_view.context;
        var plot = chart_view._plotArea();
        ctx.beginPath();
        var x = Math.round(chart_view.pixelValueAtXValue(this.point.x)) + 0.5;
        ctx.moveTo(x, chart_view.pixelValueAtYValue(this.point.y));
        if (this.direction_down) {
            ctx.lineTo(x, plot.origin.y + plot.size.height);
        } else {
            ctx.lineTo(x, plot.origin.y);
        }
        ctx.strokeStyle = this.lineColor;
        ctx.stroke();
    }
}

//////////////////////////////////////////////////////////////////

TFChartPolygon.prototype = new TFChartAnnotation();
TFChartPolygon.prototype.constructor = TFChartPolygon;
TFChartPolygon.prototype.parent = TFChartPolygon.prototype;
function TFChartPolygon(borderColor, fillColor) {
    this.borderColor = borderColor;
    this.fillColor = fillColor;
    this.bounding_box = null;
    this.points = []
}

TFChartPolygon.prototype.add = function(point) {
    if (this.points.length == 0) {
        this.bounding_box = TFChartRectMake(point.x, point.y, 0.0, 0.0);
    } else {
        this.bounding_box.origin.x = Math.min(this.bounding_box.origin.x, point.x);
        this.bounding_box.origin.y = Math.min(this.bounding_box.origin.y, point.y);
        this.bounding_box.size.width = Math.max(this.bounding_box.size.width, point.x - this.bounding_box.origin.x);
        this.bounding_box.size.height = Math.max(this.bounding_box.size.height, point.y - this.bounding_box.origin.y);
    }
    this.points.push(point);
}

TFChartPolygon.prototype.render = function(bounds, chart_view) {
    if (this.points.length > 0 && this.bounding_box.intersectsRect(bounds)) {
        var ctx = chart_view.context;
        ctx.beginPath();
        ctx.moveTo(Math.round(chart_view.pixelValueAtXValue(this.points[0].x)) + 0.5, Math.round(chart_view.pixelValueAtYValue(this.points[0].y)) + 0.5);
        for (i = 1; i < this.points.length; i++) {
            ctx.lineTo(Math.round(chart_view.pixelValueAtXValue(this.points[i].x)) + 0.5, Math.round(chart_view.pixelValueAtYValue(this.points[i].y)) + 0.5);
        }
        ctx.closePath();
        if (typeof this.fillColor !== 'undefined') {
            ctx.fillStyle = this.fillColor;
            ctx.fill();
        }
        if (typeof this.borderColor !== 'undefined') {
            ctx.strokeStyle = this.borderColor;
            ctx.stroke();
        }
    } else {
        console.log("box doesn;t intersect");
    }
}
function log10(val) {
   return Math.log(val) / Math.LN10;
}

function DateTimeAxisFormatter() {
    this.timeUnitSize = {
        "second": 1,
        "minute": 60 * 1,
        "hour": 60 * 60 * 1,
        "day": 24 * 60 * 60 * 1,
        "month": 30 * 24 * 60 * 60 * 1,
        "quarter": 3 * 30 * 24 * 60 * 60 * 1,
        "year": 365.2425 * 24 * 60 * 60 * 1
    };

    // the allowed tick sizes, after 1 year we use
    // an integer algorithm
    this.intervals = [
        [1, "second"], [2, "second"], [5, "second"], [10, "second"], [30, "second"], 
        [1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"], [30, "minute"], 
        [1, "hour"], [2, "hour"], [4, "hour"], [8, "hour"], [12, "hour"],
        [1, "day"], [2, "day"], [3, "day"],
        [0.25, "month"], [0.5, "month"], [1, "month"],
        [2, "month"]
    ];
}

DateTimeAxisFormatter.prototype.calculateAxisTicks = function(axis, count) {
    var result = [];

    if (axis.range.span == 0.0) {
        // TODO: deal with it
        return result;
    }

    var step = axis.range.span / count;
    var mag = Math.floor(log10(step));
    var magPow = Math.pow(10, mag);
    var magMsd = Math.round(step / magPow + 0.5);
    var stepSize = magMsd * magPow;

    var i = 0;
    for (i = 0; i < this.intervals.length - 1; ++i) {
        if (stepSize < (this.intervals[i][0] * this.timeUnitSize[this.intervals[i][1]])) {
            break;
        }
    }

    var size = this.intervals[i][0];
    var unit = this.intervals[i][1];
    stepSize = size * this.timeUnitSize[unit];

    var lower = stepSize * Math.floor(axis.range.position / stepSize);
    var upper = stepSize * Math.ceil((axis.range.position + axis.range.span) / stepSize);

    var val = lower;
    while(1) {
        result.push(val);
        val += stepSize;
        if (val > upper) {
            break;
        }
    }
    axis.tickSize = stepSize;
    return result;
}

DateTimeAxisFormatter.prototype.format = function(value, axis, is_crosshair) {
    // var m = new Moment();
    if (is_crosshair == true) {
        return {text: moment(value * 1000).utc().format("YYYY-MM-DD HH:mm:ss"), is_key:false};
    } else {

        var t = axis.tickSize;
        var fmt;

        if (t < this.timeUnitSize.minute) {
            fmt = "HH:mm:ss";
        } else if (t < this.timeUnitSize.day) {
            fmt = "HH:mm";
        } else if (t < this.timeUnitSize.month) {
            fmt = "D";
        } else if (t < this.timeUnitSize.year) {
            fmt = "MMM YYYY";
        } else {
            fmt = "YYYY";
        }

        var is_key = false;
        if (value % this.timeUnitSize.day == 0) {
            fmt = "D";
            is_key = true;
        }
        if (value % this.timeUnitSize.month == 0) {
            fmt = "MMM";
            is_key = true;
        }
        if (value % this.timeUnitSize.year == 0) {
            fmt = "YYYY";
            is_key = true;
        }

        return {text: moment(value * 1000).utc().format(fmt), is_key: is_key};
    }
}

function isNullOrUndefined(obj) {
    return (typeof obj === 'undefined') || obj == null;
}

//////////////////////////////////////////////////////////////////

function TFChartRange(position, span) {
    this.position = position;
    this.span = span;
}

TFChartRange.prototype.ratioForSize = function(x) {
    return x / this.span;    
}

//////////////////////////////////////////////////////////////////

function TFChartPoint(x, y) {
    this.x = x;
    this.y = y;
}

TFChartPoint.prototype.toString = function() {
    return "{x: " + this.x + ", y: " + this.y + "}";
}

function TFChartPointMake(x, y) {
    return new TFChartPoint(x, y);
}

//////////////////////////////////////////////////////////////////

function TFChartSize(width, height) {
    this.width = width;
    this.height = height;
}

TFChartSize.prototype.toString = function() {
    return "{width: " + this.width + ", height: " + this.height + "}";
}

//////////////////////////////////////////////////////////////////

function TFChartRect(origin, size) {
    this.origin = origin;
    this.size = size;
}

TFChartRect.prototype.toString = function() {
    return "origin: " + this.origin + ", size: " + this.size;
}

TFChartRect.prototype.containsPoint = function(point) {
    return point.x <= this.origin.x && point.x >= (this.origin.x + this.size.width) &&
           point.y <= this.origin.y && point.y >= (this.origin.y + this.size.height);
}

TFChartRect.prototype.intersectsRect = function(rect) {
    return (this.origin.x + this.size.width >= rect.origin.x && this.origin.x <= rect.origin.x + rect.size.width && this.origin.y + this.size.height >= rect.origin.y && this.origin.y <= rect.origin.y + rect.size.height);
}

function TFChartRectMake(x, y, w, h) {
    return new TFChartRect(new TFChartPoint(x, y), new TFChartSize(w, h));
}

function setCanvasSize(canvasId, x, y) {
    var canvas = document.getElementById(canvasId);
    canvas.width = x;
    canvas.height = y;
}

//////////////////////////////////////////////////////////////////

function TFChartWindow(origin, width, space_right) {
    this.origin = origin;
    this.width = width;
    this.space_right = space_right;
}

TFChartWindow.prototype._checkLimits = function(area) {
    this.space_right = Math.min(area.size.width * 0.5, this.space_right);
    this.space_right = Math.max(0.0, this.space_right);

    // no smaller than the current window width
    this.width = Math.max(this.width, area.size.width);

    // origin cannot be +'ve' (i.e. have space to left)
    this.origin = Math.min(0.0, this.origin);
    // and you can't have space to the right
    this.origin = Math.max(-(this.width - area.size.width), this.origin)
}

TFChartWindow.prototype.move = function(delta, area) {

    if (this.origin + delta < -(this.width - area.size.width)) {
        this.space_right -= delta;
    } else if (this.space_right > 0 && delta > 0.0) {
        this.space_right -= delta;
    } else {
        this.origin += delta;
    }

    this._checkLimits(area);
}

TFChartWindow.prototype.zoom = function(delta, area) {

    var to_right = this.width - area.size.width + this.origin;

    var r = to_right / this.width;

    this.origin -= delta;
    // this.origin = Math.min(0.0, this.origin);

    this.width = -this.origin + area.size.width + to_right + delta;
    this.width = Math.max(this.width, area.size.width);

    var delta_to_right = ((this.width - area.size.width + this.origin) / this.width) - r;

    // delta_to_right = Math.max(0.0, delta_to_right);

    this.origin -= delta_to_right * this.width;

    this._checkLimits(area);
}

TFChartWindow.prototype.log = function(area) {
    var to_right = this.width - area.size.width + this.origin;
    console.log("|-[" + roundToDP(-this.origin, 2) + "(" + roundToDP(-this.origin / this.width * 100.0, 2) + "%)" + "]-|XX-[" + roundToDP(area.size.width, 2)  + "(" + roundToDP(area.size.width / this.width * 100, 2) + "%)"+ "]-XX|-[" + roundToDP(to_right, 2) + "(" + roundToDP(to_right / this.width * 100, 2) + "%)" + "]-|-[" + roundToDP(this.space_right, 2) + "]-|");
    // console.log("|--------------------" + this.width + "--------------------|");
}

//////////////////////////////////////////////////////////////////

function TFChart(container, renderer, options) {
    var defaults = {
        theme: {
            backgroundColor: "#FFFFFF",
            axisColor: "#888888",
            gridColor: "#EEEEEE",
            crosshairTextColor: "#FFFFFF",
            crosshairBackground: '#555555',
            crosshairColor: "#999999"
        },
        min_data_points: 15,
        max_data_points: 500,
        space_right: 8.0
    };

    this.options = $.extend({}, defaults, options || {});
    this.options.theme = $.extend({}, defaults.theme, this.options.theme || {});

    renderer.setOptions(this.options);

    this.x_axis = {
        formatter: new DateTimeAxisFormatter(),
        padding: 70.0,
        data_padding: 0.0,
        range: new TFChartRange(0.0, 0.0)
    };

    this.y_axis = {
        formatter: new LinearAxisFormatter(4),
        padding: 30.0,
        data_padding: 20.0,
        range: new TFChartRange(0.0, 0.0)
    };

    this.renderer = renderer;
    this.viewable_range = new TFChartRange(0.0, 0.0);

    this.data = [];
    this.visible_data = [];

    this.annotations = [];

    this.data_window = new TFChartWindow(0.0, 0.0, this.options.space_right);

    this.context = null;
    this.axis_context = null;

    this.isMouseDown = false;
    this.isTouchDown = false;
    this.drag_start = 0.0;
    this.touch_start = 0.0;
    this.touch_delta = 0.0;

    this.container = $(container);

    var x = this.container.width();
    var y = this.container.height();

    container.append('<canvas id=\'chart_canvas\' width="' + x + 'px" height="' + y + 'px" style="position: absolute; left: 0; top: 0; width=100%; height=100%">Your browser doesn\'t support canvas.</canvas>');
    container.append('<canvas id=\'crosshair_canvas\' width="' + x + 'px" height="' + y + 'px" style="position: absolute; left: 0; top: 0; width=100%; height=100%"></canvas>');

    var drawingCanvas = document.getElementById('chart_canvas');
    // Check the element is in the DOM and the browser supports canvas
    if(drawingCanvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        this.context = drawingCanvas.getContext('2d');
        //Canvas commands go here
    }

    this.chart_canvas = $('canvas#chart_canvas');
    this.crosshair_canvas = $('canvas#crosshair_canvas');

    var axisCanvas = document.getElementById('crosshair_canvas');
    this.crosshair_canvas.css('cursor', 'crosshair');

    // Check the element is in the DOM and the browser supports canvas
    if(axisCanvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        this.axis_context = axisCanvas.getContext('2d');

        axisCanvas.onmousedown = $.proxy(this.onMouseDown, this);
        axisCanvas.onmouseup = $.proxy(this.onMouseUp, this);
        axisCanvas.onmousemove = $.proxy(this.onMouseMove, this);
        axisCanvas.onmouseout = $.proxy(this.onMouseOut, this);

        if (axisCanvas.addEventListener) {
            axisCanvas.addEventListener("mousewheel", $.proxy(this.onMouseWheelScroll, this), false);
            axisCanvas.addEventListener("DOMMouseScroll", $.proxy(this.onMouseWheelScroll, this), false);
            axisCanvas.addEventListener("touchstart", $.proxy(this.onTouchDown, this), false);
            axisCanvas.addEventListener("touchend", $.proxy(this.onTouchUp, this), false);
            axisCanvas.addEventListener("touchmove", $.proxy(this.onTouchMove, this), false);
        } else {
            axisCanvas.attachEvent("onmousewheel", $.proxy(this.onMouseWheelScroll, this));
        }
    }

    new ResizeSensor(this.container, $.proxy(this.onResize, this));

    var area = this._drawableArea();
    this.data_window = new TFChartWindow(0.0, area.size.width, this.options.space_right);

    this.redraw();
}

TFChart.prototype.setData = function(data) {
    this.data = data;
    this._updateVisible();

    this.redraw();
}

TFChart.prototype.reset = function() {
    var area = this._drawableArea();
    this.data_window = new TFChartWindow(0.0, area.size.width, this.options.space_right);
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.pixelValueAtXValue = function(x) {
    var area = this._drawableArea();
    var x_ratio = this.x_axis.range.ratioForSize(area.size.width - area.origin.x - this.data_window.space_right);
    return (x - this.x_axis.range.position) * x_ratio + area.origin.x;
}

TFChart.prototype.pixelValueAtYValue = function(y) {
    var area = this._drawableArea();
    var y_ratio = this.y_axis.range.ratioForSize(area.size.height);
    return area.origin.y + area.size.height - ((y - this.y_axis.range.position) * y_ratio);
}

TFChart.prototype.valueAtPixelLocation = function(point) {
    var area = this._drawableArea();

    var x_ratio = this.x_axis.range.ratioForSize(area.size.width - area.origin.x - this.data_window.space_right);
    var y_ratio = this.y_axis.range.ratioForSize(area.size.height);

    return TFChartPointMake(((point.x - area.origin.x) / x_ratio) + this.x_axis.range.position, (((area.size.height + area.origin.y) - point.y) / y_ratio) + this.y_axis.range.position);
}

TFChart.prototype.addAnnotation = function(annotation) {
    this.annotations.push(annotation);
    this._drawAnnotations();
}

TFChart.prototype.redraw = function() {
    var width = this.chart_canvas.width();
    var height = this.chart_canvas.height();

    this.context.clearRect(0.0, 0.0, width, height);
    this.axis_context.clearRect(0.0, 0.0, width, height);

    this._drawAxis();
    this._drawPlot();
    this._drawAnnotations();
}

TFChart.prototype.pan = function(delta, preventRedraw) {
    this.data_window.move(delta, this._plotArea());
    if (preventRedraw != true) {
        this._updateVisible();
        this.redraw();
    }
}

TFChart.prototype.zoom = function(delta, preventRedraw) {
    this.data_window.zoom(delta, this._plotArea());
    if (preventRedraw != true) {
        this._updateVisible();
        this.redraw();
    }
}

////////////// END PUBLIC METHODS /////////////

TFChart.prototype._chartBounds = function() {
    if (isNullOrUndefined(this.bounds)) {
        var tl = this.valueAtPixelLocation(TFChartPointMake(this.x_axis.data_padding, this.y_axis.data_padding));
        var br = this.valueAtPixelLocation(TFChartPointMake(Math.round(this.chart_canvas.width() - this.x_axis.padding) + 0.5 - (this.x_axis.data_padding * 2), Math.round(this.chart_canvas.height() - this.y_axis.padding) + 0.5 - (this.y_axis.data_padding * 2)));

        this.bounds = new TFChartRectMake(tl.x, br.y, br.x - tl.x, tl.y - br.y);
    }

    return this.bounds;
}

TFChart.prototype._drawableArea = function() {
    if (isNullOrUndefined(this.drawable_area)) {
        var width = Math.round(this.chart_canvas.width() - this.x_axis.padding) + 0.5 - (this.x_axis.data_padding * 2);
        var height = Math.round(this.chart_canvas.height() - this.y_axis.padding) + 0.5 - (this.y_axis.data_padding * 2);
        this.drawable_area = new TFChartRectMake(this.x_axis.data_padding, this.y_axis.data_padding, width, height);
    }

    return this.drawable_area;
}

TFChart.prototype._plotArea = function() {
    if (isNullOrUndefined(this.plot_area)) {
        // cache the value
        var width = Math.round(this.chart_canvas.width() - this.x_axis.padding) + 0.5 ;
        var height = Math.round(this.chart_canvas.height() - this.y_axis.padding) + 0.5;
        this.plot_area = new TFChartRect(new TFChartPoint(0.0, 0.0), new TFChartSize(width, height));
    }

    return this.plot_area;
}

TFChart.prototype._updateVisible = function() {
    var area = this._drawableArea();
    this.bounds = null;

    var data_x_range = this.data[this.data.length - 1].timestamp - this.data[0].timestamp;

    // this is the pixes per time unit
    var ratio = this.data_window.width / data_x_range;
    var end_x = (area.size.width - area.origin.x - this.data_window.origin) / ratio + this.data[0].timestamp;
    var offset = (area.size.width - this.data_window.space_right) / ratio;
    start_x = end_x - offset;

    var start_index = -1;
    var end_index = this.data.length;
    $.each(this.data, function(index, point) {
        if (start_index == -1 && point.timestamp > start_x) {
            start_index = index;
        }
        if (index < end_index && point.timestamp > end_x) {
            end_index = index;
            return;
        }
    });

    this.visible_data = this.data.slice(start_index, end_index);
    if (this.visible_data.length > 0) {
        var min = this.visible_data[0].low;
        var max = this.visible_data[0].high;
        $.each(this.visible_data, function(index, point) {
            max = Math.max(max, point.high);
            min = Math.min(min, point.low);
        });

        this.x_axis.range = new TFChartRange(this.visible_data[0].timestamp, end_x - this.visible_data[0].timestamp);
        this.y_axis.range = new TFChartRange(min, max - min);
    }
}

TFChart.prototype._drawAxis = function() {
    var width = this.chart_canvas.width();
    var height = this.chart_canvas.height();

    var area = this._plotArea();

    this.context.strokeStyle = this.options.theme.axisColor;
    
    this.context.beginPath();    
    this.context.moveTo(area.origin.x, area.size.height);
    this.context.lineTo(area.origin.x + area.size.width, area.size.height);
    this.context.lineTo(area.origin.x + area.size.width, area.origin.y);
    this.context.stroke();

    var y_ticks = this.y_axis.formatter.calculateAxisTicks(this.y_axis, 10);
    this.context.font = "bold 10px Arial";

    var self = this;
    $.each(y_ticks, function(index, y_value) {
        var value = Math.round(self.pixelValueAtYValue(y_value)) + 0.5;
        if (value < area.size.height + area.origin.y) {
            self.context.strokeStyle = self.options.theme.axisColor;
            self.context.beginPath();
            self.context.moveTo(area.origin.x + area.size.width, value);
            self.context.lineTo(area.origin.x + area.size.width + 5, value);
            self.context.stroke();

            self.context.strokeStyle = self.options.theme.gridColor;
            self.context.beginPath();
            self.context.moveTo(area.origin.x, value);
            self.context.lineTo(area.origin.x + area.size.width, value);
            self.context.stroke();

            self.context.fillStyle = self.options.theme.axisColor;
            var y_text = self.y_axis.formatter.format(y_value, self.x_axis, false);
            if (y_text.is_key == true) {
                this.context.font = "bold 10px Arial";
            }
            var text_size = self.context.measureText(y_text.text);
            self.context.fillText(y_text.text, area.origin.x + area.size.width + 5.0, value + 2.0 /* font size */);
            if (y_text.is_key == true) {
                this.context.font = "10px Arial";
            }
        }
    });


    var x_ticks = this.x_axis.formatter.calculateAxisTicks(this.x_axis, 15);
    var self = this;
    $.each(x_ticks, function(index, x_value) {
        var value = Math.round(self.pixelValueAtXValue(x_value)) + 0.5;
        if (value < area.size.width + area.origin.x) {
            self.context.strokeStyle = self.options.theme.axisColor;
            self.context.beginPath();
            self.context.moveTo(value, area.origin.y + area.size.height);
            self.context.lineTo(value, area.origin.y + area.size.height + 5);
            self.context.stroke();

            self.context.strokeStyle = self.options.theme.gridColor;
            self.context.beginPath();
            self.context.moveTo(value, area.origin.y);
            self.context.lineTo(value, area.origin.y + area.size.height);
            self.context.stroke();

            self.context.fillStyle = self.options.theme.axisColor;
            var x_text = self.x_axis.formatter.format(x_value, self.x_axis, false);
            if (x_text.is_key == true) {
                self.context.font = "bold 10px Arial";
            }
            var text_size = self.context.measureText(x_text.text);
            self.context.fillText(x_text.text, value - (text_size.width / 2.0), area.origin.y + area.size.height + 15.0);
            if (x_text.is_key == true) {
                self.context.font = "10px Arial";
            }
        }
    });

}

TFChart.prototype._drawPlot = function() {
    if (this.visible_data.length > 0) {

        var area = this._plotArea();
        this.context.save();
        this.context.rect(area.origin.x, area.origin.y, area.size.width, area.size.height);
        this.context.clip();
        this.renderer.render(this.visible_data, this);
        this.context.restore();
    }
}

TFChart.prototype._drawAnnotations = function() {
    if (this.annotations.length > 0) {
        self  = this;
        var bounds = this._plotArea();
        this.context.save();
        this.context.rect(bounds.origin.x, bounds.origin.y, bounds.size.width, bounds.size.height);
        this.context.clip();
        bounds = this._chartBounds();
        $.each(this.annotations, function(index, annotation) {
            annotation.render(bounds, self);
        });
        this.context.restore();
    }
}

TFChart.prototype._removeCrosshair = function() {
    var width = $('#crosshair_canvas').width();
    var height = $('#crosshair_canvas').height();
    this.axis_context.clearRect(0, 0, width, height);
}

TFChart.prototype._drawCrosshair = function(point) {
    var area = this._plotArea();

    this.axis_context.save();
    var width = this.crosshair_canvas.width();
    var height = this.crosshair_canvas.height();

    this.axis_context.clearRect(0, 0, width, height);

    if (point.x >= 0.0 && point.x <= area.origin.x + area.size.width && point.y >= 0.0 && point.y <= area.origin.y + area.size.height) {

        point.x = Math.round(point.x) + 0.5;
        point.y = Math.round(point.y) + 0.5;

        this.axis_context.setLineDash([4, 2]);
        this.axis_context.strokeStyle = this.options.theme.crosshairColor;
        this.axis_context.beginPath();  
        this.axis_context.moveTo(point.x, area.origin.y);
        this.axis_context.lineTo(point.x, area.size.height + area.origin.y);
        this.axis_context.stroke();

        this.axis_context.beginPath();
        this.axis_context.moveTo(area.origin.x, point.y);
        this.axis_context.lineTo(area.size.width + area.origin.x, point.y);
        this.axis_context.stroke();

        this.axis_context.restore();

        this.axis_context.font = "10px Arial";

        // draw the value pills at the bottom and right showing the value
        var value = this.valueAtPixelLocation(point);
        this.axis_context.fillStyle = this.options.theme.crosshairBackground;

        // right
        this.axis_context.save();
        var y_text = this.y_axis.formatter.format(value.y, this.y_axis, true);
        var text_size = this.axis_context.measureText(y_text.text);

        var verticalIndicatorSize = 8
        this.axis_context.beginPath();
        this.axis_context.moveTo(area.size.width + area.origin.x, point.y);
        this.axis_context.lineTo(area.size.width + area.origin.x + 5, point.y - verticalIndicatorSize);
        this.axis_context.lineTo(area.size.width + area.origin.x + text_size.width + 10, point.y - verticalIndicatorSize);
        this.axis_context.lineTo(area.size.width + area.origin.x + text_size.width + 10, point.y + verticalIndicatorSize);
        this.axis_context.lineTo(area.size.width + area.origin.x + 5, point.y + verticalIndicatorSize);
        this.axis_context.fill();
        this.axis_context.fillStyle = this.options.theme.crosshairTextColor;

        this.axis_context.fillText(y_text.text, area.size.width + area.origin.x + 5, point.y + 3);
        this.axis_context.restore();

        // bottom
        this.axis_context.save();
        var x_text = this.x_axis.formatter.format(value.x, this.x_axis, true);
        var text_size = this.axis_context.measureText(x_text.text);
        var horizontalIndicatorSize = text_size.width + 10;

        this.axis_context.beginPath();
        this.axis_context.moveTo(point.x - (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5);
        this.axis_context.lineTo(point.x - 5, area.size.height + area.origin.y + 5);
        this.axis_context.lineTo(point.x, area.size.height + area.origin.y);
        this.axis_context.lineTo(point.x + 5, area.size.height + area.origin.y + 5);
        this.axis_context.lineTo(point.x + (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5);
        this.axis_context.lineTo(point.x + (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5 + verticalIndicatorSize * 2);
        this.axis_context.lineTo(point.x - (horizontalIndicatorSize / 2.0), area.size.height + area.origin.y + 5 + verticalIndicatorSize * 2);
        this.axis_context.closePath();
        this.axis_context.fill();
        this.axis_context.fillStyle = this.options.theme.crosshairTextColor;
        this.axis_context.fillText(x_text.text, point.x - (horizontalIndicatorSize / 2.0) + 5, area.size.height + area.origin.y + 3 + verticalIndicatorSize + 5.0 /* font size */);
        this.axis_context.restore();
    }
}

TFChart.prototype.onResize = function() {
    var width = this.container.width();
    var height = this.container.height();
    setCanvasSize('chart_canvas', width, height);
    setCanvasSize('crosshair_canvas', width, height);
    this.plot_area = null;
    this.drawable_area = null;
    this.bounds = null;
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.onMouseWheelScroll = function(e) {
    var ev = e ? e : window.event;
    var deltaX = (e.wheelDeltaX || -e.detail);
    var deltaY = (e.wheelDeltaY || -e.detail);
    if (deltaX) {
        this.pan(deltaX, true);
    }
    if (deltaY) {
        var area = this._plotArea();
        this.zoom(deltaY, true);
    }
    this._updateVisible();
    this.redraw();

    mouseX = ev.pageX - this.crosshair_canvas.offset().left;
    mouseY = ev.pageY - this.crosshair_canvas.offset().top;
    this._drawCrosshair(TFChartPointMake(mouseX, mouseY));

    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype.onMouseMove = function(e) {
    var ev = e ? e : window.event;
    mouseX = ev.pageX - this.crosshair_canvas.offset().left;
    mouseY = ev.pageY - this.crosshair_canvas.offset().top;

    if (this.isMouseDown) {
        var area = this._plotArea();
        var delta = -(this.drag_start - mouseX);
        this.pan(delta);
        this.drag_start = mouseX;
    }

    this._drawCrosshair(TFChartPointMake(mouseX, mouseY));

    return false;
}

TFChart.prototype.onMouseOut = function(e) {
    this._removeCrosshair();
    this.isMouseDown = false;
    this.crosshair_canvas.css('cursor', 'crosshair');
}

TFChart.prototype.onMouseDown = function(e) {
    var ev = e ? e : window.event;
    mouseX = ev.pageX - this.crosshair_canvas.offset().left;
    mouseY = ev.pageY - this.crosshair_canvas.offset().top;

    this.isMouseDown = true;
    this.drag_start = mouseX;
    this.crosshair_canvas.css('cursor', 'move');
    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype.onMouseUp = function(e) {
    this.isMouseDown = false;
    this.crosshair_canvas.css('cursor', 'crosshair');
    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype.onTouchMove = function(e) {
    var ev = e ? e : window.event;
    var touchX = e.targetTouches[0].pageX - this.crosshair_canvas.offset().left;
    if (e.targetTouches.length == 1) { // we are panning
        if (this.isTouchDown) { // however, the touch must be down to beable to move
            var area = this._plotArea();
            var delta = -(this.touch_start - touchX);
            this.pan(delta);
            this.touch_start = touchX;
        }
    } else if (e.targetTouches.length == 2) {
        var touchX_2 = e.targetTouches[1].pageX - this.crosshair_canvas.offset().left;
        touch_delta = Math.abs(touchX_2 - touchX);
        // are we getting larger or smaller?
        this.zoom(2 * (touch_delta - this.touch_delta));
        this.touch_delta = touch_delta;
        this._updateVisible();
        this.redraw();
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype.onTouchDown = function(e) {
    var ev = e ? e : window.event;
    len = e.targetTouches.length;
    var touchX = e.targetTouches[0].pageX - this.crosshair_canvas.offset().left;
    var touchY = e.targetTouches[0].pageY - this.crosshair_canvas.offset().top;

    this.touch_start = touchX;
    this.isTouchDown = true;

    if (len == 1) {
        this._drawCrosshair((touchX, touchY));
    } else {
        var touchX_2 = e.targetTouches[1].pageX - this.crosshair_canvas.offset().left;
        this.touch_delta = Math.abs(touchX_2 - touchX);
        this._removeCrosshair();
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype.onTouchUp = function(e) {
    this.isTouchDown = false;

    e.preventDefault();
    e.stopPropagation();
    return false;
}

function roundToDP(val, dp) {
    var p = Math.pow(10, dp);
    var t = val * p;
    t = Math.round(t);
    return t / p;
}

function log10(val) {
    return Math.log(val) / Math.LN10;
}

function LinearAxisFormatter(dp) {
    this.dp = dp;
}

LinearAxisFormatter.prototype.calculateAxisTicks = function(axis, count) {
    var result = [];

    if (axis.range.span == 0.0) {
        // TODO: deal with it
        return result;
    }

    var step = axis.range.span / count;
    var mag = Math.floor(log10(step));
    var magPow = Math.pow(10, mag);
    var magMsd = Math.round(step / magPow + 0.5);
    var stepSize = magMsd * magPow;

    var lower = stepSize * Math.floor(axis.range.position / stepSize);
    var upper = stepSize * Math.ceil((axis.range.position + axis.range.span) / stepSize);

    var val = lower;
    while(1) {
        result.push(val);
        val += stepSize;
        if (val > upper) {
            break;
        }
    }
    return result;
}

LinearAxisFormatter.prototype.format = function(value, range, is_crosshair) {
    return {text: value.toFixed(this.dp), is_yey: false};
}

function TFChartLineRenderer() {
}

TFChartLineRenderer.prototype.setOptions = function(options) {
    var default_theme = {
        lineColor: "#FF0000"
    };

    this.theme = $.extend({}, default_theme, options.theme.line || {});
}

TFChartLineRenderer.prototype.render = function(data, chart_view) {

    var ctx = chart_view.context;

    ctx.strokeStyle = this.theme.lineColor;
    ctx.beginPath();

    ctx.moveTo(chart_view.pixelValueAtXValue(data[0].timestamp), chart_view.pixelValueAtYValue(data[0].close));

    self = this;
    $.each(data, function(index, point) {
        if (index > 0) {
            ctx.lineTo(chart_view.pixelValueAtXValue(point.timestamp), chart_view.pixelValueAtYValue(point.close));
        }
    });

    ctx.stroke();
}
