import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ArticleAnalysisPage } from './pages/ArticleAnalysisPage';
import { NewsPage } from './pages/NewsPage';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="verifai-theme">
      <Routes>
        <Route path="/" element={<HomePage showLanding={true} />} />
        <Route path="/home-page" element={<HomePage showLanding={false} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/article-analysis" element={<ArticleAnalysisPage />} />
        <Route path="/news" element={<NewsPage />} />
     
      </Routes>
    </ThemeProvider>
  );
}

export default App;