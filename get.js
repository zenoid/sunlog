
var parser = require( __dirname + '/lib/parser' ),
  startingDay = new Date( 2014, 11, 1 );

parser.getLocationData( startingDay );
