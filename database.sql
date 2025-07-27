-- カテゴリテーブル（ツリー構造）
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- フラッシュカードテーブル
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  front_text VARCHAR(500) NOT NULL, -- 学習単語
  back_text TEXT NOT NULL, -- 説明
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_flashcards_category_id ON flashcards(category_id);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 学習記録テーブル
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  cards_studied INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  study_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- 学習記録の詳細テーブル（どのカードを学習したかの記録）
CREATE TABLE study_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  flashcard_id UUID REFERENCES flashcards(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_study_sessions_date ON study_sessions(date);
CREATE INDEX idx_study_records_session_id ON study_records(session_id);
CREATE INDEX idx_study_records_flashcard_id ON study_records(flashcard_id);
CREATE INDEX idx_study_records_answered_at ON study_records(answered_at);

-- 学習記録テーブルの更新日時トリガー
CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();