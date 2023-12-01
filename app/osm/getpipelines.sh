echo "Downloading pipelines using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["man_made"="pipeline"];);out body;>;out skel qt;' | query-overpass > osm/data/pipelines.geojson

