
var parser = require( './lib/parser' ),
  startingDay = new Date( 2014, 10, 21 ); // Nov 21 2014

parser.getLocationHistory( startingDay, function( locations ){
  parser.getWeatherData( locations );
});
