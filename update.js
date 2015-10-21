
var fs = require( 'fs' ),
  parser = require( __dirname + '/lib/parser' ),
  locationsFile = __dirname + '/data/locations.json';

fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
  if ( err ) throw err;

  var locations = JSON.parse( fileContent ),
    daysList = Object.keys( locations );

  parser.updateLocationData( new Date( daysList[ daysList.length - 1 ] ) );

});
