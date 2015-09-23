function TFChartBarChartRenderer() {
}

TFChartBarChartRenderer.prototype.setOptions = function(options) {
    var default_theme = {
            barFillColor: "rgb(215, 84, 66)",
            barStrokeColor: "rgb(107, 42, 33)"
    };

    this.theme = $.extend({}, default_theme, options.theme.barchart || {});
}


TFChartBarChartRenderer.prototype._fillCandle = function(ctx, isUp) {
}

TFChartBarChartRenderer.prototype.render = function(data, chart) {

    var ctx = chart.context;
    var x_start = chart.pixelValueAtXValue(data[0].timestamp);
    var x_end = chart.pixelValueAtXValue(data[data.length - 1].timestamp);
    var x_delta = x_end - x_start;
    var bar_width = (x_delta / data.length) / 1.5;
    var half_bar_width = bar_width / 2.0;

    ctx.fillStyle = this.theme.barFillColor;
    ctx.strokeStyle = this.theme.barStrokeColor;

    self = this;
    $.each(data, function(index, point) {
        if (chart.doesXValueIntersectVisible(point.timestamp)) {
            var plot = chart._plotArea();
            var body_top = Math.round(chart.pixelValueAtYValue(point.close)) + 0.5;
            var offset = chart.pixelValueAtXValue(point.timestamp);

            if (offset > -half_bar_width) {
                ctx.beginPath();
                ctx.rect(Math.round(offset - half_bar_width) + 0.5,
                                body_top,
                                bar_width,
                                plot.origin.y + plot.size.height - body_top);

                ctx.fill();
                ctx.stroke();
            }
        }
    });

}
