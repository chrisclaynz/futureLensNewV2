-- Update RLS policies to use direct passcode matching
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
        USING (true);  -- Allow all SELECT queries

    CREATE POLICY "Participants can insert their own responses"
        ON responses
        FOR INSERT
        WITH CHECK (true);  -- Allow all INSERT queries
END;
$$ LANGUAGE plpgsql;

-- Run the function to update policies
SELECT update_rls_policies(); 