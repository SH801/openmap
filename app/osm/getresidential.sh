echo "Downloading residential land use using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["landuse"="residential"];);out body;>;out skel qt;' | query-overpass > osm/data/residential.geojson
