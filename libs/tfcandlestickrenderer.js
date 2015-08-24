function TFChartCandlestickRenderer(options) {
    var default_theme = {
            upFillColor: "rgb(215, 84, 66)",
            upStrokeColor: "rgb(107, 42, 33)",
            downFillColor: "rgb(107, 165, 131)",
            downStrokeColor: "rgb(53, 82, 65)",
            wickColor: "rgb(180, 180, 180)"        
    };

    var defaults = {
        theme: default_theme
    };

    this.options = $.extend({}, defaults, options || {});
    this.options.theme = $.extend({}, defaults.theme, this.options.theme || {});
}

TFChartCandlestickRenderer.prototype._fillCandle = function(ctx, isUp) {
    if (!isUp) {
        ctx.fillStyle = this.options.theme.upFillColor;
        ctx.strokeStyle = this.options.theme.upStrokeColor;
    } else {
        ctx.fillStyle = this.options.theme.downFillColor;
        ctx.strokeStyle = this.options.theme.downStrokeColor;
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

            ctx.strokeStyle = self.options.theme.wickColor;
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
