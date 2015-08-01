Sunlog
========

Using the "Google Location" data, silently logged from your smartphone behind your back, you can have a detailed history of the places you've been.
This script grabs and simplifies the data, and - thanks to the Forecast.IO API - gets the weather conditions for each past day, in each location.


## Setup

- "npm install"
- Go to your Google Locations history: https://www.google.com/maps/timeline
- Get the page cookies (for example, with this Chrome extension: https://chrome.google.com/webstore/detail/cookietxt-export/lopabhfecdfhgogdbojmaicoicjekelh)
- Save them in a text file called "googleCookies" in the root folder
- Create an account on Forecast.IO: https://developer.forecast.io/
- Get an API key, and save it in a text file called "forecastIOApiKey" in the root folder
- Open "get.js" and set your "startingDate" (the first day logged on Google Locations History, or the day to start from)
- Launch "**node get**" to store all the locations in data/locations.json and all the weather conditions in data/weather.json
- You can then launch "**node test**" to check if everything looks correct, and in the future you can use "**node update**" to append the missing days to the lists


### Notes

- For each day in the Google Locations history, the script stores the coordinates of the median sample
- If a day is missing in the history, the coordinates of the previous day will be duplicated
- The Forecast.IO API is free of charge for the first 1000 calls/day
