echo "Downloading widllife reserves using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["leisure"="nature_reserve"];);out body;>;out skel qt;' | query-overpass > osm/data/wildlifereserves.geojson
