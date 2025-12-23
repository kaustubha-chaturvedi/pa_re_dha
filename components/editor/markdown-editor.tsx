"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMarkdownEditor } from "./useMarkdownEditor"
import { BasicInformationSection } from "./sections/BasicInformationSection"
import { ImageSection } from "./sections/ImageSection"
import { ContentSection } from "./sections/ContentSection"
import { ClientInfoSection } from "./sections/ClientInfoSection"
import { ResultsSection } from "./sections/ResultsSection"
import { AboutClientSection } from "./sections/AboutClientSection"
import { ChallengeSection } from "./sections/ChallengeSection"
import { SolutionSection } from "./sections/SolutionSection"
import { TestimonialSection } from "./sections/TestimonialSection"
import { PricingSection } from "./sections/PricingSection"
import { FeaturesSection } from "./sections/FeaturesSection"
import { ProcessSection } from "./sections/ProcessSection"
import { FAQSection } from "./sections/FAQSection"
import { CTASection } from "./sections/CTASection"
import { EditorSidebar } from "./sections/EditorSidebar"
import { RemoveSectionDialog } from "./sections/RemoveSectionDialog"
import matter from "gray-matter"

interface MarkdownEditorProps {
  initialContent?: string
  initialFrontmatter?: Record<string, any>
  filePath?: string
  filePathTemplate?: string
  editorTitle?: string
  editorDescription?: string
  onSave?: () => void
  initialSlug?: string
}

export function MarkdownEditor({
  initialContent = "",
  initialFrontmatter = {},
  filePath,
  filePathTemplate,
  editorTitle = "Content",
  editorDescription = "Edit the markdown content and frontmatter",
  onSave,
  initialSlug = "",
}: MarkdownEditorProps) {
  const {
    state,
    setState,
    slug,
    resolvedFilePath,
    fileExists,
    loading,
    saving,
    expandedSections,
    setExpandedSections,
    confirmDialog,
    setConfirmDialog,
    sectionRefs,
    sections,
    isService,
    isPortfolio,
    toggleSection,
    scrollToSection,
    handleSectionToggle,
    confirmRemove,
    handleSave: saveHandler,
  } = useMarkdownEditor({
    initialContent,
    initialFrontmatter,
    filePath,
    filePathTemplate,
    initialSlug,
  })

  const isEditing = fileExists && state.title
  const cardTitle = isEditing ? `Edit ${editorTitle}` : `Create ${editorTitle}`

  // Build frontmatter for ContentSection
  const getFrontmatter = () => ({
    title: state.title,
    ...(state.description && { description: state.description }),
    ...(slug && { slug }),
    ...(state.tags.length > 0 && { tags: state.tags }),
    ...(state.image && { image: state.image }),
    ...(state.client && { client: state.client }),
    ...(state.clientLogo && { clientLogo: state.clientLogo }),
    ...(state.results && state.results.length > 0 && { results: state.results }),
    ...(state.aboutClient && { aboutClient: state.aboutClient }),
    ...(state.challenge && { challenge: state.challenge }),
    ...(state.solution && { solution: state.solution }),
    ...(state.testimonial && { testimonial: state.testimonial }),
    ...(state.pricing && { pricing: state.pricing }),
    ...(state.features && { features: state.features }),
    ...(state.process && { process: state.process }),
    ...(state.faq && { faq: state.faq }),
    ...(state.cta && { cta: state.cta }),
    draft: state.draft,
  })

  const handleSave = async () => {
    await saveHandler()
    onSave?.()
  }

  return (
    <div className="w-full flex gap-4">
      <EditorSidebar
        sections={sections}
        state={state}
        loading={loading}
        onSectionClick={scrollToSection}
        onSectionToggle={handleSectionToggle}
      />

      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle>{cardTitle}</CardTitle>
              <CardDescription>{editorDescription}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{state.draft ? 'Draft' : 'Published'}</span>
              <button
                type="button"
                onClick={() => setState(prev => ({ ...prev, draft: !prev.draft }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  state.draft ? 'bg-muted' : 'bg-primary'
                }`}
                role="switch"
                aria-checked={!state.draft}
                aria-label="Toggle draft status"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    state.draft ? 'translate-x-1' : 'translate-x-6'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Loading content from GitHub...</p>
              </div>
            </div>
          )}
          {!loading && (
            <>
              <BasicInformationSection
                title={state.title}
                description={state.description}
                tags={state.tags}
                tagInput={state.tagInput}
                slug={slug}
                onTitleChange={(value) => setState(prev => ({ ...prev, title: value }))}
                onDescriptionChange={(value) => setState(prev => ({ ...prev, description: value }))}
                onTagsChange={(tags) => setState(prev => ({ ...prev, tags }))}
                onTagInputChange={(value) => setState(prev => ({ ...prev, tagInput: value }))}
                isOpen={expandedSections.has('basic')}
                onToggle={() => toggleSection('basic')}
                sectionRef={(el) => { sectionRefs.current['basic'] = el }}
              />

              <ImageSection
                image={state.image}
                onImageChange={(value) => setState(prev => ({ ...prev, image: value }))}
                isOpen={expandedSections.has('image')}
                onToggle={() => toggleSection('image')}
                sectionRef={(el) => { sectionRefs.current['image'] = el }}
              />

              {isPortfolio && (
                <>
                  <ClientInfoSection
                    client={state.client}
                    clientLogo={state.clientLogo}
                    onClientChange={(value) => setState(prev => ({ ...prev, client: value }))}
                    onClientLogoChange={(value) => setState(prev => ({ ...prev, clientLogo: value }))}
                    isOpen={expandedSections.has('client')}
                    onToggle={() => toggleSection('client')}
                    sectionRef={(el) => { sectionRefs.current['client'] = el }}
                  />

                  <ResultsSection
                    results={state.results}
                    onResultsChange={(results) => setState(prev => ({ ...prev, results }))}
                    isOpen={expandedSections.has('results')}
                    onToggle={() => toggleSection('results')}
                    sectionRef={(el) => { sectionRefs.current['results'] = el }}
                  />

                  <AboutClientSection
                    aboutClient={state.aboutClient}
                    onAboutClientChange={(value) => setState(prev => ({ ...prev, aboutClient: value }))}
                    isOpen={expandedSections.has('aboutClient')}
                    onToggle={() => toggleSection('aboutClient')}
                    sectionRef={(el) => { sectionRefs.current['aboutClient'] = el }}
                  />

                  <ChallengeSection
                    challenge={state.challenge}
                    onChallengeChange={(value) => setState(prev => ({ ...prev, challenge: value }))}
                    isOpen={expandedSections.has('challenge')}
                    onToggle={() => toggleSection('challenge')}
                    sectionRef={(el) => { sectionRefs.current['challenge'] = el }}
                  />

                  <SolutionSection
                    solution={state.solution}
                    onSolutionChange={(value) => setState(prev => ({ ...prev, solution: value }))}
                    isOpen={expandedSections.has('solution')}
                    onToggle={() => toggleSection('solution')}
                    sectionRef={(el) => { sectionRefs.current['solution'] = el }}
                  />

                  <TestimonialSection
                    testimonial={state.testimonial}
                    onTestimonialChange={(value) => setState(prev => ({ ...prev, testimonial: value }))}
                    isOpen={expandedSections.has('testimonial')}
                    onToggle={() => toggleSection('testimonial')}
                    sectionRef={(el) => { sectionRefs.current['testimonial'] = el }}
                  />
                </>
              )}

              {isService && (
                <>
                  <PricingSection
                    pricing={state.pricing}
                    onPricingChange={(value) => setState(prev => ({ ...prev, pricing: value }))}
                    isOpen={expandedSections.has('pricing')}
                    onToggle={() => toggleSection('pricing')}
                    sectionRef={(el) => { sectionRefs.current['pricing'] = el }}
                  />

                  <FeaturesSection
                    features={state.features}
                    onFeaturesChange={(value) => setState(prev => ({ ...prev, features: value }))}
                    isOpen={expandedSections.has('features')}
                    onToggle={() => toggleSection('features')}
                    sectionRef={(el) => { sectionRefs.current['features'] = el }}
                  />

                  <ProcessSection
                    process={state.process}
                    onProcessChange={(value) => setState(prev => ({ ...prev, process: value }))}
                    isOpen={expandedSections.has('process')}
                    onToggle={() => toggleSection('process')}
                    sectionRef={(el) => { sectionRefs.current['process'] = el }}
                  />
                </>
              )}

              <ContentSection
                content={state.content}
                htmlContent={state.htmlContent}
                rawContent={state.rawContent}
                rawMode={state.rawMode}
                frontmatter={getFrontmatter()}
                onContentChange={(value) => setState(prev => ({ ...prev, content: value }))}
                onHtmlContentChange={(value) => setState(prev => ({ ...prev, htmlContent: value }))}
                onRawContentChange={(value) => setState(prev => ({ ...prev, rawContent: value }))}
                onRawModeChange={(mode) => setState(prev => ({ ...prev, rawMode: mode }))}
                onFrontmatterUpdate={(updates) => {
                  setState(prev => ({
                    ...prev,
                    title: updates.title || prev.title,
                    description: updates.description || prev.description,
                    tags: Array.isArray(updates.tags) ? updates.tags : prev.tags,
                    draft: updates.draft ?? prev.draft,
                    image: updates.image || prev.image,
                    client: updates.client || prev.client,
                    clientLogo: updates.clientLogo || prev.clientLogo,
                    results: updates.results || prev.results,
                    aboutClient: updates.aboutClient || prev.aboutClient,
                    challenge: updates.challenge || prev.challenge,
                    solution: updates.solution || prev.solution,
                    testimonial: updates.testimonial || prev.testimonial,
                    pricing: updates.pricing || prev.pricing,
                    features: updates.features || prev.features,
                    process: updates.process || prev.process,
                    faq: updates.faq || prev.faq,
                    cta: updates.cta || prev.cta,
                  }))
                }}
                isOpen={expandedSections.has('content')}
                onToggle={() => toggleSection('content')}
                sectionRef={(el) => { sectionRefs.current['content'] = el }}
              />

              <FAQSection
                faq={state.faq}
                onFaqChange={(value) => setState(prev => ({ ...prev, faq: value }))}
                isOpen={expandedSections.has('faq')}
                onToggle={() => toggleSection('faq')}
                sectionRef={(el) => { sectionRefs.current['faq'] = el }}
              />

              <CTASection
                cta={state.cta}
                onCtaChange={(value) => setState(prev => ({ ...prev, cta: value }))}
                isOpen={expandedSections.has('cta')}
                onToggle={() => toggleSection('cta')}
                sectionRef={(el) => { sectionRefs.current['cta'] = el }}
              />

              <Button onClick={handleSave} disabled={saving || loading} className="w-full mt-4">
                {loading ? "Loading..." : saving ? "Saving..." : "Save & Commit"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <RemoveSectionDialog
        open={confirmDialog.open}
        sectionLabel={confirmDialog.sectionLabel}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
