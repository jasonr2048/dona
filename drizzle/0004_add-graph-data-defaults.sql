-- Custom SQL migration file: add default values to graph_data table --
ALTER TABLE graph_data
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN created_at SET DEFAULT NOW();
