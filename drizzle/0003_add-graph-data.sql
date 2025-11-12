-- Custom SQL migration file: add graph_data table --
CREATE TABLE graph_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
