1. Go to /postgis2mbtiles/src/postgis2mbtiles.ts and remove '-rg' flag as it has problems with large polygons. We want all polygons to show at all resolutions
