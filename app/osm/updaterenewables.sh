echo "Downloading renewables data using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["plant:source"="wind"];nwr(area.searchArea)["plant:source"="solar"];);out body;>;out skel qt;' | query-overpass > osm/renewables.geojson

echo "Prettifying geojson"
python3 backend/prettifygeojson.py

echo "Processing renewables.geojson"
python3 backend/tools.py processrenewables

echo "Creating renewables.mbtiles using tippecanoe"
tippecanoe -Z4 -z15 -B4 --generate-ids -l renewables osm/renewables_output.geojson -o osm/renewables.mbtiles --force

echo "Restarting tileserver-gl"
./osm/restarttileserver.sh
