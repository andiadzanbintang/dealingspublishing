// src/pages/AboutPage.jsx
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import {
  Target,
  Eye,
  Microscope,
  Globe,
  Users,
  BookOpen,
  Award,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedSection from '@/components/ui/AnimatedSection'
import SubscribeSection from '@/components/sections/SubscribeSection'
import { siteAPI } from '@/services/api'

const stats = [
  { icon: BookOpen, value: '41+', label: 'Published Articles' },
  { icon: Users, value: '51+', label: 'Research Authors' },
  { icon: Globe, value: '5+', label: 'Contributing Countries' },
  { icon: Award, value: '75+', label: 'Google Citations' },
]

const values = [
  {
    icon: Microscope,
    title: 'Rigor',
    description:
      'Every publication undergoes a thorough peer-review process to ensure the highest standards of scientific integrity.',
  },
  {
    icon: Globe,
    title: 'Accessibility',
    description:
      'We believe knowledge should be freely accessible, breaking down barriers to scientific information worldwide.',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description:
      'We foster international collaboration, connecting researchers across disciplines and borders.',
  },
  {
    icon: TrendingUp,
    title: 'Innovation',
    description:
      'We embrace new technologies and methodologies to advance the frontiers of academic publishing.',
  },
]

const timeline = [
  {
    year: '2024',
    title: 'Officially Established',
    description:
      'Dealings Foundation Institute (Dealings Publishing) was legally registered under the Ministry of Law and Human Rights of the Republic of Indonesia.',
  },
  {
    year: '2024',
    title: 'Launching Academic Publishing Platform',
    description:
      'Started publishing interdisciplinary academic journals and supporting open-access scientific communication.',
  },
  {
    year: '2025',
    title: 'International Research Collaboration',
    description:
      'Expanded collaboration with researchers, educators, and institutions from multiple countries across diverse disciplines.',
  },
  {
    year: '2025',
    title: 'Crossref DOI Registration',
    description:
      'Registered publications with Crossref DOI to ensure global discoverability and academic citation standards.',
  },
  {
    year: '2026',
    title: 'Growing Global Impact',
    description:
      'Published peer-reviewed research involving international authors and interdisciplinary studies in government, resilience, and sustainability.',
  },
  {
    year: 'Future',
    title: 'Advancing Open Knowledge',
    description:
      'Continuing to build an inclusive and globally recognized platform for impactful research and scientific innovation.',
  },
]

const teamMembers = [
  {
    name: 'Dr Abdillah',
    role: 'Founder & Publishing Director',
    email: 'abdillah@dealingspublishing.com',
    image:
      '/abdillah.jpg',
    description:
      "Leading the company's strategic direction, development of academic and professional networks, and oversight of the overall publishing process and development of scientific publications.",
  },
  {
    name: 'Prof. Nina Yuslaini',
    role: 'Senior Publishing Advisor',
    email: 'ninayuslaini@soc.uir.ac.id',
    image:
      '/nina.png',
    description:
      'Providing strategic academic and publishing guidance to strengthen editorial quality, publication management, and institutional collaboration.',
  },
  {
    name: 'dr Suci Triana Putri',
    role: 'Finance & Administration Manager',
    email: 'sucitrianaputri@gmail.com',
    image:
      '/suci.jpg',
    description:
      'Responsible for managing company finances, operational administration, document archiving, budget management, and ensuring that administrative and financial governance runs effectively and professionally.',
  },
  {
    name: 'Dr Siti Sofiaturrohmah',
    role: 'Creative & Publication Officer',
    email: 'siti19044@dealingspublishing.com',
    image:
      '/siti.jpg',
    description:
      'Manage publication design, book and journal layout, visual branding, publication media, and creative content development to support company identity and promotion.',
  },
]

const defaultSettings = {
  heroTitle: 'Our Story',
  heroSubtitle:
    "We've been at the forefront of academic publishing for over 15 years, dedicated to open science and global knowledge sharing.",
  heroImage:
    'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80',
  aboutUsShort:
    'Design Publishing is dedicated to advancing scientific knowledge through accessible, high-quality academic publishing.',
  aboutUsFull:
    'Design Publishing was created to support researchers, institutions, and knowledge communities through reliable academic publishing. We are committed to quality, openness, and accessibility as core principles of scientific communication.',
  mission:
    'To accelerate the pace of scientific discovery by providing an open, rigorous, and accessible platform for researchers worldwide.',
  vision:
    'A world where knowledge flows freely, empowering every researcher to make a meaningful impact.',
}

export default function AboutPage() {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await siteAPI.getSettings()
        const data = response?.data

        if (data) {
          setSettings({
            heroTitle: data.heroTitle || defaultSettings.heroTitle,
            heroSubtitle: data.heroSubtitle || defaultSettings.heroSubtitle,
            heroImage: data.heroImage || defaultSettings.heroImage,
            aboutUsShort: data.aboutUsShort || defaultSettings.aboutUsShort,
            aboutUsFull: data.aboutUsFull || defaultSettings.aboutUsFull,
            mission: data.mission || defaultSettings.mission,
            vision: data.vision || defaultSettings.vision,
          })
        }
      } catch (error) {
        console.error('Failed to fetch about page settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const storyParagraphs = settings.aboutUsFull
    ? settings.aboutUsFull
        .split(/\n+/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
    : []

  return (
    <>
      <Helmet>
        <title>About Us — Design Publishing</title>
        <meta
          name="description"
          content={
            settings.aboutUsShort ||
            "Learn about Design Publishing's mission, vision, and journey in advancing academic research and publishing."
          }
        />
      </Helmet>

      {/* ═══ Page Hero ═══ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={settings.heroImage}
            alt="About background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 to-neutral-900" />
        </div>

        <div className="relative container-custom text-center">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-semibold text-primary-400 uppercase tracking-wider"
          >
            About Us
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight"
          >
            {settings.heroTitle || 'Our Story'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-neutral-400 max-w-2xl mx-auto"
          >
            {settings.heroSubtitle}
          </motion.p>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="relative -mt-12 z-10">
        <div className="container-custom">
          <AnimatedSection>
            <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100">
              {stats.map((stat, index) => (
                <div key={index} className="p-6 md:p-8 text-center">
                  <stat.icon className="w-6 h-6 text-primary-600 mx-auto mb-3" />
                  <div className="text-2xl md:text-3xl font-bold text-neutral-900">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-neutral-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ Mission & Vision ═══ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
            <AnimatedSection>
              <div className="p-8 md:p-10 bg-primary-50 rounded-3xl">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Our Mission
                </h2>
                <p className="mt-4 text-neutral-600 leading-relaxed">
                  {settings.mission}
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="p-8 md:p-10 bg-neutral-50 rounded-3xl">
                <div className="w-12 h-12 bg-neutral-200 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-neutral-700" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Our Vision
                </h2>
                <p className="mt-4 text-neutral-600 leading-relaxed">
                  {settings.vision}
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══ Company Story + Image ═══ */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div>
                <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                  Our Journey
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                  From Knowledge to
                  <br />
                  Global Impact
                </h2>
                <div className="mt-6 space-y-4 text-neutral-600 leading-relaxed">
                  {storyParagraphs.length > 0 ? (
                    storyParagraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                  ) : (
                    <>
                      <p>
                        Design Publishing was created to support researchers,
                        institutions, and knowledge communities through reliable
                        academic publishing.
                      </p>
                      <p>
                        We are committed to quality, openness, and accessibility
                        as core principles of scientific communication.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
                  alt="Research laboratory"
                  className="rounded-3xl shadow-xl w-full h-[450px] object-cover"
                />
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary-100 rounded-3xl -z-10" />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══ Our Values ═══ */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                What Drives Us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                Our Core Values
              </h2>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="text-center p-6">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <value.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {value.title}
                  </h3>
                  <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Our Team ═══ */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                Meet The Team
              </span>

              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                The People Behind
                <br />
                Dealings Publishing
              </h2>

              <p className="mt-6 text-neutral-500 max-w-2xl mx-auto">
                Our publishing team is dedicated to advancing academic excellence,
                open-access knowledge, and impactful scientific communication through
                collaboration and innovation.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="grid sm:grid-cols-[220px_1fr]">
                    <div className="relative h-[260px] sm:h-full">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-neutral-900">
                        {member.name}
                      </h3>

                      <p className="mt-2 text-primary-600 font-medium">
                        {member.role}
                      </p>

                      <a
                        href={`mailto:${member.email}`}
                        className="inline-block mt-3 text-sm text-neutral-500 hover:text-primary-600 transition-colors"
                      >
                        {member.email}
                      </a>

                      <p className="mt-6 text-neutral-600 leading-relaxed">
                        {member.description}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Timeline ═══ */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-16">
              <span className="text-sm font-semibold text-primary-600 uppercase tracking-wider">
                Milestones
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                Our Timeline
              </h2>
            </div>
          </AnimatedSection>

          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-neutral-200 md:-translate-x-px" />

            {timeline.map((item, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <div
                  className={`relative flex items-start gap-8 mb-12 ${
                    index % 2 === 0
                      ? 'md:flex-row'
                      : 'md:flex-row-reverse md:text-right'
                  }`}
                >
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-primary-600 rounded-full border-4 border-white shadow -translate-x-1.5 md:-translate-x-1.5 mt-1.5 z-10" />

                  <div
                    className={`ml-12 md:ml-0 md:w-1/2 ${
                      index % 2 === 0 ? 'md:pr-16' : 'md:pl-16'
                    }`}
                  >
                    <span className="text-sm font-bold text-primary-600">
                      {item.year}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold text-neutral-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Subscribe ═══ */}
      <SubscribeSection />
    </>
  )
}