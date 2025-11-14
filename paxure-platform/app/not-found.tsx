import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>404 - Pagina niet gevonden</CardTitle>
          <CardDescription>
            De pagina die je zoekt bestaat niet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">Ga naar Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

