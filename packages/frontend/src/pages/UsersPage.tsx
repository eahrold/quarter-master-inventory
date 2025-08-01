import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, User } from 'lucide-react'

export function UsersPage() {
  const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@troop123.org', role: 'admin' },
    { id: 2, username: 'leader1', email: 'leader@troop123.org', role: 'leader' },
    { id: 3, username: 'scout1', email: 'scout@troop123.org', role: 'scout' },
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'leader': return 'bg-blue-100 text-blue-800'
      case 'scout': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage troop members and their permissions</p>
        </div>
        <Button variant="qm">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4">
        {mockUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-quartermaster-yellow-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-quartermaster-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}