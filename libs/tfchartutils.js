function isNullOrUndefined(obj) {
    return (typeof obj === 'undefined') || obj == null;
}

//////////////////////////////////////////////////////////////////

function TFChartRange(position, span) {
    this.position = position;
    this.span = span;
}

TFChartRange.prototype.intersects = function(x) {
    return (x >= this.position && x <= this.position + this.span);
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
