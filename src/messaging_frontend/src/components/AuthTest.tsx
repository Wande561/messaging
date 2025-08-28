// Backup authentication test
import React from 'react';

const AuthTest: React.FC = () => {
  const testII = () => {
    // Test Internet Identity directly
    window.open('http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/', '_blank');
  };

  const testBackend = async () => {
    try {
      // Test backend directly
      const response = await fetch('http://127.0.0.1:4943/api/v2/canister/u6s2n-gx777-77774-qaaba-cai/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/cbor',
        },
        body: new Uint8Array([]), // Empty CBOR for health check
      });
      console.log('Backend response:', response.status);
    } catch (error) {
      console.error('Backend error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0' }}>
      <h2>Authentication Debug</h2>
      <button onClick={testII} style={{ margin: '10px', padding: '10px' }}>
        Test Internet Identity
      </button>
      <button onClick={testBackend} style={{ margin: '10px', padding: '10px' }}>
        Test Backend
      </button>
    </div>
  );
};

export default AuthTest;
