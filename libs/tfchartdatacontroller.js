var TFChartDataRequestType = Object.freeze({
    PREPEND: 1,
    APPEND: 2
});

function TFChartDataController(chart, controller, period, callback) {
    this.chart = chart;
    this.controller = controller;
    this.callback = callback;
    this.period = period;
    this.data = [];

    this.has_pending_data_request = false;
    this.pending_request_queue = [];

    this.no_data = 0;
    this.data_range = null;
}

TFChartDataController.prototype.setPeriod = function(period) {
    this.period = period;
}

TFChartDataController.prototype.setData = function(data) {
    this.data = this._normaliseData(data);
    this.data_range = new TFChartRange(this.data[0].timestamp, this.data[this.data.length - 1].timestamp - this.data[0].timestamp);
    this.no_data = 0;
}

TFChartDataController.prototype._normaliseData = function(data) {
    if (isNullOrUndefined(this.period)) {
        return data;
    } else {
        var lastPoint = data[0];
        var result = [lastPoint];
        var self = this;
        $.each(data, function(index, point) {
            if (index != 0) {
                // if (point.timestamp - lastPoint.timestamp > self.period) {
                //     console.log("We have a gap to fill " + lastPoint.timestamp + " -> " + point.timestamp + " [" + self.period + "]");
                // }
                while (point.timestamp - lastPoint.timestamp > self.period) {
                    lastPoint = {
                        timestamp : lastPoint.timestamp + self.period,
                        open: lastPoint.close,
                        high: lastPoint.close,
                        low: lastPoint.close,
                        close: lastPoint.close
                    };
                    result.push(lastPoint);    
                }
                result.push(point);
                lastPoint = point;
            }
        });
        return result;
    }
}

TFChartDataController.prototype._removeCurrentDataFromRange = function(range) {
    if (range !== null) {
        // we need to make sure we don't request the same data
        var intersection = TFChartIntersectionRange(this.data_range, range);
        if (intersection.span > 0) { // something intersects
            if (TFChartEqualRanges(intersection, range)) {
                // we already have this pending data
                return null;
            } else {
                // we need to update 'range'
                if (range.position == intersection.position) {
                    // the beginning over laps
                    range.position += intersection.span + this.period;
                    range.span -= intersection.span;
                } else if (TFChartRangeMax(range) == TFChartRangeMax(intersection)) {
                    // the end over laps
                    range.span = intersection.position - range.position - this.period;
                }
            }
        }
    }
    return range;
}

TFChartDataController.prototype.processPendingRequestQueue = function() {
    var prependRange = null;
    var appendRange = null;
    $.each(this.pending_request_queue, function(index, request) {
        if (request[0] == TFChartDataRequestType.PREPEND) {
            if (isNullOrUndefined(prependRange)) {
                prependRange = request[1];
            } else {
                prependRange = TFChartUnionRange(prependRange, request[1]);
            }
        } else {
            if (isNullOrUndefined(appendRange)) {
                appendRange = request[1];
            } else {
                appendRange = TFChartUnionRange(appendRange, request[1]);
            }
        }
    });
    this.pending_request_queue = [];

    prependRange = this._removeCurrentDataFromRange(prependRange);
    appendRange = this._removeCurrentDataFromRange(appendRange);

    if (!isNullOrUndefined(prependRange) && this.canSupplyData(TFChartDataRequestType.PREPEND)) {
        this.requestData(prependRange, TFChartDataRequestType.PREPEND);
    }
    if (!isNullOrUndefined(appendRange) && this.canSupplyData(TFChartDataRequestType.APPEND)) {
        this.requestData(appendRange, TFChartDataRequestType.APPEND);
    }
}

TFChartDataController.prototype.canSupplyData = function(operation) {
    return !isNullOrUndefined(this.controller) && (this.no_data & operation) != operation;
}

TFChartDataController.prototype.requestData = function(range, operation) {
    if (this.has_pending_data_request === false) {
        if (this.controller.has_data_available(this.chart, range, this.period)) {
            this.has_pending_data_request = true;
            var self = this;
            this.controller.fetch_data(this.chart, range, this.period, function(data) {
                if (operation === TFChartDataRequestType.PREPEND) {
                    self.setData(data.concat(self.data));
                } else {
                    self.setData(self.data.concat(data));
                }
                self.callback(data, operation);
                self.has_pending_data_request = false;
                self.processPendingRequestQueue();
            });
        } else {
            this.no_data |= operation;
        }
    } else {
        // we need to add our request to a queue
        this.pending_request_queue.push([operation, range]);               
    }
}

TFChartDataController.prototype.purgeData = function(range) {
}
