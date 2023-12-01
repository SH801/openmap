export NODE_OPTIONS=--max_old_space_size=80192 && node -e 'console.log(v8.getHeapStatistics().heap_size_limit/(1024*1024))'
./osm/getaeroway.sh
./osm/getdangerareas.sh
./osm/getmilitary.sh
./osm/gethedgerows.sh
./osm/getwildlifereserves.sh
./osm/getroads.sh
./osm/getrailways.sh
./osm/getinlandwaters.sh
./osm/getpipelines.sh
./osm/getpowerlines.sh
./osm/getfootpaths.sh
./osm/getbridleways.sh