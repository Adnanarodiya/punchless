import { MapPin, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@punchless/ui/components/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">⚡ Punchless</h1>
          <nav className="flex gap-4">
            <Button variant="ghost" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button variant="tertiary" asChild>
              <a href="/signup">Get Started</a>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold tracking-tight leading-tight">
            Attendance that works
            <br />
            <span className="text-blue-400">without the punch.</span>
          </h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed">
            GPS-based automatic attendance, job tracking, travel time logging,
            and salary calculation — built for workshops and service businesses.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Button size="xl" asChild>
              <a href="/signup">Start Free Trial</a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div
          id="features"
          className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          <FeatureCard
            icon={<MapPin className="w-8 h-8 text-blue-400" />}
            title="Auto Attendance"
            description="GPS geofencing marks employees present automatically when they enter the workshop."
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-green-400" />}
            title="Travel & Job Tracking"
            description="Track travel time, on-site repair time, and job completion — all automatically."
          />
          <FeatureCard
            icon={<DollarSign className="w-8 h-8 text-yellow-400" />}
            title="Fair Salary"
            description="Salary calculated from actual tracked hours. Overtime, advances — all handled."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-purple-400" />}
            title="Multi-Workshop"
            description="Manage multiple workshops, employees, and jobs from one dashboard."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-32">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          © 2026 Punchless. Built for workshops that move.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600 transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
