import { useEffect, useState } from "react";
import { FileText, Menu, X } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { profile } from "../data";

const links = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#contact", label: "Contact" },
];

const RESUME_URL = `${import.meta.env.BASE_URL}Muhammad-Hussain-Resume.pdf`;

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-bg/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <a href="#top" className="font-mono text-xl font-bold tracking-tighter text-ink">
          <span className="text-accent">&lt;</span>Hussain<span className="text-accent">/&gt;</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-mono text-[13px] text-muted transition-colors hover:text-accent"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href={RESUME_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono text-[13px] text-muted transition-colors hover:text-accent"
          >
            <FileText size={14} />
            Resume
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-muted transition-colors hover:text-accent"
          >
            <FaGithub size={18} />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-muted transition-colors hover:text-accent"
          >
            <FaLinkedin size={18} />
          </a>
          <a
            href="#contact"
            className="rounded-sm border border-accent/40 px-4 py-2 font-mono text-[13px] text-accent transition-colors hover:bg-accent/10"
          >
            Let&apos;s talk
          </a>
        </div>

        <button
          className="text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg px-6 pb-6 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-mono text-sm text-muted hover:text-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={RESUME_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex items-center gap-1.5 font-mono text-sm text-muted hover:text-accent"
          >
            <FileText size={15} />
            Resume
          </a>
          <div className="mt-5 flex items-center gap-5">
            <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted">
              <FaGithub size={18} />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted">
              <FaLinkedin size={18} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
