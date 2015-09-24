function setCanvasSize(canvasId, x, y) {
    var canvas = document.getElementById(canvasId);
    canvas.width = x;
    canvas.height = y;
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
        max_data_points: 1000,
        space_right: 0.0,
        initial_data_points: 100,
        view_range: null,
        controller: null
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

    this.annotations = [];

    this.visible_offset = 0.0;
    this.visible_data_points = this.options.initial_data_points;
    this.period = 300000;

    this.context = null;
    this.axis_context = null;

    this.isMouseDown = false;
    this.isTouchDown = false;
    this.drag_start = 0.0;
    this.touch_start = 0.0;
    this.touch_delta = 0.0;

    var self = this;
    this.data_controller = new TFChartDataController(this, this.options.controller, this.period, function(data, operation) {
        if (operation === TFChartDataRequestType.PREPEND) {
            self._reevaluateVerticalRange(data);
            self.visible_offset -= data.length;
            // self._updateVisible();
            self.redraw();
        } else {
            self._reevaluateVerticalRange(data);
            // self._updateVisible();
            self.redraw();
        }
    });

    this.container = $(container);

    var x = this.container.width();
    var y = this.container.height();

    // we need to find a canvas id which isn't being used
    var element_index = 0;
    for (var element_index = 0; element_index < 1000; element_index++) {
        element_name = "chart_canvas_" + element_index;
        if (isNullOrUndefined(document.getElementById(element_name))) {
            break;
        }
    }
    this.chart_canvas_name = "chart_canvas_" + element_index;
    this.crosshair_canvas_name = "crosshair_canvas_" + element_index;

    container.append('<canvas id="' + this.chart_canvas_name + '" width="' + x + 'px" height="' + y + 'px" style="position: absolute; left: 0; top: 0; width=100%; height=100%">Your browser doesn\'t support canvas.</canvas>');
    container.append('<canvas id="' + this.crosshair_canvas_name + '" width="' + x + 'px" height="' + y + 'px" style="position: absolute; left: 0; top: 0; width=100%; height=100%"></canvas>');

    var drawingCanvas = document.getElementById(this.chart_canvas_name);
    // Check the element is in the DOM and the browser supports canvas
    if(drawingCanvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        this.context = drawingCanvas.getContext('2d');
        //Canvas commands go here
    }

    this.chart_canvas = $('canvas#' + this.chart_canvas_name);
    this.crosshair_canvas = $('canvas#' + this.crosshair_canvas_name);

    var axisCanvas = document.getElementById(this.crosshair_canvas_name);
    this.crosshair_canvas.css('cursor', 'crosshair');

    // Check the element is in the DOM and the browser supports canvas
    if(axisCanvas.getContext) {
        // Initaliase a 2-dimensional drawing context
        this.axis_context = axisCanvas.getContext('2d');

        axisCanvas.onmousedown = $.proxy(this._onMouseDown, this);
        axisCanvas.onmouseup = $.proxy(this._onMouseUp, this);
        axisCanvas.onmousemove = $.proxy(this._onMouseMove, this);
        axisCanvas.onmouseout = $.proxy(this._onMouseOut, this);

        if (axisCanvas.addEventListener) {
            axisCanvas.addEventListener("mousewheel", $.proxy(this._onMouseWheelScroll, this), false);
            axisCanvas.addEventListener("DOMMouseScroll", $.proxy(this._onMouseWheelScroll, this), false);
            axisCanvas.addEventListener("touchstart", $.proxy(this._nTouchDown, this), false);
            axisCanvas.addEventListener("touchend", $.proxy(this._onTouchUp, this), false);
            axisCanvas.addEventListener("touchmove", $.proxy(this._onTouchMove, this), false);
        } else {
            axisCanvas.attachEvent("onmousewheel", $.proxy(this._onMouseWheelScroll, this));
        }
    }

    new ResizeSensor(this.container, $.proxy(this._onResize, this));

    this.redraw();
}

TFChart.prototype.setPeriod = function(period) {
    this.period = period;
    this.data_controller.setPeriod(this.period);
}

TFChart.prototype.setData = function(data) {
    this.data_controller.setData(data);
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.setVisible = function(range) {
    var area = this._drawableArea();
    
    this.visible_data_points = range.span / this.period;

    // number of pixels per time unit (across the whole range)
    var ratio = area.size.width / this.visible_data_points;
    this.visible_offset = ((this.data_controller.data_range.position - range.position) * ratio) / this.period;

    this._checkViewableLimits();
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.doesXValueIntersectVisible = function(x) {
    return this.x_axis.range.intersects(x);
}

TFChart.prototype.reset = function() {
    this.visible_offset = 0.0;
    this.visible_data_points = this.options.initial_data_points;
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.reflow = function() {
    var width = this.container.width();
    var height = this.container.height();
    setCanvasSize(this.chart_canvas_name, width, height);
    setCanvasSize(this.crosshair_canvas_name, width, height);
    this.plot_area = null;
    this.drawable_area = null;
    this.bounds = null;
    this._updateVisible();
    this.redraw();
}

TFChart.prototype.pixelValueAtXValue = function(x) {
    var area = this._drawableArea();
    var ppdp = area.size.width / this.visible_data_points;
    return ((x - this.data_controller.data_range.position) / this.period) * ppdp + (this.visible_offset * ppdp);
}

TFChart.prototype.pixelValueAtYValue = function(y) {
    var area = this._drawableArea();
    var y_ratio = this.y_axis.range.ratioForSize(area.size.height);
    return area.origin.y + area.size.height - ((y - this.y_axis.range.position) * y_ratio);
}

TFChart.prototype.valueAtPixelLocation = function(point) {
    var area = this._drawableArea();
    var y_ratio = this.y_axis.range.ratioForSize(area.size.height);
    var ppdp = area.size.width / this.visible_data_points;
    var x_value = ((point.x / ppdp) - this.visible_offset) * this.period + this.data_controller.data_range.position;
    return TFChartPointMake(x_value, (((area.size.height + area.origin.y) - point.y) / y_ratio) + this.y_axis.range.position);
}

TFChart.prototype.addAnnotation = function(annotation) {
    this.annotations.push(annotation);
    this._drawAnnotations();
}

TFChart.prototype.removeAnnotation = function(annotation) {
    var index = this.annotations.indexOf(annotation);
    if (index > -1) {
        this.annotations.splice(index, 1);
        this._drawAnnotations();
    }
}

TFChart.prototype.removeAnnotations = function() {
    this.annotations.splice(0, this.annotations.length)
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
    var area = this._drawableArea();

    this.visible_offset += (delta / area.size.width) * this.visible_data_points;
    this._checkViewableLimits();

    if (preventRedraw != true) {
        this._updateVisible();
        this.redraw();
    }
    this._checkDataAvailable();
}

TFChart.prototype.zoom = function(delta, preventRedraw) {
    var area = this._drawableArea();
    var move = (delta / area.size.width) * this.visible_data_points;
    this.visible_data_points += move;
    if (this._checkViewableRangeLimits()) {
        this.visible_offset += move;
        this._checkViewableOffsetLimits();
    }


    if (preventRedraw != true) {
        this._updateVisible();
        this.redraw();
    }
    this._checkDataAvailable();
}

TFChart.prototype.log = function() {
    var area = this._plotArea();

    console.log("Canvas Size" + this.chart_canvas.width() + " x " + this.chart_canvas.height());
    console.log("Plot Area" + area.origin.x + " x " + area.origin.y + " --> " + area.size.width + ", " + area.size.height);
}

////////////// END PUBLIC METHODS /////////////

TFChart.prototype._checkDataAvailable = function() {
    if (this.visible_offset > 0.0 && this.data_controller.canSupplyData(TFChartDataRequestType.PREPEND)) {
        var start_x = this.x_axis.range.position - this.x_axis.range.span;
        var range =  new TFChartRange(start_x, this.data_controller.data_range.position - start_x - this.period);
        this.data_controller.requestData(range, TFChartDataRequestType.PREPEND);
    }

    if (this.visible_data_points - this.visible_offset > this.data_controller.data.length && this.data_controller.canSupplyData(TFChartDataRequestType.APPEND)) {
        var range =  new TFChartRange(TFChartRangeMax(this.data_controller.data_range) + this.period, this.x_axis.range.span)
        this.data_controller.requestData(range, TFChartDataRequestType.APPEND);
    }
}

TFChart.prototype._reevaluateVerticalRange = function(data) {
    var min = this.y_axis.range.position;
    var max = min + this.y_axis.range.span;
    var self = this;
    $.each(data, function(index, point) {
        if (point.timestamp > TFChartRangeMax(self.x_axis.range)) {
            return;
        } else if (point.timestamp >= self.x_axis.range.position) {
            max = Math.max(max, point.high);
            min = Math.min(min, point.low);
        }
    });
    if (max !== min) {
        var y_range = new TFChartRange(min, max - min);
        if (!this.y_axis.range.equal(y_range)) {
            this.y_axis.range = y_range;
            if (this.options.view_range !== null) {
                this.options.view_range(this, this.x_axis.range, this.y_axis.range);
            }
        }
    }
};

TFChart.prototype._checkViewableRangeLimits = function() {
    var result = Math.max(this.visible_data_points, this.options.min_data_points);
    result = Math.min(result, this.options.max_data_points);

    var restricted = (this.visible_data_points === result);
    this.visible_data_points = result;
    return restricted;
}

TFChart.prototype._checkViewableOffsetLimits = function() {
    var area = this._drawableArea();
    var data_points = this.data_controller.data.length;
    if (this.visible_data_points >= data_points) {
        result = Math.max(this.visible_offset, 1.0);
        result = Math.min(result, (this.visible_data_points - data_points));
    } else {
        if (this.visible_offset > 0.0) {
            result = Math.min(this.visible_offset, this.visible_data_points / 2.0);
        } else {
            result = Math.max(this.visible_offset, -(data_points - (this.visible_data_points / 2.0)));
        }
    }
    var restricted = (this.visible_offset === result);
    this.visible_offset = result;
    return restricted;
}

TFChart.prototype._checkViewableLimits = function() {
    return this._checkViewableRangeLimits() && this._checkViewableOffsetLimits();
}

TFChart.prototype._periodFloor = function(value) {
    return value - (value % this.period);
}

TFChart.prototype._periodCeil = function(value) {
    return value - (value % this.period) + this.period;
}

TFChart.prototype._chartBounds = function() {
    var tl = this.valueAtPixelLocation(TFChartPointMake(this.x_axis.data_padding, this.y_axis.data_padding));
    var br = this.valueAtPixelLocation(TFChartPointMake(Math.round(this.chart_canvas.width() - this.x_axis.padding) + 0.5 - (this.x_axis.data_padding * 2), Math.round(this.chart_canvas.height() - this.y_axis.padding) + 0.5 - (this.y_axis.data_padding * 2)));

    this.bounds = new TFChartRectMake(tl.x, br.y, br.x - tl.x, tl.y - br.y);

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

    var ppdp = area.size.width / this.visible_data_points;
    var offset = this.visible_offset * this.period;
    var start_x = this._periodFloor(this.data_controller.data_range.position - offset + (this.period / 2.0));
    var end_x = this._periodCeil(this.data_controller.data_range.position - offset - (this.period / 2.0) + ((area.size.width / ppdp) * this.period));

    var min = null;
    var max = null;
    $.each(this.data_controller.data, function(index, point) {
        if (point.timestamp > end_x) {
            return;
        } else if (point.timestamp >= start_x) {
            max = isNullOrUndefined(max) ? point.high : Math.max(max, point.high);
            min = isNullOrUndefined(min) ? point.low : Math.min(min, point.low);
        }
    });

    this.x_axis.range = new TFChartRange(start_x, end_x - start_x);
    if (max !== min) {
        this.y_axis.range = new TFChartRange(min, max - min);
    }
    if (this.options.view_range !== null) {
        this.options.view_range(this, this.x_axis.range, this.y_axis.range);
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
    if (this.data_controller.data.length > 0) {

        var area = this._plotArea();
        this.context.save();
        this.context.rect(area.origin.x, area.origin.y, area.size.width, area.size.height);
        this.context.clip();
        this.renderer.render(this.data_controller.data, this);
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
        var x_text = this.x_axis.formatter.format(this._periodFloor(value.x + (this.period / 2.0)), this.x_axis, true);
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

TFChart.prototype._onResize = function() {
    this.reflow();
}

TFChart.prototype._onMouseWheelScroll = function(e) {
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

TFChart.prototype._onMouseMove = function(e) {
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

TFChart.prototype._onMouseOut = function(e) {
    this._removeCrosshair();
    this.isMouseDown = false;
    this.crosshair_canvas.css('cursor', 'crosshair');
}

TFChart.prototype._onMouseDown = function(e) {
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

TFChart.prototype._onMouseUp = function(e) {
    this.isMouseDown = false;
    this.crosshair_canvas.css('cursor', 'crosshair');
    e.preventDefault();
    e.stopPropagation();
    return false;
}

TFChart.prototype._onTouchMove = function(e) {
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

TFChart.prototype._onTouchDown = function(e) {
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

TFChart.prototype._onTouchUp = function(e) {
    this.isTouchDown = false;

    e.preventDefault();
    e.stopPropagation();
    return false;
}
