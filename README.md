# TFChart
A Simple HTML5 Canvas for drawing financial charts Chart Drawing

## Using
The simplest way is to download the tfcharts.min.js from https://github.com/wannabegeek/TFChart/blob/master/dist/tfcharts.min.js and include it in you project.

TFChart also requires jquery to operate.

The best way to use this is probably to look under the examples directory and look at the code (it is pretty simple)

![Example Image](https://github.com/wannabegeek/TFChart/raw/master/examples/chart.png)

###The Chart
However, the basics are:
```javascript
var renderer = new TFChartCandlestickRenderer();
var chart = new TFChart($('#chartContainer'), renderer);
chart.setData(sampleData);
```

The renderer is the class used to render the data onto the chart canvas (currently there are 2 renderers, candlesticks and line charts).
The construct the TFChart object, providing the ```div``` container in which to place the chart.
Then set the data on the chart.

The data must be an array of elements in the following format:
```
{
	"timestamp":1432861800,
	"open":1.09598,
	"high":1.09634,
	"low":1.095845,
	"close":1.096335
}
```

The ```timestamp``` is a normal unix timestamp in seconds (not the javascript timestamp in milliseconds).

###Annotations
Extra annotations can be added to the chart. Currently there are the following;

1. TFChartPolygon(borderColor, fillColor)
2. TFChartLine(lineColor, point1, point2)
3. TFChartHorizontalRay(lineColor, point)
4. TFChartVerticalRay(lineColor, point, is_down)

You then add the annotation to the chart;
```javascript
chart.addAnnotation(annotation);
```

Extending the code to have more annotation types should be fairly simple  if you looks at the code.

## Building
To build the javascript you need to use npm (http://npmjs.com) and grunt (http://gruntjs.com)

1. Download and install nodejs from http://nodejs.org - this will install npm
2. Install grunt-cli by running... ```npm install -g grunt-cli```
3. If you haven't already clone the TFChart repository and navigate into the root directory
4. Run ```npm install``` to install all the dependencies
5. Run ```grunt``` to build the javascipt.