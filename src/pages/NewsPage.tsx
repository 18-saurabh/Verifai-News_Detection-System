import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Newspaper,
  Globe,
  Clock,
  ExternalLink,
  Share2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  Info,
  Camera,
  Languages,
  Brain,
  BarChart2,
  Home,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MobileSidebar } from '@/components/MobileSidebar';
import { analyzeText } from '@/utils/newsAnalyzer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  source: string;
  credibilityScore?: number;
  isFactual?: boolean;
  warnings?: string[];
}

const RSS_FEEDS = [
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    name: 'NY Times',
    icon: '📰' // Newspaper emoji for a classic publication
  },
  {
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    name: 'BBC News',
    icon: '🌍' // Globe emoji for international coverage
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    name: 'The Guardian',
    icon: '🦉' // Owl emoji for wisdom and insight
  },
  {
    url: 'https://feeds.feedburner.com/ndtvnews-top-stories',
    name: 'NDTV',
    icon: '🛡️' // Shield emoji for Indian news authority
  },
  {
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    name: 'The Hindu',
    icon: '🏛️' // Classical building emoji for traditional journalism
  },
];

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://proxy.cors.sh/',
];

async function fetchWithCorsProxy(url: string): Promise<Response> {
  let lastError;
  
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy + encodeURIComponent(url), {
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
        }
      });
      
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
      lastError = error;
    }
  }
  
  throw lastError || new Error('All CORS proxies failed');
}

function parseRSS(xml: string): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('XML parsing failed: ' + parseError.textContent);
    }
    
    const items = Array.from(doc.querySelectorAll('item, entry'));
    
    return items.map(item => {
      const title = item.querySelector('title')?.textContent || 'No title available';
      const link = item.querySelector('link')?.textContent || 
                  item.querySelector('link')?.getAttribute('href') || '#';
      const pubDate = item.querySelector('pubDate, published')?.textContent || 
                     new Date().toISOString();
      const content = item.querySelector('content\\:encoded, description, summary')?.textContent || '';
      const contentSnippet = content
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/ /g, ' ')
        .replace(/\s+/g, ' ')
        .trim() || 'No content available';

      return {
        title,
        link,
        pubDate,
        content,
        contentSnippet,
        source: '',
      };
    });
  } catch (error) {
    console.error('RSS parsing error:', error);
    return [];
  }
}

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const particlesInit = async (main: any) => {
    await loadFull(main);
  };

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    setFailedSources([]);
    const allNews: NewsItem[] = [];
    const failed: string[] = [];

    try {
      await Promise.all(RSS_FEEDS.map(async feed => {
        try {
          const response = await fetchWithCorsProxy(feed.url);
          const xmlText = await response.text();
          const items = parseRSS(xmlText);
          
          if (items.length === 0) {
            throw new Error('No items found in feed');
          }
          
          const newsWithSource = items.map(item => ({
            ...item,
            source: feed.name
          }));
          
          allNews.push(...newsWithSource);
        } catch (feedError) {
          console.error(`Error fetching ${feed.name}:`, feedError);
          failed.push(feed.name);
        }
      }));

      if (allNews.length === 0) {
        setError('Unable to fetch news from any sources. Please try again later.');
      } else {
        allNews.sort((a, b) => 
          new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );
        setNews(allNews);
      }
      
      if (failed.length > 0) {
        setFailedSources(failed);
      }
    } catch (err) {
      setError('Failed to fetch news. Please try again later.');
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const analyzeArticle = async (article: NewsItem) => {
    if (analyzing) return;
    setAnalyzing(true);
    
    try {
      const textToAnalyze = article.contentSnippet || article.title;
      const analysis = await analyzeText(textToAnalyze);
      
      setNews(prevNews => 
        prevNews.map(item => 
          item.link === article.link 
            ? {
                ...item,
                credibilityScore: analysis.credibilityScore,
                isFactual: analysis.factCheck.isFactual,
                warnings: analysis.warnings
              }
            : item
        )
      );
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.contentSnippet?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSource && matchesSearch;
  });

  const sortedNews = [...filteredNews].sort((a, b) => 
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return (
    <div className="min-h-screen relative">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          particles: {
            number: {
              value: 50,
              density: {
                enable: true,
                value_area: 800,
              },
            },
            color: {
              value: "#93c5fd",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.5,
              random: true,
            },
            size: {
              value: 3,
              random: true,
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false,
            },
          },
          detectRetina: true,
        }}
        className="absolute inset-0 z-0"
      />

      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/80" />
      
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#93c5fd_1px,transparent_1px),linear-gradient(to_bottom,#93c5fd_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear_gradient(to_bottom,#334155_1px,transparent_1px)] opacity-50 transition-opacity duration-300" />
      
      <div className="fixed inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,#ffffff_0%,rgba(255,255,255,0)_100%)] dark:bg-[radial-gradient(100%_100%_at_50%_0%,rgba(30,41,59,0.5)_0%,rgba(30,41,59,0)_100%)]" />

      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                asChild
                className="flex items-center gap-2"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/">
                    <Home className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/article-analysis">
                    <Camera className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/about">
                    <Info className="h-5 w-5" />
                  </Link>
                </Button>
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="md:hidden">
                <MobileSidebar
                  showHistory={showHistory}
                  onHistoryClick={() => setShowHistory(!showHistory)}
                />
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Newspaper className="h-12 w-12 text-primary relative" />
              </div>
              <h1 className="text-4xl font-bold">
                News Analysis
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered news verification and credibility analysis
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4 mb-8 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search articles by title or content..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-primary/20 bg-background/90 backdrop-blur-md shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/70 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="h-12 rounded-xl border-2 border-primary/20 bg-background/90 backdrop-blur-md px-4 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            >
              <option value="all">All Sources</option>
              {RSS_FEEDS.map(feed => (
                <option key={feed.name} value={feed.name}>
                  {feed.icon} {feed.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              onClick={fetchNews}
              className="h-12 px-6 rounded-xl shadow-lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh
            </Button>
          </div>

          {failedSources.length > 0 && (
            <div className="mb-6 rounded-lg border bg-card/50 backdrop-blur-sm p-4">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm font-medium">Unable to fetch news from: {failedSources.join(', ')}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading news...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              <AlertTriangle className="h-6 w-6 mr-2" />
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {sortedNews.map((item, index) => (
                <Dialog key={item.link}>
                  <DialogTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg" />
                      <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-6 h-full">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{item.source}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <h3 className="mb-2 line-clamp-2 text-xl font-semibold">
                          {item.title}
                        </h3>

                        <div className="mb-4">
                          <p className="text-base text-muted-foreground line-clamp-3">
                            {item.contentSnippet}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {format(new Date(item.pubDate), 'MMM d, yyyy')}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            Read More
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </DialogTrigger>

                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl mb-4">{item.title}</DialogTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {item.source}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {format(new Date(item.pubDate), 'MMMM d, yyyy')}
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {item.contentSnippet}
                      </div>

                      {item.credibilityScore !== undefined ? (
                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Analysis Results</h4>
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              item.isFactual 
                                ? 'bg-success/10 text-success' 
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {item.isFactual ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertTriangle className="h-4 w-4" />
                              )}
                              Credibility Score: {item.credibilityScore}%
                            </span>
                          </div>

                          {item.warnings && item.warnings.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Warnings</h5>
                              {item.warnings.map((warning, i) => (
                                <p key={i} className="flex items-start gap-2 text-sm text-warning">
                                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                  {warning}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
                          onClick={() => analyzeArticle(item)}
                          disabled={analyzing}
                        >
                          {analyzing ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-4 w-4" />
                              Analyze Article
                            </>
                          )}
                        </Button>
                      )}

                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Visit Source
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(item.link);
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { NewsPage };