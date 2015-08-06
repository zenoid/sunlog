
var fs = require( 'fs' ),
  parser = require( __dirname + '/lib/parser' ),
  locationsFile = __dirname + '/data/locations.json',
  startingDay;

fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
  if ( err ) throw err;

  var locationsData = JSON.parse( fileContent ),
    lastDay = 0,
    endingDay = new Date();

  endingDay.setDate( endingDay.getDate() - 1 );

  for ( var t in locationsData ) {
    lastDay = Math.max( lastDay, t );
  }
  lastDay = new Date( lastDay );

  if ( new Date( endingDay.getFullYear(), endingDay.getMonth(), endingDay.getDate() ) > lastDay ) {
    startingDay = new Date( lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1 );
    console.log( '\n----- UPDATING from ' + String( lastDay ).substring( 0, 15 ) + ' -----\n' );
    parser.updateLocationHistory( startingDay, function( locations ){
      parser.updateWeatherData( startingDay, locations );
    });
  } else {
    console.log( '\n----- Already up-to-date -----\n' );
  }

});
