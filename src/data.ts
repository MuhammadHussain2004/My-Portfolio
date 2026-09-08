// Everything below marked "generated" is regenerated at build time (on
// every push, and daily via cron) by scripts/sync-content.mjs and
// scripts/generate-projects.mjs, which:
//  - pull the latest resume from MuhammadHussain2004/resume (itself kept in
//    sync with live GitHub activity by its own automation) and adapt it
//    into this structured content via Gemini, grounded strictly in that
//    resume text (see scripts/sync-content.mjs for the exact rules), and
//  - compute a few facts directly from the GitHub API with no LLM involved
//    (public repo count, live full-stack repo count, the project showcase).
// These committed JSON files are also the fallback if a build ever runs
// without regenerating them, or the generators can't reach their APIs.
import generatedContent from "./generated/content.json";
import generatedStats from "./generated/stats.json";
import generatedProjects from "./generated/projects.json";

export const profile = {
  name: "Muhammad Hussain",
  fullName: "Muhammad Hussain Khan Lodhi",
  role: "Software Engineer",
  location: "Karachi, Pakistan",
  email: "muhammadhussaintech@gmail.com",
  phone: "+92 324 3249217",
  github: "https://github.com/MuhammadHussain2004",
  linkedin: "https://www.linkedin.com/in/muhammad-hussain-khan-lodhi-139261252",
  secondaryRoles: generatedContent.secondaryRoles,
  tagline: generatedContent.tagline,
  bio: generatedContent.bio,
  contactHeading: generatedContent.contactHeading,
  quickFacts: generatedContent.quickFacts,
};

export const stats = [
  { value: `${generatedStats.publicRepos}+`, label: "public repositories" },
  { value: `${generatedStats.fullStackRepoCount}+`, label: "shipped full-stack apps" },
  { value: generatedContent.cgpaStat, label: "CGPA, BSCS" },
];

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  live?: string;
  code: string;
  featured?: boolean;
};

export const projects: Project[] = generatedProjects as Project[];

export const skills: { category: string; items: string[] }[] = generatedContent.skills;

export type TimelineItem = {
  period: string;
  title: string;
  place: string;
  description: string;
  tag: string;
  link?: string;
  linkLabel?: string;
};

export const timeline: TimelineItem[] = generatedContent.timeline;
