#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of patterns for sensitive files
const SENSITIVE_PATTERNS = [
  /^\.env$/i,
  /^\.env\..+$/i,
  /credentials\.json$/i,
  /secrets\.json$/i,
  // Salary-specific patterns that exclude .tsx files
  /salary\.(json|md|ya?ml)$/i,
  /salary\.backup\.json$/i,
  /.*salary.*\.(json|md|ya?ml)$/i,
];

// Files that are allowed to be committed (e.g., example files)
const ALLOWED_FILES = [
  'src/salary.example.json',
  '.env.example',
  // Add more allowed files as needed
];

try {
  // Get staged files
  const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);

  console.log('Checking files:', stagedFiles);

  // Check each staged file against sensitive patterns
  const sensitiveFiles = stagedFiles.filter(file => {
    // Skip allowed files
    if (ALLOWED_FILES.includes(file)) {
      return false;
    }

    // Skip .tsx files
    if (file.endsWith('.tsx')) {
      return false;
    }

    // Check if file matches any sensitive pattern
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(file));
  });

  if (sensitiveFiles.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'ERROR: Attempting to commit sensitive files:');
    sensitiveFiles.forEach(file => {
      console.error('\x1b[31m%s\x1b[0m', `  - ${file}`);
    });
    console.error('\x1b[33m%s\x1b[0m', '\nTo fix this:');
    console.error('\x1b[33m%s\x1b[0m', '1. Run `git reset HEAD` on these files');
    console.error('\x1b[33m%s\x1b[0m', '2. Add them to .gitignore if they should never be committed');
    console.error('\x1b[33m%s\x1b[0m', '3. Or use example data files for development');
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error checking for sensitive files:', error);
  process.exit(1);
} 