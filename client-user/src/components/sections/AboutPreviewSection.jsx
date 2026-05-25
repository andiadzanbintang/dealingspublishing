// src/components/sections/AboutPreviewSection.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Target, Microscope, Globe } from 'lucide-react'
import Button from '@/components/ui/Button'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { siteAPI } from '@/services/api'

const defaultSettings = {
  aboutUsShort:
    'Design Publishing is dedicated to advancing scientific knowledge through accessible, high-quality academic publishing.',
  mission:
    'To democratize access to research and provide a platform where knowledge knows no boundaries.',
  vision:
    'A world where every researcher has the tools and platform to share their discoveries with the global community.',
}


export default function AboutPreviewSection() {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await siteAPI.getSettings()
        const data = response?.data

        if(data) {
          setSettings({
            aboutUsShort: data.aboutUsShort || defaultSettings.aboutUsShort,
            mission: data.mission || defaultSettings.mission,
            vision: data.vision || defaultSettings.vision,
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const highlights = [
  {
    icon: Target,
    title: 'Our Mission',
    description:
      'Accelerating scientific discovery through open and rigorous publishing.',
  },
  {
    icon: Microscope,
    title: 'Quality Research',
    description:
      'Peer-reviewed journals ensuring the highest standards of academic excellence.',
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description:
      'Connecting researchers from 60+ countries to advance collective knowledge.',
  },
]

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* ═══ Left — Image ═══ */}
          <AnimatedSection>
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-neutral-200/50">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"
                  alt="Research team collaborating"
                  className="w-full h-[500px] object-cover"
                />
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary-50 rounded-3xl -z-10" />
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary-100 rounded-3xl -z-10" />

              {/* Floating stat card */}
              <div className="absolute -bottom-4 -left-4 md:bottom-8 md:-left-8 bg-white rounded-2xl shadow-xl p-5 border border-neutral-100">
                <div className="text-3xl font-bold text-primary-600">15+</div>
                <div className="text-sm text-neutral-500 mt-0.5">
                  Years of Excellence
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ═══ Right — Content ═══ */}
          <AnimatedSection delay={0.2}>
            <div>
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                About Us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                Dedicated to Advancing
                <br />
                Scientific Knowledge
              </h2>
              <p className="mt-6 text-lg text-neutral-500 leading-relaxed">
                {settings.aboutUsShort}
              </p>

              {/* Highlights */}
              <div className="mt-10 space-y-6">
                {highlights.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link to="/about">
                  <Button variant="outline" icon={ArrowRight}>
                    More About Us
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}