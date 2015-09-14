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
    }
}