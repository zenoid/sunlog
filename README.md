Sunlog
========

Using the "Google Location" data, silently logged from your smartphone behind your back, you can have a detailed history of the places you've been.
This script grabs and simplifies the data, and - thanks to the GoogleMaps and Forecast.IO API - stores the countries you've been and the weather conditions of each past day.


## Setup

- **npm install**
- Open "get.js" and set your **startingDate** (the first day logged on Google Locations History, or the day to start from)
- Create a **/private** folder, where you'll save 3 files:
1. **googleCookies**: dump your Google cookies in JAR format, using this:
https://github.com/proudlygeek/google-cookies-dump
2. **gMapsApiKey**: get an API key for Google Maps:
https://developers.google.com/maps/documentation/javascript/get-api-key
3. **forecastIOApiKey**: get an API key for Forecast.IO:
https://developer.forecast.io

## Usage

- **node get** to store all the data in data/locations.json
- **node update** to append new days to the list
- **node test** to check how many days have been logged

### Notes

- For each day in the Google Locations history, the script stores the coordinates of the median sample
- If a day is missing in the history, the coordinates of the previous day will be duplicated
- The Forecast.IO API is free of charge for the first 1000 calls/day
