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
