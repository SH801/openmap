echo "Downloading lakes using Overpass"
# echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)relation["water"="lake"];);out body;>;out skel qt;' | query-overpass > osm/data/lakes.geojson

osmium tags-filter britain-and-ireland.osm r/water=lake -o osmium-lakes.osm
osmium export osmium-lakes.osm -o lakes.geojson
#tippecanoe -Z4 -z15 --coalesce-densest-as-needed -X --generate-ids lakes.geojson -o lakes.mbtiles --force
