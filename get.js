
var parser = require( './lib/parser' ),
  startingDay = new Date( 2014, 10, 1 );

parser.getLocationHistory( startingDay, function( locations ){
  parser.getWeatherData( locations );
});
