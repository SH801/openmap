echo "Downloading military-related using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["landuse"="military"];nwr(area.searchArea)["military"];);out body;>;out skel qt;' | query-overpass > osm/data/military.geojson
