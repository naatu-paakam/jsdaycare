import { BookHeart } from "lucide-react";
import Layout from "@/components/Layout";

export default function Stories() {
  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <BookHeart size={28} className="text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Coming in R1</span>
        </div>
        <p className="text-gray-500 text-sm mb-8">A shared journal for the daycare community — milestones, reflections, and moments of growth.</p>

        {/* Preview card */}
        <div className="card p-8 text-center space-y-6 border-2 border-dashed border-orange-200 bg-orange-50/30">
          <div className="text-5xl">📖</div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-900 text-lg">Stories are coming soon</p>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">
              Admins, staff, and parents will be able to post short reflections — a child's milestone, a group activity, or a moment of growth — with optional photos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              { emoji: "✍️", title: "Write a story", desc: "Share a moment in 2-5 sentences" },
              { emoji: "🤖", title: "AI elaborates", desc: "Claude turns your note into a warm narrative" },
              { emoji: "📜", title: "Timeline view", desc: "Latest stories at top, all scrollable" },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-xl p-4 border border-orange-100">
                <div className="text-2xl mb-2">{f.emoji}</div>
                <p className="font-medium text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            See <code className="bg-gray-100 px-1 rounded">docs/features/09-stories.md</code> for the full feature spec.
          </p>
        </div>
      </div>
    </Layout>
  );
}
