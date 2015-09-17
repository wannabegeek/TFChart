function log10(val) {
   return Math.log(val) / Math.LN10;
}

function DateTimeAxisFormatter() {
    this.timeUnitSize = {
        "second": 1000,
        "minute": 60 * 1000,
        "hour": 60 * 60 * 1000,
        "day": 24 * 60 * 60 * 1000,
        "month": 30 * 24 * 60 * 60 * 1000,
        "quarter": 3 * 30 * 24 * 60 * 60 * 1000,
        "year": 365.2425 * 24 * 60 * 60 * 1000
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
        return {text: moment(value).utc().format("YYYY-MM-DD HH:mm:ss"), is_key:false};
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

        return {text: moment(value).utc().format(fmt), is_key: is_key};
    }
}
