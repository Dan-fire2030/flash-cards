-- Add columns for multiple-choice card support
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS card_type VARCHAR(20) DEFAULT 'vocabulary',
ADD COLUMN IF NOT EXISTS options JSONB,
ADD COLUMN IF NOT EXISTS correct_option_index INTEGER,
ADD COLUMN IF NOT EXISTS back_image_url TEXT;

-- Add check constraint for card_type
ALTER TABLE flashcards 
ADD CONSTRAINT check_card_type CHECK (card_type IN ('vocabulary', 'multiple_choice'));

-- Add check constraint for multiple choice cards
ALTER TABLE flashcards
ADD CONSTRAINT check_multiple_choice_fields CHECK (
  (card_type = 'vocabulary') OR 
  (card_type = 'multiple_choice' AND options IS NOT NULL AND correct_option_index IS NOT NULL)
);