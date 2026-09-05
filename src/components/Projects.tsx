import { SquareArrowOutUpRight } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { projects } from "../data";

export default function Projects() {
  return (
    <section id="work" className="border-t border-line-soft px-6 py-28 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeading index="03" kicker="Selected work" title="Projects" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal
              key={project.slug}
              delay={(i % 2) * 0.08}
              className={project.featured ? "md:col-span-2" : ""}
            >
              <article
                className={`group h-full overflow-hidden rounded-md border border-line bg-bg-card transition-colors hover:border-accent/40 ${
                  project.featured ? "grid grid-cols-1 lg:grid-cols-[1.15fr_1fr]" : "flex flex-col"
                }`}
              >
                <div className="overflow-hidden border-b border-line lg:border-b-0 lg:border-r">
                  <div className="flex items-center gap-1.5 border-b border-line bg-bg-raised px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="aspect-[16/10] overflow-hidden bg-bg-raised">
                    <img
                      src={`${import.meta.env.BASE_URL}${project.image}`}
                      alt={`${project.title} screenshot`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="font-heading text-xl font-semibold text-ink">
                    {project.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">
                    {project.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border border-line bg-bg-raised px-2.5 py-1 font-mono text-[11px] text-faint"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-5 border-t border-line-soft pt-5">
                    {project.live && (
                      <a
                        href={project.live}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[13px] text-accent hover:underline"
                      >
                        <SquareArrowOutUpRight size={14} />
                        Live demo
                      </a>
                    )}
                    <a
                      href={project.code}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted hover:text-accent"
                    >
                      <FaGithub size={14} />
                      Source
                    </a>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-14 text-center">
          <a
            href="https://github.com/MuhammadHussain2004?tab=repositories"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-line px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-accent/50 hover:text-accent"
          >
            View all repositories on GitHub
            <SquareArrowOutUpRight size={14} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
