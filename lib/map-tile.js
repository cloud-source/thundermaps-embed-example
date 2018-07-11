"use strict";

const tileSize = 1;

function MapTile(sw, size) {
    this.bounds = new mapboxgl.LngLatBounds(sw, new mapboxgl.LngLat(sw.lng + size, sw.lat + size));
    this.size = size;
    this.id = id(sw.lng, sw.lat, this.size);
    this.lng = sw.lng;
    this.lat = sw.lat;
    this.neighbour = function (westOffset, southOffset) {
        let west = this.bounds.getWest() + westOffset * size;
        const south = this.bounds.getSouth() + southOffset * size;
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
    this.toGeoJSON = function() {
        let coords = [[this.bounds.getNorthWest().toArray(), this.bounds.getNorthEast().toArray(), this.bounds.getSouthEast().toArray(), this.bounds.getSouthWest().toArray(), this.bounds.getNorthWest().toArray()]];
        return {type: "Feature", geometry: {type: "Polygon", coordinates: coords}};
    };
    this.tilesAround = function (westOffset, southOffset) {
        const result = {};

        function add(tile) {
            result[tile.id] = tile;
        }
        for (let i = 0; i <= westOffset; i++) {
            for (let j = 0; j <= southOffset; j++) {
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
        const southDelta = tile.bounds.getSouth() - this.bounds.getSouth();
        let westDelta = tile.bounds.getWest() - this.bounds.getWest();
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
    return this;
}

function around(p, size) {
    const west = truncate(p.lng, size);
    const south = truncate(p.lat, size);
    return new MapTile(new mapboxgl.LngLat(west, south), size);
}

function id(lat, lng, size) {
    return lat + "," + lng + "@" + size;
}

function pinTileAround(p) {
    return around(p, tileSize);
}

function truncate(value, size) {
    const delta = value % size;
    return delta < 0 ? value - delta - size : value - delta;
}