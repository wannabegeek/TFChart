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
