"use strict";
function createMap(opts) {
    const api = "https://public-api.thundermaps.com/api/v4/";
    let reportUrl = opts.appUrl || "https://app.thundermaps.com";
    const pinStyle = opts.pinClass || "report-marker";
    reportUrl = reportUrl+"/#!/reports/";
    const openReportInNewWindow = opts.openReportInNewWindow;
    const channels = JSON.stringify(opts.channels);

    let key = opts.thundermapsKey;
    const pinWidth = 28;
    const pinHeight = 30;
    const reportSearchPageSize = 30;
    const installationID = "thundermaps-embed-map-" + sha1(key) + makeid();

    mapboxgl.accessToken = opts.mapboxToken;
    if (!opts.channels || opts.channels.length === 0) {
        throw new Error("No channels provided!");
    }
    if (!key) {
        throw new Error("No api key provided!");
    }
    if (!opts.mapboxToken) {
        throw new Error("No mapbox token provided!");
    }
    const map = new mapboxgl.Map({
        container: opts.container,
        style: opts.style || 'mapbox://styles/mapbox/streets-v10'
    });
    if (map.loaded()) {
        downloadTiles();
    }
    map.on("load", downloadTiles);
    map.on("dragend", downloadTiles);
    map.on("zoomend", downloadTiles);

    const getCategoryData = memoize(async (channel) => {
        const options = {
            uri: api + "channels/"+channel+"/categories",
            qs: {"fields": "name,id"},
            headers: headers()
        };
        let data = JSON.parse((await request('get', options.uri, options)).body);

        return new Map(data.map(i => [i.id, i]));
    });

    const getReportPopup = (item, imageElement) => {
        const popup = new mapboxgl.Popup({offset: 25});
        const listener = imageElement.addEventListener("click", async () => {
            imageElement.removeEventListener("click", listener);
            const options = {
                uri: api + "reports/" + item.id,
                qs: {fields: "form_fields,user_short_name"},
                headers: headers()
            };
            let data = JSON.parse((await request('get', options.uri, options)).body);
            const fieldMap = new Map(data.form_fields.map(i => [i.key, i]));
            let fieldData = "";
            let fields = data.form_fields;
            fields = fields.filter(field => {
                return field.field_type !== "ReportViewers" && field.field_type !== "Image" && field.value != null;
            });
            if (config.visible_fields) {
                fields = fields.filter(field => config.visible_fields.indexOf(fieldMap.get(field.key).label) !== -1);
            }
            fields.forEach(async field => {
                const fieldLabels = fieldMap.get(field.key);
                fieldData += `<h5>${fieldLabels.label}</h5>`;
                if (field.field_type === "Category") {
                    const categories = await getCategoryData(item.channel_id);
                    fieldData += `<p>${categories.get(field.value).name}</p>`;
                } else if (field.data && field.data.options) {
                    const options = new Map(field.data.options.map(i => [i.value, i]));
                    let selected = field.value;
                    if (!(selected instanceof Array)) {
                        selected = [selected];
                    }
                    for (const sel of selected) {
                        if (options.has(sel)) {
                            fieldData += `<p>${options.get(sel).label}</p>`;
                        }
                    }
                } else {
                    fieldData += `<p>${field.value}</p>`;
                }
            });
            popup.setHTML(`
                    <h3>${data.title}</h3>
                    <h5>Reporter</h5>
                    <p>${data.user_short_name}</p>
                    ${fieldData}
                `);
        });
        popup.setHTML(`<h3>Loading report information...</h3>`);
        return popup;
    };

    const makeMarker = memoize((item) => {
        const img = document.createElement("img");
        img.src = item.pin;
        img.className = pinStyle;
        img.style.width = pinWidth + "px";
        img.style.height = pinHeight + "px";
        if (openReportInNewWindow) {
            img.addEventListener("click", function () {
                const win = window.open(reportUrl + item.id, '_blank');
                win.focus();
            });
        }
        const container = document.createElement("div");
        container.appendChild(img);
        const marker = new mapboxgl.Marker(container).setLngLat([item.longitude, item.latitude]);
        marker.addTo(map);
        if (!openReportInNewWindow) {
            marker.setPopup(getReportPopup(item,img));
        }
        return {
            marker: marker,
            element: container,
            image: img
        };
    });

    function headers(range) {
        const ret = {
            "Authorization": "Token token=" + key,
            "Content-Type": "application/json",
            "X-AppID": config.bundleid,
            "X-InstallationID": installationID
        };
        if (range) {
            ret["Range"] = range.name + "=" + range.start + "-" + range.end;
        }
        return ret;
    }


    function downloadTiles() {
        Object.values(getVisibleTiles()).forEach(downloadTilePins);
    }

    const downloadTilePins = memoize(async (tile, start, end) =>  {
        // var dd = {id: tile.id, source: {type: 'geojson', data: tile.toGeoJSON()}, type: "line"};
        // map.addLayer(dd)
        const range = {
            name: "reports",
            start: start || 0,
            end: end || reportSearchPageSize - 1,
            count: 0,
            total: 0
        };
        const options = {
            uri: api + "reports/search",
            headers: headers(),
            qs: {
                "filter[tile][latitude]": tile.lat,
                "filter[tile][longitude]": tile.lng,
                "filter[tile][scale]": tile.size,
                "filter[channels]": channels,
                "exclude[appearance]": "invisible",
                "order[updated_at]": "desc"
            }
        };
        let search = JSON.parse((await request('get', options.uri, options)).body);
        search.headers = headers(range);
        search = await request('get', search.url, search);
        if (search.statusCode === 202) {
            return;
        }
        const ranges = search.headers["content-range"];
        const total = parseInt(ranges.substring(ranges.indexOf("/")+1));
        end = parseInt(ranges.substring(ranges.indexOf("-")+1,ranges.indexOf("/")))+1;
        JSON.parse(search.body).forEach(makeMarker);
        if (total > end) {
            await downloadTilePins(tile,end, end+reportSearchPageSize-1);
        }
    });

    function getVisibleTiles() {
        const centerTile = pinTileAround(map.getCenter());
        const bounds = map.getBounds();
        const swTile = pinTileAround(bounds.getSouthWest());
        const offset = swTile.offsetTo(centerTile);
        const limit = 3; // Not downloading too many tiles
        const westOffset = Math.min(limit, offset.west + 1);
        const southOffset = Math.min(limit, offset.south + 1);
        return centerTile.tilesAround(westOffset, southOffset);
    }

    function makeid() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    function memoize(method) {
        let cache = {};

        return async function() {
            let args = JSON.stringify(arguments);
            cache[args] = cache[args] || method.apply(this, arguments);
            return cache[args];
        };
    }

    return map;
}