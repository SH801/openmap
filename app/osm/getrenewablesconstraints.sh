#echo "Downloading renewables constraints using Overpass"
#echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["power"="line"];nwr(area.searchArea)["power"="cable"];nwr(area.searchArea)["power"="minor_line"];);out body;>;out skel qt;' | query-overpass > osm/powerlines.geojson


#echo "Creating renewables.mbtiles using tippecanoe"
#tippecanoe -Z4 -z15 -B4 --generate-ids -l renewables osm/renewables_output.geojson -o osm/renewables.mbtiles --force

#echo "Restarting tileserver-gl"
#./osm/restarttileserver.sh
