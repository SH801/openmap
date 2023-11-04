echo "Creating windspeed.mbtiles using tippecanoe"
tippecanoe -Z4 -z15 -B4 --generate-ids -l windspeed gis/windspeed.geojson -o gis/windspeed.mbtiles --force

