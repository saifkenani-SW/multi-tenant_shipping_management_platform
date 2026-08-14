const http = require('http');

async function run() {
  console.log('Logging in as employee@fastship.com...');
  const loginRes = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'client-type': 'MOBILE' },
    body: JSON.stringify({ email: 'employee@fastship.com', password: 'password123' })
  });
  
  let loginData = await loginRes.json();
  
  if (!loginRes.ok) {
    if (loginRes.status === 404) {
      console.log('Trying /v1/auth/login...');
      const v1Res = await fetch('http://localhost:3000/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'client-type': 'MOBILE' },
        body: JSON.stringify({ email: 'employee@fastship.com', password: 'password123' })
      });
      loginData = await v1Res.json();
      if (!v1Res.ok) {
        console.error('Failed to login:', loginData);
        return;
      }
    } else {
      console.error('Failed to login:', loginData);
      return;
    }
  }
  
  console.log('Login success!', Object.keys(loginData));
  
  // They are a multi-profile user, maybe we need to select profile?
  // Check loginData
  let accessToken = loginData.accessToken;
  let tenantId = null;
  if (loginData.status === 'REQUIRE_PROFILE_SELECTION') {
    console.log('Selecting profile...');
    const selectRes = await fetch('http://localhost:3000/v1/auth/select-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'client-type': 'MOBILE', 'Authorization': `Bearer ${loginData.sessionToken}` },
      body: JSON.stringify({ profileId: loginData.profiles[0].id })
    });
    const selectData = await selectRes.json();
    if (!selectRes.ok) {
      console.error('Failed to select profile', selectData);
      return;
    }
    accessToken = selectData.accessToken;
    tenantId = loginData.profiles[0].tenantId;
  }
  
  console.log('Got access token!');
  
  console.log('Fetching a READY_FOR_COLLECTION parcel from DB via pg...');
  const { Client } = require('pg');
  const client = new Client({ connectionString: 'postgresql://saif:saif@localhost:51214/multi-tenant_shipping_management_platform' });
  await client.connect();
  const res = await client.query("SELECT tracking_number FROM parcel WHERE current_status = 'READY_FOR_COLLECTION' LIMIT 1");
  let trackingNumber = res.rows[0]?.tracking_number;
  if (!trackingNumber) {
    const res2 = await client.query("SELECT tracking_number, id FROM parcel LIMIT 1");
    trackingNumber = res2.rows[0]?.tracking_number;
    const id = res2.rows[0]?.id;
    if (id) {
       await client.query("UPDATE parcel SET current_status = 'READY_FOR_COLLECTION' WHERE id = $1", [id]);
       console.log('Forced parcel to READY_FOR_COLLECTION:', trackingNumber);
    }
  }
  await client.end();
  
  console.log('Recording delivery for tracking number:', trackingNumber);
  
  const FormData = require('form-data');
  const form = new FormData();
  form.append('receivedByName', 'Sami');
  form.append('deliveryNotes', 'Left at door');
  form.append('signature', Buffer.from('fake-signature-image'), { filename: 'sig.png', contentType: 'image/png' });

  const headers = form.getHeaders();
  headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;
  
  const podRes = await fetch(`http://localhost:3000/v1/parcels/${trackingNumber}/proof-of-delivery`, {
    method: 'POST',
    headers: headers,
    body: form.getBuffer()
  });
  
  console.log('Status:', podRes.status);
  const podText = await podRes.text();
  console.log('POD Result:', podText);
}

run().catch(console.error);
