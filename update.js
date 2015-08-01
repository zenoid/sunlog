
var fs = require( 'fs' ),
  parser = require( './lib/parser' ),
  locationsFile = 'data/locations.json',
  startingDay;

fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
  if ( err ) throw err;

  var locationsData = JSON.parse( fileContent ),
    lastDate = 0,
    today = new Date();

  for ( var t in locationsData ) {
    lastDate = Math.max( lastDate, t );
  }
  lastDate = new Date( lastDate );

  if ( new Date( today.getFullYear(), today.getMonth(), today.getDate() ) > lastDate ) {
    startingDay = new Date( lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1 );
    console.log( '\n----- UPDATING from ' + String( lastDate ).substring( 0, 15 ) + ' -----\n' );
    parser.updateLocationHistory( startingDay, function( locations ){
      parser.updateWeatherData( startingDay, locations );
    });
  } else {
    console.log( '\n----- Already up-to-date -----\n' );
  }

});
