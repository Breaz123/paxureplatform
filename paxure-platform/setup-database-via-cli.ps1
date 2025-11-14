# Setup Database via Supabase CLI
# Dit script pusht alle migrations naar je Supabase project

Write-Host "=== PAXURE PLATFORM DATABASE SETUP VIA CLI ===" -ForegroundColor Cyan
Write-Host ""

# Check if project is linked
$projectRef = ""
if (Test-Path ".supabase/config.toml") {
    $config = Get-Content ".supabase/config.toml" | Select-String "project_id"
    if ($config) {
        Write-Host "Project is al gelinkt." -ForegroundColor Green
    }
}

# If not linked, ask for project-ref
if (-not $projectRef) {
    Write-Host "Om via CLI te pushen, heb je de project-ref nodig." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Je kunt deze vinden in je Supabase dashboard URL:" -ForegroundColor White
    Write-Host "https://supabase.com/dashboard/project/[PROJECT-REF]" -ForegroundColor Cyan
    Write-Host ""
    
    $projectRef = Read-Host "Voer je project-ref in (of druk Enter om via Dashboard te werken)"
    
    if ($projectRef) {
        Write-Host ""
        Write-Host "Linking project..." -ForegroundColor Yellow
        npx supabase link --project-ref $projectRef
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "Pushing migrations..." -ForegroundColor Yellow
            npx supabase db push
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "✓ Database schema is succesvol gepusht!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Vergeet niet om:" -ForegroundColor Yellow
                Write-Host "1. Storage bucket 'docs' aan te maken in Supabase Dashboard" -ForegroundColor White
                Write-Host "2. setup-storage-complete.sql uit te voeren in SQL Editor" -ForegroundColor White
                Write-Host "3. Een profiel aan te maken voor je gebruiker" -ForegroundColor White
            } else {
                Write-Host ""
                Write-Host "✗ Er ging iets mis bij het pushen. Gebruik de Dashboard methode." -ForegroundColor Red
            }
        } else {
            Write-Host ""
            Write-Host "✗ Er ging iets mis bij het linken. Gebruik de Dashboard methode." -ForegroundColor Red
        }
    } else {
        Write-Host ""
        Write-Host "=== ALTERNATIEF: VIA DASHBOARD ===" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Ga naar Supabase Dashboard → SQL Editor" -ForegroundColor White
        Write-Host "2. Open: setup-complete-database.sql" -ForegroundColor White
        Write-Host "3. Kopieer en plak de volledige inhoud" -ForegroundColor White
        Write-Host "4. Klik Run" -ForegroundColor White
    }
}

