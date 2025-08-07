-- Enable Row Level Security for all tables
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- Add user_id columns to all tables
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE study_records ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create a default user for existing data migration
-- Note: Replace 'your-email@example.com' with the actual email you want to use
-- This user will own all existing data
DO $$
DECLARE
  default_user_id UUID;
BEGIN
  -- Get the first user's ID (you should create this user first via the app)
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;
  
  -- If a user exists, migrate all data to that user
  IF default_user_id IS NOT NULL THEN
    UPDATE flashcards SET user_id = default_user_id WHERE user_id IS NULL;
    UPDATE categories SET user_id = default_user_id WHERE user_id IS NULL;
    UPDATE study_sessions SET user_id = default_user_id WHERE user_id IS NULL;
    UPDATE study_records SET user_id = default_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- Create RLS policies for flashcards
CREATE POLICY "Users can view their own flashcards" ON flashcards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" ON flashcards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" ON flashcards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" ON flashcards
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for categories
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for study_records
CREATE POLICY "Users can view their own study records" ON study_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study records" ON study_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study records" ON study_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study records" ON study_records
  FOR DELETE USING (auth.uid() = user_id);