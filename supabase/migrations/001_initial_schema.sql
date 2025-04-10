-- Create cohorts table
CREATE TABLE cohorts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create surveys table
CREATE TABLE surveys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    json_config JSONB NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create participants table
CREATE TABLE participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    passcode TEXT NOT NULL UNIQUE,
    cohort_id UUID REFERENCES cohorts(id),
    survey_id UUID REFERENCES surveys(id),
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create responses table
CREATE TABLE responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID REFERENCES participants(id),
    question_key TEXT NOT NULL,
    likert_value INTEGER NOT NULL CHECK (likert_value IN (-2, -1, 1, 2)),
    dont_understand BOOLEAN DEFAULT FALSE,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(participant_id, question_key)
);

-- Create indexes for better performance
CREATE INDEX idx_participants_passcode ON participants(passcode);
CREATE INDEX idx_responses_participant_id ON responses(participant_id);
CREATE INDEX idx_responses_question_key ON responses(question_key);

-- Function to enable RLS
CREATE OR REPLACE FUNCTION enable_rls()
RETURNS void AS $$
BEGIN
    -- Enable Row Level Security
    ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

    -- Create policies for participants table
    DROP POLICY IF EXISTS "Participants can view their own data" ON participants;
    DROP POLICY IF EXISTS "Participants can insert their own data" ON participants;
    DROP POLICY IF EXISTS "Participants can view their own responses" ON responses;
    DROP POLICY IF EXISTS "Participants can insert their own responses" ON responses;

    CREATE POLICY "Participants can view their own data"
        ON participants
        FOR SELECT
        USING (
            auth.uid() = id OR 
            passcode = current_setting('request.headers')::json->>'passcode'
        );

    CREATE POLICY "Participants can insert their own data"
        ON participants
        FOR INSERT
        WITH CHECK (
            auth.uid() = id
        );

    -- Create policies for responses table
    CREATE POLICY "Participants can view their own responses"
        ON responses
        FOR SELECT
        USING (
            participant_id IN (
                SELECT id FROM participants 
                WHERE passcode = current_setting('request.headers')::json->>'passcode'
            )
        );

    CREATE POLICY "Participants can insert their own responses"
        ON responses
        FOR INSERT
        WITH CHECK (
            participant_id IN (
                SELECT id FROM participants 
                WHERE passcode = current_setting('request.headers')::json->>'passcode'
            )
        );
END;
$$ LANGUAGE plpgsql;

-- Function to disable RLS
CREATE OR REPLACE FUNCTION disable_rls()
RETURNS void AS $$
BEGIN
    ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql;

-- Create custom setting for test mode
ALTER DATABASE postgres SET app.is_test TO false; 