function isNullOrUndefined(obj) {
    return (typeof obj === 'undefined') || obj == null;
}

//////////////////////////////////////////////////////////////////

function TFChartRange(position, span) {
    this.position = position;
    this.span = span;
}

function TFChartRangeMake(position, span) {
    return new TFChartRange(position, span);
}

TFChartRange.prototype.equal = function(x) {
    return TFChartEqualRanges(this, x);
}

TFChartRange.prototype.intersects = function(x) {
    return (x >= this.position && x <= this.position + this.span);
}

TFChartRange.prototype.ratioForSize = function(x) {
    return x / this.span;    
}

function TFChartLocationInRange(location, range) {
    return location >= range.position && location <= TFChartRangeMax(range);
}

function TFChartRangeMax(range) {
    return range.position + range.span;
}

function TFChartEqualRanges(range, otherRange) {
    return (range.position == otherRange.position && range.span == otherRange.span);
}

function TFChartIntersectionRange(range, otherRange) {
    var result = TFChartRangeMake(0, 0);

    if (TFChartRangeMax(range) < otherRange.position || TFChartRangeMax(otherRange) < range.position) {
        return TFChartRangeMake(0, 0);
    } else {
        result.position = Math.max(range.position, otherRange.position);
        result.span   = Math.min(TFChartRangeMax(range), TFChartRangeMax(otherRange)) - result.position;
        return result;
    }
}

function TFChartUnionRange(range, otherRange) {
    var start = Math.min(range.position, otherRange.position);
    return TFChartRangeMake(start, Math.max(TFChartRangeMax(range), TFChartRangeMax(otherRange)) - start);
}

//////////////////////////////////////////////////////////////////

function TFChartPoint(x, y) {
    this.x = x;
    this.y = y;
}

function TFChartPointMake(x, y) {
    return new TFChartPoint(x, y);
}

TFChartPoint.prototype.toString = function() {
    return "{x: " + this.x + ", y: " + this.y + "}";
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

function TFChartRectMake(x, y, w, h) {
    return new TFChartRect(new TFChartPoint(x, y), new TFChartSize(w, h));
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

function TFChartRectGetMinX(rect) {
    return rect.origin.x;
}

function TFChartRectGetMaxX(rect) {
    return rect.origin.x + rect.size.width;
}

function TFChartRectGetMinY(rect) {
    return rect.origin.y;
}

function TFChartRectGetMaxY(rect) {
    return rect.origin.y + rect.size.height;
}
