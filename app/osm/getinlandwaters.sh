echo "Downloading inland waters using Overpass"
#echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["water"];nwr(area.searchArea)["waterway"];nwr(area.searchArea)["natural"="water"];);out body;>;out skel qt;' | query-overpass > osm/data/inlandwaters.geojson

osmium tags-filter britain-and-ireland.osm w/water w/waterway w/natural=water r/water r/waterway r/natural=water -o osmium-inlandwaters.osm
osmium export osmium-inlandwaters.osm -o inlandwaters.geojson
#tippecanoe -Z4 -z15 --coalesce-densest-as-needed -X --generate-ids inlandwaters.geojson -o inlandwaters.mbtiles --force
