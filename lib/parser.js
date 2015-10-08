


var fs = require( 'fs' ),
  request = require( 'request' ),
  path = require( 'path' ),
  cookies = require( 'cookies.txt' ),
  parseXML = require( 'xml2js' ).parseString,
  locationsFile = path.join( __dirname, '../data/locations.json' ),
  locations = {},
  cookiesFile = path.join( __dirname, '../private/googleCookies' ),
  cookiesDomain = 'https://.google.com',
  locationHistoryURL = 'https://www.google.com/maps/timeline/kml?authuser=0&pb=!1m8!1m3!1i',
  gMapsApiKey,
  gMapsApiKeyFile = path.join( __dirname, '../private/gMapsApiKey' ),
  gMapsApiURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=',
  gMapsApiParams = '&result_type=country&key=',
  firstDayNum = 0,
  startingDay, day, today, endingDay;



/*                      LOCATION HISTORY DATA
------------------------------------------------------------------------- */

// Getting Location History

var getLocationHistory = function() {

  log( 'Cookie File LOADED', true );

  // Loading Location History

  if ( startingDay >= endingDay ) {
    log( 'Already UP-TO-DATE', true );
    return;
  }

  log( 'Getting data from ' + formatDate( startingDay ) + ' to ' + formatDate( endingDay ) );

  request.get({

    // url: locationHistoryURL + '?startTime=' + startingDay.getTime() + '&endTime=' + endingDay.getTime(),
    url: locationHistoryURL + startingDay.getFullYear() + '!2i' + startingDay.getMonth() + '!3i' + startingDay.getDate() + '!2m3!1i' + endingDay.getFullYear() + '!2i' + endingDay.getMonth() + '!3i' + endingDay.getDate(),
    jar: true,
    encoding: 'utf-8',
    headers: {
      Cookie: cookies.getCookieString( cookiesDomain )
    }

  }, function( error, response, body ) {

    log( 'Location History LOADED', true );

    // Parsing Location History

    parseXML( body, function ( err, result ) {

      var locationsData = result.kml.Document[ 0 ].Placemark[ 0 ][ 'gx:Track' ][ 0 ],
        itemDay, previousDay,
        dayValues = [];

      for ( var i = 0; i < locationsData.when.length; i++ ) {

        var d = new Date( locationsData.when[ i ] );
        itemDay = new Date( d.getFullYear(), d.getMonth(), d.getDate() );

        if ( previousDay && itemDay > startingDay && previousDay.getTime() !== itemDay.getTime() ) {
          log( formatDate( previousDay ) + ' | locations recorded: ' + dayValues.length );
          var middleDayNum = Math.floor( dayValues.length / 2 ),
            locationsArray = locationsData[ 'gx:coord' ][ dayValues[ middleDayNum ] ].split( ' ' );
          locations[ formatDate( previousDay ) ] = { lat: ( +locationsArray[ 1 ] ).toFixed( 2 ), lon: ( +locationsArray[ 0 ] ).toFixed( 2 ) };
          dayValues = [];
        } else {
          dayValues.push( i );
        }

        previousDay = new Date( itemDay );

      }

      // Sorting locations

      locations = sortByDate( locations );

      // Filling missing days

      var firstDay = new Date( Object.keys( locations )[ 0 ] ),
        lastDay = new Date( Object.keys( locations )[ Object.keys( locations ).length - 1 ] ),
        expectedDay = new Date( Object.keys( locations )[ 0 ] ),
        daysNum = Math.round( ( lastDay - firstDay ) / ( 1000*60*60*24 ) ) + 1;

      for ( var n = 1; n < daysNum; n++ ) {
        if ( !locations[ formatDate( expectedDay ) ] ) {
          var prevDay = new Date( expectedDay.getTime() ).setDate( expectedDay.getDate() - 1 );
          locations[ formatDate( expectedDay ) ] = locations[ formatDate( new Date( prevDay ) ) ];
          log( 'Missing location: ' + formatDate( expectedDay ) );
        }
        expectedDay.setDate( expectedDay.getDate() + 1 );
      }

      log( 'Location History PARSED', true );
      getCountriesData();

    });

  });

};

// Loading Google Cookies

var loadGoogleCookies = function() {
  cookies.parse( cookiesFile, getLocationHistory );
};



/*                      COUNTRIES DATA
------------------------------------------------------------------------- */

// Loading Google Maps API Key

var getCountriesData = function() {
  fs.readFile( gMapsApiKeyFile, 'utf-8', function( err, k ) {
    if ( err ) throw err;
    log( 'Google Maps API key LOADED', true );
    gMapsApiKey = k;
    getCountryName( firstDayNum );
  });
};

// Getting Country Names

var getCountryName = function( dayNum ) {

  day = Object.keys( locations )[ dayNum ];

  request.get({

    url: gMapsApiURL + locations[ day ].lat + ',' + locations[ day ].lon + gMapsApiParams + gMapsApiKey,
    encoding: 'utf-8',

  }, function( error, response, body ) {

    var results = JSON.parse( body ).results,
      c = results[ results.length - 1 ].address_components[ 0 ].long_name;
    locations[ day ].country = c;
    log( day + ' | ' + locations[ day ].country );

    if ( Object.keys( locations )[ dayNum + 1 ] ) {

      getCountryName( dayNum + 1 );

    } else {

      log( 'Countries Data PARSED', true );
      getWeatherData();

    }

  });

};



/*                      WEATHER HISTORY
------------------------------------------------------------------------- */

var getWeatherData = function () {

  var apiKey,
    apiKeyFile = path.join( __dirname, '../private/forecastIOApiKey' ),
    apiURL = 'https://api.forecast.io/forecast/',
    apiParams = '?units=si&exclude=flags,hourly',
    timestamp, timeZoneOffset, formattedDay;

  // Loading Forecast.IO API Key

  var loadForecastIOApiKey = function() {
    fs.readFile( apiKeyFile, 'utf-8', function( err, k ) {
      if ( err ) throw err;
      log( 'Forecast.IO API key LOADED', true );
      apiKey = k;
      getWeatherDay( firstDayNum );
    });
  };

  // Loading Day Weather Data

  var getWeatherDay = function( dayNum ) {

    timestamp = Object.keys( locations )[ dayNum ];
    day = new Date( timestamp );
    timeZoneOffset = ( new Date() ).getTimezoneOffset() * 60000;
    formattedDay = ( new Date( day - timeZoneOffset ) ).toISOString().slice( 0, -13 ) + '00:00:00Z';

    request.get({

      url: apiURL + apiKey + '/' + locations[ timestamp ].lat + ',' + locations[ timestamp ].lon + ',' + formattedDay + apiParams,
      encoding: 'utf-8',

    }, function( error, response, body ) {

      var w = JSON.parse( body ).daily.data[ 0 ],
        type = w.icon;

      if ( type === 'partly-cloudy-night' || type === 'partly-cloudy-day' ) {
        type = 'partly-cloudy';
      }

      locations[ timestamp ].type = type;
      locations[ timestamp ].sunrise = w.sunriseTime;
      locations[ timestamp ].sunset = w.sunsetTime;
      locations[ timestamp ].min = +w.apparentTemperatureMin.toFixed( 1 );
      locations[ timestamp ].max = +w.apparentTemperatureMax.toFixed( 1 );
      locations[ timestamp ].clouds = w.cloudCover;

      log( timestamp + ' | ' + locations[ timestamp ].type + ' | ' + locations[ timestamp ].min + '-' + locations[ timestamp ].max );

      if ( Object.keys( locations )[ dayNum + 1 ] ) {

        getWeatherDay( dayNum + 1 );

      } else {

        log( 'Weather Data PARSED', true );

        // Saving Weather and Location Data
        saveLocationFile();

      }

    });

  };

  // Startup
  loadForecastIOApiKey();

};



/*                      UTILITIES
------------------------------------------------------------------------- */

var formatDate = function( d ) {
  return d.getFullYear() + '-' + ( '0' + ( d.getMonth() + 1 ) ).slice( -2 ) + '-' + ( '0' + d.getDate() ).slice( -2 );
};

var resetDate = function( d  ) {
  return new Date( formatDate( d ) );
};

var log = function( msg, isBright ) {
  if ( isBright ) {
    console.log( '\x1b[1m%s\x1b[0m', '\n----- ' + msg );
  } else {
    console.log( msg );
  }
};

var sortByDate = function( arr ) {
  var keys = Object.keys( arr ),
    n,
    sortedArr = {};
  keys.sort();
  for ( n = 0; n < keys.length; n++ ) {
    sortedArr[ keys[ n ] ] = arr[ keys[ n ] ];
  }
  return sortedArr;
};

var saveLocationFile = function () {
  fs.writeFile( locationsFile, JSON.stringify( locations ), function( err ) {
    if ( err ) throw err;
    log( 'Weather and Location Data SAVED', true );
  });
};



/*                      PUBLIC METHODS
------------------------------------------------------------------------- */

exports.getLocationData = function ( d ) {

  startingDay = resetDate( d );
  today = new Date();
  endingDay = resetDate( new Date( today.getFullYear(), today.getMonth(), today.getDate() - 1 ) );
  loadGoogleCookies();

};

exports.updateLocationData = function ( d ) {

  startingDay = resetDate( d );

  fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
    if ( err ) throw err;
    locations = JSON.parse( fileContent );
    firstDayNum = Object.keys( locations ).length;
    exports.getLocationData( d );
  });

};


