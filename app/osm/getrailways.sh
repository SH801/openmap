echo "Downloading railways using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["railway"];);out body;>;out skel qt;' | query-overpass > osm/data/railways.geojson

