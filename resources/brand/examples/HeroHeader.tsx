import Image from 'next/image'

export default function HeroHeader() {
  return (
    <header className="bg-alain-blue text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-8 md:grid-cols-[auto,1fr] items-center">
        <div className="w-[320px] h-auto">
          <Image
            src="/brand/ALAIN_logo_primary_blue-bg.svg"
            width={320}
            height={160}
            alt="ALAIN logo"
            priority
          />
        </div>
        <div>
          <h1 className="heading-1 text-white">ALAIN: Open AI Learning</h1>
          <p className="body-text text-white/90 mt-4 max-w-prose">
            Learn, build, and share. Use open models and clear patterns.
          </p>
          <div className="mt-8 flex gap-4">
            <a className="inline-flex items-center rounded-md bg-white px-5 py-3 text-black-900 font-inter font-medium" href="#start">
              Get Started
            </a>
            <a className="inline-flex items-center rounded-md border border-white/30 px-5 py-3 text-white" href="#docs">
              View Docs
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

