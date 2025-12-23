"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Plus, Minus, Loader2, RotateCcw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NavItem {
  label: string
  link: string
}

interface LinkGroup {
  label: string
  link: string
}

interface ColorScheme {
  primary: string
  primaryHover: string
  secondary: string
}

interface SiteConfig {
  header: {
    logo: {
      text: string
      image: string | null
    }
    navigation: NavItem[]
    contactButton: {
      text: string
      link: string
    }
  }
  footer: {
    company: {
      name: string
      description: string
      logo: string | null
    }
    links: {
      company: LinkGroup[]
      resources: LinkGroup[]
      legal: LinkGroup[]
    }
    social: {
      facebook: string | null
      twitter: string | null
      github: string | null
    }
    copyright: string
  }
  colors: ColorScheme
}

// Default configuration values
const defaultConfig: SiteConfig = {
  header: {
    logo: {
      text: "Agency",
      image: null,
    },
    navigation: [
      { label: "About", link: "/about" },
      { label: "Services", link: "/services" },
      { label: "Blog", link: "/blog" },
      { label: "Portfolio", link: "/portfolio" },
    ],
    contactButton: {
      text: "Contact Us",
      link: "/contact",
    },
  },
  footer: {
    company: {
      name: "Agency",
      description: "A results-obsessed agency building brands that change the world.",
      logo: null,
    },
    links: {
      company: [
        { label: "About Us", link: "/about" },
        { label: "Careers", link: "/careers" },
        { label: "Portfolio", link: "/portfolio" },
        { label: "Blog", link: "/blog" },
      ],
      resources: [
        { label: "Help Center", link: "#" },
        { label: "FAQs", link: "#" },
        { label: "Contact Us", link: "/contact" },
      ],
      legal: [
        { label: "Privacy Policy", link: "#" },
        { label: "Terms of Service", link: "#" },
      ],
    },
    social: {
      facebook: null,
      twitter: null,
      github: null,
    },
    copyright: "© 2024 Agency. All rights reserved.",
  },
  colors: {
    primary: "#5b13ec",
    primaryHover: "#4a0fd9",
    secondary: "#FF6B00",
  },
}

export function SiteCustomizer() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/site-config")
      if (!res.ok) throw new Error("Failed to load config")
      const data = await res.json()
      // Ensure colors object exists with defaults
      if (!data.colors) {
        data.colors = {
          primary: "#5b13ec",
          primaryHover: "#4a0fd9",
          secondary: "#FF6B00",
        }
      }
      setConfig(data)
    } catch (error) {
      console.error("Error loading config:", error)
      toast({
        title: "Failed to load config",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      const res = await fetch("/api/site-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save")
      }

      toast({
        title: "Saved successfully",
        description: "Site configuration has been updated. Refresh the site to see color changes.",
      })
    } catch (error) {
      console.error("Error saving config:", error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const restoreHeaderDefaults = () => {
    if (!config) return
    setConfig({
      ...config,
      header: { ...defaultConfig.header },
    })
    toast({
      title: "Header restored",
      description: "Header configuration has been reset to defaults.",
    })
  }

  const restoreColorsDefaults = () => {
    if (!config) return
    setConfig({
      ...config,
      colors: { ...defaultConfig.colors },
    })
    toast({
      title: "Colors restored",
      description: "Color scheme has been reset to defaults.",
    })
  }

  const restoreFooterDefaults = () => {
    if (!config) return
    setConfig({
      ...config,
      footer: { ...defaultConfig.footer },
    })
    toast({
      title: "Footer restored",
      description: "Footer configuration has been reset to defaults.",
    })
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Header Configuration</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restoreHeaderDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo Text</Label>
            <Input
              value={config.header.logo.text}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, logo: { ...config.header.logo, text: e.target.value } } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Logo Image URL (optional)</Label>
            <Input
              value={config.header.logo.image || ""}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, logo: { ...config.header.logo, image: e.target.value || null } } })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Navigation Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfig({ ...config, header: { ...config.header, navigation: [...config.header.navigation, { label: "", link: "" }] } })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            {config.header.navigation.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const newNav = [...config.header.navigation]
                    newNav[index].label = e.target.value
                    setConfig({ ...config, header: { ...config.header, navigation: newNav } })
                  }}
                  placeholder="Label"
                />
                <Input
                  value={item.link}
                  onChange={(e) => {
                    const newNav = [...config.header.navigation]
                    newNav[index].link = e.target.value
                    setConfig({ ...config, header: { ...config.header, navigation: newNav } })
                  }}
                  placeholder="/link"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newNav = config.header.navigation.filter((_, i) => i !== index)
                    setConfig({ ...config, header: { ...config.header, navigation: newNav } })
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Contact Button Text</Label>
            <Input
              value={config.header.contactButton.text}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, contactButton: { ...config.header.contactButton, text: e.target.value } } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Button Link</Label>
            <Input
              value={config.header.contactButton.link}
              onChange={(e) => setConfig({ ...config, header: { ...config.header, contactButton: { ...config.header.contactButton, link: e.target.value } } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Color Scheme</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restoreColorsDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={config.colors.primary}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primary: e.target.value } })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={config.colors.primary}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primary: e.target.value } })}
                placeholder="#5b13ec"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-sm text-muted-foreground">Used in buttons, links, and primary UI elements</p>
          </div>
          <div className="space-y-2">
            <Label>Primary Hover Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={config.colors.primaryHover}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primaryHover: e.target.value } })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={config.colors.primaryHover}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, primaryHover: e.target.value } })}
                placeholder="#4a0fd9"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-sm text-muted-foreground">Used when hovering over primary elements</p>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={config.colors.secondary}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, secondary: e.target.value } })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={config.colors.secondary}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, secondary: e.target.value } })}
                placeholder="#FF6B00"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-sm text-muted-foreground">Used for accents and secondary UI elements</p>
          </div>
        </CardContent>
      </Card>

      {/* Footer Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Footer Configuration</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restoreFooterDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={config.footer.company.name}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, company: { ...config.footer.company, name: e.target.value } } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Description</Label>
            <Textarea
              value={config.footer.company.description}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, company: { ...config.footer.company, description: e.target.value } } })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Company Logo URL (optional)</Label>
            <Input
              value={config.footer.company.logo || ""}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, company: { ...config.footer.company, logo: e.target.value || null } } })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          {/* Company Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Company Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, company: [...config.footer.links.company, { label: "", link: "" }] } } })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            {config.footer.links.company.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.company]
                    newLinks[index].label = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, company: newLinks } } })
                  }}
                  placeholder="Label"
                />
                <Input
                  value={item.link}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.company]
                    newLinks[index].link = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, company: newLinks } } })
                  }}
                  placeholder="/link"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newLinks = config.footer.links.company.filter((_, i) => i !== index)
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, company: newLinks } } })
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Resources Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Resources Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, resources: [...config.footer.links.resources, { label: "", link: "" }] } } })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            {config.footer.links.resources.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.resources]
                    newLinks[index].label = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, resources: newLinks } } })
                  }}
                  placeholder="Label"
                />
                <Input
                  value={item.link}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.resources]
                    newLinks[index].link = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, resources: newLinks } } })
                  }}
                  placeholder="/link"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newLinks = config.footer.links.resources.filter((_, i) => i !== index)
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, resources: newLinks } } })
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Legal Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Legal Links</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, legal: [...config.footer.links.legal, { label: "", link: "" }] } } })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Link
              </Button>
            </div>
            {config.footer.links.legal.map((item, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={item.label}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.legal]
                    newLinks[index].label = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, legal: newLinks } } })
                  }}
                  placeholder="Label"
                />
                <Input
                  value={item.link}
                  onChange={(e) => {
                    const newLinks = [...config.footer.links.legal]
                    newLinks[index].link = e.target.value
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, legal: newLinks } } })
                  }}
                  placeholder="/link"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newLinks = config.footer.links.legal.filter((_, i) => i !== index)
                    setConfig({ ...config, footer: { ...config.footer, links: { ...config.footer.links, legal: newLinks } } })
                  }}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Social Links */}
          <div className="space-y-2">
            <Label>Social Media Links</Label>
            <Input
              value={config.footer.social.facebook || ""}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, social: { ...config.footer.social, facebook: e.target.value || null } } })}
              placeholder="Facebook URL"
            />
            <Input
              value={config.footer.social.twitter || ""}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, social: { ...config.footer.social, twitter: e.target.value || null } } })}
              placeholder="Twitter URL"
            />
            <Input
              value={config.footer.social.github || ""}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, social: { ...config.footer.social, github: e.target.value || null } } })}
              placeholder="GitHub URL"
            />
          </div>

          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Input
              value={config.footer.copyright}
              onChange={(e) => setConfig({ ...config, footer: { ...config.footer, copyright: e.target.value } })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </>
        )}
      </Button>
    </div>
  )
}

