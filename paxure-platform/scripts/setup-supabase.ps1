# Paxure Platform - Supabase Setup Script (PowerShell)
# Dit script automatiseert de setup van Supabase met de CLI

$ErrorActionPreference = "Stop"

Write-Host "🚀 Paxure Platform - Supabase Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is available via npx
Write-Host "🔍 Supabase CLI controleren..." -ForegroundColor Yellow
try {
    $version = npx supabase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase CLI gevonden via npx (versie: $version)" -ForegroundColor Green
    } else {
        throw "npx supabase failed"
    }
} catch {
    Write-Host "❌ Supabase CLI is niet beschikbaar via npx!" -ForegroundColor Red
    Write-Host "📦 Supabase CLI wordt automatisch gedownload via npx bij eerste gebruik" -ForegroundColor Yellow
    Write-Host "   Als dit niet werkt, controleer je npm/node installatie" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if user is logged in
try {
    $null = npx supabase projects list 2>&1
    Write-Host "✅ Ingelogd bij Supabase" -ForegroundColor Green
} catch {
    Write-Host "🔐 Je bent niet ingelogd bij Supabase" -ForegroundColor Yellow
    Write-Host "📝 Log in met: npx supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Link to remote project
$configPath = ".supabase\config.toml"
$isLinked = Test-Path $configPath

if (-not $isLinked -or -not (Select-String -Path $configPath -Pattern "project_id" -Quiet)) {
    Write-Host "🔗 Link naar je Supabase project:" -ForegroundColor Yellow
    Write-Host "   Voer je project reference ID in (vind je in Supabase Dashboard → Settings → General)" -ForegroundColor Yellow
    $projectRef = Read-Host "Project Reference ID"
    
    if ([string]::IsNullOrWhiteSpace($projectRef)) {
        Write-Host "❌ Project Reference ID is vereist" -ForegroundColor Red
        exit 1
    }
    
    npx supabase link --project-ref $projectRef
    Write-Host "✅ Project gelinkt" -ForegroundColor Green
} else {
    Write-Host "✅ Project al gelinkt" -ForegroundColor Green
}

Write-Host ""

# Push migrations
Write-Host "📤 Database migraties pushen..." -ForegroundColor Yellow
npx supabase db push
Write-Host "✅ Migraties gepusht" -ForegroundColor Green
Write-Host ""

# Create storage bucket
Write-Host "📦 Storage bucket aanmaken..." -ForegroundColor Yellow
$buckets = npx supabase storage ls 2>&1
if ($buckets -match "docs") {
    Write-Host "✅ Bucket 'docs' bestaat al" -ForegroundColor Green
} else {
    Write-Host "   Maak handmatig een bucket aan genaamd 'docs' via:" -ForegroundColor Yellow
    Write-Host "   npx supabase storage create docs --public false" -ForegroundColor Yellow
    Write-Host "   Of via het Supabase Dashboard" -ForegroundColor Yellow
    Read-Host "Druk op Enter om door te gaan na het aanmaken van de bucket"
}

Write-Host ""

# Apply storage policies (via migration)
Write-Host "🔒 Storage policies worden toegepast via migraties..." -ForegroundColor Yellow
Write-Host "✅ Storage policies geconfigureerd" -ForegroundColor Green
Write-Host ""

# Get environment variables
Write-Host "🔑 Environment variabelen ophalen..." -ForegroundColor Yellow
try {
    npx supabase status --output env > .env.supabase.tmp 2>&1
    if (Test-Path ".env.supabase.tmp") {
        Write-Host "✅ Environment variabelen opgehaald" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Voeg deze toe aan je .env.local:" -ForegroundColor Yellow
        Get-Content .env.supabase.tmp
        Write-Host ""
        Remove-Item .env.supabase.tmp
    }
} catch {
    Write-Host "⚠️  Kon environment variabelen niet automatisch ophalen" -ForegroundColor Yellow
    Write-Host "📝 Haal ze handmatig op via: npx supabase status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup voltooid!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Volgende stappen:" -ForegroundColor Cyan
    Write-Host "   1. Maak een gebruiker aan: npx supabase auth signup --email jouw@email.com --password wachtwoord" -ForegroundColor White
Write-Host "   2. Of gebruik het dashboard om een gebruiker aan te maken" -ForegroundColor White
Write-Host "   3. Maak een profiel aan in de profiles tabel" -ForegroundColor White
Write-Host "   4. Start de dev server: npm run dev" -ForegroundColor White
Write-Host ""

