import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Home,
  Info,
  Camera,
  Newspaper,
  Send,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  Hash,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileSidebar } from '@/components/MobileSidebar';
import { UserNav } from '@/components/UserNav';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import { 
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
  likes: string[];
  dislikes: string[];
  tags: string[];
  imageUrl?: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export const SocialPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [charCount, setCharCount] = useState(0);
  const [sparkles, setSparkles] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(newPosts);
      setLoading(false);
    }, (err) => {
      setError('Failed to load posts. Please try again.');
      setLoading(false);
      console.error('Posts fetch error:', err);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = [];
      const gridSize = 4;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const horizontalLines = Math.floor(viewportHeight / (gridSize * 16));
      const verticalLines = Math.floor(viewportWidth / (gridSize * 16));
      
      const sparkleCount = Math.floor(Math.random() * 6) + 5;
      
      for (let i = 0; i < sparkleCount; i++) {
        const isHorizontal = Math.random() > 0.5;
        
        if (isHorizontal) {
          const lineIndex = Math.floor(Math.random() * horizontalLines);
          newSparkles.push({
            id: `sparkle-${Date.now()}-${i}`,
            x: Math.random() * viewportWidth,
            y: lineIndex * gridSize * 16,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.5 + 0.5,
            speed: Math.random() * 2 + 1,
            direction: Math.random() > 0.5 ? 1 : -1,
            isHorizontal: true,
          });
        } else {
          const lineIndex = Math.floor(Math.random() * verticalLines);
          newSparkles.push({
            id: `sparkle-${Date.now()}-${i}`,
            x: lineIndex * gridSize * 16,
            y: Math.random() * viewportHeight,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.5 + 0.5,
            speed: Math.random() * 2 + 1,
            direction: Math.random() > 0.5 ? 1 : -1,
            isHorizontal: false,
          });
        }
      }
      
      setSparkles(newSparkles);
    };
    
    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sparkles.length === 0) return;
    
    const animateSparkles = () => {
      setSparkles(prevSparkles => 
        prevSparkles.map(sparkle => {
          if (sparkle.isHorizontal) {
            let newX = sparkle.x + (sparkle.speed * sparkle.direction);
            if (newX < 0 || newX > window.innerWidth) {
              sparkle.direction *= -1;
              newX = sparkle.x + (sparkle.speed * sparkle.direction);
            }
            return { ...sparkle, x: newX };
          } else {
            let newY = sparkle.y + (sparkle.speed * sparkle.direction);
            if (newY < 0 || newY > window.innerHeight) {
              sparkle.direction *= -1;
              newY = sparkle.y + (sparkle.speed * sparkle.direction);
            }
            return { ...sparkle, y: newY };
          }
        })
      );
    };
    
    const animationFrame = requestAnimationFrame(animateSparkles);
    const interval = setInterval(animateSparkles, 50);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(interval);
    };
  }, [sparkles]);

  useEffect(() => {
    if (!user || posts.length === 0) return;

    const unsubscribeComments = posts.map(post => {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const postComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Comment[];
        setComments(prev => ({
          ...prev,
          [post.id]: postComments
        }));
      }, (err) => {
        console.error(`Comments fetch error for post ${post.id}:`, err);
      });
    });

    return () => unsubscribeComments.forEach(unsubscribe => unsubscribe());
  }, [user, posts]);

  const handlePost = async () => {
    if (!user || !newPost.trim() || charCount > 280) return;

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newPost,
        createdAt: serverTimestamp(),
        likes: [],
        dislikes: [],
        tags: selectedTags
      });

      setNewPost('');
      setSelectedTags([]);
      setCharCount(0);
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Post creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        dislikes: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDislike = async (postId: string, isDisliked: boolean) => {
    if (!user) return;

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        dislikes: isDisliked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error('Dislike error:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;

    try {
      const batch = writeBatch(db);

      // Delete all comments associated with the post (nested subcollection)
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsQuery = query(commentsRef);
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the post
      const postRef = doc(db, 'posts', postId);
      batch.delete(postRef);

      // Commit the batch
      await batch.commit();

      // Update local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setComments(prevComments => {
        const newComments = { ...prevComments };
        delete newComments[postId];
        return newComments;
      });

      // Close the dialog
      setShowDeleteDialog(null);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error 
        ? error.message.includes('permission-denied')
          ? (i18n.language === 'gu' ? 'પરવાનગી નામંજૂર.' : 
             i18n.language === 'hi' ? 'अनुमति अस्वीकृत।' : 
             i18n.language === 'mr' ? 'परवानगी नाकारली.' : 
             'Permission denied.')
          : (i18n.language === 'gu' ? 'પોસ્ટ કાઢી નાખવામાં ભૂલ થઈ.' : 
             i18n.language === 'hi' ? 'पोस्ट हटाने में त्रुटि।' : 
             i18n.language === 'mr' ? 'पोस्ट हटवताना त्रुटी.' : 
             'Error deleting post.')
        : (i18n.language === 'gu' ? 'અજ્ઞાત ભૂલ.' : 
           i18n.language === 'hi' ? 'अज्ञात त्रुटि।' : 
           i18n.language === 'mr' ? 'अज्ञात त्रुटी.' : 
           'Unknown error.');
      alert(errorMessage);
    }
  };

  const handleShare = async (post: Post) => {
    const shareText = `${post.content}\n\nShared from Verifai`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared Post',
          text: shareText,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Post copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCommentChange = (postId: string, value: string) => {
    setNewComment(prev => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
        postId,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        content: newComment[postId],
        createdAt: serverTimestamp(),
      });

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      setComments(prev => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          {
            id: commentRef.id,
            postId,
            authorId: user.uid,
            authorName: user.displayName || user.email,
            content: newComment[postId],
            createdAt: new Date(),
          },
        ],
      }));
    } catch (err) {
      console.error('Comment creation error:', err);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewPost(value);
    setCharCount(value.length);
  };

  const availableTags = [
    'News', 'Politics', 'Technology', 'Health', 'Science',
    'Business', 'Entertainment', 'Sports', 'Education', 'Environment'
  ];

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950/80" />
      
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#93c5fd_1px,transparent_1px),linear-gradient(to_bottom,#93c5fd_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear_gradient(to_bottom,#334155_1px,transparent_1px)] opacity-50 transition-opacity duration-300" />
      
      <div className="fixed inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,#ffffff_0%,rgba(255,255,255,0)_100%)] dark:bg-[radial-gradient(100%_100%_at_50%_0%,rgba(30,41,59,0.5)_0%,rgba(30,41,59,0)_100%)]" />
      
      <div className="fixed inset-0" />
      
      <div className="fixed inset-0 pointer-events-none z-10">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="absolute rounded-full bg-blue-400 dark:bg-blue-500 animate-pulse"
            style={{
              left: `${sparkle.x}px`,
              top: `${sparkle.y}px`,
              width: `${sparkle.size}px`,
              height: `${sparkle.size}px`,
              opacity: sparkle.opacity,
              boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.size}px rgba(59, 130, 246, 0.5)`,
              transition: 'transform 0.2s linear'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              asChild
              className="flex items-center gap-2"
            >
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            
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
                  <Link to="/news">
                    <Newspaper className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/about">
                    <Info className="h-5 w-5" />
                  </Link>
                </Button>
                <ThemeToggle />
                <UserNav />
              </div>
              <div className="md:hidden">
                <MobileSidebar
                  showHistory={false}
                  onHistoryClick={() => {}}
                />
              </div>
            </div>
          </div>

          <motion.div 
            className="text-center mb-12 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <MessageCircle className="h-12 w-12 text-primary relative" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">
                {t('Community Feed')}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('Connect with the community and share your insights')}
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Create Post */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <textarea
                value={newPost}
                onChange={handleTextChange}
                placeholder={t('Share your thoughts...')}
                className="w-full h-32 p-4 mb-4 bg-background/80 backdrop-blur-sm rounded-lg border border-input focus:ring-0 focus:border-primary/50 transition-all duration-300 text-base shadow-sm relative placeholder:text-muted-foreground/50"
                style={{ resize: 'vertical' }}
              />

              <div className="mb-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagClick(tag)}
                      className="flex items-center gap-1"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  {charCount}/280
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handlePost}
                  disabled={!newPost.trim() || loading || charCount > 280}
                  className="relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Posting...' : t('Post')}
                </Button>
              </div>
            </motion.div>

            {/* Posts */}
            <AnimatePresence>
              {loading ? (
                <div className="text-center text-muted-foreground">{t('Loading posts...')}</div>
              ) : posts.length === 0 ? (
                <div className="text-center text-muted-foreground">{t('No posts yet. Be the first to post!')}</div>
              ) : (
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50 shadow-lg relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{post.authorName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {post.createdAt?.toDate().toLocaleString()}
                        </p>
                      </div>
                      {user?.uid === post.authorId && (
                        <Dialog open={showDeleteDialog === post.id} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowDeleteDialog(post.id)}
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {i18n.language === 'gu' ? 'પોસ્ટ કાઢી નાખવાની પુષ્ટિ કરો' :
                                 i18n.language === 'hi' ? 'पोस्ट हटाने की पुष्टि करें' :
                                 i18n.language === 'mr' ? 'पोस्ट हटवण्याची पुष्टी करा' :
                                 'Confirm Delete Post'}
                              </DialogTitle>
                            </DialogHeader>
                            <p className="py-4">
                              {i18n.language === 'gu' ? 'શું તમે ખરેખર આ પોસ્ટ કાઢી નાખવા માંગો છો?' :
                               i18n.language === 'hi' ? 'क्या आप वाकई इस पोस्ट को हटाना चाहते हैं?' :
                               i18n.language === 'mr' ? 'तुम्हाला खरंच ही पोस्ट हटवायची आहे का?' :
                               'Are you sure you want to delete this post?'}
                            </p>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(null)}
                              >
                                {i18n.language === 'gu' ? 'રદ કરો' :
                                 i18n.language === 'hi' ? 'रद्द करें' :
                                 i18n.language === 'mr' ? 'रद्द करा' :
                                 'Cancel'}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(post.id)}
                              >
                                {i18n.language === 'gu' ? 'કાઢી નાખો' :
                                 i18n.language === 'hi' ? 'हटाएं' :
                                 i18n.language === 'mr' ? 'हटवा' :
                                 'Delete'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <p className="mb-4 whitespace-pre-wrap">{post.content}</p>

                    {post.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                          >
                            <Hash className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id, post.likes?.includes(user?.uid || ''))}
                        className={cn(
                          "flex items-center gap-1",
                          post.likes?.includes(user?.uid || '') && "text-primary"
                        )}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes?.length || 0}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDislike(post.id, post.dislikes?.includes(user?.uid || ''))}
                        className={cn(
                          "flex items-center gap-1",
                          post.dislikes?.includes(user?.uid || '') && "text-destructive"
                        )}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {post.dislikes?.length || 0}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(post)}
                        className="flex items-center gap-1"
                      >
                        <Share2 className="h-4 w-4" />
                        {t('Share')}
                      </Button>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">{t('Comments')}</h4>
                      {comments[post.id]?.map(comment => (
                        <div key={comment.id} className="bg-background/50 p-2 rounded-md mb-2 text-sm">
                          <p><strong>{comment.authorName}</strong>: {comment.content}</p>
                          <p className="text-xs text-muted-foreground">{comment.createdAt?.toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment[post.id] || ''}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          placeholder={t('Add a comment...')}
                          className="flex-1 p-2 bg-background/80 border border-input rounded-lg focus:ring-0 focus:border-primary"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!newComment[post.id]?.trim()}
                        >
                          {t('Post')}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};