import { createEmployee } from "@/lib/actions/employee.actions";
import { getEmployees } from "@/lib/queries/employee.queries";
import { Button } from "@punchless/ui/components/button";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Add Employee</h2>

          <form action={createEmployee} className="space-y-3">
            <input
              name="fullName"
              placeholder="Full name"
              required
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
            />
            <input
              name="password"
              type="password"
              placeholder="Temporary password"
              minLength={6}
              required
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
            />
            <input
              name="hourlyRate"
              type="number"
              step="0.01"
              placeholder="Hourly rate (₹)"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
            />
            <input
              name="travelRate"
              type="number"
              step="0.01"
              placeholder="Travel rate (₹)"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
            />
            <Button type="submit" className="w-full">
              Create Employee
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Employee List</h2>

          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees yet.</p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between border border-border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{emp.full_name}</p>
                    <p className="text-sm text-muted-foreground">{emp.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">₹{emp.hourly_rate}/hr</p>
                    <p className="text-xs text-muted-foreground">
                      Travel ₹{emp.travel_rate}/hr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
