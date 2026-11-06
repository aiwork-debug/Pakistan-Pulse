import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Block, Category, PostStatus, ProfileStatus, Role } from "@/lib/types";

/*
 * DEMO MODE STORE
 * Used only while Supabase is not configured (see src/lib/demo/mode.ts). It keeps dummy
 * data in .data/demo-store.json so the whole site, including login, the editor, and the
 * super admin tools, can be tried before a database exists. Once the Supabase variables
 * are set in .env.local, none of this code runs.
 */

export type DemoProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  status: ProfileStatus;
  bio: string;
  avatarGradient: string;
  createdAt: string;
  lastSignInAt: string | null;
};

export type DemoPost = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  categoryId: string | null;
  authorId: string;
  status: PostStatus;
  coverGradient: string;
  coverImageUrl: string | null;
  coverAlt: string;
  readMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  blocks: Block[];
};

export type DemoMedia = {
  id: string;
  uploaderId: string;
  storagePath: string;
  publicUrl: string;
  mime: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
  deletedAt: string | null;
};

export type DemoAudit = {
  id: number;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DemoHomepageSlot = {
  slot: number;
  postId: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type DemoState = {
  version: 11;
  categories: Category[];
  profiles: DemoProfile[];
  posts: DemoPost[];
  homepage: DemoHomepageSlot[];
  media: DemoMedia[];
  audit: DemoAudit[];
  nextAuditId: number;
};

/** Password for every demo account. Shown on the login page in demo mode. */
export const DEMO_PASSWORD = "demo1234";

export const DATA_DIR = path.join(process.cwd(), ".data");
export const DEMO_MEDIA_DIR = path.join(DATA_DIR, "media");
const STORE_FILE = path.join(DATA_DIR, "demo-store.json");

const globalForDemo = globalThis as unknown as { pulseDemoState?: DemoState };

/** Shared, lazily loaded state. globalThis keeps one copy across Next's server bundles. */
export function getDemoState(): DemoState {
  if (!globalForDemo.pulseDemoState) {
    globalForDemo.pulseDemoState = loadState();
  }
  return globalForDemo.pulseDemoState;
}

export function saveDemoState(): void {
  const state = getDemoState();
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    // Read-only file systems (some hosts) keep working in memory only.
    console.warn("Demo store could not be saved to disk:", error);
  }
}

function loadState(): DemoState {
  try {
    if (existsSync(STORE_FILE)) {
      const parsed = JSON.parse(readFileSync(STORE_FILE, "utf8")) as DemoState;
      // Older or unknown versions are replaced with fresh seed data.
      if (parsed.version === 11) return parsed;
    }
  } catch (error) {
    console.warn("Demo store file is unreadable; starting from the seed data.", error);
  }
  const seeded = createSeed();
  globalForDemo.pulseDemoState = seeded;
  saveDemoState();
  return seeded;
}

export function appendDemoAudit(entry: Omit<DemoAudit, "id" | "createdAt">): void {
  const state = getDemoState();
  state.audit.push({ ...entry, id: state.nextAuditId++, createdAt: new Date().toISOString() });
}

// ---------------------------------------------------------------------------
// Seed data (dummy content for demo mode only)
// ---------------------------------------------------------------------------

const p = (text: string): Block => ({ type: "paragraph", text });
const h = (text: string): Block => ({ type: "heading", text });
const q = (text: string, attribution: string): Block => ({ type: "quote", text, attribution });
const img = (file: string, alt: string, caption: string): Block => ({ type: "image", url: `/demo/${file}.jpg`, alt, caption });

/** A bundled demo photo, or null when the file is not in public/demo (the gradient cover shows instead). */
function demoPhoto(file: string): string | null {
  return existsSync(path.join(process.cwd(), "public", "demo", `${file}.jpg`)) ? `/demo/${file}.jpg` : null;
}

function createSeed(): DemoState {
  // Sections first, then their subcategories (slug, name, description, parent slug).
  const sections: [string, string, string][] = [
    ["politics", "Politics", "Parliament, elections, government, and the decisions made in the country's name."],
    ["economy", "Economy", "Household budgets, prices, jobs, and the policies that shape them."],
    ["cities", "Cities", "Transport, housing, public space, and how our cities are run."],
    ["technology", "Technology", "How digital tools change work, money, and public information."],
    ["environment", "Environment", "Climate, water, energy, and the communities living with change."],
    ["education", "Education", "Schools, teachers, and the families navigating the system."],
    ["sports", "Sports", "Grassroots leagues, local clubs, and the people who keep them going."],
  ];
  const subcategories: [string, string, string, string][] = [
    ["national-politics", "National", "Government, opposition, and the parties shaping the national debate.", "politics"],
    ["elections", "Elections", "Campaigns, voting, results, and the rules that govern them.", "politics"],
    ["parliament", "Parliament", "Debates, bills, and votes in the national and provincial assemblies.", "politics"],
    ["diplomacy", "Diplomacy", "Foreign policy, regional ties, and international agreements.", "politics"],
    ["budget-and-tax", "Budget & Tax", "Public finances, tax changes, and where the money goes.", "economy"],
    ["business", "Business", "Companies, traders, credit, and the people who run small firms.", "economy"],
    ["transport", "Transport", "Buses, roads, and how people get around the city.", "cities"],
    ["housing", "Housing", "Rents, permits, and the homes being built or held back.", "cities"],
    ["online-safety", "Online Safety", "Scams, privacy, and staying safe on everyday apps.", "technology"],
    ["open-data", "Open Data", "Public records, datasets, and the people who make sense of them.", "technology"],
    ["climate", "Climate", "Heat, floods, and how communities adapt to a changing climate.", "environment"],
    ["green-spaces", "Green Spaces", "Parks, trees, and the public spaces that keep cities liveable.", "environment"],
    ["schools", "Schools", "Classrooms, enrolment, and the families navigating the school system.", "education"],
    ["learning", "Learning", "Libraries, tutoring, and learning outside the classroom.", "education"],
    ["cricket", "Cricket", "Club fixtures, community leagues, and the grounds that host them.", "sports"],
    ["football", "Football", "Leagues, academies, and the growing women's game.", "sports"],
  ];
  const categories: Category[] = sections.map(([slug, name, description]) => ({
    id: crypto.randomUUID(),
    slug,
    name,
    description,
    parentId: null,
  }));
  for (const [slug, name, description, parentSlug] of subcategories) {
    categories.push({
      id: crypto.randomUUID(),
      slug,
      name,
      description,
      parentId: categories.find((c) => c.slug === parentSlug)?.id ?? null,
    });
  }
  const cat = (slug: string) => categories.find((c) => c.slug === slug)?.id ?? null;

  const profile = (
    email: string,
    username: string,
    displayName: string,
    role: Role,
    status: ProfileStatus,
    bio: string,
    avatarGradient: string,
  ): DemoProfile => ({
    id: crypto.randomUUID(),
    email,
    username,
    displayName,
    role,
    status,
    bio,
    avatarGradient,
    createdAt: "2026-01-10T09:00:00Z",
    lastSignInAt: null,
  });

  const superAdmin = profile("super@example.com", "mariam-qureshi", "Mariam Qureshi", "SUPER_ADMIN", "ACTIVE",
    "Runs the Pulse newsroom platform and its team of editors.", "deep");
  /*
   * Local dummy admins only. Real accounts will be created after each person is contacted.
   * Bios are neutral, dated facts from each person's Wikipedia article (English, or Urdu for
   * Moeed Pirzada), checked November 2026. Sabir Shakir has no article, so his comes from a
   * May 2022 Journalism Pakistan report. Events are stated as reported, with no opinions.
   */
  const ayesha = profile("admin@example.com", "imran-riaz-khan", "Imran Riaz Khan", "ADMIN", "ACTIVE",
    "Pakistani journalist and YouTuber, born on 14 August 1975 in Faisalabad, Punjab. He went to Lahore Grammar School and studied mass communication at the University of the Punjab. He began as a crime reporter for a local newspaper, then anchored news on Express News and hosted current affairs programmes on GNN and Samaa TV. In 2020 he launched his own YouTube news channel, which has more than six million subscribers. He was arrested several times between 2022 and 2024 and released on bail each time. After his arrest in May 2023 he was missing for more than four months, prompting Lahore High Court proceedings and calls for an investigation from Amnesty International and Reporters Without Borders, before police said in September 2023 that he was safe at home. He moved to the United Kingdom in January 2025.", "teal");
  const omar = profile("sabir-shakir@example.com", "sabir-shakir", "Sabir Shakir", "ADMIN", "ACTIVE",
    "Pakistani journalist, television anchor, and political commentator. He spent almost 17 years at ARY News, where he served as Islamabad Bureau Chief and became known for political reporting and analysis. He resigned from ARY News in May 2022, days after reports that he had been taken off air over his YouTube channel, and announced the decision on Twitter. He has since continued his political commentary on his own YouTube channel. He is among the Pakistani journalists who moved abroad after 2022.", "deep");
  const sana = profile("shehbaz-gill@example.com", "shehbaz-gill", "Dr. Shehbaz Gill", "ADMIN", "ACTIVE",
    "Pakistani academic and politician from Faisalabad, Punjab. He earned a PhD in Leadership and Management from the University of Malaya in 2007 and completed postdoctoral research at the University of Illinois Urbana-Champaign in 2011. He has taught business administration at International Islamic University, Islamabad, and the University of Illinois, and has held academic posts in Austria and Greece. In 2018 he became spokesperson for the Chief Minister of Punjab, resigning in September 2019. He served as Special Assistant to Prime Minister Imran Khan from May 2020 to April 2022, and then as Imran Khan's Chief of Staff. He was arrested on sedition charges in August 2022 over remarks made on television, and was released on bail in September 2022.", "mist");
  const hassan = profile("moeed-pirzada@example.com", "moeed-pirzada", "Dr Moeed Pirzada", "ADMIN", "ACTIVE",
    "Pakistani-British journalist, television anchor, political commentator, and geostrategic analyst. Born Moeed Hassan Pirzada on 29 July 1966 in Rawalpindi, he studied at the University of the Punjab, the London School of Economics, and Columbia University. He has hosted current affairs programmes on Pakistani television, including Hard Talk on 92 News, and has interviewed political leaders from several countries. He has written opinion columns for newspapers including the Khaleej Times, and published research on Kashmir. He is among the Pakistani journalists who moved abroad after 2022 and now reaches his audience through his YouTube channel.", "teal");
  // Suspended so the active count stays within the six-admin limit.
  const bilal = profile("shehzad-akbar@example.com", "mirza-shehzad-akbar", "Mirza Shehzad Akbar", "ADMIN", "SUSPENDED",
    "Pakistani barrister, born on 19 September 1975 in Islamabad. He holds an LLB from the University of London and an LLM from Newcastle University, and was called to the bar at Lincoln's Inn. He co-founded the Foundation for Fundamental Rights and represented civilian victims of US drone strikes in the tribal areas. From 2004 to 2008 he was a special prosecutor for the National Accountability Bureau. In August 2018 he became Special Assistant to the Prime Minister on Accountability and set up the Assets Recovery Unit, and from July 2020 he was Adviser to the Prime Minister on Interior and Accountability with federal minister rank, resigning in January 2022. He moved to the United Kingdom in April 2022. In November 2023 he was attacked with a corrosive liquid outside his London home. Pakistani authorities have since pursued cases against him, including the Al-Qadir Trust case, and he denies any wrongdoing.", "mist");
  const qasim = profile("qasim-suri@example.com", "qasim-khan-soori", "Qasim Khan Soori", "ADMIN", "SUSPENDED",
    "Pakistani politician and businessman, born Muhammad Qasim Khan Suri on 16 January 1969 in Quetta, Balochistan. He holds a bachelor's degree in political science and a master's in international relations from the University of Balochistan. In 1997 he took over his late father's pharmaceutical distribution business. Associated with Pakistan Tehreek-e-Insaf since 1996, he won the NA-265 (Quetta-II) seat in the 2018 general election and was elected Deputy Speaker of the National Assembly on 15 August 2018. On 3 April 2022 he dismissed the no-confidence motion against Prime Minister Imran Khan, citing Article 5 of the Constitution. He served as acting Speaker from 10 to 16 April 2022, then resigned as Deputy Speaker. He was president of PTI Balochistan from December 2021 to April 2023.", "deep");
  const wajahat = profile("wajahat-khan@example.com", "wajahat-saeed-khan", "Wajahat Saeed Khan", "ADMIN", "SUSPENDED",
    "Pakistani journalist, born on 5 November 1978 in Quetta. He studied at Karachi Grammar School and the University of Michigan, was a Goldsmith Fellow at Harvard Kennedy School's Shorenstein Center in 2011, and studied business and financial reporting at Columbia Journalism School. He worked at Geo News from 2003 to 2007, helped launch Dawn News in 2007, and has been a producer and correspondent for NBC News across South Asia. He anchored and edited the primetime show Mahaaz on Dunya News from 2015 to 2018, wrote Game Changer, the autobiography of Shahid Afridi, published by HarperCollins in 2019, and was an editor and correspondent at Nikkei Asia from 2019 to 2023. Based in the United States, he now runs a YouTube channel and a newsletter. In January 2026 an anti-terrorism court in Islamabad convicted him in absentia over coverage of the May 2023 riots; he has denied the allegations.", "teal");

  let order = 0;
  const post = (
    slug: string,
    title: string,
    dek: string,
    category: string,
    author: DemoProfile,
    coverAlt: string,
    readMinutes: number,
    blocks: Block[],
    status: PostStatus = "PUBLISHED",
  ): DemoPost => {
    // Newest first: one story every 14 hours, counting back from 21 October 2026, 18:00 UTC.
    const date = new Date(Date.UTC(2026, 9, 21, 18 - 14 * order++, 0, 0)).toISOString();
    const coverImageUrl = demoPhoto(slug);
    const isPolitics = category === "politics" || categories.find((c) => c.slug === category)?.parentId === cat("politics");
    return {
      id: crypto.randomUUID(),
      slug,
      title,
      dek,
      categoryId: cat(category),
      authorId: author.id,
      status,
      coverGradient: isPolitics ? "deep" : "teal",
      // Dummy photos bundled in public/demo/ (credits in public/demo/CREDITS.md). Stories
      // without a bundled photo show their gradient cover.
      coverImageUrl,
      coverAlt,
      readMinutes,
      publishedAt: status === "PUBLISHED" ? date : null,
      createdAt: date,
      updatedAt: date,
      blocks,
    };
  };

  /*
   * Politics stories are fictional demo copy. They deliberately name no real politicians,
   * parties, or events: invented quotes about real people would read as genuine news.
   */
  const posts: DemoPost[] = [
    post("assembly-election-reform-walkout", "Opposition Walks Out as Assembly Debates Election Reform Bill",
      "The government says the bill will speed up results. Opposition members say it was rushed through committee in a single sitting.",
      "parliament", omar, "Members seated in rows of curved benches in a parliament chamber, seen from the gallery.", 6, [
        p("Opposition members left the chamber on Tuesday evening as the assembly began its second reading of the election reform bill, saying they had been given less than a day to study the final text."),
        p("The bill would move results transmission to an electronic system, shorten the window for recount requests, and give the election commission new powers over campaign spending."),
        h("What the bill changes"),
        p("Supporters say faster, centralised results will reduce disputes on election night. Critics argue that a shorter recount window leaves losing candidates too little time to gather evidence."),
        q("Nobody objects to faster results. We object to a law that changes the rules of the next election without a proper debate.", "An opposition whip, speaking to reporters outside the chamber"),
        // Demo placeholder: mock post text, not a real social media post.
        { type: "tweet", author: "Pulse Politics Desk", handle: "@pulse_politics", text: "Opposition benches empty as the second reading begins. Government says it has the numbers to pass the bill by Thursday." },
        h("What happens next"),
        p("The bill goes to a final vote later this week. If passed, it moves to the upper house, where the government's majority is narrower."),
      ]),
    post("by-election-timeline", "Election Commission Sets Timeline for Four By-Elections",
      "Nomination papers open next week. Polling is expected before the end of the year in four vacant constituencies.",
      "elections", sana, "A voter's finger marked with indelible ink after casting a ballot.", 4, [
        p("The election commission has published the schedule for by-elections in four constituencies left vacant after resignations and one disqualification earlier this year."),
        h("Key dates"),
        p("Nomination papers open next Monday. Scrutiny follows a week later, and candidates have three days to withdraw before ballot papers go to print."),
        // Demo video: a Creative Commons Blender Foundation film standing in for newsroom footage.
        { type: "youtube", videoId: "aqz-KE-bpKQ", title: "By-elections explained: what is at stake in four seats" },
        p("Turnout in by-elections is usually lower than in general elections, which can make local organisation decisive."),
      ]),
    post("coalition-talks-stall", "Coalition Talks Stall Over Cabinet Posts, Party Insiders Say",
      "Two smaller partners want more ministries before they sign a written agreement. Leaders say the alliance is not at risk.",
      "national-politics", omar, "A broadcast microphone beside its foam windscreen, in black and white.", 5, [
        p("Negotiations over the governing coalition's written agreement have stalled for a second week, according to officials from three of the parties involved."),
        p("The dispute centres on the allocation of two economic ministries and the chair of a key parliamentary committee."),
        q("Everyone agrees on the programme. The arguments are about who gets to deliver it.", "A senior party official, speaking on condition of anonymity"),
        h("Why the written deal matters"),
        p("Without a signed agreement, the coalition relies on informal understandings, which have broken down before during budget votes."),
      ]),
    post("budget-session-development-spending", "Budget Session: Lawmakers Clash Over Development Spending",
      "Members from smaller provinces say cuts to development funds fall hardest on districts with the fewest roads and clinics.",
      "parliament", omar, "Lawmakers at their desks in a crowded legislative chamber with a packed public gallery.", 5, [
        p("The budget debate turned heated on its third day as members from several provinces accused the finance ministry of protecting large urban projects while trimming rural schemes."),
        h("Where the cuts fall"),
        p("Development spending is down in nominal terms for the first time in four years. The ministry says the money will be restored if revenue targets are met by mid-year."),
        q("A promise to restore funding in six months is not a budget line. It is a hope.", "A member of the finance committee"),
        p("The final vote on the finance bill is scheduled for the end of the month."),
      ]),
    post("campaigns-first-time-voters", "How Campaigns Are Courting First-Time Voters Online",
      "Short videos, voice notes, and community group chats have replaced the rally as the first contact for many young voters.",
      "elections", sana, "Close-up of hands holding a smartphone.", 6, [
        p("For many voters under 25, the first message from a political campaign now arrives on a phone, not at a rally or a doorstep."),
        h("The new campaign toolkit"),
        p("Campaign staff describe a shift towards short vertical videos and voice notes shared in neighbourhood group chats, where messages travel faster and are harder to fact-check."),
        { type: "video", src: "", poster: "", title: "Inside a campaign's social media war room" },
        h("What voters can check"),
        p("Election officials advise checking candidate information on the commission's official website and treating forwarded voice notes with caution."),
      ]),
    post("regional-trade-corridor-talks", "Regional Ministers Meet to Revive a Stalled Trade Corridor",
      "Officials from four neighbouring countries agreed to restart technical talks on customs, rail links, and energy transit.",
      "diplomacy", sana, "A long freight train carrying stacked shipping containers.", 4, [
        p("Foreign and commerce ministers from four neighbouring countries ended two days of talks with an agreement to restart technical working groups on a long-delayed trade corridor."),
        p("The working groups will cover customs procedures, a shared rail gauge standard, and transit fees for energy pipelines."),
        q("Nobody signed anything historic today. But the officials who do the detailed work are talking again, and that matters.", "A regional trade analyst"),
      ]),
    post("local-government-elections-delay", "City Councils Press for Local Elections to Be Held on Schedule",
      "Councillors say repeated delays leave neighbourhood services in the hands of unelected administrators.",
      "elections", ayesha, "A voter pressing the confirm key on an electronic voting machine.", 4, [
        p("Councillors from several cities have written to the election commission asking it to hold local government elections on time, after two previous postponements."),
        h("Who runs the city meanwhile"),
        p("Since the last councils' terms ended, appointed administrators have managed budgets for waste collection, street lighting, and local markets."),
        // Demo placeholder: mock post text, not a real social media post.
        { type: "tweet", author: "Neighbourhood Council Forum", handle: "@local_councils", text: "Three years without an elected council. Our streets, our budget, our vote. Hold the local elections on time." },
      ]),
    post("heat-relief-fund-assembly", "Heat-Wave Relief Fund Becomes Flashpoint in Provincial Assembly",
      "The opposition wants an audit of last summer's spending before new money is released.",
      "parliament", hassan, "A row of air-conditioning units mounted on the wall of an office building.", 4, [
        p("A proposal to double the provincial heat-wave relief fund was sent back to committee after opposition members demanded an audit of last summer's spending."),
        p("The fund pays for cooling centres, drinking water points, and emergency health teams during extreme heat."),
        q("We support the fund. We want to know where last year's money went before we vote for more.", "An opposition member of the provincial assembly"),
      ]),
    post("caretaker-government-explained", "Explainer: What a Caretaker Government Can and Cannot Do",
      "Interim administrations run the country before an election. The law limits the decisions they are allowed to take.",
      "national-politics", hassan, "A domed government building with columns under a clear blue sky.", 7, [
        p("When an assembly completes its term, an interim administration takes over to run day-to-day affairs and support the election commission."),
        h("What it can do"),
        p("A caretaker government can pay salaries, keep public services running, and respond to emergencies."),
        h("What it cannot do"),
        p("It is generally barred from major policy decisions, new long-term contracts, and transfers of senior officials without the commission's approval."),
        // Demo video: a Creative Commons Blender Foundation film standing in for newsroom footage.
        { type: "youtube", videoId: "eRsGyueVLvQ", title: "Caretaker rules in under three minutes" },
      ]),
    post("budget-2026-what-changes", "Budget 2026: What Changes for Salaried Families",
      "A line-by-line look at tax slabs, subsidies, and what they mean for household budgets this year.",
      "budget-and-tax", omar, "A calculator, reading glasses, coins, and a notepad on a white table.", 6, [
        p("The new budget revises income tax slabs, narrows fuel subsidies, and adds a temporary relief package for households below a fixed earnings threshold."),
        h("What changes for take-home pay"),
        p("Lower and middle income bands see the largest adjustment. Employers apply the revised slabs from the next payroll cycle."),
        img("budget-2026-what-changes-inline", "A stack of coins squeezed in a red clamp beside a calculator.",
          "Household budgets are under pressure as subsidies narrow."),
        q("The details of the relief package will decide how many families actually benefit.", "A finance analyst, speaking on background"),
        // Demo video: a Creative Commons Blender Foundation film standing in for newsroom footage.
        { type: "youtube", videoId: "R6MlUcmOul8", title: "Budget briefing: the main changes explained" },
        h("What to check this month"),
        p("Families should compare their next salary slip with the previous one and ask employers about any new deductions."),
      ]),
    post("city-transit-pilot", "Inside the City's Bus Rapid Transit Pilot",
      "Commuters, drivers, and planners share early results from the first 90 days.",
      "transport", ayesha, "A modern rapid transit bus waiting at a covered station platform.", 5, [
        p("Ninety days into the pilot, journey times on the main corridor have dropped, but station crowding remains the top complaint."),
        h("Faster, but not for everyone"),
        p("Dedicated lanes have made the corridor more reliable. Residents on feeder routes report longer waits."),
        img("city-transit-pilot-inline", "A red and silver city bus at a roadside stop.",
          "Feeder routes connect neighbourhoods to the new corridor."),
        // Demo placeholder: mock post text, not a real social media post.
        { type: "tweet", author: "Corridor Commuters Group", handle: "@corridor_commuters", text: "Day 90 on the new line: 14 minutes on the bus. That number improved; the walk to the stop did not." },
      ]),
    post("open-data-newsrooms", "How Small Newsrooms Are Using Open Data",
      "Reporters with limited budgets are building investigations from public records.",
      "open-data", sana, "A laptop showing charts next to a phone, notebook, and coffee cup.", 4, [
        p("Public datasets are easier to download than ever, but turning them into verified stories still takes careful checking."),
        h("A practical starting point"),
        p("Start with one question, find the dataset that answers it, and document every cleaning step."),
        { type: "video", src: "", poster: "", title: "Workshop: verifying a public dataset" },
      ]),
    post("monsoon-preparedness", "Monsoon Preparedness: A Checklist for Neighbourhoods",
      "Drainage, shelter, and early warning steps communities can take before the rains.",
      "climate", hassan, "A residential street under ankle-deep floodwater after heavy rain.", 4, [
        p("Neighbourhood committees that cleared drains early reported fewer flooded homes last season."),
        h("Three steps to take now"),
        p("Map the streets that flood first, agree on a shelter point, and set up a phone tree for warnings."),
      ]),
    post("school-enrolment-gap", "Why Enrolment Drops Between Primary and Secondary School",
      "Distance, cost, and transport explain most of the gap, according to new survey data.",
      "schools", hassan, "A student's hands writing in a spiral notebook.", 5, [
        p("Nearly every child starts primary school, but far fewer move on to secondary."),
        h("Distance matters most"),
        p("Families living more than five kilometres from a secondary school were the least likely to continue."),
      ]),
    post("local-cricket-revival", "The Quiet Revival of Neighbourhood Cricket",
      "Why community leagues are filling grounds again, and what clubs are doing differently.",
      "cricket", ayesha, "A cricket match in progress on a green ground under a blue sky.", 3, [
        p("Weekend fixtures that once struggled for players now run waiting lists."),
        h("Shorter games, more players"),
        p("Two-hour matches fit around shift work and family time."),
      ]),
    post("small-business-credit", "Small Businesses Still Struggle to Borrow",
      "Paperwork and collateral rules keep many shop owners away from formal loans.",
      "business", omar, "A trader arranging vegetables at an open-air market stall.", 4, [
        p("A subsidised credit line was meant to reach small traders. Most applicants we spoke to never completed the process."),
        q("I have run this shop for twelve years. I do not have twelve years of paperwork.", "A hardware shop owner"),
      ]),
    post("parks-after-dark", "Keeping Parks Open After Dark",
      "Lighting, staffing, and the case for evening access to public green space.",
      "green-spaces", ayesha, "A person walking along a lamp-lit park path at night.", 3, [
        p("Three parks are trialling extended evening hours with new lighting and a night warden."),
        h("Who uses parks at night"),
        p("Shift workers, families avoiding the afternoon heat, and evening walkers make up most late visitors."),
      ]),
    post("online-scams-older-users", "Online Scams Are Targeting Older Users. Here Is What Works",
      "Simple habits and a trusted contact prevent most losses, say fraud advisers.",
      "online-safety", sana, "Close-up of hands holding a smartphone.", 4, [
        p("Impersonation messages are now the most common scam reported by older people."),
        h("Pause and call back"),
        p("Hanging up and calling a known number back stops most attempts."),
        // Demo video: a Creative Commons Blender Foundation film standing in for newsroom footage.
        { type: "youtube", videoId: "TLkA0RELQ1g", title: "How to spot an impersonation message" },
      ]),
    post("urban-tree-canopy", "Counting the City's Trees, One Block at a Time",
      "A volunteer tree census shows which neighbourhoods are losing shade fastest.",
      "green-spaces", hassan, "Large shade trees lining a city pavement with benches.", 5, [
        p("Volunteers have catalogued more than eight thousand street trees."),
        h("Heat follows the gaps"),
        p("Streets without trees recorded noticeably higher surface temperatures on summer afternoons."),
      ]),
    post("community-libraries", "Community Libraries Are Becoming Homework Hubs",
      "Evening study sessions have turned reading rooms into the busiest space in the neighbourhood.",
      "learning", hassan, "A bright library with bookshelves and colourful bean bags.", 3, [
        p("Small community libraries have extended evening hours to offer quiet study space and volunteer tutors."),
      ]),
    post("womens-football-league", "A Women's Football League Finds Its Feet",
      "In its second season, the league has doubled its teams and found a permanent ground.",
      "football", omar, "Women footballers warming up on a pitch in front of stadium seats.", 4, [
        p("What began as friendly matches is now a structured league with eight teams and qualified referees."),
        { type: "video", src: "", poster: "", title: "Matchday highlights from the season opener" },
      ]),
    /*
     * Video desk. Each story carries a real, embeddable YouTube video: Creative Commons
     * films from the Blender Foundation, standing in for newsroom footage in demo mode.
     */
    post("heatwave-cooling-centres", "Cooling Centres Open Their Doors as the Heatwave Peaks",
      "Volunteers, water stations, and a few hours of relief: a day inside one of the city's busiest shelters.",
      "climate", hassan, "Rows of folding chairs and water coolers inside a community hall.", 4, [
        p("Twelve community halls have been converted into cooling centres for the hottest week of the year, with fans, drinking water, and first-aid volunteers on site from late morning."),
        { type: "youtube", videoId: "WhWc3b3KhnY", title: "Inside a cooling centre on the hottest day of the year" },
        h("Who comes in"),
        p("Most visitors are older residents, street vendors, and delivery riders between shifts. Staff say the busiest hours are between one and four in the afternoon."),
      ]),
    post("night-markets-small-traders", "How Night Markets Keep Small Traders Afloat",
      "Lower rents and cooler evenings have turned weekly night markets into a lifeline for stallholders.",
      "business", omar, "Strings of lights above food stalls at an evening market.", 5, [
        p("Weekly night markets now host more than three hundred stalls across the city, many run by families who cannot afford a permanent shop."),
        h("The numbers behind a stall"),
        p("Traders say a pitch costs a fraction of a monthly shop rent, and evening crowds spend more per visit than daytime shoppers."),
        { type: "youtube", videoId: "Y-rmzh0PI3c", title: "Night market economics, explained by the stallholders" },
      ]),
    post("budget-portal-open-data", "Reading the City Budget Portal in Five Minutes",
      "The new open data portal publishes every line of spending. Here is how to make sense of it.",
      "open-data", sana, "A laptop screen showing spreadsheet columns and a bar chart.", 6, [
        p("The city's open budget portal went live this month, publishing department-level spending as downloadable tables for the first time."),
        { type: "youtube", videoId: "mN0zPOpADL4", title: "Open data in five minutes: a walkthrough of the budget portal" },
        h("Where to start"),
        p("Begin with the summary view, then compare allocations against what was actually spent in the previous year."),
      ]),
    post("school-bus-routes", "On the School Run: A Morning on the New Bus Routes",
      "Four new routes promise shorter journeys for students on the city's edge. We rode along to see.",
      "schools", hassan, "Students in uniform boarding a yellow school bus at dawn.", 4, [
        p("The education department added four school bus routes this term, serving neighbourhoods where students previously walked more than three kilometres."),
        { type: "youtube", videoId: "UXqq0ZvbOnk", title: "On the school run: a morning on the new bus routes" },
        q("My daughter used to leave before sunrise. Now she leaves when it is light.", "A parent waiting at the first stop"),
      ]),
    post("riverside-cycle-lane", "Riding the Riverside Cycle Lane at Rush Hour",
      "The protected lane has been open for a month. Riders like it; the junctions still need work.",
      "transport", ayesha, "A green-painted cycle lane running beside a river embankment.", 3, [
        p("The four-kilometre protected lane along the river now carries several hundred riders on weekday mornings, according to the city's counters."),
        { type: "youtube", videoId: "Z4C82eyhwgU", title: "Riding the riverside cycle lane at rush hour" },
        h("The tricky junctions"),
        p("Riders say two crossings near the old bridge still feel unsafe, and the city has promised new signals by the end of the year."),
      ]),
    post("neighbourhood-cricket-nets", "The Volunteers Behind a Neighbourhood Cricket Club",
      "Evening nets, borrowed kit, and a waiting list of eager juniors.",
      "cricket", omar, "Cricket nets under floodlights at dusk.", 3, [
        p("Three evenings a week, a small group of volunteers runs free practice sessions for more than sixty young players."),
        { type: "youtube", videoId: "SkVqJ1SGeL0", title: "Evening nets with a neighbourhood cricket club" },
      ]),
    post("question-hour-explained", "Question Hour, Explained in Three Minutes",
      "How members put questions to ministers, and why the session matters even when answers are short.",
      "parliament", ayesha, "An empty assembly chamber with rows of green benches.", 3, [
        p("Question hour opens most sitting days. Members submit written questions in advance, and ministers answer on the floor."),
        { type: "youtube", videoId: "YE7VzlLtp-4", title: "Question hour, explained in three minutes" },
        p("Supplementary questions, asked on the spot, are where most of the scrutiny happens."),
      ]),
    post("bus-shelter-audit", "Auditing Every Bus Shelter on the Corridor",
      "Shade, seating, and lighting: how the new stops measure up.",
      "transport", ayesha, "A metal bus shelter with a bench beside a quiet road.", 2, [p("Draft: field notes from visits to every shelter on the pilot corridor.")], "DRAFT"),
    post("housing-permits-backlog", "The Housing Permit Backlog, Explained",
      "Why approvals for small residential projects are taking longer this year.",
      "housing", ayesha, "A construction crane beside a new apartment block.", 2, [p("Draft: interviews with applicants and planning staff still to be added.")], "DRAFT"),
  ];

  const now = new Date().toISOString();
  return {
    version: 11,
    categories,
    profiles: [superAdmin, ayesha, omar, sana, hassan, bilal, qasim, wajahat],
    posts,
    // No pins at first: every homepage slot shows the newest stories automatically.
    homepage: [],
    media: [],
    audit: [
      { id: 1, actorId: superAdmin.id, action: "ADMIN_CREATED", targetType: "profile", targetId: ayesha.id, metadata: { username: ayesha.username, via: "demo-seed" }, createdAt: now },
      { id: 2, actorId: superAdmin.id, action: "ADMIN_CREATED", targetType: "profile", targetId: omar.id, metadata: { username: omar.username, via: "demo-seed" }, createdAt: now },
      { id: 3, actorId: superAdmin.id, action: "ADMIN_CREATED", targetType: "profile", targetId: sana.id, metadata: { username: sana.username, via: "demo-seed" }, createdAt: now },
      { id: 4, actorId: superAdmin.id, action: "ADMIN_CREATED", targetType: "profile", targetId: hassan.id, metadata: { username: hassan.username, via: "demo-seed" }, createdAt: now },
      { id: 5, actorId: superAdmin.id, action: "ADMIN_SUSPENDED", targetType: "profile", targetId: bilal.id, metadata: { username: bilal.username }, createdAt: now },
    ],
    nextAuditId: 6,
  };
}
