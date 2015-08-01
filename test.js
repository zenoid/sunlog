
var fs = require( 'fs' ),
  locationsFile = 'data/locations.json',
  weatherFile = 'data/weather.json',
  locationDays = 0,
  weatherDays = 0;

fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
  if ( err ) throw err;

  console.log( '\n----- Locations -----\n' );

  var locationsData = JSON.parse( fileContent );

  for ( var t in locationsData ) {
    locationDays++;
    console.log( '' + new Date( +t ), locationsData[ t ].lat, locationsData[ t ].lon );
  }

  fs.readFile( weatherFile, 'utf-8', function( err, fileContent ) {
    if ( err ) throw err;

    console.log( '\n----- Weather Conditions -----\n' );

    var weatherData = JSON.parse( fileContent );

    for ( var t in weatherData ) {
      weatherDays++;
      console.log( '' + new Date( +t ), weatherData[ t ].type );
    }

    console.log( '\n\t' + locationDays + ' locations logged' );
    console.log( '\t' + weatherDays + ' weather conditions logged\n' );

  });

});
