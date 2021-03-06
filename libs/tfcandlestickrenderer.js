function TFChartCandlestickRenderer() {
}

TFChartCandlestickRenderer.prototype.setOptions = function(options) {
    var default_theme = {
            upFillColor: "rgb(107, 165, 131)",
            upStrokeColor: "rgb(53, 82, 65)",
            downFillColor: "rgb(215, 84, 66)",
            downStrokeColor: "rgb(107, 42, 33)",
            wickColor: "rgb(180, 180, 180)"        
    };

    this.theme = $.extend({}, default_theme, options.theme.candlestick || {});
}


TFChartCandlestickRenderer.prototype._fillCandle = function(ctx, isUp) {
    if (isUp) {
        ctx.fillStyle = this.theme.upFillColor;
        ctx.strokeStyle = this.theme.upStrokeColor;
    } else {
        ctx.fillStyle = this.theme.downFillColor;
        ctx.strokeStyle = this.theme.downStrokeColor;
    }
    ctx.fill();
    ctx.stroke();
}

TFChartCandlestickRenderer.prototype.render = function(data, chart) {

    var ctx = chart.context;
    var x_start = chart.pixelValueAtXValue(data[0].timestamp);
    var x_end = chart.pixelValueAtXValue(data[data.length - 1].timestamp);
    var x_delta = x_end - x_start;
    var candle_width = (x_delta / data.length) / 1.5;
    var half_candle_width = candle_width / 2.0;

    self = this;
    $.each(data, function(index, point) {
        if (chart.doesXValueIntersectVisible(point.timestamp)) {
            var body_top = Math.round(chart.pixelValueAtYValue(Math.max(point.open, point.close))) + 0.5;
            var body_bottom = Math.round(chart.pixelValueAtYValue(Math.min(point.open, point.close))) + 0.5;

            var offset = chart.pixelValueAtXValue(point.timestamp);
            if (offset > -half_candle_width) {
                ctx.beginPath();
                ctx.rect(Math.round(offset - half_candle_width) + 0.5,
                                body_top,
                                candle_width,
                                body_bottom - body_top);
                self._fillCandle(ctx, point.close >= point.open);

                ctx.strokeStyle = self.theme.wickColor;
                ctx.beginPath();
                var wick_location = Math.round(offset) + 0.5;
                ctx.moveTo(wick_location, chart.pixelValueAtYValue(point.high));
                ctx.lineTo(wick_location, body_top);
                ctx.moveTo(wick_location, body_bottom);
                ctx.lineTo(wick_location, chart.pixelValueAtYValue(point.low));
                ctx.stroke();
            }
        }
    });

}
