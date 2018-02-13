"use strict";

function createMap(opts) {
    var api = "https://public-api.thundermaps.com/api/v4/";
    var reportUrl = "https://app.thundermaps.com" || opts.appUrl;
    var pinStyle = opts.pinClass || "report-marker";
    reportUrl = reportUrl+"/#!/reports/";
    var goToReportOnClick = opts.goToReportOnClick === undefined || opts.goToReportOnClick;
    var channels = JSON.stringify(opts.channels);
    var key = opts.thundermapsKey;
    var pinWidth = 28;
    var pinHeight = 30;
    var reportSearchPageSize = 30;
    var installationID = "thundermaps-embed-map-" + sha1(key) + makeid();
    mapboxgl.accessToken = opts.mapboxToken;
    if (!opts.channels || opts.channels.length === 0) {
        console.log("No channels provided");
        return;
    }
    var pinCache = {};
    var loadedTiles = {};
    var map = new mapboxgl.Map({
        container: opts.container,
        style: opts.style || 'mapbox://styles/mapbox/streets-v10'
    });
    if (map.loaded()) {
        downloadTiles();
    }
    map.on("load", downloadTiles);
    map.on("dragend", downloadTiles);
    map.on("zoomend", downloadTiles);
    return map;
    function headers(range) {
        var ret = {
            "Authorization": "Token token=" + key,
            "Content-Type": "application/json",
            "X-AppID": "com.thundermaps.main",
            "X-InstallationID": installationID
        };
        if (range) {
            ret["Range"] = range.name + "=" + range.start + "-" + range.end;
        }
        return ret;
    }
    function downloadTiles() {
        var vis = getVisibleTiles();
        for (var i in vis) {
            if (loadedTiles[i]) continue;
            downloadTile(vis[i]);
            loadedTiles[i] = true;
        }
    }

    //TODO: the tiles api is in the process of being removed.
    function downloadTile(tile) {
        var options = {
            uri: api + "tiles",
            headers: headers(),
            qs: {
                area: tile.wkt(),
                scale: tile.size
            }
        };
        request('get', options.uri, options).then(function (req) {
            var tiles = JSON.parse(req.body);
            for (var i in tiles) {
                tileDownloader(tiles[i]);
            }
        });
    }

    function tileDownloader(tile, start, end) {
        var range = {
            name: "reports",
            start: start || 0,
            end: end || reportSearchPageSize - 1,
            count: 0,
            total: 0
        };
        var options = {
            uri: api + "reports/search",
            headers: headers(),
            qs: {
                "filter[tile_id]": tile.uuid,
                "filter[channels]": channels,
                "exclude[appearance]": "invisible",
                "order[updated_at]": "desc"
            }
        };
        request('get', options.uri, options).then(function (req) {
            var search = JSON.parse(req.body);
            var optsSearch = {
                uri: search.url,
                headers: headers(range)
            };
            return request('get', optsSearch.uri, optsSearch);
        }).then(function (search) {
            if (search.statusCode === 202) {
                return;
            }
            const ranges = search.headers["content-range"];
            const total = parseInt(ranges.substring(ranges.indexOf("/")+1));
            const end = parseInt(ranges.substring(ranges.indexOf("-")+1,ranges.indexOf("/")));
            if (total > end) {
                tileDownloader(tile,end, end+reportSearchPageSize-1);
            }
            var pins = JSON.parse(search.body);
            for (var i in pins) {
                makeMarker(pins[i]);
            }
        });
    }

    function makeMarker(item) {
        if (pinCache[item.id]) return;
        pinCache[item.id] = true;
        var img = document.createElement("img");
        img.src = item.pin;
        img.className = pinStyle;
        img.style.width = pinWidth + "px";
        img.style.height = pinHeight + "px";
        if (goToReportOnClick) {
            img.addEventListener("click", function () {
                var win = window.open(reportUrl + item.id, '_blank');
                win.focus();
            });
        }
        var container = document.createElement("div");
        container.appendChild(img);
        var marker = new mapboxgl.Marker(container).setLngLat([item.longitude, item.latitude]);
        marker.addTo(map);
        return {
            marker: marker,
            element: container,
            image: img
        };
    }

    function getVisibleTiles() {
        var centerTile = pinTileAround(map.getCenter());
        var bounds = map.getBounds();
        var swTile = pinTileAround(bounds.getSouthWest());
        var offset = swTile.offsetTo(centerTile);
        var limit = 3; // Not downloading too many tiles
        var westOffset = Math.min(limit, offset.west + 1);
        var southOffset = Math.min(limit, offset.south + 1);
        return centerTile.tilesAround(westOffset, southOffset);
    }
    function makeid() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

}