-- Add name column to attempts table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attempts' AND column_name = 'name'
    ) THEN
        ALTER TABLE attempts ADD COLUMN name TEXT DEFAULT '';
    END IF;
END $$;

-- Update existing records to have empty name if null
UPDATE attempts SET name = '' WHERE name IS NULL;
