
var fs = require( 'fs' ),
  locationsFile = __dirname + '/data/locations.json',
  locationDays = 0;

fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
  if ( err ) throw err;

  console.log( '\x1b[1m%s\x1b[0m', '\n----- Locations' );

  var locationsData = JSON.parse( fileContent );

  for ( var t in locationsData ) {
    locationDays++;
    console.log( '' + t + ' | ' + locationsData[ t ].lat + ' ' + locationsData[ t ].lon + ' | ' + locationsData[ t ].country );
  }

  console.log( '\n' + locationDays + ' locations logged\n' );

});
