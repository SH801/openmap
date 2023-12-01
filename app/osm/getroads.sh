echo "Downloading main roads using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["highway"="motorway"];nwr(area.searchArea)["highway"="primary"];nwr(area.searchArea)["highway"="secondary"];nwr(area.searchArea)["highway"="trunk"];);out body;>;out skel qt;' | query-overpass > osm/data/roads.geojson

