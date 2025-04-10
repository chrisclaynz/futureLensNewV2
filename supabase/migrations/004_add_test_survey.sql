-- Create a test cohort
INSERT INTO cohorts (code, label) 
VALUES ('TESTCOHORT', 'Test Cohort')
ON CONFLICT (code) DO NOTHING;

-- Create a test survey
INSERT INTO surveys (json_config)
VALUES (
    '{
        "theme": {
            "title": "Test Survey",
            "description": "This is a test survey for anonymous mode testing",
            "instructions": "Select how much you agree or disagree with each statement.",
            "startButtonText": "Start Survey",
            "nextButtonText": "Next",
            "backButtonText": "Back",
            "colors": {
                "primary": "#007acc",
                "background": "#f9f9f9",
                "button": "#007acc",
                "text": "#333"
            }
        },
        "statements": [
            {
                "id": "test_1",
                "text": "I enjoy testing new features.",
                "alignment": "left",
                "continuum": "testing",
                "hasDontUnderstand": true
            },
            {
                "id": "test_2",
                "text": "Anonymous mode is useful for quick feedback.",
                "alignment": "right",
                "continuum": "testing",
                "hasDontUnderstand": true
            }
        ],
        "continua": {
            "testing": {
                "name": "Testing Preferences",
                "description": "This continuum explores preferences for testing methods.",
                "labels": {
                    "left": "Structured Testing",
                    "right": "Quick Testing"
                }
            }
        }
    }'::jsonb
)
ON CONFLICT DO NOTHING; 