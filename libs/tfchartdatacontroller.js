var TFChartDataRequestType = Object.freeze({
    PREPEND: 1,
    APPEND: 2
});

function TFChartDataController(chart, controller) {
    this.chart = chart;
    this.controller = controller;
    this.data = [];

    this.has_pending_data_request = false;
    this.pending_request_queue = [];

    this.no_data = 0;
    this.data_range = null;
}

TFChartDataController.prototype.setData = function(data) {
    this.data = data;
    this.data_range = new TFChartRange(this.data[0].timestamp, this.data[this.data.length - 1].timestamp - this.data[0].timestamp);
}

TFChartDataController.prototype.processPendingRequestQueue = function(range) {
    var range = this.pending_request_queue.shift();
    // we need to make sure we don't request the same data
    var intersection = TFChartIntersectionRange(this.data_range, range);
    if (intersection.span > 0) { // something intersects
        if (TFChartEqualRanges(intersection, range)) {
            // we already have this pending data
            return;
        } else {
            // we need to update 'range'
            if (range.position == intersection.position) {
                // the beginning over laps
                range.position += intersection.span;
                range.span -= intersection.span;
            } else if (TFChartRangeMax(range) == TFChartRangeMax(intersection)) {
                // the end over laps
                range.span -= intersection.position - range.position;
            }
        }
    }
    this.requestData(range);
}

TFChartDataController.prototype.canSupplyData = function(operation) {
    return !isNullOrUndefined(this.controller) && (this.no_data & operation) != operation;
}

TFChartDataController.prototype.requestData = function(range, operation, cb) {
    if (this.has_pending_data_request === false) {
        if (this.controller.has_data_available(this.chart, range)) {
            this.has_pending_data_request = true;
            var self = this;
            this.controller.fetch_data(this.chart, range, function(data) {
                if (operation === TFChartDataRequestType.PREPEND) {
                    self.setData(data.concat(self.data));
                } else {
                    self.setData(self.data.concat(data));
                }
                cb(data);
                self.has_pending_data_request = false;
            });
        } else {
            console.log("No more " + operation + " data");
            this.no_data |= operation;
        }
    } else {
        console.log("Data request already in progress");
        // we need to add our request to a queue
        this.pending_request_queue.push([operation, range]);               
    }
}

TFChartDataController.prototype.purgeData = function(range) {
}
