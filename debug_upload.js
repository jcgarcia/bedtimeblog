import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const testUpload = async () => {
  try {
    // First, let's check if we can access the media files endpoint
    console.log('Testing GET /api/media/files...');
    
    const getResponse = await fetch('https://bapi.ingasti.com/api/media/files', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    
    console.log('GET Response Status:', getResponse.status);
    const getText = await getResponse.text();
    console.log('GET Response:', getText);
    
    console.log('\nTesting POST /api/media/upload...');
    
    // Create a simple test file
    const testContent = 'This is a test file for upload debugging';
    fs.writeFileSync('/tmp/test-upload.txt', testContent);
    
    const form = new FormData();
    form.append('file', fs.createReadStream('/tmp/test-upload.txt'));
    form.append('folderPath', '/');
    form.append('altText', 'Test file');
    
    const uploadResponse = await fetch('https://bapi.ingasti.com/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test'
      },
      body: form
    });
    
    console.log('POST Response Status:', uploadResponse.status);
    const uploadText = await uploadResponse.text();
    console.log('POST Response:', uploadText);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testUpload();
