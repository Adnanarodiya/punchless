import { MapPin, Clock, DollarSign, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            ⚡ Punchless
          </h1>
          <nav className="flex gap-4">
            <a
              href="/login"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Login
            </a>
            <a
              href="/signup"
              className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Get Started
            </a>
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
            <a
              href="/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium text-lg transition"
            >
              Start Free Trial
            </a>
            <a
              href="#features"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-medium text-lg transition"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
