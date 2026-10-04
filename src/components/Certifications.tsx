import { BadgeCheck, ExternalLink, FileCheck2 } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { certifications } from "../data";

export default function Certifications() {
  if (certifications.length === 0) return null;

  return (
    <section id="certifications" className="border-t border-line-soft px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="05" kicker="Verified proof" title="Certifications" />
        <div className="grid gap-4 md:grid-cols-2">
          {certifications.map((item, index) => (
            <Reveal key={`${item.title}-${item.period}`} delay={index * 0.08}>
              <article className="group h-full rounded-sm border border-line bg-bg-card p-6 transition-colors hover:border-accent/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-accent/30 bg-accent/10 text-accent">
                    {item.linkLabel?.toLowerCase() === "certificate" ? <FileCheck2 size={19} /> : <BadgeCheck size={19} />}
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{item.period}</span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold leading-snug text-ink">{item.title}</h3>
                <p className="mt-2 font-mono text-xs text-faint">{item.place}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{item.description}</p>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-mono text-xs text-accent hover:underline">
                    <ExternalLink size={14} /> {item.linkLabel || "View proof"}
                  </a>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
