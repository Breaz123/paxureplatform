# Script to apply migration 20240101000013_add_werkdagen_regime_dagen.sql
# Run this script to add the werkdagen_regime and werkdagen_dagen columns

Write-Host "Applying migration 20240101000013_add_werkdagen_regime_dagen.sql..." -ForegroundColor Yellow

# Check if Supabase CLI is available
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "You can install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Apply the migration
$migrationFile = "supabase\migrations\20240101000013_add_werkdagen_regime_dagen.sql"

if (Test-Path $migrationFile) {
    Write-Host "Migration file found: $migrationFile" -ForegroundColor Green
    
    # If using Supabase CLI locally
    # supabase db push
    
    # Or if connecting to remote Supabase
    Write-Host "To apply this migration, you can:" -ForegroundColor Yellow
    Write-Host "1. Use Supabase Dashboard: Go to SQL Editor and run the migration file" -ForegroundColor Cyan
    Write-Host "2. Use Supabase CLI: supabase db push" -ForegroundColor Cyan
    Write-Host "3. Or run the SQL directly in your database" -ForegroundColor Cyan
    
    Write-Host "`nMigration SQL:" -ForegroundColor Yellow
    Get-Content $migrationFile
} else {
    Write-Host "Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

