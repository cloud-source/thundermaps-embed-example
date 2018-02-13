Copyright 2018 ThunderMaps. Licenced under the MIT Licence, see LICENSE File for details.
# thundermaps-embed-example
This repository contains an example that shows how to embed a map with pins on your website.
To use this example, you will need to obtain a ThunderMaps API key, a channel ID and a MapBox token.
See [map.html](map.html) for a working example that just needs keys. 

Obtaining API Key and Channel ID
--------------------------------
You can obtain your API Key and Channel ID for any ThunderMaps channel you are allowed to report to by:

1. Going to https://app.thundermaps.com/#!/channel-manager
1. Select the channel you want to send reports to from the drop down box on the right
1. Click the 'Integrations' Tab
1. Click the 'ThunderBot' Intergration

API key
-------
To use any of these examples you will need a ThunderMaps API key. If you do not have one, you will need to create a ThunderMaps account at https://app.thundermaps.com/#!/sign-up.

Once you have your API key you will need to supply it as an option to `createMap`.

Channel ID
----------
In order to send a report you will need to create a channel to submit it to. You can do this at https://app.thundermaps.com/#!/new-channel.

Once you have your channel ID you will need to supply it as an option to `createMap`. Note that multiple ids may be used to show multiple channels on your map.

MapBox Token
------------
In order to display a map, you will need to register an account at https://mapbox.com, and then go to https://www.mapbox.com/account/ and supply your token as an option to `createMap`.

Usage
-----
Import the below scripts, and then call `createMap` with the required options.
```html
<script src='https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.0/mapbox-gl.js'></script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/then-request/2.2.0/request.min.js'></script>
    <script src='https://rawgit.com/emn178/js-sha1/master/src/sha1.js'></script>
    <script src='https://rawgit.com/mapbox/wellknown/master/wellknown.js'></script>
    <script src="https://cdn.jsdelivr.net/npm/promise-polyfill@7/dist/polyfill.min.js"></script>
    <script src='lib/map-tile.js'></script>
    <script src="lib/map.js"></script>
    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.0/mapbox-gl.css' rel='stylesheet' />
```

createMap will return a `mapbox-gl` [map](https://www.mapbox.com/mapbox-gl-js/api/#map).

createMap options
-----------------
The below list shows all options with defaults. Anything with required does not have a default and must be passed in.
```javascript
{
    //Your API Key, required
    "thundermapsKey": "",
    //Your token from mapbox, required
    "mapboxToken": "",
    //The element to place the map in, required
    "container": "",
    //A list of channel ids to display pins for (aka [5350]), required
    "channels": [],
    //If a report marker is clicked, take the user to the report in the app
    "goToReportOnClick": true,
    //The site to open reports with
    "appUrl": "https://app.thundermaps.com",
    //The class for report markers, for styling
    "pinClass": "report-marker"
};
```
