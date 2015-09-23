$(function() {
    renderer = new TFChartBarChartRenderer();

    // lets have some candles not the standard red/green
    var options = {
        view_range: function(chart, x_range, y_range) {
            $("input#startDate").val(moment(x_range.position).format("YYYY-MM-DD HH:mm:ss"));
            $("input#endDate").val(moment(x_range.position + x_range.span).format("YYYY-MM-DD HH:mm:ss"));
        }
    };
    chart = new TFChart($('#chartContainer'), renderer, options);
    chart.setPeriod(300000);

    chart.setData(sampleData);


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
