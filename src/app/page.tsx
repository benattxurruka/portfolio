import Link from "next/link";
import Image from "next/image";
import { Github, Camera, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

const LINKEDIN_URL = "https://www.linkedin.com/in/benattxurruka/";

export default async function HomePage() {
  const t = await getTranslations("Home");

  const internalSections = [
    {
      href: "/github",
      title: t("githubTitle"),
      description: t("githubDescription"),
      image: "/images/github-preview.svg",
      imageAlt: "GitHub logo",
      icon: Github,
      ring: "ring-blue-500/30",
    },
    {
      href: "/photography",
      title: t("photographyTitle"),
      description: t("photographyDescription"),
      image: "/images/photography-preview.svg",
      imageAlt: "Camera illustration",
      icon: Camera,
      ring: "ring-purple-500/30",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-48px)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-3xl font-semibold text-ink-primary text-center mb-10">
          {t("welcome")}
        </h1>

        {/* Internal navigation cards */}
        {internalSections.map(({ href, title, description, image, imageAlt, icon: Icon, ring }) => (
          <Link
            key={href}
            href={href}
            className="card flex items-center gap-6 p-6 group"
          >
            <div className={`relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden ring-2 ${ring} bg-surface-3`}>
              <Image src={image} alt={imageAlt} fill className="object-cover" sizes="64px" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-ink-muted flex-shrink-0" />
                <h2 className="font-semibold text-ink-primary group-hover:text-accent transition-colors">
                  {title}
                </h2>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed">{description}</p>
            </div>

            <ArrowRight
              className="w-5 h-5 text-ink-muted flex-shrink-0 opacity-0 group-hover:opacity-100
                         -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
            />
          </Link>
        ))}

        {/* CV — external link card */}
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-center gap-6 p-6 group"
        >
          <div className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden ring-2 ring-sky-500/30 bg-surface-3">
            <Image src="/images/linkedin-preview.svg" alt="LinkedIn logo" fill className="object-cover" sizes="64px" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-ink-muted flex-shrink-0" />
              <h2 className="font-semibold text-ink-primary group-hover:text-accent transition-colors">
                {t("cvTitle")}
              </h2>
            </div>
            <p className="text-sm text-ink-secondary leading-relaxed">{t("cvDescription")}</p>
          </div>

          <ExternalLink
            className="w-5 h-5 text-ink-muted flex-shrink-0 opacity-0 group-hover:opacity-100
                       transition-all duration-200"
          />
        </a>
      </div>
    </div>
  );
}
