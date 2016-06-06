


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

var locationFixes = {
  '2015-06-25': { lat: 51.55, lon: -0.14 },
  '2015-06-27': { lat: 51.55, lon: -0.14 },
  '2015-10-17': { lat: 41.90, lon: 12.51 },
  '2016-05-25': { lat: 44.08, lon: 11.70 },
  '2016-05-26': { lat: 44.08, lon: 11.70 },
  '2016-05-27': { lat: 44.08, lon: 11.70 },
  '2016-05-28': { lat: 44.08, lon: 11.70 },
  '2016-05-29': { lat: 44.08, lon: 11.70 },
  '2016-05-30': { lat: 44.08, lon: 11.70 },
  '2016-05-31': { lat: 44.08, lon: 11.70 },
  '2016-06-01': { lat: 44.08, lon: 11.70 },
  '2016-06-02': { lat: 44.08, lon: 11.70 },
  '2016-06-03': { lat: 44.08, lon: 11.70 },
  '2016-06-04': { lat: 44.08, lon: 11.70 },
  '2016-06-05': { lat: 44.08, lon: 11.70 }
};



/*                      LOCATION HISTORY DATA
------------------------------------------------------------------------- */

// Getting Location History

var getLocationHistory = function() {

  log( 'LOADING Google Location History', true );

  if ( startingDay >= endingDay ) {
    log( 'Already UP-TO-DATE', true );
    return;
  }

  log( 'Getting data from ' + formatDate( startingDay ) + ' to ' + formatDate( endingDay ) );

  getLocationHistoryDay( startingDay );

};

// Getting Location History Day

var getLocationHistoryDay = function( day ) {

  var dayArr = formatDate( day ).split( '-' );

  request.get({

    url: locationHistoryURL + ( +dayArr[ 0 ] ) + '!2i' + ( +dayArr[ 1 ] - 1 ) + '!3i' + ( +dayArr[ 2 ] ) + '!2m3!1i' + ( +dayArr[ 0 ] ) + '!2i' + ( +dayArr[ 1 ] - 1 ) + '!3i' + ( +dayArr[ 2 ] ),
    jar: true,
    encoding: 'utf-8',
    headers: {
      Cookie: cookies.getCookieString( cookiesDomain )
    }

  }, function( err, response, body ) {

    parseXML( body, function ( err, result ) {

      var locationsData = result.kml.Document[ 0 ].Placemark[ 0 ][ 'gx:Track' ][ 0 ],
        middleDayNum, locationsArray, i, nextDay;

      if ( locationsData.when ) {

        middleDayNum = Math.floor( locationsData.when.length / 2 );
        locationsArray = locationsData[ 'gx:coord' ][ middleDayNum ].split( ' ' );
        locations[ formatDate( day ) ] = { lat: ( +locationsArray[ 1 ] ).toFixed( 2 ), lon: ( +locationsArray[ 0 ] ).toFixed( 2 ) };

        log( formatDate( day ) + ' | locations recorded: ' + locationsData.when.length );

      } else {

        log( 'No data for ' + formatDate( day ) );

      }

      if ( locationFixes[ formatDate( day ) ] ) {
        locations[ formatDate( day ) ] = locationFixes[ formatDate( day ) ];
      }

      nextDay = new Date( ( new Date( day ) ).setDate( new Date( day ).getDate() + 1 ) );

      if ( nextDay <= endingDay ) {
        getLocationHistoryDay( nextDay );
      } else {
        finalizeLocationHistory();
      }

    });

  });

};

// Finalizing Location History

var finalizeLocationHistory = function() {

  // Filling missing days

  var firstDayArr = Object.keys( locations )[ 0 ].split( '-' ),
    firstDay = new Date( +firstDayArr[ 0 ], +firstDayArr[ 1 ] - 1, +firstDayArr[ 2 ] ),
    lastDayArr = Object.keys( locations )[ Object.keys( locations ).length - 1 ].split( '-' ),
    lastDay = new Date( +lastDayArr[ 0 ], +lastDayArr[ 1 ] - 1, +lastDayArr[ 2 ] ),
    expectedDay = new Date( +firstDayArr[ 0 ], +firstDayArr[ 1 ] - 1, +firstDayArr[ 2 ] ),
    daysNum = Math.round( ( lastDay - firstDay ) / ( 1000*60*60*24 ) ) + 1;

  for ( var n = 1; n < daysNum; n++ ) {
    if ( !locations[ formatDate( expectedDay ) ] ) {
      var prevDay = new Date( expectedDay.getTime() ).setDate( expectedDay.getDate() - 1 );
      locations[ formatDate( expectedDay ) ] = locations[ formatDate( new Date( prevDay ) ) ];
      log( 'Missing location: ' + formatDate( expectedDay ) );
    }
    expectedDay.setDate( expectedDay.getDate() + 1 );
  }

  // Sorting locations
  locations = sortByDate( locations );

  log( 'Location History PARSED', true );
  getCountriesData();

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
    log( 'LOADING country data', true );
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
      country;

    for ( var i = 0; i < results.length; i++ ) {
      var addr = results[ i ].address_components;
      for ( var j = 0; j < addr.length; j++ ) {
        if ( addr[ j ].types[ 0 ] === 'country' ) {
          country = addr[ j ].long_name;
        }
      }
    }
    locations[ day ].country = country;
    log( day + ' | ' + locations[ day ].country );

    if ( Object.keys( locations )[ dayNum + 1 ] ) {

      setTimeout(function(){
        getCountryName( dayNum + 1 );
      }, 100);

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
    formattedDay = timestamp + 'T00:00:00Z';

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

var normalizeDate = function( d ) {
  var timeZoneOffset = ( new Date() ).getTimezoneOffset() * 60000;
  return new Date( d.getTime() + timeZoneOffset );
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

  startingDay = d;
  today = new Date();
  endingDay = new Date( today.getFullYear(), today.getMonth(), today.getDate() - 1 );
  loadGoogleCookies();

};

exports.updateLocationData = function ( d ) {

  d = normalizeDate( d );
  startingDay = new Date( d.setDate( d.getDate() + 1 ) );

  fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
    if ( err ) throw err;
    locations = JSON.parse( fileContent );
    firstDayNum = Object.keys( locations ).length;
    exports.getLocationData( d );
  });

};


