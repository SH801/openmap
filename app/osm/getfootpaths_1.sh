echo "Downloading footpaths (element 1) using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["highway"="footway"];);out body;>;out skel qt;' | query-overpass > osm/data/footpaths1.geojson
