#!/bin/bash

# Database connection parameters - replace these with your actual values
DB_NAME="scorecard_db"
DB_USER="mikepica"
DB_HOST="localhost"
DB_PORT="5432"

# Function to apply migration
apply_migration() {
    local migration_file=$1
    echo "Applying migration: $migration_file"
    
    # Apply the up migration
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
    
    if [ $? -eq 0 ]; then
        echo "Migration applied successfully"
    else
        echo "Error applying migration"
        exit 1
    fi
}

# Check if migration file exists
if [ ! -f "migrations/001_add_progress_updates_history.sql" ]; then
    echo "Migration file not found"
    exit 1
fi

# Apply the migration
apply_migration "migrations/001_add_progress_updates_history.sql" 