import React, { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';

const SimpleAuthTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  const testAuthClient = async () => {
    try {
      setStatus('Creating AuthClient...');
      
      const client = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
        },
      });
      
      setAuthClient(client);
      setStatus('AuthClient created successfully!');
      console.log('AuthClient created:', client);
      
    } catch (error) {
      setStatus(`Error creating AuthClient: ${error}`);
      console.error('AuthClient error:', error);
    }
  };

  const testLogin = async () => {
    if (!authClient) {
      setStatus('Create AuthClient first!');
      return;
    }

    try {
      setStatus('Attempting login...');
      
      // Try the subdomain format first
      const identityProvider = 'http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943/#authorize';
      
      await authClient.login({
        identityProvider,
        onSuccess: () => {
          setStatus('Login successful!');
          console.log('Login success');
        },
        onError: (error) => {
          setStatus(`Login error: ${error}`);
          console.error('Login error:', error);
        },
      });
      
    } catch (error) {
      setStatus(`Login attempt failed: ${error}`);
      console.error('Login attempt error:', error);
    }
  };

  const testLegacyLogin = async () => {
    if (!authClient) {
      setStatus('Create AuthClient first!');
      return;
    }

    try {
      setStatus('Attempting legacy login...');
      
      // Try the legacy format
      const identityProvider = 'http://127.0.0.1:4943/?canisterId=uxrrr-q7777-77774-qaaaq-cai#authorize';
      
      await authClient.login({
        identityProvider,
        onSuccess: () => {
          setStatus('Legacy login successful!');
          console.log('Legacy login success');
        },
        onError: (error) => {
          setStatus(`Legacy login error: ${error}`);
          console.error('Legacy login error:', error);
        },
      });
      
    } catch (error) {
      setStatus(`Legacy login attempt failed: ${error}`);
      console.error('Legacy login attempt error:', error);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      margin: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h3>Internet Identity Auth Test</h3>
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testAuthClient}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          1. Create AuthClient
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testLogin}
          disabled={!authClient}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: authClient ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          2. Test Subdomain Login
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testLegacyLogin}
          disabled={!authClient}
          style={{ 
            padding: '10px 15px', 
            marginRight: '10px',
            backgroundColor: authClient ? '#FF9800' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          3. Test Legacy Login
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '15px' }}>
        Open browser console to see detailed logs
      </div>
    </div>
  );
};

export default SimpleAuthTest;
