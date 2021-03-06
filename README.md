Copyright 2018 ThunderMaps. Licenced under the MIT Licence, see LICENSE File for details.
# thundermaps-embed-example
This repository contains an example that shows how to embed a map with pins on your website.
To use this example, you will need to obtain a ThunderMaps API key, a channel ID and a MapBox token.
See [map.html](map.html) for a working example that just needs keys. 

Obtaining API Key and Channel ID
--------------------------------
You can obtain your API Key and Channel ID for any ThunderMaps channel you are allowed to report to by:

1. Going to the [Channel Manager](https://app.thundermaps.com/#!/channel-manager)
1. Select the channel you want to view from the drop down box on the right
1. Click the 'Integrations' Tab
1. Click the 'ThunderBot' Intergration

Once you have your channel id and token, supply them as options to `createMap`.

Obtaining a Channel ID for a public channel
-------------------------------------------
If you visit the channel on the thundermaps website, the id will be visible in the URL for the channel.
For example, the link <https://app.thundermaps.com/#!/channels/5350> is for the channel Mobility Park Locations, and the Channel ID is `5350`. 

MapBox Token
------------
In order to display a map, you will need to register an account at [MapBox](https://mapbox.com), and then go to your [Mapbox Account](https://www.mapbox.com/account/) and supply retrieve your token, and then supply it as an option to `createMap`.

Usage
-----
Import the below scripts, and then call `createMap` with the required options.
```html
<script src='https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.0/mapbox-gl.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/then-request/2.2.0/request.min.js'></script>
<script src='https://rawgit.com/emn178/js-sha1/master/src/sha1.js'></script>
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
config = {
    //Your API Key, required
    thundermapsKey: "",
    //Your token from mapbox, required
    mapboxToken: "",
    //The branding bundle id, e.g. com.thundermaps.main, required
    bundleID: "",
    //The element to place the map in, required
    container: "",
    //A list of channel ids to display pins for (aka [5350]), required
    channels: [],
    //Where to center the map, latitude, required
    startLatitude: "",
    //Where to center the map, longitude, required
    startLongitude: "",
    //Where to center the map, zoom level, required
    startZoom: "",
    //If a report marker is clicked, take the user to the report in the app, else show report data inline
    openReportInNewWindow: false,
    //What fields should be displayed when using inline mode, if missing all fields are shown.
    //Based on field labels, e.g. "Description"
    visible_fields: [],
    //The site to open reports with
    appUrl: "https://app.thundermaps.com",
    //The class for report markers, for styling
    pinClass: "report-marker"
};
```
Inline Mode
-----------
If openReportInNewWindow is false or missing, report data will be shown inline on click. All field types except photos are shown.
