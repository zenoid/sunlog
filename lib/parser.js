


var fs = require( 'fs' ),
  request = require( 'request' ),
  updating = false;



/*                      GOOGLE LOCATION HISTORY
------------------------------------------------------------------------- */

exports.getLocationHistory = function ( startingDay, callback ) {

  var cookies = require( 'cookies.txt' ),
    parseXML = require( 'xml2js' ).parseString,
    cookiesFile = 'googleCookies',
    cookiesDomain = 'https://.google.com',
    locationsFile = 'data/locations.json',
    locationHistoryURL = 'https://maps.google.com/locationhistory/b/0/kml',
    locations = {},
    today = new Date();

  var saveLocationsHistory = function () {
    fs.writeFile( locationsFile, JSON.stringify( locations ), function( err ) {
      if ( err ) throw err;
      console.log( '\n----- Location History SAVED -----\n' );
      callback( locations );
    });
  };

  cookies.parse( cookiesFile, function( jsonCookieObj ) {

    console.log( '\n----- Cookie File LOADED -----\n' );

    // Loading Location History

    request.get({

      url: locationHistoryURL + '?startTime=' + startingDay.getTime() + '&endTime=' + today.getTime(),
      jar: true,
      encoding: 'utf-8',
      headers: {
        Cookie: cookies.getCookieString( cookiesDomain )
      }

    }, function( error, response, body ) {

      console.log( '\n----- Location History LOADED -----\n' );

      // Parsing Location History

      parseXML( body, function ( err, result ) {

        var locationsData = result.kml.Document[ 0 ].Placemark[ 0 ][ 'gx:Track' ][ 0 ],
          itemDay, previousDay,
          dayValues = [];

        for ( var i = 0; i < locationsData.when.length; i++ ) {

          var d = new Date( locationsData.when[ i ] );
          itemDay = new Date( d.getFullYear(), d.getMonth(), d.getDate() );

          if ( ( previousDay && previousDay.getTime() !== itemDay.getTime() ) || i === locationsData.when.length-1 ) {
            console.log( previousDay + ' | locations recorded: ' + dayValues.length );
            var middleDayNum = Math.floor( dayValues.length / 2 ),
              locationsArray = locationsData[ 'gx:coord' ][ dayValues[ middleDayNum ] ].split( ' ' );
            locations[ previousDay.getTime() ] = { lat: ( +locationsArray[ 1 ] ).toFixed( 2 ), lon: ( +locationsArray[ 0 ] ).toFixed( 2 ) };
            dayValues = [];
          } else {
            dayValues.push( i );
          }

          previousDay = new Date( itemDay );

        }

        // filling missing days

        var firstDay = new Date( +Object.keys( locations )[ 0 ] ),
          lastDay = new Date( +Object.keys( locations )[ Object.keys( locations ).length - 1 ] ),
          expectedDay = new Date( +Object.keys( locations )[ 0 ] ),
          daysNum = Math.round( ( lastDay - firstDay ) / ( 1000*60*60*24 ) ) + 1;

        for ( var n = 1; n < daysNum - 1; n++ ) {
          if ( !locations[ expectedDay.getTime() ] ) {
            var prevDay = new Date( expectedDay.getTime() ).setDate( expectedDay.getDate() - 1 );
            locations[ expectedDay.getTime() ] = locations[ prevDay ];
            console.log( 'Missing location:', expectedDay );
          }
          expectedDay.setDate( expectedDay.getDate() + 1 );
        }

        // sorting locations

        var locationsKeys = Object.keys( locations ),
          sortedLocations = {};

        locationsKeys.sort();
        for ( n = 0; n < locationsKeys.length; n++ ) {
          sortedLocations[ locationsKeys[ n ] ] = locations[ locationsKeys[ n ] ];
        }
        locations = sortedLocations;

        console.log( '\n----- Location History PARSED -----\n' );

        // Saving Location History

        if ( updating ) {

          fs.readFile( locationsFile, 'utf-8', function( err, fileContent ) {
            if ( err ) throw err;
            var locationsJSON = JSON.parse( fileContent );
            for ( var t in locations ) {
              locationsJSON[ t ] = locations[ t ];
            }
            locations = locationsJSON;
            console.log( '\n----- Location History MERGED -----\n' );
            saveLocationsHistory();
          });

        } else {

          saveLocationsHistory();

        }

      });

    });
  });

};



/*                      WEATHER HISTORY
------------------------------------------------------------------------- */

exports.getWeatherData = function ( locations, firstDayNum ) {

  var apiKey,
    apiURL = 'https://api.forecast.io/forecast/',
    apiParams = '?units=si&exclude=flags,hourly',
    weatherFile = 'data/weather.json',
    timestamp, day, timeZoneOffset, formattedDay,
    weather = {};

  var saveWeatherData = function () {
    fs.writeFile( weatherFile, JSON.stringify( weather ), function( err ) {
      if ( err ) throw err;
      console.log( '\n----- Weather Data SAVED -----\n' );
    });
  };

  // Loading Forecast.IO API Key

  fs.readFile( 'forecastIOApiKey', 'utf-8', function( err, k ) {
    if ( err ) throw err;
    console.log( '\n----- Forecast.IO API key LOADED -----\n' );
    apiKey = k;
    getWeatherDay( firstDayNum || 0 );
  });

  // Loading Day Weather Data

  var getWeatherDay = function( dayNum ) {

    timestamp = Object.keys( locations )[ dayNum ];
    day = new Date( +timestamp );
    timeZoneOffset = ( new Date() ).getTimezoneOffset() * 60000;
    formattedDay = ( new Date( day - timeZoneOffset ) ).toISOString().slice( 0, -13 ) + '00:00:00Z';

    request.get({

      url: apiURL + apiKey + '/' + locations[ timestamp ].lat + ',' + locations[ timestamp ].lon + ',' + formattedDay + apiParams,
      encoding: 'utf-8',

    }, function( error, response, body ) {

      var w = JSON.parse( body ).daily.data[ 0 ];
      weather[ day.getTime() ] = {
        type: w.icon,
        sunriseTime: w.sunriseTime,
        sunsetTime: w.sunsetTime,
        temperatureMin: w.temperatureMin,
        temperatureMax: w.temperatureMax,
        humidity: w.humidity,
        windSpeed: w.windSpeed,
        cloudCover: w.cloudCover,
        precipType: w.precipType,
        precipAccumulation: w.precipAccumulation,
        precipIntensity: w.precipIntensity
      };

      console.log( day, w.icon, w.temperatureMin + '-' + w.temperatureMax );

      if ( Object.keys( locations )[ dayNum + 1 ] ) {

        getWeatherDay( dayNum + 1 );

      } else {

        console.log( '\n----- Weather Data PARSED -----\n' );

        // Saving Weather Data

        if ( updating ) {

          fs.readFile( weatherFile, 'utf-8', function( err, fileContent ) {
            if ( err ) throw err;
            var weatherFileJSON = JSON.parse( fileContent );
            for ( var t in weather ) {
              weatherFileJSON[ t ] = weather[ t ];
            }
            weather = weatherFileJSON;
            console.log( '\n----- Weather Data MERGED -----\n' );
            saveWeatherData();
          });

        } else {

          saveWeatherData();

        }

      }

    });

  };

};



/*                      SET UPDATE MODE
------------------------------------------------------------------------- */

exports.updateLocationHistory = function ( startingDay, callback ) {

  updating = true;
  this.getLocationHistory( startingDay, callback );

};

exports.updateWeatherData = function ( startingDay, locations ) {

  updating = true;
  var i = 0, t;
  for ( t in locations ) {
    if ( startingDay.getTime() === +t ) {
      this.getWeatherData( locations, i );
    }
    i++;
  }

};


