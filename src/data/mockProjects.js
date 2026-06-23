import { MS_PER_DAY } from "../utils/deadline.js";

export const IS_DEV = import.meta.env.DEV;

export const MOCK_PROJECTS = (() => {
  const now = Date.now();
  return [
    {
      id: "mock-1",
      name: "Launch Campaign",
      emoji: "🚀",
      deadline: now - 1.5 * MS_PER_DAY,
      blocks: [
        { id: "m1a", type: "h1", text: "Launch Campaign" },
        {
          id: "m1b",
          type: "p",
          text: "This deadline has already passed. Time to do a post-mortem.",
        },
        { id: "m1c", type: "h2", text: "What went wrong" },
        { id: "m1d", type: "li", text: "Scope crept in week 3" },
        { id: "m1e", type: "li", text: "Asset delivery was delayed by 4 days" },
        { id: "m1f", type: "h2", text: "Next steps" },
        {
          id: "m1g",
          type: "p",
          text: "Reschedule with stakeholders and set a hard freeze date.",
        },
      ],
      history: [
        {
          id: "h1a",
          timestamp: now - 5 * MS_PER_DAY,
          blocks: [
            { id: "m1a", type: "h1", text: "Launch Campaign" },
            {
              id: "m1b",
              type: "p",
              text: "Initial brief received. Kicking things off.",
            },
          ],
        },
      ],
    },
    {
      id: "mock-2",
      name: "Client Prototype",
      emoji: "⚡",
      deadline: now + 2 * MS_PER_DAY,
      blocks: [
        { id: "m2a", type: "h1", text: "Client Prototype" },
        {
          id: "m2b",
          type: "p",
          text: "Crunch time. This needs to ship in 48 hours.",
        },
        { id: "m2c", type: "h2", text: "Remaining tasks" },
        { id: "m2d", type: "li", text: "Fix responsive layout on tablet" },
        {
          id: "m2e",
          type: "li",
          text: "Swap placeholder copy with final text",
        },
        { id: "m2f", type: "li", text: "QA pass on Chrome and Safari" },
      ],
      history: [],
    },
    {
      id: "mock-3",
      name: "Brand Refresh",
      emoji: "🎨",
      deadline: now + 10 * MS_PER_DAY,
      blocks: [
        { id: "m3a", type: "h1", text: "Brand Refresh" },
        {
          id: "m3b",
          type: "p",
          text: "Full visual identity overhaul. Typography, color system, and component library.",
        },
        { id: "m3c", type: "h2", text: "In progress" },
        { id: "m3d", type: "li", text: "Finalize type scale" },
        { id: "m3e", type: "li", text: "Color token definitions" },
        { id: "m3f", type: "h2", text: "Blocked on" },
        {
          id: "m3g",
          type: "p",
          text: "Waiting for CEO approval on the primary palette shortlist.",
        },
      ],
      history: [],
    },
    {
      id: "mock-4",
      name: "Q3 Strategy Doc",
      emoji: "📋",
      deadline: now + 24 * MS_PER_DAY,
      blocks: [
        { id: "m4a", type: "h1", text: "Q3 Strategy" },
        {
          id: "m4b",
          type: "p",
          text: "Outline goals, KPIs, and team allocation for the quarter.",
        },
        { id: "m4c", type: "h2", text: "Goals" },
        { id: "m4d", type: "li", text: "Increase retention by 8%" },
        { id: "m4e", type: "li", text: "Ship two major feature releases" },
        { id: "m4f", type: "li", text: "Reduce support ticket volume" },
      ],
      history: [],
    },
    {
      id: "mock-5",
      name: "Annual Report",
      emoji: "📊",
      deadline: now + 90 * MS_PER_DAY,
      blocks: [
        { id: "m5a", type: "h1", text: "Annual Report" },
        {
          id: "m5b",
          type: "p",
          text: "Plenty of runway here. Start gathering data early.",
        },
        { id: "m5c", type: "h2", text: "Sections" },
        { id: "m5d", type: "li", text: "Executive summary" },
        { id: "m5e", type: "li", text: "Financial performance" },
        { id: "m5f", type: "li", text: "Product milestones" },
        { id: "m5g", type: "li", text: "Team & culture" },
      ],
      history: [],
    },
  ];
})();
