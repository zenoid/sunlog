
var parser = require( './lib/parser' ),
  startingDay = new Date( 2015, 0, 1 );

parser.getLocationHistory( startingDay, function( locations ){
  parser.getWeatherData( locations );
});
