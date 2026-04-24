import Link from "next/link";
import WaitlistForm from "./components/WaitlistForm";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0F1117] text-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0F1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight text-white">
            Recall
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-lg border border-transparent hover:border-white/10 transition-all"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-[#4F8EF7] hover:bg-[#6aa0f8] text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#4F8EF7]/10 border border-[#4F8EF7]/25 rounded-full px-4 py-1.5 text-sm text-[#4F8EF7] mb-8">
            <span className="w-1.5 h-1.5 bg-[#4F8EF7] rounded-full"></span>
            Voice-graded AI testing — no competitor does this
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-bold tracking-tight leading-[1.05] mb-6 text-white">
            Study less.
            <br />
            <span className="text-[#4F8EF7]">Retain more.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your lecture notes. Recall builds your study plan, tests you with AI, and tracks exactly what you know — and what you don&apos;t.
          </p>

          <div className="flex flex-col items-center gap-3">
            <Link
              href="/signup"
              className="bg-[#4F8EF7] hover:bg-[#6aa0f8] text-white px-8 py-4 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#4F8EF7]/20"
            >
              Start studying free
            </Link>
            <p className="text-sm text-gray-500">No credit card. Works with any PDF or photo.</p>
            <p className="text-sm text-gray-500">
              Already signed up?{" "}
              <Link href="/login" className="text-blue-400 underline">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        {/* Hero Visual: Stylized question card with voice waveform + score badge */}
        <div className="mt-16 max-w-lg mx-auto">
          <div className="rounded-2xl bg-[#151821] border border-white/8 p-6 shadow-2xl shadow-black/50">
            {/* Card header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#4F8EF7]"></div>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Question 4 of 12</span>
              </div>
              <div className="text-xs text-gray-500 bg-white/5 rounded-md px-2 py-1">Molecular Biology</div>
            </div>
            {/* Question */}
            <p className="text-white font-medium mb-5 leading-relaxed">
              Explain the role of mRNA in protein synthesis and where translation occurs in the cell.
            </p>
            {/* Voice waveform visualization */}
            <div className="bg-[#0F1117] rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#4F8EF7]/20 border border-[#4F8EF7]/40 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4F8EF7]"></div>
                </div>
                <span className="text-xs text-[#4F8EF7] font-medium">Recording answer...</span>
                <div className="ml-auto flex items-end gap-[3px] h-5">
                  {[3, 7, 5, 10, 8, 4, 9, 6, 11, 7, 4, 8, 5, 10, 6].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full bg-[#4F8EF7]/60"
                      style={{ height: `${h * 1.6}px` }}
                    ></div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-400 italic leading-relaxed">
                &ldquo;mRNA carries the genetic code from the nucleus to the ribosome... transcription happens in the nucleus and translation at the ribosome...&rdquo;
              </p>
            </div>
            {/* Score badge */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full">
                <div className="h-1.5 w-[82%] bg-[#4F8EF7] rounded-full"></div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-xs font-semibold text-emerald-400">Strong — 82%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
            <p className="text-gray-400 text-lg">From notes to exam-ready in three steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
                title: "Upload your notes",
                desc: "PDF slides or a photo of your handwritten notes. Recall extracts everything.",
              },
              {
                step: "02",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                ),
                title: "Get tested by AI",
                desc: "Recall generates targeted questions and quizzes you — by voice or text.",
              },
              {
                step: "03",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                title: "Know what sticks",
                desc: "Spaced repetition resurfaces weak spots. Your readiness score updates in real time.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center text-[#4F8EF7]">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#4F8EF7]/60 mb-1">{item.step}</div>
                    <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-white/5 py-24 bg-[#0c0e14]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need to actually prepare</h2>
            <p className="text-gray-400 text-lg">Built around how memory works, not how flashcard apps work.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                emoji: "🎤",
                title: "Voice self-testing",
                desc: "Speak your answer. Claude grades your reasoning, not just keywords.",
                highlight: true,
              },
              {
                emoji: "📄",
                title: "PDF + photo upload",
                desc: "Lecture slides, handwritten notes, textbook pages. All supported.",
              },
              {
                emoji: "🧠",
                title: "Spaced repetition",
                desc: "Questions come back when you're about to forget them.",
              },
              {
                emoji: "📊",
                title: "Mastery tracking",
                desc: "See exactly which topics you own and which need work.",
              },
              {
                emoji: "📅",
                title: "Exam countdown",
                desc: "Study plan built around your exam date.",
              },
              {
                emoji: "✍️",
                title: "AI feedback",
                desc: "Every answer gets specific feedback on what to improve.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`rounded-xl p-6 border transition-all ${
                  feature.highlight
                    ? "bg-[#4F8EF7]/5 border-[#4F8EF7]/30 hover:border-[#4F8EF7]/50"
                    : "bg-[#151821] border-white/6 hover:border-white/12"
                }`}
              >
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="text-white font-semibold mb-2">
                  {feature.title}
                  {feature.highlight && (
                    <span className="ml-2 text-[10px] font-medium text-[#4F8EF7] bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 rounded-full px-2 py-0.5 align-middle">
                      Unique
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for students who actually want to pass.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I'd been rereading the same thermodynamics notes for a week and it wasn't clicking. After two sessions with Recall — speaking answers out loud and getting real feedback — I actually understood what I'd been staring at. Got an 81 on the midterm.",
                name: "James T.",
                detail: "3rd year, Mechanical Engineering — University of Waterloo",
              },
              {
                quote: "Every study tool I'd tried just made me feel busy. Recall is different because it tells you when you actually know something versus when you just recognize it. The voice testing is weird at first but it works — you can't fake it.",
                name: "Priya M.",
                detail: "2nd year, Commerce — Queen's University",
              },
              {
                quote: "Biochem has so many pathways and I was drowning. I uploaded my prof's slides, set my exam date, and Recall just told me what to do every day. The mastery tracker showed me I was weak on glycolysis three days out — enough time to fix it.",
                name: "Sophie L.",
                detail: "3rd year, Life Sciences — McMaster University",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-[#151821] border border-white/6 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#4F8EF7]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <div className="text-white text-sm font-medium">{testimonial.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{testimonial.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Early access open
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Be first in line</h2>
          <p className="text-white/50 mb-8 text-sm">Join students already on the waitlist. Get early access before we open to everyone.</p>
          <WaitlistForm />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/5 py-24 bg-[#0c0e14]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to actually remember<br />what you study?
          </h2>
          <p className="text-gray-400 mb-10">Works with any subject. No setup required.</p>
          <Link
            href="/signup"
            className="inline-block bg-[#4F8EF7] hover:bg-[#6aa0f8] text-white px-10 py-4 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-[#4F8EF7]/25"
          >
            Get started free
          </Link>
          <p className="text-sm text-gray-600 mt-4">No credit card. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">Recall &copy; 2026</div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
