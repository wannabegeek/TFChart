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
        space_right: 8.0,
        view_range: null
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

TFChart.prototype.setVisible = function(start, end) {
    start_x = Math.max(start, this.data[0].timestamp);
    end_x = Math.min(end, this.data[this.data.length - 1].timestamp);

    var area = this._drawableArea();
    this.bounds = null;

    var visible_range = end_x - start_x;
    var data_x_range = this.data[this.data.length - 2].timestamp - this.data[0].timestamp;

    // this is proportion of the data which is visible
    var ratio = visible_range / data_x_range;
    
    this.data_window.width = (area.size.width - area.origin.x) / ratio;

    // number of pixels per time unit (across the whole range)
    ratio = this.data_window.width / data_x_range;
    this.data_window.origin = -(start_x - this.data[1].timestamp) * ratio;

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

    // this is the pixels per time unit
    var ratio = this.data_window.width / data_x_range;
    var end_x = Math.floor((area.size.width - area.origin.x - this.data_window.origin) / ratio + this.data[0].timestamp);
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
        if (this.options.view_range !== null) {
            this.options.view_range(this, this.x_axis.range, this.y_axis.range);
        }

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
