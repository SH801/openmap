import json

featurecollection = {}
with open("osm/renewables.geojson", "r") as readerfileobj:
    featurecollection = json.load(readerfileobj)

with open("osm/renewables.geojson", "w") as writerfileobj:
    json.dump(featurecollection, writerfileobj, indent=2)
