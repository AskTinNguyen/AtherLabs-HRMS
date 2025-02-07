#!/bin/bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash
node scripts/check-sensitive-files.cjs
EOL

# Make it executable
chmod +x .git/hooks/pre-commit 