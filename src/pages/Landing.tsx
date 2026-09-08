import { useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --orange: #f97316;
    --orange-dark: #ea580c;
    --orange-light: #fff7ed;
    --navy: #1c1917;
    --gray: #78716c;
    --gray-light: #fafaf9;
    --border: #e7e5e4;
    --radius: 16px;
  }
  .lp-body { font-family: 'Nunito', sans-serif; color: var(--navy); background: #fff; line-height: 1.6; }
  nav { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 64px; }
  .nav-brand { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 1.1rem; }
  .nav-brand img { width: 42px; height: 42px; border-radius: 10px; object-fit: contain; }
  .nav-links { display: flex; gap: 2rem; }
  .nav-links a { color: var(--gray); text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: color .2s; }
  .nav-links a:hover { color: var(--orange); }
  .nav-cta { background: var(--orange); color: #fff; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: background .2s; cursor: pointer; border: none; }
  .nav-cta:hover { background: var(--orange-dark); }
  .nav-signin { background: transparent; color: var(--navy); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; border: 1.5px solid var(--border); margin-right: 0.5rem; cursor: pointer; transition: border-color .2s; }
  .nav-signin:hover { border-color: var(--orange); color: var(--orange); }
  .hero { background: linear-gradient(135deg, #fff7ed 0%, #faf5ff 60%, #f0fdf4 100%); padding: 6rem 2rem 5rem; text-align: center; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #fdba74; color: var(--orange-dark); font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.9rem; border-radius: 999px; margin-bottom: 1.5rem; }
  .hero h1 { font-size: clamp(2.2rem, 5vw, 3.8rem); font-weight: 900; line-height: 1.15; max-width: 780px; margin: 0 auto 1.25rem; }
  .hero h1 span { color: var(--orange); }
  .hero p { font-size: 1.15rem; color: var(--gray); max-width: 560px; margin: 0 auto 2.5rem; }
  .hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
  .btn-primary { background: var(--orange); color: #fff; padding: 0.85rem 2rem; border-radius: 8px; font-weight: 700; font-size: 1rem; text-decoration: none; transition: background .2s, transform .1s; display: inline-block; cursor: pointer; border: none; }
  .btn-primary:hover { background: var(--orange-dark); transform: translateY(-1px); }
  .btn-secondary { background: #fff; color: var(--navy); border: 1.5px solid var(--border); padding: 0.85rem 2rem; border-radius: 10px; font-weight: 700; font-size: 1rem; text-decoration: none; transition: border-color .2s; display: inline-block; }
  .btn-secondary:hover { border-color: var(--orange); color: var(--orange); }
  .hero-proof { margin-top: 5rem; font-size: 0.85rem; color: var(--gray); display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem 1rem; padding: 0 1rem; }
  .hero-proof strong { color: var(--navy); }
  section { padding: 5rem 2rem; }
  .container { max-width: 1100px; margin: 0 auto; }
  .section-label { display: inline-block; background: var(--orange-light); color: var(--orange-dark); font-size: 0.75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 0.3rem 0.8rem; border-radius: 6px; margin-bottom: 1rem; }
  .section-title { font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 800; line-height: 1.2; margin-bottom: 0.75rem; }
  .section-sub { font-size: 1.05rem; color: var(--gray); max-width: 720px; }
  .problem { background: var(--gray-light); }
  .problem .section-sub { max-width: 100%; }
  .problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
  .problem-card { background: #fff; border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
  .problem-icon { font-size: 2rem; margin-bottom: 0.75rem; }
  .problem-card h3 { font-weight: 800; margin-bottom: 0.5rem; }
  .problem-card p { font-size: 0.9rem; color: var(--gray); }
  .diff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 3rem; }
  .diff-card { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 2rem; transition: border-color .2s, box-shadow .2s; position: relative; overflow: hidden; }
  .diff-card:hover { border-color: var(--orange); box-shadow: 0 8px 32px rgba(249,115,22,.1); }
  .diff-card.featured { border-color: var(--orange); background: var(--orange-light); }
  .diff-tag { position: absolute; top: 1rem; right: 1rem; background: var(--orange); color: #fff; font-size: 0.65rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; }
  .diff-emoji { font-size: 2.5rem; margin-bottom: 1rem; display: block; }
  .diff-card h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem; }
  .diff-card p { font-size: 0.9rem; color: var(--gray); margin-bottom: 1rem; }
  .diff-card blockquote { background: #fff; border-left: 3px solid var(--orange); padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; font-size: 0.85rem; color: var(--navy); font-style: italic; }
  .diff-vs { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: var(--gray); background: #f1f5f9; padding: 0.3rem 0.7rem; border-radius: 6px; margin-top: 0.75rem; }
  .diff-vs .yes { color: #22c55e; }
  .audit { background: linear-gradient(135deg, #1c1917 0%, #292524 100%); color: #fff; }
  .audit .section-label { background: rgba(249,115,22,.2); color: #fb923c; }
  .audit .section-title { color: #fff; }
  .audit .section-sub { color: #94a3b8; }
  .audit { padding: 4rem 2rem; }
  .audit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 2rem; align-items: center; }
  .audit-steps { list-style: none; display: flex; flex-direction: column; gap: 1.25rem; }
  .audit-steps li { display: flex; gap: 1rem; align-items: flex-start; }
  .audit-step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--orange); color: #fff; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .audit-steps li h4 { font-weight: 800; margin-bottom: 0.2rem; }
  .audit-steps li p { font-size: 0.85rem; color: #94a3b8; }
  .audit-stat-box { background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); border-radius: var(--radius); padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .audit-stat { text-align: center; }
  .audit-stat .num { font-size: 2.8rem; font-weight: 900; color: var(--orange); }
  .audit-stat .label { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
  .pricing { background: var(--gray-light); }
  .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
  .plan { background: #fff; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 1.75rem; display: flex; flex-direction: column; }
  .plan.popular { border-color: var(--orange); box-shadow: 0 8px 32px rgba(249,115,22,.15); }
  .plan-badge { display: inline-block; background: var(--orange); color: #fff; font-size: 0.7rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 0.2rem 0.7rem; border-radius: 4px; margin-bottom: 1rem; align-self: flex-start; }
  .plan-name { font-size: 1rem; font-weight: 800; margin-bottom: 0.25rem; }
  .plan-price { font-size: 2.2rem; font-weight: 900; margin-bottom: 0.25rem; }
  .plan-price span { font-size: 1rem; font-weight: 600; color: var(--gray); }
  .plan-desc { font-size: 0.85rem; color: var(--gray); margin-bottom: 1.25rem; }
  .plan-features { list-style: none; flex: 1; }
  .plan-features li { font-size: 0.88rem; padding: 0.35rem 0; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 0.5rem; }
  .plan-features li::before { content: '✓'; color: var(--orange); font-weight: 800; }
  .plan-cta { display: block; text-align: center; margin-top: 1.5rem; padding: 0.7rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; transition: all .2s; cursor: pointer; border: none; }
  .plan-cta.primary { background: var(--orange); color: #fff; }
  .plan-cta.primary:hover { background: var(--orange-dark); }
  .plan-cta.outline { border: 1.5px solid var(--border); color: var(--navy); background: transparent; }
  .plan-cta.outline:hover { border-color: var(--orange); color: var(--orange); }
  .pricing-note { text-align: center; color: var(--gray); font-size: 0.85rem; margin-top: 1.5rem; }
  .roadmap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 3rem; }
  .roadmap-item { border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
  .roadmap-item.done { border-color: #86efac; background: #f0fdf4; }
  .roadmap-item.next { border-color: #fcd34d; background: #fefce8; }
  .roadmap-item.future { border-color: #c4b5fd; background: #faf5ff; }
  .roadmap-tag { display: inline-block; font-size: 0.7rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 4px; margin-bottom: 0.75rem; }
  .done .roadmap-tag { background: #bbf7d0; color: #166534; }
  .next .roadmap-tag { background: #fde68a; color: #92400e; }
  .future .roadmap-tag { background: #ddd6fe; color: #5b21b6; }
  .roadmap-item h3 { font-weight: 800; margin-bottom: 0.4rem; }
  .roadmap-item p { font-size: 0.85rem; color: var(--gray); }
  .cta-section { background: linear-gradient(135deg, #fff7ed 0%, #faf5ff 50%, #f0fdf4 100%); text-align: center; padding: 5rem 2rem; color: var(--navy); }
  .cta-section h2 { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; margin-bottom: 1rem; }
  .cta-section p { font-size: 1.1rem; color: var(--gray); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; }
  .btn-white { background: var(--orange); color: #fff; padding: 0.9rem 2.25rem; border-radius: 8px; font-weight: 700; font-size: 1rem; text-decoration: none; display: inline-block; transition: transform .1s, background .2s; cursor: pointer; border: none; }
  .btn-white:hover { transform: translateY(-2px); background: var(--orange-dark); }
  footer { background: var(--navy); color: #64748b; padding: 2rem; text-align: center; font-size: 0.85rem; }
  footer a { color: #94a3b8; text-decoration: none; }
  footer a:hover { color: var(--orange); }
  @media (max-width: 700px) { .audit-grid { grid-template-columns: 1fr; } }
  @media (max-width: 640px) { .nav-links { display: none; } .hero { padding: 4rem 1.5rem 3rem; } section { padding: 3.5rem 1.5rem; } }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .modal-box { background: #fff; border-radius: var(--radius); padding: 2rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
  .modal-box h2 { font-size: 1.4rem; font-weight: 900; margin-bottom: 0.5rem; }
  .modal-box p { font-size: 0.9rem; color: var(--gray); margin-bottom: 1.5rem; }
  .modal-field { margin-bottom: 1rem; }
  .modal-field label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--navy); }
  .modal-field input { width: 100%; padding: 0.65rem 0.9rem; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.95rem; font-family: inherit; outline: none; transition: border-color .2s; }
  .modal-field input:focus { border-color: var(--orange); }
  .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  .modal-actions button { flex: 1; padding: 0.75rem; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: none; transition: all .2s; }
  .modal-submit { background: var(--orange); color: #fff; }
  .modal-submit:hover:not(:disabled) { background: var(--orange-dark); }
  .modal-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .modal-cancel { background: var(--gray-light); color: var(--navy); border: 1.5px solid var(--border) !important; }
  .modal-cancel:hover { border-color: var(--orange) !important; color: var(--orange); }
  .modal-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.65rem 0.9rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; }
`;

export default function Landing() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/create-school-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, adminEmail, adminPhone }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      navigate(`/register?token=${data.token}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="lp-body">
        {/* Nav */}
        <nav>
          <div className="nav-brand">
            <img src="/favicon.webp" alt="Daycare Portal" />
            Daycare Portal
          </div>
          <div className="nav-links">
            <a href="#why">Why Us</a>
            <a href="#audit">Licensing</a>
            <a href="#pricing">Pricing</a>
            <a href="#roadmap">Roadmap</a>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <a href="/login" className="nav-signin">Sign In</a>
            <button className="nav-cta" onClick={() => setModalOpen(true)}>Try it free →</button>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">🌟 Built for family-owned daycares</div>
          <p style={{fontSize:'1rem',color:'#c2410c',fontWeight:700,maxWidth:640,margin:'0 auto 1rem',letterSpacing:'.01em'}}>
            A complete daycare management platform.
          </p>
          <h1>Run your daycare.<br /><span>Not your paperwork.</span></h1>
          <p>Daycare Portal handles check-ins, parent &amp; staff onboarding, student admissions, daily reports, parent communication, and licensing compliance — so you can focus on the children.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setModalOpen(true)}>Start free trial</button>
            <a href="#why" className="btn-secondary">See what&apos;s different</a>
          </div>
          <p className="hero-proof">
            <span>No credit card required</span>
            <span>·</span>
            <span>Setup in <strong>less than 10 minutes</strong></span>
            <span>·</span>
            <span>Cancel anytime</span>
          </p>
        </section>

        {/* Problem */}
        <section className="problem" id="problem">
          <div className="container">
            <div className="section-label">Built for You</div>
            <h2 className="section-title">Small daycares deserve great software too.</h2>
            <p className="section-sub">Family-owned daycares are the heart of early childhood care. Daycare Portal is designed specifically for you — simple enough to use on a busy morning, powerful enough to handle everything you need.</p>
            <div className="problem-grid">
              <div className="problem-card">
                <div className="problem-icon">🚪</div>
                <h3>Drop-off that flows</h3>
                <p>Parents set their own check-in code — something they actually remember. Mornings move faster when nobody&apos;s fumbling for a PIN.</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon">📋</div>
                <h3>Parent onboarding with the right paperwork</h3>
                <p>Invite parents via a link, pre-fill their details, and have all the right forms signed before day one. Onboarding that&apos;s smooth for families and complete for you.</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon">✅</div>
                <h3>Inspection-ready, always</h3>
                <p>Licensing records, immunizations, and compliance forms are organized and up to date — not scrambled together the week before an inspection.</p>
              </div>
              <div className="problem-card">
                <div className="problem-icon">💛</div>
                <h3>Parents who feel connected</h3>
                <p>AI turns your daily activity logs into warm, readable stories. Parents get more than data — they get a window into their child&apos;s day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how">
          <div className="container">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">Up and running in less than 10 minutes.</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'2rem',marginTop:'3rem'}}>
              <div style={{textAlign:'center',padding:'1.5rem'}}>
                <div style={{width:48,height:48,background:'var(--orange-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'1.3rem',fontWeight:900,color:'var(--orange)'}}>1</div>
                <h3 style={{fontWeight:800,marginBottom:'0.5rem'}}>Sign up your school</h3>
                <p style={{fontSize:'0.9rem',color:'var(--gray)'}}>Enter your school name and contact details. Your account is ready instantly — no waiting, no approval process.</p>
              </div>
              <div style={{textAlign:'center',padding:'1.5rem'}}>
                <div style={{width:48,height:48,background:'var(--orange-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'1.3rem',fontWeight:900,color:'var(--orange)'}}>2</div>
                <h3 style={{fontWeight:800,marginBottom:'0.5rem'}}>Add staff &amp; set up rooms</h3>
                <p style={{fontSize:'0.9rem',color:'var(--gray)'}}>Invite your team via a link. Set up classrooms, schedules, and check-in codes in just a few clicks.</p>
              </div>
              <div style={{textAlign:'center',padding:'1.5rem'}}>
                <div style={{width:48,height:48,background:'var(--orange-light)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'1.3rem',fontWeight:900,color:'var(--orange)'}}>3</div>
                <h3 style={{fontWeight:800,marginBottom:'0.5rem'}}>Invite parents</h3>
                <p style={{fontSize:'0.9rem',color:'var(--gray)'}}>Parents receive a personal invite link, register themselves, and can see their child's daily activity from day one.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Differentiators */}
        <section id="why">
          <div className="container">
            <div className="section-label">Why Daycare Portal</div>
            <h2 className="section-title">Three things that set us apart.</h2>
            <p className="section-sub">Thoughtfully designed features that make a real difference for family-owned daycares.</p>
            <div className="diff-grid">
              <div className="diff-card">
                <span className="diff-emoji">🔑</span>
                <h3>One code. Every school.</h3>
                <p>Your check-in code is tied to <em>you</em>, not a specific school or child. If your kids attend two schools, one code works at both. And you set it yourself — something you&apos;ll actually remember.</p>
                <blockquote>&ldquo;Like your ATM PIN — it&apos;s yours, it&apos;s everywhere, it doesn&apos;t change.&rdquo;</blockquote>
                <div className="diff-vs"><span className="yes">✓</span> Works across every school your children attend</div>
              </div>
              <div className="diff-card featured">
                <div className="diff-tag">Unique</div>
                <span className="diff-emoji">✨</span>
                <h3>AI turns activity logs into stories parents love.</h3>
                <p>Staff tap in: nap, meals, potty, observations. Our AI turns that into a warm daily narrative — or a weekly digest email — that makes parents feel genuinely connected to their child&apos;s day.</p>
                <blockquote>&ldquo;Lily had a wonderful afternoon. She explored the sensory table, showed real focus during storytime, and napped deeply for 90 minutes.&rdquo;</blockquote>
                <div className="diff-vs"><span className="yes">✓</span> Parents subscribe emotionally, not just contractually</div>
              </div>
              <div className="diff-card">
                <span className="diff-emoji">🏛️</span>
                <h3>Remote Auditing. Fewer surprise inspections.</h3>
                <p>Give your state licensing inspector a time-limited read-only audit link. They review immunization records, staff certifications, and compliance forms from their office — saving everyone hours.</p>
                <blockquote>&ldquo;Inspection prep went from a week of binder-pulling to sharing a link.&rdquo;</blockquote>
                <div className="diff-vs"><span className="yes">✓</span> A genuine competitive advantage in your market</div>
              </div>
            </div>
          </div>
        </section>

        {/* Audit spotlight */}
        <section className="audit" id="audit">
          <div className="container">
            <div className="section-label">Licensing &amp; Compliance</div>
            <h2 className="section-title">Remote Auditing. Fewer surprises.</h2>
            <p className="section-sub">Stay inspection-ready year-round — share a time-limited audit link with your licensing agency instead of a day of binder-pulling.</p>
            <div className="audit-grid">
              <ul className="audit-steps">
                <li>
                  <div className="audit-step-num">1</div>
                  <div><h4>Generate an audit link</h4><p>One click creates a time-limited, read-only link scoped to compliance data only. No login required for the inspector.</p></div>
                </li>
                <li>
                  <div className="audit-step-num">2</div>
                  <div><h4>Inspector reviews remotely</h4><p>Immunization records, staff certifications, attendance logs, emergency contacts, and compliance forms — all in one view.</p></div>
                </li>
                <li>
                  <div className="audit-step-num">3</div>
                  <div><h4>Physical visit becomes a formality</h4><p>When the inspector does visit, the paperwork review is already done. They walk the facility, sign off, and leave in under an hour.</p></div>
                </li>
                <li>
                  <div className="audit-step-num">4</div>
                  <div><h4>Link expires automatically</h4><p>No permanent access granted. Every audit link has an expiry date. Security and compliance baked in.</p></div>
                </li>
              </ul>
              <div className="audit-stat-box">
                <div className="audit-stat"><div className="num">3–5</div><div className="label">hours saved per inspection for the daycare owner</div></div>
                <div className="audit-stat"><div className="num">2×</div><div className="label">more inspections per day possible for licensing agencies</div></div>
                <div className="audit-stat"><div className="num">0</div><div className="label">other portals at this price point offer remote audit access</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing" id="pricing">
          <div className="container">
            <div className="section-label">Pricing</div>
            <h2 className="section-title">Free during early access.</h2>
            <p className="section-sub">Daycare Portal is free to use while we&apos;re in early access. We&apos;re building with real daycares and refining the product together. Paid plans will be introduced later — and early adopters will receive preferential pricing when we do.</p>
            <div style={{ marginTop: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.5rem" }}>
              <div className="plan popular">
                <div className="plan-badge">Current — Early Access</div>
                <div className="plan-name">Full Access</div>
                <div className="plan-price" style={{ fontSize: "2.8rem" }}>Free</div>
                <div className="plan-desc">All features, no limits, no credit card required.</div>
                <ul className="plan-features">
                  <li>Unlimited children &amp; locations</li>
                  <li>Parent portal &amp; personal check-in codes</li>
                  <li>QR code check-in kiosk</li>
                  <li>Daily activity logs &amp; immunization tracking</li>
                  <li>Staff management &amp; invites</li>
                  <li>Compliance forms &amp; paperwork</li>
                </ul>
                <button className="plan-cta primary" onClick={() => setModalOpen(true)}>Get started free →</button>
              </div>
              <div className="plan" style={{ background: "linear-gradient(135deg,#fdf2f8,#f0fdf4)", borderColor: "#fce7f3" }}>
                <div className="plan-badge" style={{ background: "#f59e0b" }}>Coming Soon</div>
                <div className="plan-name">Paid Plans</div>
                <div className="plan-price" style={{ fontSize: "1.6rem", paddingTop: ".5rem" }}>Pricing TBD</div>
                <div className="plan-desc">Planned tiers based on school size and features. Early adopters get priority rates.</div>
                <ul className="plan-features">
                  <li>AI daily stories &amp; weekly digests</li>
                  <li>Remote audit / licensing access</li>
                  <li>Multi-site management</li>
                  <li>Tuition &amp; invoicing</li>
                  <li>Priority support</li>
                  <li>White-label &amp; API (enterprise)</li>
                </ul>
                <a href="mailto:hello@daycareportal.com" className="plan-cta outline">Notify me when pricing launches</a>
              </div>
            </div>
            <p className="pricing-note" style={{ marginTop: "2rem" }}>🎁 Early adopters who join now will be grandfathered into preferential pricing when paid plans launch.</p>
          </div>
        </section>

        {/* Roadmap */}
        <section id="roadmap">
          <div className="container">
            <div className="section-label">Roadmap</div>
            <h2 className="section-title">What&apos;s built. What&apos;s next.</h2>
            <p className="section-sub">We ship fast. Here&apos;s where we are and where we&apos;re going.</p>
            <div className="roadmap-grid">
              <div className="roadmap-item done"><span className="roadmap-tag">Live now</span><h3>Check-in &amp; Parent Portal</h3><p>QR kiosk, personal check-in codes, parent registration via invite, daily activity feed.</p></div>
              <div className="roadmap-item done"><span className="roadmap-tag">Live now</span><h3>School &amp; Staff Management</h3><p>Multi-school portal admin, staff invites, rooms, schedules, immunization tracking.</p></div>
              <div className="roadmap-item done"><span className="roadmap-tag">Live now</span><h3>Compliance Forms</h3><p>Digital paperwork, document storage, compliance alerts dashboard.</p></div>
              <div className="roadmap-item next"><span className="roadmap-tag">Coming R1</span><h3>AI Daily Stories</h3><p>Activity logs → warm parent narratives. Weekly digest emails. Milestone detection.</p></div>
              <div className="roadmap-item next"><span className="roadmap-tag">Coming R1</span><h3>Remote Audit Access</h3><p>Time-limited inspector links, licensing agency portal, automated compliance reports.</p></div>
              <div className="roadmap-item next"><span className="roadmap-tag">Coming R1</span><h3>School Website Hosting &amp; Vacancy Search</h3><p>A public-facing mini-site for your daycare — contact info, location, hours, enrolment enquiry form.</p></div>
              <div className="roadmap-item next"><span className="roadmap-tag">Coming R1</span><h3>Weekly Parenting Insights</h3><p>Curated articles on child development, growth milestones, and parenting tips — delivered to parents every week.</p></div>
              <div className="roadmap-item future"><span className="roadmap-tag">Future</span><h3>Tuition &amp; Invoicing</h3><p>Automated billing, payment collection, subsidy tracking, financial reports.</p></div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2>Give children more of your attention.</h2>
          <p>Set up in less than 10 minutes. No credit card needed. Start with a free trial today.</p>
          <button className="btn-white" onClick={() => setModalOpen(true)}>Start your free trial →</button>
        </section>

        {/* Footer */}
        <footer>
          <p>© 2026 Daycare Portal &nbsp;·&nbsp; <a href="/login">Sign In</a> &nbsp;·&nbsp; <a href="mailto:hello@daycareportal.com">Contact</a></p>
        </footer>

        {/* Sign-up modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h2>Start your free trial</h2>
              <p>Set up your school in under 10 minutes — no credit card required.</p>
              {error && <div className="modal-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="modal-field">
                  <label htmlFor="schoolName">School name</label>
                  <input
                    id="schoolName"
                    type="text"
                    placeholder="Sunny Days Daycare"
                    required
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="adminEmail">Admin email</label>
                  <input
                    id="adminEmail"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="adminPhone">Admin phone</label>
                  <input
                    id="adminPhone"
                    type="tel"
                    placeholder="(555) 555-5555"
                    required
                    value={adminPhone}
                    onChange={e => setAdminPhone(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={() => setModalOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-submit" disabled={loading}>
                    {loading ? "Creating…" : "Continue →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
