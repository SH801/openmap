echo "Downloading danger areas using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["boundary"="hazard"];nwr(area.searchArea)["hazard"];);out body;>;out skel qt;' | query-overpass > osm/data/dangerareas.geojson
