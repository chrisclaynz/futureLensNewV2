-- Add anonymous support to responses table
ALTER TABLE responses 
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE,
ADD COLUMN survey_code TEXT;

-- Create index for survey_code
CREATE INDEX idx_responses_survey_code ON responses(survey_code);

-- Update RLS policies to allow anonymous responses
CREATE OR REPLACE FUNCTION update_rls_policies()
RETURNS void AS $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Participants can view their own data" ON participants;
    DROP POLICY IF EXISTS "Participants can insert their own data" ON participants;
    DROP POLICY IF EXISTS "Participants can view their own responses" ON responses;
    DROP POLICY IF EXISTS "Participants can insert their own responses" ON responses;

    -- Create new policies for participants table
    CREATE POLICY "Participants can view their own data"
        ON participants
        FOR SELECT
        USING (true);  -- Allow all SELECT queries

    CREATE POLICY "Participants can insert their own data"
        ON participants
        FOR INSERT
        WITH CHECK (true);  -- Allow all INSERT queries

    -- Create new policies for responses table
    CREATE POLICY "Participants can view their own responses"
        ON responses
        FOR SELECT
        USING (
            (participant_id IS NULL AND survey_code = current_setting('request.headers')::json->>'survey_code')
            OR
            (participant_id IN (
                SELECT id FROM participants 
                WHERE passcode = current_setting('request.headers')::json->>'passcode'
            ))
        );

    CREATE POLICY "Participants can insert their own responses"
        ON responses
        FOR INSERT
        WITH CHECK (
            (participant_id IS NULL AND survey_code = current_setting('request.headers')::json->>'survey_code')
            OR
            (participant_id IN (
                SELECT id FROM participants 
                WHERE passcode = current_setting('request.headers')::json->>'passcode'
            ))
        );
END;
$$ LANGUAGE plpgsql;

-- Run the function to update policies
SELECT update_rls_policies(); 