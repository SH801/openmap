echo "Downloading railways using Overpass"
echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["railway"]["railway"!="abandoned"]["railway"!="razed"]["railway"!="disused"];);out body;>;out skel qt;' | query-overpass > osm/data/railways.geojson

