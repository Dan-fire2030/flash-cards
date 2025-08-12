// Test data creation script
// Run this script in the browser console after logging in to create sample data

const createTestData = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      return;
    }
    
    console.log('Creating test data for user:', user.email);
    
    // Create test categories
    const categories = [
      { name: '英単語', user_id: user.id },
      { name: '数学', user_id: user.id },
      { name: '歴史', user_id: user.id }
    ];
    
    const { data: createdCategories, error: categoryError } = await supabase
      .from('categories')
      .insert(categories)
      .select();
    
    if (categoryError) {
      console.error('Error creating categories:', categoryError);
      return;
    }
    
    console.log('Created categories:', createdCategories);
    
    // Create test flashcards
    const flashcards = [
      {
        front_text: 'Apple',
        back_text: 'りんご - 果物の一種',
        category_id: createdCategories[0].id,
        correct_count: 5,
        incorrect_count: 2,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: 'Dog',
        back_text: '犬 - 人間の最も身近なペット',
        category_id: createdCategories[0].id,
        correct_count: 3,
        incorrect_count: 1,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: 'Hello',
        back_text: 'こんにちは - 挨拶の言葉',
        category_id: createdCategories[0].id,
        correct_count: 8,
        incorrect_count: 0,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: '2² = ?',
        back_text: '4',
        category_id: createdCategories[1].id,
        correct_count: 4,
        incorrect_count: 3,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: '√16 = ?',
        back_text: '4',
        category_id: createdCategories[1].id,
        correct_count: 2,
        incorrect_count: 4,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: '日本の首都は？',
        back_text: '東京',
        category_id: createdCategories[2].id,
        correct_count: 10,
        incorrect_count: 0,
        user_id: user.id,
        card_type: 'vocabulary'
      },
      {
        front_text: '第二次世界大戦終了年は？',
        back_text: '1945年',
        category_id: createdCategories[2].id,
        correct_count: 6,
        incorrect_count: 2,
        user_id: user.id,
        card_type: 'vocabulary'
      }
    ];
    
    const { data: createdCards, error: cardsError } = await supabase
      .from('flashcards')
      .insert(flashcards)
      .select();
    
    if (cardsError) {
      console.error('Error creating flashcards:', cardsError);
      return;
    }
    
    console.log('Created flashcards:', createdCards);
    console.log(`Successfully created ${createdCategories.length} categories and ${createdCards.length} flashcards!`);
    
    // Refresh the page to see the new data
    window.location.reload();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};

// Instructions for use
console.log(`
To create test data:
1. Make sure you're logged in to the app
2. Run: createTestData()
3. Wait for confirmation and page refresh
`);

// Make the function available globally
window.createTestData = createTestData;