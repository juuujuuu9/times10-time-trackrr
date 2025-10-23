/**
 * Test Bunny CDN using FTP-style authentication
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testBunnyFtp() {
  console.log('🧪 Testing Bunny CDN with FTP-style authentication...\n');

  try {
    // Test 1: Try the FTP hostname from your dashboard
    console.log('📋 Testing FTP-style connection...');
    const ftpHostname = 'la.storage.bunnycdn.com';
    const ftpUrl = `https://${ftpHostname}/${process.env.BUNNY_STORAGE_ZONE_NAME}/`;
    
    console.log(`   FTP URL: ${ftpUrl}`);
    console.log(`   Username: ${process.env.BUNNY_STORAGE_ZONE_NAME}`);
    console.log(`   Password: ${process.env.BUNNY_STORAGE_ZONE_PASSWORD?.substring(0, 8)}...`);

    // Try basic auth with username:password
    const credentials = btoa(`${process.env.BUNNY_STORAGE_ZONE_NAME}:${process.env.BUNNY_STORAGE_ZONE_PASSWORD}`);
    
    const listResponse = await fetch(ftpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    console.log(`   List response status: ${listResponse.status}`);
    
    if (listResponse.ok) {
      const files = await listResponse.json();
      console.log('✅ Successfully connected to storage zone!');
      console.log(`   Found ${Array.isArray(files) ? files.length : 'unknown'} items`);
    } else {
      const errorText = await listResponse.text();
      console.log(`❌ List failed: ${listResponse.status} - ${errorText}`);
    }

    // Test 2: Try upload with FTP-style URL
    console.log('\n📤 Testing upload with FTP-style URL...');
    const testContent = 'Hello from Times10 Time Tracker!';
    const testFileName = `test-${Date.now()}.txt`;
    const uploadUrl = `https://${ftpHostname}/${process.env.BUNNY_STORAGE_ZONE_NAME}/${testFileName}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'text/plain'
      },
      body: testContent
    });

    console.log(`   Upload response status: ${uploadResponse.status}`);
    
    if (uploadResponse.ok) {
      console.log('✅ Upload successful!');
      const publicUrl = `${process.env.BUNNY_CDN_URL}/${testFileName}`;
      console.log(`   Public URL: ${publicUrl}`);
      
      // Test access
      console.log('🔍 Testing file access...');
      const accessResponse = await fetch(publicUrl);
      console.log(`   Access test: ${accessResponse.status}`);
      
      if (accessResponse.ok) {
        const content = await accessResponse.text();
        console.log('✅ File accessible via CDN!');
        console.log(`   Content matches: ${content === testContent}`);
      } else {
        console.log('⚠️  File not immediately accessible (might need time to propagate)');
      }
    } else {
      const errorText = await uploadResponse.text();
      console.log(`❌ Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testBunnyFtp();
