echo "Downloading power using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["power"];);out body;>;out skel qt;' | query-overpass > osm/data/power.geojson

