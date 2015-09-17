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
            $("input#startDate").val(moment(x_range.position).format("YYYY-MM-DD HH:mm:ss"));
            $("input#endDate").val(moment(x_range.position + x_range.span).format("YYYY-MM-DD HH:mm:ss"));
        },
        controller: {
            has_data_available: function(chart, range, period) {
                return ((range.position + range.span) > sampleData[0].timestamp && range.position < sampleData[sampleData.length - 1].timestamp)
            },
            fetch_data: function(chart, range, period, callback) {
                console.log("Requested: " + moment(range.position).format("YYYY-MM-DD HH:mm:ss") + " --> " + moment(range.position + range.span).format("YYYY-MM-DD HH:mm:ss"));
                var result = [];
                $.each(sampleData, function(index, value) {
                    if (range.intersects(value.timestamp)) {
                        result.push(value);
                    }
                });
                setTimeout(callback, 1000, result);
                //callback(result);
            }
        }
    };
    chart = new TFChart($('#chartContainer'), renderer, options);
    chart.setPeriod(300000);

    console.log("Complete dataset: " + moment(sampleData[0].timestamp).format("YYYY-MM-DD HH:mm:ss") + " --> " + moment(sampleData[sampleData.length - 1].timestamp).format("YYYY-MM-DD HH:mm:ss"));
    var t = sampleData.length / 3;
    var initialData = sampleData.slice(t, t * 2);
    chart.setData(initialData);


    $("#submit_btn").click(function(event) {
        event.preventDefault();
        // validate and process form here
        var startDate = $("input#startDate").val();
        var startDateObj = moment(startDate, "YYYY-MM-DD HH:mm:ss");

        var endDate = $("input#endDate").val();
        var endDateObj = moment(endDate, "YYYY-MM-DD HH:mm:ss");
        
        chart.setVisible(TFChartRangeMake(startDateObj.valueOf(), endDateObj.valueOf() - startDateObj.valueOf()));

        return false;
    });
});
