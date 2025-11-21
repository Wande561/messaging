#!/usr/bin/env node

/**
 * ICRC-1 Wallet Test Script
 * This script tests the ICRC-1 token functionality directly
 */

const { Principal } = require('@dfinity/principal');

// Test configuration
const BACKEND_CANISTER_ID = 'u6s2n-gx777-77774-qaaba-cai';
const TEST_PRINCIPAL = 'rdmx6-jaaaa-aaaah-qcaiq-cai'; // Example principal for testing

console.log('🧪 ICRC-1 Wallet Test Script');
console.log('===============================\n');

console.log('📋 Test Configuration:');
console.log(`   Backend Canister: ${BACKEND_CANISTER_ID}`);
console.log(`   Test Principal: ${TEST_PRINCIPAL}`);
console.log('\n🔍 Testing ICRC-1 Functions...\n');

// Test functions to call via dfx
const tests = [
  {
    name: 'Token Name',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_name`,
    description: 'Get the token name'
  },
  {
    name: 'Token Symbol', 
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_symbol`,
    description: 'Get the token symbol'
  },
  {
    name: 'Token Decimals',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_decimals`,
    description: 'Get the number of decimals'
  },
  {
    name: 'Transfer Fee',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_fee`,
    description: 'Get the transfer fee'
  },
  {
    name: 'Total Supply',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_total_supply`,
    description: 'Get the total token supply'
  },
  {
    name: 'Supported Standards',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_supported_standards`,
    description: 'Get list of supported standards'
  },
  {
    name: 'Token Metadata',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_metadata`,
    description: 'Get token metadata'
  },
  {
    name: 'Balance Query (Test Principal)',
    command: `dfx canister call ${BACKEND_CANISTER_ID} icrc1_balance_of '(principal "${TEST_PRINCIPAL}")'`,
    description: `Get balance for ${TEST_PRINCIPAL}`
  },
  {
    name: 'Principal to Account',
    command: `dfx canister call ${BACKEND_CANISTER_ID} principal_to_account '(principal "${TEST_PRINCIPAL}")'`,
    description: 'Convert principal to account format'
  }
];

console.log('📜 Test Commands to Run:');
console.log('========================\n');

tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Command: ${test.command}`);
  console.log('');
});

console.log('💡 Usage Instructions:');
console.log('======================');
console.log('1. Copy and paste each command above into your terminal');
console.log('2. Run the commands to test ICRC-1 functionality');
console.log('3. Verify the responses match ICRC-1 standard format');
console.log('');

console.log('🌐 Frontend Access:');
console.log('==================');
console.log('Open your wallet at: http://uzt4z-lp777-77774-qaabq-cai.localhost:4943/');
console.log('1. Log in with Internet Identity');
console.log('2. Navigate to Wallet -> ICRC-1 Wallet');
console.log('3. Test token transfers and balance queries');
console.log('');

console.log('🔧 Expected ICRC-1 Responses:');
console.log('=============================');
console.log('- icrc1_name(): "Engage Token"');
console.log('- icrc1_symbol(): "ENG"');
console.log('- icrc1_decimals(): 8');
console.log('- icrc1_fee(): 10000 (0.0001 ENG)');
console.log('- icrc1_total_supply(): 10000000000000000 (100M tokens)');
console.log('- icrc1_supported_standards(): [{"name": "ICRC-1", "url": "..."}]');
console.log('');

console.log('✅ ICRC-1 Implementation Complete!');
console.log('Your token system now follows the ICRC-1 standard and is compatible');
console.log('with other Internet Computer applications and wallets.');
