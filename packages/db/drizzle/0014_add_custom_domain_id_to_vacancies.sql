-- Migration to add custom_domain_id column to vacancies table
-- This column stores the custom domain ID for web chat configuration per vacancy

DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vacancies' 
        AND column_name = 'custom_domain_id'
    ) THEN
        ALTER TABLE vacancies 
        ADD COLUMN custom_domain_id TEXT;
        
        -- Add comment to the column
        COMMENT ON COLUMN vacancies.custom_domain_id IS 'ID of custom domain for web chat (can be preset or workspace-specific)';
    END IF;
END $$;
