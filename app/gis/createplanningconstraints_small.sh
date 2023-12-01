echo "Creating planningconstraints.mbtiles using tippecanoe - excluding all attributes to save space with -X"
# tippecanoe -Z4 -z15 -B4 --generate-ids ../../planningconstraints/Consolidated/* osm/data/* -o gis/planningconstraints.mbtiles --force
tippecanoe -Z4 -z15 -B10 --drop-densest-as-needed -X --generate-ids ../../planningconstraints/Consolidated/* osm/data/* -o gis/planningconstraints.mbtiles --force

