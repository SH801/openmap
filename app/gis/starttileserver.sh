docker run --name tileserver --rm --detach -v $(pwd):/data -p 8080:8080 maptiler/tileserver-gl --config config.json
