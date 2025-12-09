import { Card, CardContent, CardHeader, CardTitle } from "@myprotocolstack/ui";

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to MyProtocolStack Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This admin dashboard will be used to manage protocols, users, and subscriptions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
