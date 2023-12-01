echo "Downloading powerlines using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["power"="line"];nwr(area.searchArea)["power"="cable"];nwr(area.searchArea)["power"="minor_line"];);out body;>;out skel qt;' | query-overpass > osm/data/powerlines.geojson

