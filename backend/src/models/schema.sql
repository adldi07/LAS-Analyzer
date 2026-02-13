
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wells table
CREATE TABLE wells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    
    well_name VARCHAR(255),
    field_name VARCHAR(255),
    company VARCHAR(255),
    
    start_depth DOUBLE PRECISION,
    stop_depth DOUBLE PRECISION,
    step DOUBLE PRECISION,
    depth_unit VARCHAR(20),
    
    header_info JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Curves table
CREATE TABLE curves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    well_id UUID NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
    
    mnemonic VARCHAR(50) NOT NULL,
    curve_name VARCHAR(100),
    unit VARCHAR(50),
    description TEXT,
    
    min_value DOUBLE PRECISION,
    max_value DOUBLE PRECISION,
    mean_value DOUBLE PRECISION,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(well_id, mnemonic)
);

-- Measurements table (FIXED)
CREATE TABLE measurements (
    id BIGSERIAL PRIMARY KEY,
    curve_id UUID NOT NULL REFERENCES curves(id) ON DELETE CASCADE,
    depth DOUBLE PRECISION NOT NULL,
    value DOUBLE PRECISION,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Interpretations table
CREATE TABLE interpretations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    well_id UUID NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
    
    depth_start DOUBLE PRECISION NOT NULL,
    depth_stop DOUBLE PRECISION NOT NULL,
    curves_analyzed TEXT[],
    
    interpretation_text TEXT,
    statistics JSONB,
    insights JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    well_id UUID NOT NULL REFERENCES wells(id) ON DELETE CASCADE,
    
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_curves_well_id ON curves(well_id);
CREATE INDEX idx_curves_well_mnemonic ON curves(well_id, mnemonic);
CREATE INDEX idx_measurements_curve_id ON measurements(curve_id);
CREATE INDEX idx_measurements_curve_depth ON measurements(curve_id, depth);
CREATE INDEX idx_measurements_depth ON measurements(depth) WHERE value IS NOT NULL;
CREATE INDEX idx_interpretations_well ON interpretations(well_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wells_updated_at BEFORE UPDATE ON wells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();