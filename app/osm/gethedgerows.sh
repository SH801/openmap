echo "Downloading hedgerows using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["barrier"="hedge"];);out body;>;out skel qt;' | query-overpass > osm/data/hedgerows.geojson
