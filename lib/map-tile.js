"use strict";

function MapTile(sw, size) {
    this.bounds = new mapboxgl.LngLatBounds(sw, new mapboxgl.LngLat(sw.lng + size, sw.lat + size));
    this.size = size;
    this.id = id(sw.lng, sw.lat, this.size);
    this.lng = sw.lng;
    this.lat = sw.lat;
    this.pinSize = 1/4;
    this.neighbour = function (westOffset, southOffset) {
        var west = this.bounds.getWest() + westOffset * size;
        var south = this.bounds.getSouth() + southOffset * size;
        if (westOffset > 0) {
            if (west > 180) {
                west -= 360;
            }
        } else {
            if (west < -180) {
                west += 360;
            }
        }
        return new MapTile(new mapboxgl.LngLat(west, south), size);
    };

    this.tilesAround = function (westOffset, southOffset) {
        var result = {};

        function add(tile) {
            result[tile.id] = tile;
        }
        for (var i = 0; i <= westOffset; i++) {
            for (var j = 0; j <= southOffset; j++) {
                add(this.neighbour(i, j));
                if (i !== 0) {
                    add(this.neighbour(-i, j));
                }
                if (j !== 0) {
                    add(this.neighbour(i, -j));
                    if (i !== 0) {
                        add(this.neighbour(-i, -j));
                    }
                }
            }
        }

        return result;
    };

    /** South/west offsets to another tile. */
    this.offsetTo = function (tile) {
        var southDelta = tile.bounds.getSouth() - this.bounds.getSouth();
        var westDelta = tile.bounds.getWest() - this.bounds.getWest();
        if (westDelta < -180) {
            westDelta += 360;
        } else if (westDelta > 180) {
            westDelta -= 360;
        }
        return {
            south: southDelta / size,
            west: westDelta / size
        };
    };
    this.wkt = function() {
        var west = this.bounds.getWest();
        var south = this.bounds.getSouth();
        var east = this.bounds.getEast();
        var north = this.bounds.getNorth();
        return wellknown.stringify({
            type: "Polygon",
            coordinates: [[[west, south], [west, north], [east, north], [east, south], [west, south]]]
        });
    };
    return this;
}

function around(p, size) {
    var west = truncate(p.lng, size);
    var south = truncate(p.lat, size);
    return new MapTile(new mapboxgl.LngLat(west, south), size);
}

function id(lat, lng, size) {
    return lat + "," + lng + "@" + size;
}

function pinTileAround(p) {
    return around(p, this.pinSize);
}

function truncate(value, size) {
    var delta = value % size;
    return delta < 0 ? value - delta - size : value - delta;
}