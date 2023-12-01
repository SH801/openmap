echo "Downloading bridleways using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["highway"="bridleway"];);out body;>;out skel qt;' | query-overpass > osm/data/bridleways.geojson
