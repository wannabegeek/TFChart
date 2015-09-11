$(function() {
    renderer = new TFChartCandlestickRenderer();

    // lets have some candles not the standard red/green
    var options = {
        theme: {
            candlestick: {
                upFillColor: "rgb(84, 215, 66)",
                upStrokeColor: "rgb(42, 107, 33)",
                downFillColor: "rgb(107, 165, 131)",
                downStrokeColor: "rgb(53, 82, 65)",
            }
        }
    };
    chart = new TFChart($('#chartContainer'), renderer, options);

    chart.setData(sampleData);//.slice(sampleData.length - 100));

    annotation = new TFChartPolygon('rgba(0, 255, 255, 0.9)', 'rgba(0, 255, 255, 0.3)');
    annotation.add(TFChartPointMake(sampleData[0].timestamp, 1.0920));
    annotation.add(TFChartPointMake(sampleData[0].timestamp, 1.0900));
    annotation.add(TFChartPointMake(sampleData[sampleData.length - 1].timestamp, 1.0900));
    annotation.add(TFChartPointMake(sampleData[sampleData.length - 1].timestamp, 1.09200));

    chart.addAnnotation(annotation);

    annotation2 = new TFChartLine('rgba(50, 255, 0, 0.9)', TFChartPointMake(sampleData[500].timestamp, 1.0851), TFChartPointMake(sampleData[700].timestamp, 1.0957));
    chart.addAnnotation(annotation2);

    annotation3 = new TFChartHorizontalRay('rgba(50, 50, 0, 0.9)', TFChartPointMake(sampleData[554].timestamp, sampleData[554].low));
    chart.addAnnotation(annotation3);

    annotation4 = new TFChartVerticalRay('rgba(50, 50, 160, 0.9)', TFChartPointMake(sampleData[564].timestamp, sampleData[564].high));
    chart.addAnnotation(annotation4);
});
