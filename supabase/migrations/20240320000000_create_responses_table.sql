-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id TEXT NOT NULL,
    response INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    survey_id UUID REFERENCES surveys(id)
);

-- Enable Row Level Security
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own responses"
    ON responses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
    ON responses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert responses"
    ON responses
    FOR INSERT
    TO anon
    WITH CHECK (user_id IS NULL);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS responses_user_id_idx ON responses(user_id);
CREATE INDEX IF NOT EXISTS responses_question_id_idx ON responses(question_id);
CREATE INDEX IF NOT EXISTS responses_survey_id_idx ON responses(survey_id); 