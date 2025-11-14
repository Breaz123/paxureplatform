#!/bin/bash

# Paxure Platform - Supabase Setup Script
# Dit script automatiseert de setup van Supabase met de CLI

set -e

echo "🚀 Paxure Platform - Supabase Setup"
echo "===================================="
echo ""

# Check if supabase CLI is available via npx
echo "🔍 Supabase CLI controleren..."
if npx supabase --version &> /dev/null; then
    VERSION=$(npx supabase --version)
    echo "✅ Supabase CLI gevonden via npx (versie: $VERSION)"
else
    echo "❌ Supabase CLI is niet beschikbaar via npx!"
    echo "📦 Supabase CLI wordt automatisch gedownload via npx bij eerste gebruik"
    echo "   Als dit niet werkt, controleer je npm/node installatie"
    exit 1
fi
echo ""

# Check if user is logged in
if ! npx supabase projects list &> /dev/null; then
    echo "🔐 Je bent niet ingelogd bij Supabase"
    echo "📝 Log in met: npx supabase login"
    exit 1
fi

echo "✅ Ingelogd bij Supabase"
echo ""

# Link to remote project (if not already linked)
if [ ! -f ".supabase/config.toml" ] || ! grep -q "project_id" .supabase/config.toml 2>/dev/null; then
    echo "🔗 Link naar je Supabase project:"
    echo "   Voer je project reference ID in (vind je in Supabase Dashboard → Settings → General)"
    read -p "Project Reference ID: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ Project Reference ID is vereist"
        exit 1
    fi
    
    npx supabase link --project-ref "$PROJECT_REF"
    echo "✅ Project gelinkt"
else
    echo "✅ Project al gelinkt"
fi

echo ""

# Push migrations
echo "📤 Database migraties pushen..."
npx supabase db push
echo "✅ Migraties gepusht"
echo ""

# Create storage bucket
echo "📦 Storage bucket aanmaken..."
# Check if bucket already exists
if npx supabase storage ls | grep -q "docs"; then
    echo "✅ Bucket 'docs' bestaat al"
else
    echo "   Maak handmatig een bucket aan genaamd 'docs' via:"
    echo "   npx supabase storage create docs --public false"
    echo "   Of via het Supabase Dashboard"
    read -p "Druk op Enter om door te gaan na het aanmaken van de bucket..."
fi

echo ""

# Apply storage policies (via migration)
echo "🔒 Storage policies worden toegepast via migraties..."
echo "✅ Storage policies geconfigureerd"
echo ""

# Get environment variables
echo "🔑 Environment variabelen ophalen..."
npx supabase status --output env > .env.supabase.tmp 2>/dev/null || true

if [ -f ".env.supabase.tmp" ]; then
    echo "✅ Environment variabelen opgehaald"
    echo ""
    echo "📝 Voeg deze toe aan je .env.local:"
    cat .env.supabase.tmp
    echo ""
    rm .env.supabase.tmp
else
    echo "⚠️  Kon environment variabelen niet automatisch ophalen"
    echo "📝 Haal ze handmatig op via: npx supabase status"
fi

echo ""
echo "✅ Setup voltooid!"
echo ""
echo "📋 Volgende stappen:"
echo "   1. Maak een gebruiker aan: npx supabase auth signup --email jouw@email.com --password wachtwoord"
echo "   2. Of gebruik het dashboard om een gebruiker aan te maken"
echo "   3. Maak een profiel aan in de profiles tabel"
echo "   4. Start de dev server: npm run dev"
echo ""

