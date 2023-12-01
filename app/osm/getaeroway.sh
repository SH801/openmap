echo "Downloading aeroway-related using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["aeroway"];);out body;>;out skel qt;' | query-overpass > osm/data/aeroway.geojson
