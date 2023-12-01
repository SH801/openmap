#echo "Downloading footpaths using Overpass"
#echo 'area["name"="United Kingdom"]->.searchArea;(nwr(area.searchArea)["highway"="footway"];nwr(area.searchArea)["highway"="track"];nwr(area.searchArea)["highway"="path"];nwr(area.searchArea)["highway"="pedestrian"];);out body;>;out skel qt;' | query-overpass > osm/data/footpaths.geojson

osmium tags-filter britain-and-ireland.osm w/highway=footway w/highway=track w/highway=path /whighway=pedestrian -o osmium-footpaths.osm
osmium export osmium-footpaths.osm -o footpaths.geojson


