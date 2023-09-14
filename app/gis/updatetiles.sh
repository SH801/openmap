# Stop docker container
docker kill tileserver

# Set version of node
#nvm use v10.19.0

# Generate tiles from Postgres
npm run exporttiles

# Restart docker container
docker run --name tileserver --detach --rm -v $(pwd):/data -p 8080:8080 maptiler/tileserver-gl --mbtiles data/positivefarms.mbtiles
