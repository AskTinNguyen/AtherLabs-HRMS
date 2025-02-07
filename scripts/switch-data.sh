#!/bin/bash

# Function to display usage instructions
show_usage() {
    echo "Usage: ./switch-data.sh [real|example]"
    echo "  real    - Switch to real salary data"
    echo "  example - Switch to example salary data"
}

# Check if argument is provided
if [ $# -ne 1 ]; then
    show_usage
    exit 1
fi

# Set file paths
REAL_DATA="src/salary.json"
EXAMPLE_DATA="src/salary.example.json"
BACKUP_DATA="src/salary.backup.json"

case "$1" in
    "real")
        # Check if backup exists
        if [ ! -f "$BACKUP_DATA" ]; then
            echo "Error: No backup file found at $BACKUP_DATA"
            exit 1
        fi
        
        # Backup example data if it exists
        if [ -f "$REAL_DATA" ]; then
            mv "$REAL_DATA" "$EXAMPLE_DATA"
        fi
        
        # Restore real data from backup
        cp "$BACKUP_DATA" "$REAL_DATA"
        echo "✅ Switched to real salary data"
        ;;
        
    "example")
        # Backup real data if it exists
        if [ -f "$REAL_DATA" ]; then
            cp "$REAL_DATA" "$BACKUP_DATA"
        fi
        
        # Switch to example data
        if [ -f "$EXAMPLE_DATA" ]; then
            mv "$EXAMPLE_DATA" "$REAL_DATA"
        else
            echo "Error: Example data file not found at $EXAMPLE_DATA"
            exit 1
        fi
        echo "✅ Switched to example salary data"
        echo "💾 Real data backed up to $BACKUP_DATA"
        ;;
        
    *)
        show_usage
        exit 1
        ;;
esac 