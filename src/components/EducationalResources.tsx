import React from 'react';
import { 
  AlertTriangle, 
  Brain, 
  Share2, 
  BookOpen, 
  Search, 
  FileText, 
  Link2, 
  Shield, 
  Eye, 
  MessageSquare, 
  BarChart2, 
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const EducationalResources = () => {
  const resources = [
    {
      title: "Content Analysis Guide",
      icon: Brain,
      items: [
        {
          heading: "Step 1: Input Content",
          details: [
            "Paste the text you want to analyze",
            "Support for articles, social media posts, and news content",
            "Longer content provides more accurate analysis",
            "Original source links are recommended"
          ]
        },
        {
          heading: "Step 2: Review Results",
          details: [
            "Check the overall credibility score",
            "Review specific warnings and suggestions",
            "Examine source verification details",
            "Consider AI-generated insights"
          ]
        },
        {
          heading: "Step 3: Take Action",
          details: [
            "Share analysis results with others",
            "Export detailed reports in various formats",
            "Save analyses for future reference",
            "Compare multiple versions of content"
          ]
        }
      ]
    },
    {
      title: "Verification Techniques",
      icon: Shield,
      items: [
        {
          heading: "Source Analysis",
          details: [
            "Check author credentials and expertise",
            "Verify publication date and updates",
            "Cross-reference with trusted sources",
            "Evaluate source reputation and history"
          ]
        },
        {
          heading: "Content Evaluation",
          details: [
            "Look for emotional manipulation tactics",
            "Check for logical fallacies",
            "Verify statistical claims and data",
            "Identify potential conflicts of interest"
          ]
        },
        {
          heading: "Technical Verification",
          details: [
            "Use reverse image search for visuals",
            "Check URL authenticity",
            "Verify quoted sources and citations",
            "Examine metadata when available"
          ]
        }
      ]
    },
    {
      title: "Red Flags & Warning Signs",
      icon: AlertTriangle,
      items: [
        {
          heading: "Language Patterns",
          details: [
            "Excessive use of emotional language",
            "Urgency or pressure tactics",
            "Absolute claims without evidence",
            "Oversimplification of complex issues"
          ]
        },
        {
          heading: "Content Issues",
          details: [
            "Missing or anonymous sources",
            "Outdated or manipulated information",
            "Conspiracy theory narratives",
            "Unverifiable claims or predictions"
          ]
        },
        {
          heading: "Presentation Concerns",
          details: [
            "Clickbait headlines",
            "Misleading images or captions",
            "Poor grammar or formatting",
            "Suspicious website characteristics"
          ]
        }
      ]
    },
    {
      title: "Best Practices",
      icon: CheckCircle,
      items: [
        {
          heading: "Before Sharing",
          details: [
            "Verify claims with multiple sources",
            "Check publication dates and context",
            "Read beyond headlines",
            "Consider author expertise"
          ]
        },
        {
          heading: "Using Our Tools",
          details: [
            "Regular content monitoring",
            "Save important analyses",
            "Compare multiple versions",
            "Export detailed reports"
          ]
        },
        {
          heading: "Responsible Sharing",
          details: [
            "Include verification status",
            "Add context when needed",
            "Correct misinformation promptly",
            "Share analysis results"
          ]
        }
      ]
    }
  ];

  const features = [
    {
      icon: BarChart2,
      title: "Credibility Scoring",
      description: "Get instant credibility ratings based on multiple verification factors"
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Advanced algorithms detect patterns and analyze content authenticity"
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Continuous monitoring and updates for evolving stories"
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Generate comprehensive analysis reports with actionable insights"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Quick Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-primary/5 rounded-lg p-4 flex flex-col items-center text-center">
            <feature.icon className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Detailed Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resources.map((resource, index) => (
          <div key={index} className="bg-card rounded-lg p-6 shadow-lg border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <resource.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{resource.title}</h3>
            </div>
            
            <div className="space-y-6">
              {resource.items.map((item, itemIndex) => (
                <div key={itemIndex} className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {item.heading}
                  </h4>
                  <ul className="space-y-2">
                    {item.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Additional Resources</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Fact-Checking Websites",
              links: [
                { name: "Snopes", url: "https://www.snopes.com" },
                { name: "FactCheck.org", url: "https://www.factcheck.org" },
                { name: "PolitiFact", url: "https://www.politifact.com" }
              ]
            },
            {
              title: "Media Literacy",
              links: [
                { name: "Media Bias Chart", url: "https://adfontesmedia.com" },
                { name: "News Literacy Project", url: "https://newslit.org" },
                { name: "Common Sense Media", url: "https://www.commonsensemedia.org" }
              ]
            },
            {
              title: "Research Tools",
              links: [
                { name: "Google Scholar", url: "https://scholar.google.com" },
                { name: "Internet Archive", url: "https://archive.org" },
                { name: "Academic Search", url: "https://www.base-search.net" }
              ]
            }
          ].map((section, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-medium text-sm">{section.title}</h4>
              <ul className="space-y-1">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};