# Build Notes

## Build zonder Supabase Credentials

Het platform kan **niet** succesvol builden zonder Supabase environment variabelen. Dit is normaal gedrag.

### Oplossing

Voordat je `npm run build` uitvoert, moet je:

1. Een `.env.local` bestand aanmaken met alle vereiste variabelen
2. Zie `.env.local.example` voor het format
3. Zie `GETTING_STARTED.md` voor instructies om de waarden te verkrijgen

### Development Mode

Voor development kun je gewoon `npm run dev` gebruiken. De applicatie zal werken zodra je:
- Supabase project hebt aangemaakt
- Environment variabelen hebt ingesteld
- Database schema hebt geïnstalleerd

### Build Errors

Als je build errors krijgt zoals:
```
Error: @supabase/ssr: Your project's URL and API key are required
```

Dit betekent dat:
- Je `.env.local` bestand ontbreekt of incompleet is
- De environment variabelen niet correct zijn ingesteld
- Je moet eerst Supabase setup voltooien (zie `GETTING_STARTED.md`)

### Vercel Deployment

Voor Vercel deployment:
1. Voeg alle environment variabelen toe in Vercel dashboard
2. De build zal dan succesvol zijn
3. Zie `README.md` voor deployment instructies

