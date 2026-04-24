import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-blue-500">Re</span>call
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-sm text-blue-400 mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          AI-powered exam prep
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
          Study smarter.
          <br />
          <span className="text-blue-500">Not longer.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Upload your lectures. Set your exam date. Recall builds your personal study plan
          and tests you with your voice until you&apos;re ready.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-4 rounded-xl text-lg font-medium transition-colors"
          >
            Log In
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl">
          {[
            {
              icon: "📄",
              title: "Upload Anything",
              desc: "PDFs, photos of handwritten notes — Recall extracts and understands all of it.",
            },
            {
              icon: "🗓️",
              title: "AI Study Plan",
              desc: "Day-by-day schedule from today to exam day, built from your actual content.",
            },
            {
              icon: "🎙️",
              title: "Voice Self-Testing",
              desc: "Speak your answers out loud. AI grades your reasoning, not just keywords.",
            },
            {
              icon: "📈",
              title: "Exam Readiness Score",
              desc: "Real-time score across all topics. Spaced repetition kills your weak spots.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6 text-left hover:border-blue-500/30 transition-colors"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-600 border-t border-[#1f1f1f]">
        Built for university students who want to actually pass.
      </footer>
    </div>
  );
}
