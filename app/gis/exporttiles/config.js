require('dotenv').config();
const env = process.env;

const export_dir = env.export_dir || __dirname;
const srid = 4326;
const bounds = {
  futurefarms : [49.5,-11.4, 61.2,2.3],
}

module.exports = {
    db: {
      user:env.db_user,
      password:env.db_password,
      host:env.db_host,
      port:env.db_port,
      database:env.db_name,
    },
    name: 'positivefarms',
    description: 'Positive Farms',
    attribution: '© Positive Farms',
    mbtiles: export_dir + '/positivefarms.mbtiles',
    minzoom: 4,
    maxzoom: 16,
    layers : [
	{
		name: 'positivefarms',
		geojsonFileName: __dirname + '/positivefarms.geojson',
		select: `

SELECT row_to_json(mainfeaturecollection) AS json FROM
(
  SELECT
    'FeatureCollection' AS type,
    json_agg(mainfeatures) AS features
  FROM (

    SELECT
      'FeatureCollection' AS type,
      features
    FROM (

      WITH entitypropertiesgeometries AS
      (
        SELECT
          G.id AS id,
          'Feature' AS type,
          json_build_object(
            'fid', G.id,
            'entityid', E.id,
            'entityname', E.name,
            'entityproperties', (SELECT string_agg(format('%L', property_id), ',') FROM backend_entity_properties WHERE 
entity_id = E.id),
            'contexts', (SELECT '''0'',' || string_agg(format('%L', id), ',') FROM backend_context WHERE ST_Intersects(geometry, 
ST_MakeValid(G.geometry)) )
          ) AS properties,
          ST_AsGeoJSON(G.geometry)::json AS geometry
        FROM
          backend_entity E,
          backend_entity_geometrycodes EGC,
          backend_geometrycode GC,
          backend_geometry G
        WHERE
          E.status=3 AND
          E.id=EGC.entity_id AND
          EGC.geometrycode_id = GC.id AND
          GC.code=G.code
      )
      SELECT JSON_AGG(entitypropertiesgeometries.*) AS features
      FROM entitypropertiesgeometries
      GROUP BY entitypropertiesgeometries.id
    ) AS features
        
  ) AS mainfeatures  
) AS mainfeaturecollection; 

		`
	}
    ]
}


