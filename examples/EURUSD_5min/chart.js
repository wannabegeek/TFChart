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
        },
        view_range: function(chart, x_range, y_range) {
            $("input#startDate").val(moment(x_range.position * 1000).format("YYYY-MM-DD HH:mm:ss"));
            $("input#endDate").val(moment((x_range.position + x_range.span) * 1000).format("YYYY-MM-DD HH:mm:ss"));
        },
        controller: {
            has_data_available: function(chart, range) {
                console.log("Requested: " + moment(range.position * 1000).format("YYYY-MM-DD HH:mm:ss") + " --> " + moment((range.position + range.span) * 1000).format("YYYY-MM-DD HH:mm:ss"));
                return ((range.position + range.span) > sampleData[0].timestamp && range.position < sampleData[sampleData.length - 1].timestamp)
            },
            fetch_data: function(chart, range, callback) {
                console.log("Need to return more data");
                var result = [];
                $.each(sampleData, function(index, value) {
                    if (range.intersects(value.timestamp)) {
                        result.push(value);
                    }
                });
                callback(result);
            }
        }
    };
    chart = new TFChart($('#chartContainer'), renderer, options);
    chart.setPeriod(300);

    var initialData = sampleData.slice(0, sampleData.length / 3);
    chart.setData(initialData);

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

    // setTimeout(function(c) {
    //     c.setVisible(1432565100, 1432775700);
    // }, 5000, chart);


    $("#submit_btn").click(function(event) {
        event.preventDefault();
        // validate and process form here
        var startDate = $("input#startDate").val();
        var startDateObj = moment(startDate, "YYYY-MM-DD HH:mm:ss");

        var endDate = $("input#endDate").val();
        var endDateObj = moment(endDate, "YYYY-MM-DD HH:mm:ss");
        
        chart.setVisible(TFChartRangeMake(startDateObj.unix(), endDateObj.unix() - startDateObj.unix()));

        return false;
    });
});
