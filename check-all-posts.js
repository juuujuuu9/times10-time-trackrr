// Check what posts exist for different tasks
import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllPosts() {
  try {
    console.log('🔍 Checking all posts in the database...');
    
    // Get all posts grouped by task_id
    const { data: allPosts, error } = await supabase
      .from('task_discussions')
      .select('task_id, id, content, created_at, archived')
      .eq('archived', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching posts:', error);
      return;
    }
    
    console.log(`✅ Found ${allPosts.length} total posts`);
    
    // Group by task_id
    const postsByTask = {};
    allPosts.forEach(post => {
      if (!postsByTask[post.task_id]) {
        postsByTask[post.task_id] = [];
      }
      postsByTask[post.task_id].push(post);
    });
    
    console.log('\n📋 Posts by task:');
    Object.keys(postsByTask).forEach(taskId => {
      const posts = postsByTask[taskId];
      console.log(`  Task ${taskId}: ${posts.length} posts`);
      posts.forEach((post, index) => {
        console.log(`    ${index + 1}. ID: ${post.id}, Content: ${post.content.substring(0, 50)}...`);
      });
    });
    
    // Check specifically for task 1
    console.log('\n📋 Posts for task 1:');
    const task1Posts = postsByTask[1] || [];
    console.log(`Found ${task1Posts.length} posts for task 1`);
    
    if (task1Posts.length === 0) {
      console.log('❌ No posts found for task 1');
      console.log('💡 This explains why you\'re not seeing any posts in the feed');
      console.log('💡 Your posts are likely for a different task');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllPosts();
