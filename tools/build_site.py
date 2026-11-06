# Generates index.html and work/*.html for espressothecat.com from the content below.
# Voice: first person, plain, short.
import html, os

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GC = '<script data-goatcounter="https://espressothecat.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'
ORIGIN = "https://espressothecat.com"

def e(s): return html.escape(s, quote=True)

def ul(items): return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"

def term(lines, caption):
    out = []
    for i, l in enumerate(lines):
        cls = "line"
        if l.startswith("$ ") or l.startswith("> "): cls += " line--in"
        if i == len(lines) - 1: cls += " line--ok"
        out.append(f'<span class="{cls}">{e(l)}</span>')
    return (f'<figure class="term"><pre class="term__screen"><code>' + "\n".join(out) +
            f'</code></pre><figcaption>{caption}</figcaption></figure>')

PAGES = [
  dict(slug="back-office", title="Back-office tools",
    lead="Four internal tools for a UK vehicle-leasing broker, built on the job. All still in use when I left.",
    status="In use when I left, October 2026", stack_line="Systems unnamed under a confidentiality agreement",
    hero=None, schematic=True,
    about=["From December 2025 to October 2026 I worked operations at a UK vehicle-leasing broker: the internal ticket queue, order admin for nine salespeople, hands-on IT, and from August the front end of the company’s new website.",
           "A back office is full of work that repeats, so alongside the day job I built tools to take it over."],
    did=["<strong>A cancellation system.</strong> Cancelling an order became one recorded process instead of a chain of manual steps.",
         "<strong>An invoicing bridge.</strong> Invoices reached the accounts software without being retyped.",
         "<strong>An image uploader.</strong> Marketing put images on the website themselves instead of raising a ticket.",
         "<strong>An order integration</strong> with a manufacturer’s leasing platform. Nine salespeople placed 215 orders through it. I administered those orders, reconciled 176 of them against the dealer system, and was the main contact for the integration partner on testing and API errors.",
         "Around the tools, the ticket queue: 224 of the 226 tickets assigned to me closed."],
    stack=["Claude Code: I write the brief, then read and test what it builds",
           "Integrations with an accounts package and a manufacturer’s order API",
           "Front-end work on a live company website",
           "Ticketing and order admin systems, daily"],
    skills=["Spotting the repeat work and turning it into a tool",
            "Specifying a process exactly, then testing against the real thing",
            "Running an integration with an outside partner",
            "Keeping a queue closed while building on the side"],
    gallery=[]),

  dict(slug="talent-radar", title="Talent Radar",
    lead="A sourcing tool for a recruiter friend. It finds engineers and researchers from their public work and explains the fit.",
    status="Private, in progress", stack_line="React, TypeScript, Node, then Go and Postgres",
    demo=("demo/talent-radar.html", "talent-radar-sonar.jpg", "The Sonar view, working: people placed by how well their public work matches one job. Click a dot, change the job, search, shortlist someone. Everyone in it is made up and the signals are redacted.", "A dark dashboard with concentric rings labelled Close match, Good match, Partial match and Far, dotted with candidates"),
    about=["Talent Radar is a private web app for one recruiter who places engineers and AI researchers at startups. It finds people from what they have published, scores how well that work matches a job ad, and gives him a short list to work from each day, with a plain-English reason for each person. He told me the only metric that matters is outreach worth his time, so the tool shows fewer, better people.",
           "I build it with a partner. I own the product, the screens, the client relationship and the privacy side; he owns hosting, the data pipeline and most of the Go core. We both ship code."],
    did=["Set the product direction with the recruiter, and said no to rebuilding things his existing tools already do.",
         "Designed and built the screens: a person panel with a two-line “why”, a review card with keyboard and swipe decisions, and the Sonar rings that use words (Close match, Good match, Partial match, Far) instead of scores.",
         "Wrote the data-protection paperwork: the DPIA, a legitimate interests assessment, the privacy notice, the processing agreement and the records of processing.",
         "Turned the privacy rules into code: no email harvesting, no LinkedIn scraping, no SMS, no data brokers. Retention of 30, 90 and 365 days built in. Model reads stay off until the recruiter signs the DPIA.",
         "Built the demo mode with made-up people and ten weeks of fake pipeline, so the app can be developed and shown without a real record. The Sonar at the top of this page is a copy of it that I rebuilt in plain JavaScript.",
         "Made the call to rebuild the core in Go, so the rules are enforced by the build rather than by habit."],
    stack=["React and TypeScript (Vite, Tailwind, shadcn, TanStack)",
           "Node, then Go with Postgres",
           "Playwright end-to-end tests and an accessibility check",
           "Claude Code for the build, with a bot review on every pull request"],
    skills=["Product ownership with a real user and a real deadline",
            "UK GDPR in practice: DPIA, lawful basis, retention",
            "Designing for low reading load: calm, short screens, dark mode",
            "Working in two lanes with a partner through pull requests"],
    gallery=[]),

  dict(slug="harness", title="A harness for Claude Code",
    lead="Everything I built around Claude Code so it works like a colleague who remembers.",
    status="In daily use since 21 October 2026", stack_line="Node 24 with no npm packages, SQLite, Claude Code hooks, Ollama",
    hero=("harness-overview.jpg", "The dashboard. A copy running made-up projects.", "A dark dashboard showing five project cards, health checks, today’s plan and a list of what is up next"),
    about=["Claude Code forgets everything between sessions, runs several sessions at once that can trample each other, and quietly burns through a capped plan. This is the layer I built around it: small programs that run before and after each step the AI takes, notes per project that get fed back in, and a dashboard.",
           "I built it on my own from 21 October 2026, in Claude Code, and it has run every working day since. Two other projects on this site, the local-model server and the fractal server, plug into it."],
    did=["<strong>Memory.</strong> Every project has notes: brief, state, decisions, log. The right ones are injected the moment I mention the project.",
         "<strong>Write-ups.</strong> When a session ends, the transcript becomes a log entry, a fresh state, dated decisions and a git commit. 187 so far, none by hand.",
         "<strong>Guards.</strong> Before every command and edit: no reading secrets or real-data folders, no git commands that throw away work, no keys written into files.",
         "<strong>Review.</strong> A read-only bot reviews every commit and pull request for bugs and scores it. 94 reviews so far.",
         "<strong>Planning.</strong> The expensive model writes the plan once; cheaper models build it step by step, each step checked.",
         "<strong>Several sessions at once.</strong> Each one knows who else is editing what. The first clash on a file is stopped once, with who and why.",
         "<strong>Local models.</strong> Long files and private data go to a model on my graphics card; only the answer comes back.",
         "<strong>Voice.</strong> Local speech recognition. I talk to a session from across the room and the reply is read aloud. Nothing goes to a cloud speech service.",
         "<strong>Day planner.</strong> A local model slots my tasks into free time on my calendar. The hard rules are code.",
         "<strong>Dashboard.</strong> Projects, health checks, reviews, tasks and usage, from my phone over a private network.",
         "<strong>Usage.</strong> Tracks the plan limits and forecasts when they will run out, with cost per subagent.",
         "<strong>Backups.</strong> Nightly, with an encrypted copy off the machine, and uncommitted work snapshotted between commits. <em class=\"unproven\">Built, restore not yet proven on a real repo.</em>",
         "<strong>Team feed.</strong> Change notes from my sessions reach my partner’s sessions on our shared project."],
    did_heading="What it does",
    stack=["Node 24 with zero dependencies (node:sqlite, node:http)",
           "Claude Code hooks on ten events",
           "Ollama running Gemma for the local jobs",
           "whisper.cpp and Kokoro for voice",
           "A vanilla JavaScript dashboard, no build step"],
    skills=["Designing a system rather than a script: 49 modules that fit together",
            "Safety first: guards, read-only reviewers, nothing secret in the AI’s context",
            "Cost awareness: cheap models for cheap work",
            "Writing things down so the next session, or a colleague, can pick up where I left off"],
    gallery=[]),

  dict(slug="metalol", title="MetaLoL",
    lead="A new front end for a public League of Legends stats site, the sister of MetaTFT.",
    status="On a branch, awaiting the owner’s review", stack_line="React 19, TypeScript, Vite",
    hero=("metalol-tier-list.jpg", "The champion tier list in the remake. Live public game data.", "A dark table of League of Legends champions ranked by tier with win rate, pick rate and games columns"),
    about=["MetaLoL is a public stats site for League of Legends, run by the same person as MetaTFT, one of the main stats sites for Teamfight Tactics. I contribute under my own GitHub account. In 2025 I made small fixes to the champion page on the live site. In September 2026 I started a ground-up remake of the front end on a branch: a new look, a tier list, champion pages, a header champion finder, a phone layout and a test suite.",
           "The owner has not reviewed it yet, so it is not live."],
    did=["Mapped the three repos (front end, API, crawler) and reported two security problems to the owner, who fixed them.",
         "Rebuilt the front end against the live API: tier list, champion pages, matchup views, header search, page titles and metadata.",
         "Checked the phone layout at real sizes. No sideways scroll at 390 pixels.",
         "Typecheck, lint, 31 tests and a production build all pass."],
    stack=["React 19 and TypeScript", "Vite, with a test suite", "Working against someone else’s API and data without cluster access", "Claude Code for the build"],
    skills=["Working in someone else’s codebase, to their conventions", "Front-end design that reads well on a phone", "Finishing: tests, titles and metadata, not just the pretty parts", "Reporting a problem to an owner clearly and leaving the fix to them"],
    gallery=[("metalol-home.jpg", "The home page.", "The MetaLoL home page in the remake, dark, with a champion search"),
             ("metalol-champion.jpg", "A champion page.", "A champion page with win rate, matchups and builds"),
             ("metalol-phone.jpg", "The tier list on a phone.", "The tier list at phone width", "tall")]),

  dict(slug="needle-drop", title="Needle Drop",
    lead="A keyboard DJ rhythm game with roguelike runs, in Godot.",
    status="In progress, started November 2026", stack_line="Godot 4.7, GDScript, Python for the music",
    hero=None,
    about=["Left hand on WASD does the mixing: bass in and out, crossfader. Right hand on the arrow keys lines up the next record and, when a record drops, plays a short falling-arrow dance section. Every record switch scores like a card game, chips times multiplier: the key relationship between the two records, a locked tempo, hitting the switch on the one, crowd energy. Between sets a shop sells records, perks and bigger rigs.",
           "The music is synthesised by a script, so every track has an exact tempo and key and nothing is licensed. The design is written, about 7,000 words plus an engineering contract that lets several build passes run in parallel, and the first playable slice is being built now. No screenshots yet."],
    did=["Designed the core loop and the scoring, and wrote it all down before building anything.",
         "Split the first slice into work packages with a shared contract, so parallel Claude builds do not collide.",
         "Set the rules for the build: scene-first Godot, tunables as exported properties, no licensed audio."],
    stack=["Godot 4.7 and GDScript", "Python to synthesise the records: exact BPM and key, stems for kick, drums, bass and music", "A scene-first workflow for Godot and Claude that my brother wrote"],
    skills=["Game design: writing a loop down tightly enough to build", "Scoping: a first slice before any of the fun extras", "Coordinating parallel AI builds through a written contract"],
    gallery=[]),

  dict(slug="ollama-mcp", title="Local models for Claude",
    lead="Two small servers that let Claude Code use a model on my own graphics card.",
    status="Running daily", stack_line="Node, MCP, Ollama, Gemma",
    hero=None,
    about=["Claude Code has a context limit and a paid plan. Logs, data dumps and long documents eat both. This gives Claude three tools: <code>ask</code> (a question to a local model), <code>list_models</code>, and <code>digest</code> (hand a set of files to a local model with one question and get back only the answer, with file and line references). The files never enter Claude’s context, so private data stays on the machine and the paid context stays small.",
           "A second copy of the server lets another machine use my graphics card over a private network."],
    did=["Specified the three tools and had Claude Code build the servers in Node with the MCP SDK.",
         "Wired <code>digest</code> into my harness, so any session can read a 12 MB log in one call.",
         "Tuned the prompt so answers cite file and line, which makes them checkable."],
    extra=term(["> what broke in last night’s render run?",
                "digest  logs/run-*.log  (3 files, 12 MB)  “which jobs failed, and why?”",
                "  gemma on the GPU, 41 s",
                "  3 jobs timed out after 02:14, all three-body renders over 4,000 frames.",
                "  Nothing else failed.",
                "Three lines in Claude’s context, not twelve megabytes."],
               "A digest call. The shape is real; the log is a sample."),
    stack=["Node and the MCP SDK", "Ollama running Gemma on an RTX 5070 Ti", "zod for argument validation"],
    skills=["Knowing which work belongs on a cheap local model", "Keeping private data off cloud services", "Small, finished tools rather than platforms"],
    gallery=[]),

  dict(slug="fractal-mcp", title="Fractal MCP",
    lead="A render farm for maths art that Claude can call like a tool.",
    status="Running as a Windows service", stack_line="Node, Python, OpenCL, MCP, Mandelbulber 2, Fraktaler 3",
    hero=("three-body.jpg", "The three-body problem, mapped: the colour at each point is how long until the sixth close pass.", "A symmetrical blue fractal of swirling bands around two bright discs"),
    about=["Fractal MCP is a server on my PC that exposes the renderers I have collected (Mandelbulber 2, Fraktaler 3, a three-body simulator, a Clifford attractor engine, a nebulabrot renderer) as tools Claude can call. I ask for a picture in a sentence, Claude picks the tool and the parameters, the GPU renders it, and the image comes back into the conversation.",
           "The server is token-protected and set up so two friends can point their own Claude at it. Every render on the home page came out of it, and the live hero is the same Clifford maths running in your browser."],
    did=["Chose and installed the renderers, and had Claude Code wrap each one as a tool with safe parameters: no file paths, one GPU job at a time, output confined to one folder.",
         "Built the three-body and Clifford renderers in Python and OpenCL, including the palettes.",
         "Wrote the hand-over page so friends could set it up.",
         "Ported the Clifford attractor to WebGL for this site’s hero, and to a live desktop wallpaper."],
    extra=term(["> render a clifford attractor in espresso’s eye colour, silk-like, 4k",
                "fractal.clifford  a=-1.7 b=1.3 c=-0.1 d=-1.2  palette=espresso  size=3840x2160",
                "  queued, 1 of 1 · GPU · 1.2 billion points",
                "  done in 9 s → out/clifford-0412.png",
                "Image attached. Want it looser, tighter, or another seed?"],
               "A render call. Tool, parameters and queue are real; the numbers are a sample."),
    stack=["Node and the MCP SDK", "Python with OpenCL and moderngl on the GPU", "Mandelbulber 2 and Fraktaler 3 driven from the command line", "WebGL2 for the browser version"],
    skills=["Turning a vague wish into parameters and a finished image", "Running a service safely on a home network", "Judgement: knowing when a render is finished and when it is not worth keeping"],
    gallery=[("nebulabrot.jpg", "Nebulabrot, 33 billion samples, card kept under 72°C.", "A glowing orange and teal cloud shape on dark blue, mirrored left to right"),
             ("clifford-3.jpg", "Clifford attractor, billions of points.", "A ball of fine yellow-green threads looping over each other"),
             ("rabbits.jpg", "Rabbits and the Mandelbrot set are the same maths.", "The Mandelbrot set above a chart of rabbit populations, each split lining up under a bulb"),
             ("nebulabrot-ice.jpg", "Buddhabrot, in ice.", "A pale blue glowing Mandelbrot shape on black")]),
]

THIS_SITE = dict(slug="this-site", title="This site",
    lead="How espressothecat.com was made.",
    status="Live", stack_line="HTML, CSS, WebGL2, GitHub Pages",
    hero=None,
    about=["Hand-written HTML and CSS, no framework, no build step. The hero is a Clifford attractor drawn live in WebGL2 from the same maths as the Fractal MCP renders; it pauses if you ask it to, or if your system prefers reduced motion. The fonts are served from the site, not from Google. The only script from elsewhere is a cookie-free visitor counter.",
           "It was built in Claude Code with a design skill I keep, and checked in headless Chrome at desktop and phone widths before each push."],
    did=["Briefed and directed the build, then rewrote the copy by hand after the first version read like a brochure.",
         "Took every screenshot from demo modes with made-up data, so nothing private is on the page.",
         "Rebuilt one screen of Talent Radar as a small page of plain HTML and JavaScript, with made-up people and redacted signals, so you can click around it instead of looking at a picture."],
    stack=["HTML, CSS, a little JavaScript", "WebGL2", "GitHub Pages with a custom domain", "Headless Chrome over the DevTools protocol for checks"],
    skills=["Design judgement", "Shipping without a framework", "Privacy by default"],
    gallery=[])

NAV = """<header class="nav">
  <div class="container">
    <a class="wordmark" href="/" aria-label="Espresso the cat, home">espresso the cat</a>
    <ul>
      <li><a href="/#work"{w}>Work</a></li>
      <li><a href="/#how">How I work</a></li>
      <li><a href="/#hire">Hire me</a></li>
    </ul>
  </div>
</header>"""

FOOT_SLIM = """<footer class="footer footer--slim">
  <div class="container">
    <p class="footer__mast">espresso the cat</p>
    <div class="footer__links">
      <a href="https://github.com/beartreeuk">GitHub</a>
      <a href="mailto:hello@espressothecat.com">hello@espressothecat.com</a>
      <a href="/work/this-site.html">How this site was made</a>
      <small>Every screenshot and demo uses made-up data or public game data.</small>
    </div>
  </div>
</footer>"""

def page(p, n, total, prev, nxt):
    hero = ""
    og = f"{ORIGIN}/assets/clifford-still.jpg"
    if p.get("schematic"):
        hero = ('<figure class="case-hero case-hero--schematic"><picture><source media="(max-width: 40rem)" srcset="/assets/back-office-tools-phone.svg" width="700" height="680">'
                '<img src="/assets/back-office-tools.svg" width="1400" height="680" alt="A schematic: four kinds of repeat work on the left, each with an arrow to the tool that took it over"></picture>'
                '<figcaption>A schematic rather than a screenshot, under a confidentiality agreement.</figcaption></figure>')
    elif p.get("demo"):
        src, img, cap, alt = p["demo"]
        og = f"{ORIGIN}/assets/{img}"
        hero = (f'<figure class="case-hero case-hero--demo">'
                f'<div class="demo-frame"><iframe src="/work/{src}" title="{e(p["title"])}: a working copy of one screen, with made-up people" loading="lazy"></iframe></div>'
                f'<a class="demo-fallback" href="/work/{src}"><img src="/assets/{img}" alt="{e(alt)}" loading="eager"><span class="btn btn--primary">Open the working demo</span></a>'
                f'<figcaption>{e(cap)} <a href="/work/{src}">Open it full screen.</a></figcaption></figure>')
    elif p.get("hero"):
        src, cap, alt = p["hero"]
        og = f"{ORIGIN}/assets/{src}"
        hero = f'<figure class="case-hero"><img src="/assets/{src}" alt="{e(alt)}" loading="eager"><figcaption>{e(cap)}</figcaption></figure>'
    sections = []
    sections.append(("About", "".join(f"<p>{a}</p>" for a in p["about"])))
    sections.append((p.get("did_heading", "What I did"), ul(p["did"]) + p.get("extra", "")))
    sections.append(("Stack", ul(p["stack"])))
    sections.append(("Skills", ul(p["skills"])))
    body = ""
    for i, (h, inner) in enumerate(sections):
        sid = f"s{i}"
        body += f'<section class="case-section" aria-labelledby="{sid}"><h2 id="{sid}">{e(h)}</h2><div class="case-section__body">{inner}</div></section>\n'
    gallery = ""
    if p["gallery"]:
        figs = ""
        for g in p["gallery"]:
            src, cap, alt = g[0], g[1], g[2]
            tall = ' class="figure--tall"' if len(g) > 3 else ""
            figs += f'<figure{tall}><img src="/assets/{src}" alt="{e(alt)}" loading="lazy"><figcaption>{e(cap)}</figcaption></figure>'
        gallery = f'<section class="case-gallery-section" aria-label="Gallery"><div class="case-gallery">{figs}</div></section>\n'
    eyebrow = f'<a href="/#work">Work</a> <span aria-hidden="true">&middot;</span> {n} of {total}' if n else '<a href="/#work">Work</a>'
    foot = f'<a class="btn btn--quiet" href="/#work">Back to the work</a>'
    if nxt: foot += f'<a class="btn btn--primary" href="/work/{nxt["slug"]}.html">Next: {e(nxt["title"])}</a>'
    desc = e(p["lead"])
    return f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(p['title'])} · Espresso the cat</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#1a1611">
<meta property="og:type" content="article">
<meta property="og:title" content="{e(p['title'])} · Espresso the cat">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{og}">
<meta property="og:url" content="{ORIGIN}/work/{p['slug']}.html">
<link rel="canonical" href="{ORIGIN}/work/{p['slug']}.html">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
<script>document.documentElement.classList.add('js');</script>
</head>
<body class="case">
<a class="skip" href="#main">Skip to the content</a>
{NAV.format(w=' class="is-current"')}

<main id="main" class="container">
  <header class="case-head">
    <div>
      <p class="eyebrow">{eyebrow}</p>
      <h1>{e(p['title'])}</h1>
      <p class="lead">{p['lead']}</p>
    </div>
    <dl class="case-meta">
      <div><dt>Status</dt><dd><span class="chip">{e(p['status'])}</span></dd></div>
      <div><dt>Stack</dt><dd class="stack">{e(p['stack_line'])}</dd></div>
    </dl>
  </header>
  {hero}
  <div class="case-body">
{body}  </div>
  {gallery}
  <nav class="case-foot" aria-label="More work">{foot}</nav>
</main>

{FOOT_SLIM}
{GC}
</body>
</html>
"""

os.makedirs(f"{SITE}/work", exist_ok=True)
for i, p in enumerate(PAGES):
    nxt = PAGES[(i + 1) % len(PAGES)]
    open(f"{SITE}/work/{p['slug']}.html", "w", encoding="utf-8", newline="\n").write(page(p, i + 1, len(PAGES), None, nxt))
open(f"{SITE}/work/this-site.html", "w", encoding="utf-8", newline="\n").write(page(THIS_SITE, 0, 0, None, None))
print("pages written")

# ---------------- home page ----------------
ROWS = [
  ("talent-radar", "Talent Radar", "Finds engineers from their public work and says, in plain English, why they fit the job. Built with a partner; I own the product side, the screens and the privacy paperwork.", "Private", "React, Go, Postgres", None),
  ("back-office", "Back-office tools", "Four internal tools for a UK vehicle-leasing broker, built on the job: cancellations, invoicing, marketing uploads and an order integration that carried 215 orders. All still in use when I left.", "In use", "Claude Code, internal tools", "back-office-tools.svg"),
  ("harness", "A harness for Claude Code", "Everything I wired around Claude Code so it works like a colleague: briefs each session, blocks dangerous commands, reviews every commit, writes up the day, takes instructions by voice.", "Daily use", "Node, SQLite, Ollama", "harness-overview.jpg"),
  ("metalol", "MetaLoL", "A new front end for a public League of Legends stats site, sister of MetaTFT. Tier list, champion pages, a phone layout and tests.", "On a branch", "React 19, TypeScript, Vite", "metalol-tier-list.jpg"),
  ("needle-drop", "Needle Drop", "A keyboard DJ rhythm game with roguelike runs: left hand mixes, right hand beatmatches, every record switch scores like a card game.", "In progress", "Godot 4.7, GDScript", None),
  ("ollama-mcp", "Local models for Claude", "Two small servers that hand long files to a model on my own graphics card and send back only the answer. Private data stays on the machine.", "Running", "Node, MCP, Ollama", None),
  ("fractal-mcp", "Fractal MCP", "A render farm for maths art that Claude can call like a tool: ask for a fractal in a sentence, get the picture back from my graphics card.", "Running", "Node, Python, OpenCL", "three-body.jpg"),
]

DEMO = """          <figure class="demo">
            <div class="demo__frame"><iframe src="work/demo/talent-radar.html" title="Talent Radar: the Sonar view, a working demo" loading="lazy"></iframe></div>
            <a class="demo__fallback" href="work/demo/talent-radar.html">
              <img src="assets/talent-radar-sonar.jpg" width="1600" height="900" loading="lazy" alt="The Sonar view: candidates as dots on rings around an ideal in the middle, one selected, with a match card beside it">
              <span class="btn btn--primary">Open the demo</span>
            </a>
            <figcaption><span>Live. Click a dot, change the job, search, shortlist someone.</span><a href="work/talent-radar.html">About the project</a></figcaption>
          </figure>
"""

def row(r, n):
    slug, title, blurb, status, stack, img = r
    attrs = f' data-img="assets/{img}"' if img else ""
    feature = DEMO if slug == "talent-radar" else ""
    return f"""        <li class="row"{attrs}>
          <a href="work/{slug}.html">
            <span class="row__n">{n:02d}</span>
            <span class="row__main"><h3 class="row__title">{e(title)}</h3><span class="row__blurb">{e(blurb)}</span></span>
            <span class="row__meta"><span class="row__status">{e(status)}</span><span class="row__stack">{e(stack)}</span></span>
            <span class="row__go" aria-hidden="true">&rarr;</span>
          </a>
{feature}        </li>
"""

REVIEW = term(["Commit review — harness repo",
               "2026-10-23, 7 commits, medium depth",
               "Score: 86/100",
               "Findings (1)",
               "  [low] non-wrapping code items in .meta overflow, then html overflow-x: clip hides them — dashboard/public/style.css:60",
               "  Failure: a 50-character booking reference on a phone runs off screen; the end is unreadable and uncopyable.",
               "Checked: every removed CSS variable and class traced; nothing still points at them."],
              "A review of one of my commits by the read-only reviewer in my harness. Wording trimmed, findings as written.")

INDEX = f"""<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Espresso the cat</title>
<meta name="description" content="Internal tools, automations and maths art, built by directing AI coding agents and testing what they make. UK, remote, available now.">
<meta name="theme-color" content="#1a1611">
<meta property="og:title" content="Espresso the cat">
<meta property="og:description" content="I build the tools a team is missing. UK, remote, available now.">
<meta property="og:image" content="{ORIGIN}/assets/clifford-still.jpg">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="style.css">
<script>document.documentElement.classList.add('js');</script>
</head>
<body>
<a class="skip" href="#work">Skip to the work</a>

<figure class="ground" data-loop aria-hidden="true">
  <img src="assets/clifford-still.jpg" width="2560" height="1440" alt="" fetchpriority="high">
  <canvas id="silk"></canvas>
</figure>

{NAV.format(w='')}

<main>
  <section class="hero container" aria-labelledby="hero-title">
    <dl class="hero__facts">
      <div><dt>Status</dt><dd>Available now</dd></div>
      <div><dt>Where</dt><dd>Remote, UK</dd></div>
      <div><dt>Looking for</dt><dd>Product, operations or AI tooling</dd></div>
    </dl>
    <div class="hero__body">
      <h1 id="hero-title">I build the tools a team is missing.</h1>
      <p class="lead">Mostly by directing Claude Code and testing what it makes. At my last job, operations at a UK vehicle-leasing broker, four things I built were still in daily use when I left.</p>
      <div class="hero__links">
        <a class="arrow" href="#work">See the work <span aria-hidden="true">&darr;</span></a>
        <a class="arrow" href="mailto:hello@espressothecat.com">Email me <span aria-hidden="true">&rarr;</span></a>
      </div>
    </div>
    <div class="hero__foot">
      <p>A Clifford attractor, drawn live on your graphics card. Move to bend it. Click for another.</p>
      <button type="button" data-loop-toggle aria-controls="silk">Pause</button>
    </div>
  </section>

  <section class="section" id="work" aria-labelledby="work-title">
    <div class="container">
      <div class="section__head">
        <h2 id="work-title">Work</h2>
        <p>Seven projects. Each opens a page with what I did, the stack and the skills.</p>
      </div>
      <ol class="index" data-reveal>
{''.join(row(r, i + 1) for i, r in enumerate(ROWS))}      </ol>
    </div>
  </section>

  <section class="section" id="how" aria-labelledby="how-title">
    <div class="container">
      <div class="section__head">
        <h2 id="how-title">How I work with AI</h2>
      </div>
      <div class="how__grid">
        <ol class="creed" data-reveal>
          <li><p>I write the brief in plain words. Claude Code reads the code and proposes a plan, I say go, and I read and run every change before it lands.</p></li>
          <li><p>Around that sits <a href="work/harness.html">a harness I built</a>: guards so the AI cannot read secrets or throw work away, a reviewer on every commit, and write-ups so nothing is lost between days.</p></li>
          <li><p>Long files and private data go to a model on my own graphics card, not to the cloud. The tools are new; the habits are old ones: write it down, test it against the real thing, keep it small enough to finish.</p></li>
        </ol>
        {REVIEW}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="lately-title">
    <div class="container">
      <div class="section__head">
        <h2 id="lately-title">Lately</h2>
      </div>
      <dl class="lately">
        <div><dt>Oct 2026 to now</dt><dd><strong>Talent Radar</strong>, with a partner, for a recruiter. Product, screens, the UK GDPR paperwork.</dd></div>
        <div><dt>Dec 2025 to Oct 2026</dt><dd><strong>Operations, UK vehicle-leasing broker.</strong> The internal ticket queue, order admin for nine salespeople, hands-on IT, and from August the front end of the new company website. Built the four tools above on the side.</dd></div>
        <div><dt>2025 to now</dt><dd><strong>MetaLoL</strong>, contributor. Small fixes on the live site, then a front-end remake on a branch.</dd></div>
      </dl>
    </div>
  </section>

  <section class="section cat" id="espresso" aria-labelledby="cat-title">
    <div class="container">
      <div class="section__head">
        <h2 id="cat-title">Espresso</h2>
      </div>
      <div class="cat__grid">
        <figure>
          <img src="assets/espresso-stare.jpg" width="1200" height="1600" loading="lazy" alt="Espresso, a black cat with yellow-green eyes, looking straight into the camera">
        </figure>
        <div class="cat__text">
          <p>The site is named after my cat and coloured like her eyes. Black shorthair, yellow-green eyes, one white tuft.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="close" id="hire" aria-labelledby="hire-title">
    <div class="container">
      <div class="section__head">
        <h2 id="hire-title">Hire me</h2>
        <p>Remote, UK-based. Product, operations or AI tooling. CV on request.</p>
      </div>
      <a class="close__mail" href="mailto:hello@espressothecat.com">Email me<span>hello@espressothecat.com</span></a>
      <div class="close__grid">
        <p class="close__note">Roles that fit: product operations, operations analyst, internal tools, AI tooling.</p>
        <dl class="pitch" data-reveal>
          <div><dt>Builds tools people use daily</dt><dd>Four built on the job at my last employer, all still running when I left.</dd></div>
          <div><dt>Directs AI, with checks</dt><dd>Every change is read and run before it lands. Private data never reaches a cloud model.</dd></div>
          <div><dt>Writes it down</dt><dd>Briefs, data-protection paperwork, session write-ups. The next person can pick it up.</dd></div>
          <div><dt>Finishes</dt><dd>224 of 226 tickets closed in ten months, while building the tools on the side.</dd></div>
        </dl>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="container">
    <p class="footer__mast">espresso the cat</p>
    <div class="footer__links">
      <a href="https://github.com/beartreeuk">GitHub</a>
      <a href="mailto:hello@espressothecat.com">hello@espressothecat.com</a>
      <a href="work/this-site.html">How this site was made</a>
    </div>
    <p class="footer__note">Every screenshot and demo uses made-up data or public game data.</p>
  </div>
</footer>

<script src="silk.js" defer></script>
{GC}
</body>
</html>
"""
open(f"{SITE}/index.html", "w", encoding="utf-8", newline="\n").write(INDEX)
print("index written")
