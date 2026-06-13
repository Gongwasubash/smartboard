import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Book, Atom, Calculator, Globe, Bell, Settings,
  ChevronRight, ChevronDown, Menu, HelpCircle, Send, Sparkles,
  Check, X, FileText, Lightbulb, Video, Layers, Compass, Users,
  Award, ListTodo, Share2, LogOut, Volume2, ArrowLeft, ArrowRight,
  RefreshCw, SlidersHorizontal, Eye, EyeOff, Mail, Lock, UserCheck,
  Plus, Trash2, Edit, Database, UploadCloud, CheckCircle2, Play, Tv
} from 'lucide-react';
import { CURRICULUM_DATA } from './data';
import { ClassLevel, Subject, Chapter, Topic, ContentTool, GenerationSettings } from './types';
import {
  auth,
  db,
  signInWithGooglePopup,
  handleSignOut,
  fetchFromFirebase,
  syncToFirebase,
  firebaseConfig
} from './lib/firebaseClient';
import { onAuthStateChanged, User } from 'firebase/auth';
import TextbookViewer from './TextbookViewer';
import { TextbookSidebar, TextbookView, SubjectSelection, ChapterSelection } from './TextbookBrowser';

export default function App() {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('smatoro_logged_in') === 'true';
  });
  const [userType, setUserType] = useState<string>('Teacher');
  const [email, setEmail] = useState<string>('anil.bk@smatoro.edu.np');
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Anil Bk');

  // Dynamic Curriculum States
  const [curriculum, setCurriculum] = useState<ClassLevel[]>(() => {
    const saved = localStorage.getItem('smatoro_curriculum');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return CURRICULUM_DATA;
  });

  // Track state-backed manual videos for chapters (chapterId -> array of videos)
  const [chapterVideos, setChapterVideos] = useState<Record<string, { id: string; title: string; url: string }[]>>(() => {
    const saved = localStorage.getItem('smatoro_chapter_videos');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Firebase Configuration States & Auth User tracking
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Admin Dashboard Mode
  const [isAdminConsoleOpen, setIsAdminConsoleOpen] = useState<boolean>(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'editor' | 'firebase_settings'>('editor');

  // Textbook Browser State (lives in sidebar, content in main area)
  const [textbookExpandedClass, setTextbookExpandedClass] = useState<string | null>(null);
  const [textbookSelectedSubject, setTextbookSelectedSubject] = useState<SubjectSelection | null>(null);
  const [textbookSelectedChapter, setTextbookSelectedChapter] = useState<ChapterSelection | null>(null);

  // Reset chapter when subject changes
  const handleSelectSubject = (sub: SubjectSelection | null) => {
    setTextbookSelectedSubject(sub);
    setTextbookSelectedChapter(null);
    setSelectedTopic(null);
    setGeneratedContent(null);
    setGeneratedTool(null);
  };

  // Select chapter from textbook: create a Topic for the AI toolkit
  const handleTextbookChapterSelect = (ch: ChapterSelection | null) => {
    setTextbookSelectedChapter(ch);
    if (ch && textbookSelectedSubject) {
      const clsName = textbookSelectedSubject.className;
      const subName = textbookSelectedSubject.filename.replace(/\.(md|pdf)$/, '');
      const topic: Topic = {
        id: `textbook-${clsName}-${subName}-${ch.page}`,
        title: ch.title,
        defaultContent: `This is a Grade ${clsName} ${subName} lesson. The chapter/unit is titled "${ch.title}".${ch.sectionTitle ? ` The current section is "${ch.sectionTitle}".` : ''} Generate educational content appropriate for ${clsName} students studying ${subName}.`
      };
      setSelectedTopic(topic);
      setGeneratedContent(null);
      setGeneratedTool(null);
    } else {
      setSelectedTopic(null);
    }
  };
  
  // Selected IDs during admin editing
  const [adminSelectedClassId, setAdminSelectedClassId] = useState<string | null>(null);
  const [adminSelectedSubjectId, setAdminSelectedSubjectId] = useState<string | null>(null);
  const [adminSelectedChapterId, setAdminSelectedChapterId] = useState<string | null>(null);
  const [adminSelectedTopicId, setAdminSelectedTopicId] = useState<string | null>(null);

  // Form Fields for Database Admin Editor
  const [newClassName, setNewClassName] = useState('');
  const [newSubjectTitle, setNewSubjectTitle] = useState('');
  const [newSubjectTitleNepali, setNewSubjectTitleNepali] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('BookOpen');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterTitleNepali, setNewChapterTitleNepali] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicTitleNepali, setNewTopicTitleNepali] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Active playing video modal
  const [activePlayingVideo, setActivePlayingVideo] = useState<{ title: string; url: string } | null>(null);

  // Save changes locally whenever curriculum changes
  useEffect(() => {
    localStorage.setItem('smatoro_curriculum', JSON.stringify(curriculum));
  }, [curriculum]);

  // Save changes locally whenever chapter videos change
  useEffect(() => {
    localStorage.setItem('smatoro_chapter_videos', JSON.stringify(chapterVideos));
  }, [chapterVideos]);

  // Keep track of Firebase Auth user status & auto-retrieve latest curriculum on startup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    loadLatestFromFirebase();
    return () => unsubscribe();
  }, []);

  const loadLatestFromFirebase = async () => {
    try {
      const res = await fetchFromFirebase();
      if (res) {
        if (res.permissionError) {
          setIsFirebaseConnected(false);
          setSyncMessage({
            text: `Firebase Connected (Restricted Access): ${res.errorMessage || ''}`,
            isError: true,
          });
          return;
        }
        setCurriculum(res.curriculum);
        setChapterVideos(res.videos);
        setIsFirebaseConnected(true);
      }
    } catch (e: any) {
      // Soft-catch to avoid breaking the startup flow
    }
  };

  // UI States
  const [activeTab, setActiveTab] = useState<'content' | 'ai-helper'>('content');
  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null);
  
  // Sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);

  // Modal / Generation States
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [activeGenerationTool, setActiveGenerationTool] = useState<ContentTool | null>(null);
  const [modalSettings, setModalSettings] = useState<GenerationSettings>({
    quantity: 5,
    questionType: 'Knowledge based',
    difficulty: 'Medium'
  });

  // AI Content Result States
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedTool, setGeneratedTool] = useState<ContentTool | null>(null);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizScore, setQuizScore] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});

  // Chatbot Sidebar/Popup state
  // Textbook Viewer state
  const [isTextbookOpen, setIsTextbookOpen] = useState<boolean>(false);

  // Chatbot Sidebar/Popup state
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Namaste! I am your Smatoro AI Learning Assistant. You can ask me any questions about the curriculum or topics.' }
  ]);
  const [userInputMessage, setUserInputMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Tickets Modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketDesc, setTicketDesc] = useState<string>('');
  const [ticketStatus, setTicketStatus] = useState<string | null>(null);

  // Automatic scrolling / helper states
  const Class7Data = curriculum.find(c => c.id === 'class-7');

  // Trigger login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('smatoro_logged_in', 'true');
    setIsLoggedIn(true);
    // Dynamic naming based on email if customized
    if (email && email.includes('@')) {
      const parts = email.split('@')[0].split('.');
      const formattedName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      setUserName(formattedName || 'Educator');
    }
  };

  // Trigger logout
  const handleLogout = () => {
    localStorage.removeItem('smatoro_logged_in');
    setIsLoggedIn(false);
  };

  // Simulate loading of content on topic selection
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setLoadingProgress(2);
    setGeneratedContent(null);
    setGeneratedTool(null);
  };

  useEffect(() => {
    if (loadingProgress !== null) {
      if (loadingProgress < 100) {
        const interval = setTimeout(() => {
          setLoadingProgress(prev => {
            if (prev === null) return null;
            const step = Math.floor(Math.random() * 25) + 5;
            return Math.min(prev + step, 100);
          });
        }, 150);
        return () => clearTimeout(interval);
      } else {
        const timer = setTimeout(() => setLoadingProgress(null), 300);
        return () => clearTimeout(timer);
      }
    }
  }, [loadingProgress]);

  // Handle Generator configuration trigger
  const handleConfigureTool = (tool: ContentTool) => {
    setActiveGenerationTool(tool);
    // Pre-populate sensible quantities
    setModalSettings({
      quantity: tool === 'MCQ' || tool === 'Vocabulary' || tool === 'Flashcard' ? 5 : 4,
      questionType: 'Knowledge based',
      difficulty: 'Medium'
    });
    setIsGenerateModalOpen(true);
  };

  // Trigger AI text generation call
  const triggerGeneration = async () => {
    if (!selectedTopic || !activeGenerationTool) return;
    setIsGenerateModalOpen(false);
    setIsAiLoading(true);
    setGeneratedContent(null);
    setGeneratedTool(activeGenerationTool);
    setActiveSlideIndex(0);
    setQuizAnswers({});
    setQuizScore(0);
    setFlippedCards({});

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: selectedTopic.title,
          topicContent: selectedTopic.defaultContent,
          tool: activeGenerationTool,
          settings: modalSettings,
          className: textbookSelectedSubject?.className || '',
          subjectName: textbookSelectedSubject?.filename.replace(/\.(md|pdf)$/, '') || '',
          chapterTitle: textbookSelectedChapter?.title || '',
          sectionTitle: textbookSelectedChapter?.sectionTitle || ''
        })
      });

      if (!res.ok) {
        throw new Error('AI Server is warming up or key is missing. Reverting to smart demo generation.');
      }

      const data = await res.json();
      setGeneratedContent(data);
    } catch (e) {
      console.warn(e);
      // Fallback local smart content generator in case API key isn't provided or server errors
      generateLocalFallback(activeGenerationTool, selectedTopic);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Rich offline local content simulation for perfect UX when API Key is pending
  const generateLocalFallback = (tool: ContentTool, topic: Topic) => {
    setTimeout(() => {
      let mockData: any = null;
      if (tool === 'MCQ') {
        mockData = {
          questions: [
            {
              question: `What is the key essence of "${topic.title}"?`,
              options: [
                "It represents the biological advancement only",
                "It is a complex social evolution and structured organization",
                "It occurred suddenly in a single day",
                "None of the above"
              ],
              answerIndex: 1,
              explanation: "Human society evolved gradually through security, cooperation, and structural rules over millennia."
            },
            {
              question: "Which of the following stages comes first in human societal evolution?",
              options: [
                "Industrial Era (औद्योगिक युग)",
                "Agricultural Era (कृषि युग)",
                "Hunting & Gathering Era (शिकार र संकलन युग)",
                "Pastoral Era (पशुपालन युग)"
              ],
              answerIndex: 2,
              explanation: "In primitive ancient times, humans lived in caves, gathered forest products, and hunted wild beasts."
            },
            {
              question: "Who coordinates development projects across local municipalities inside a district of Nepal?",
              options: [
                "The Supreme Court",
                "The District Coordination Committee (जिल्ला समन्वय समिति)",
                "Global Non-Governmental Agencies",
                "Private Business Hubs"
              ],
              answerIndex: 1,
              explanation: "Under Article 220 of the Nepal Constitution, the DCC coordinates and monitors municipal development programs."
            }
          ]
        };
      } else if (tool === 'Slides') {
        mockData = {
          slides: [
            {
              title: `Introduction to ${topic.title}`,
              bullets: [
                "Overview of key parameters and structures.",
                "Why this topic holds immense importance in modern education.",
                "Understanding history vs modern computational advancements."
              ],
              visualCue: "Sketch a timeline showing primitive icons on the far left, transitioning to standard gear of the industrial age, and a mobile gadget on the right."
            },
            {
              title: "Critical Pillars",
              bullets: [
                "Cooperative learning environments & peer synergy.",
                "Active social responsibility and civic consciousness.",
                "Interactive evaluation tools to track retention statistics."
              ],
              visualCue: "Draw a simple triangle labeled with Pillars (Knowledge, Action, Ethos) at three points connected by glowing arrows."
            }
          ]
        };
      } else if (tool === 'Vocabulary') {
        mockData = {
          vocabulary: [
            {
              word: "उत्पत्ति (Origin)",
              meaning: "The point or place where something begins or is created.",
              example: "समाजको उत्पत्ति मानिसको सुरक्षा र सहकार्यको खोजीबाट भएको हो।"
            },
            {
              word: "पूर्वाधार (Infrastructure)",
              meaning: "The basic physical and organizational structures needed for the operation of a society.",
              example: "शिक्षा र स्वास्थ्य विकासका मुख्य पूर्वाधार हुन्।"
            },
            {
              word: "समन्वय (Coordination)",
              meaning: "The organization of the different elements of a complex body or activity so as to enable them to work together effectively.",
              example: "जिल्ला समन्वय समितिले गाउँपालिका र नगरपालिकाबीच समन्वय गर्छ।"
            }
          ]
        };
      } else if (tool === 'Flashcard') {
        mockData = {
          cards: [
            {
              front: "What are the primary mediums of Socialization (सामाजिकीकरण)?",
              back: "Primary: Family and parents. Secondary: Friends, school, neighborhood, media, religious institutions."
            },
            {
              front: "Why is Education (शिक्षा) called the 'infrastructure of infrastructures'?",
              back: "Because it produces skilled humans, professionals (doctors, teachers, engineers) who enable all other sectors to build and function properly."
            },
            {
              front: "Class 7 Social Topic: What is DCC's composition in Nepal?",
              back: "It consists of a Chief, a Deputy Chief, at least three women, and at least one Dalit or minority, up to 9 members."
            }
          ]
        };
      } else if (tool === 'Mind Map') {
        mockData = {
          root: {
            name: topic.title,
            children: [
              {
                name: "Core Philosophy",
                description: "Basic values and logical framework",
                children: [
                  { name: "Historical context" },
                  { name: "Evolutionary steps" }
                ]
              },
              {
                name: "Practical Implementation",
                description: "Real-world utility and smart board guides",
                children: [
                  { name: "Classroom activities" },
                  { name: "Self assessment" }
                ]
              }
            ]
          }
        };
      } else {
        mockData = {
          title: `Smart Synthesis of ${topic.title}`,
          items: [
            "Active observation of historical, structural, and political transitions in society.",
            "Recognizing how rules, values, and civic duties safeguard human rights.",
            "Interactive analysis utilizing high-quality educational boards and digital aids."
          ],
          notesForTeachers: "Encourage active inquiry-based learning. Have students draw diagrams representing these coordinates."
        };
      }
      setGeneratedContent(mockData);
    }, 1200);
  };

  // Handle MCQ Answer Submission
  const handleAnswerSelect = (qIdx: number, oIdx: number, correctIdx: number) => {
    if (quizAnswers[qIdx] !== undefined) return; // Prevent raw re-clicking
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
    if (oIdx === correctIdx) {
      setQuizScore(prev => prev + 1);
    }
  };

  // Flip state tracker for flashcards
  const toggleCardFlip = (idx: number) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Chat message submit
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInputMessage.trim()) return;

    const userMsg = userInputMessage;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setUserInputMessage('');
    setIsChatLoading(true);

    try {
      // Prompt creation with current selected topic context
      let aiPrompt = userMsg;
      if (selectedTopic) {
        aiPrompt = `The student/teacher is studying the topic "${selectedTopic.title}" (Content: ${selectedTopic.defaultContent}). Answer the following question within this context: ${userMsg}`;
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: selectedTopic ? selectedTopic.title : "General Education Help",
          topicContent: selectedTopic ? selectedTopic.defaultContent : "Ask study helper.",
          tool: "Chat Assistant",
          settings: {
            quantity: 1,
            questionType: "Understanding",
            difficulty: "Medium"
          }
        })
      });

      if (!res.ok) {
        throw new Error("Chat assistant fallback.");
      }

      const data = await res.json();
      const answer = data.notesForTeachers || data.title || "Here is information based on your question: " + JSON.stringify(data);
      setChatMessages(prev => [...prev, { sender: 'ai', text: answer }]);

    } catch (err) {
      // Local smart pedagogical assistant response
      setTimeout(() => {
        let fallbackReply = `That is a great question! Regarding "${userMsg}", human civilizations progress by designing structural rules, values, and coordination units. This builds balanced systems of learning, infrastructure, and civic responsibilities. Can I generate self-assessment MCQs or Slides for you to learn faster?`;
        if (selectedTopic && selectedTopic.id === 'origin-evolution') {
          fallbackReply = `Under the chapter 'We and Our Society' (${selectedTopic.titleNepali || ''}), "${userMsg}" speaks to how humans moved from the primitive cave-dwelling 'Hunting Stage' to the structured 'Information Stage'. Cooperation and social rules became critical.`;
        }
        setChatMessages(prev => [...prev, { sender: 'ai', text: fallbackReply }]);
      }, 1000);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Raise Ticket Handler
  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    setTicketStatus('submitting');
    setTimeout(() => {
      setTicketStatus('success');
      setTicketSubject('');
      setTicketDesc('');
      setTimeout(() => {
        setIsTicketModalOpen(false);
        setTicketStatus(null);
      }, 1500);
    }, 1200);
  };

  // Sound pronunciation helper speaker
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = word.match(/[\u0900-\u097F]/) ? 'ne-NP' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported on your browser container.");
    }
  };

  // --- SCHOOL ROLL & DATABASE CONSOLE ADMINISTRATION HANDLERS ---
  const handleAddNewClass = () => {
    if (!newClassName.trim()) return;
    const newId = `class-${Date.now()}`;
    const updated = [...curriculum, {
      id: newId,
      name: newClassName.trim(),
      subjects: []
    }];
    setCurriculum(updated);
    setNewClassName('');
    setAdminSelectedClassId(newId);
  };

  const handleDeleteClass = (classId: string) => {
    const updated = curriculum.filter(c => c.id !== classId);
    setCurriculum(updated);
    if (adminSelectedClassId === classId) {
      setAdminSelectedClassId(null);
      setAdminSelectedSubjectId(null);
      setAdminSelectedChapterId(null);
    }
  };

  const handleAddNewSubject = (classId: string) => {
    if (!newSubjectTitle.trim()) return;
    const newId = `subject-${Date.now()}`;
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: [...cl.subjects, {
            id: newId,
            title: newSubjectTitle.trim(),
            titleNepali: newSubjectTitleNepali.trim() || undefined,
            iconName: newSubjectIcon,
            chapters: []
          }]
        };
      }
      return cl;
    });
    setCurriculum(updated);
    setNewSubjectTitle('');
    setNewSubjectTitleNepali('');
    setAdminSelectedSubjectId(newId);
  };

  const handleDeleteSubject = (classId: string, subjectId: string) => {
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: cl.subjects.filter(s => s.id !== subjectId)
        };
      }
      return cl;
    });
    setCurriculum(updated);
    if (adminSelectedSubjectId === subjectId) {
      setAdminSelectedSubjectId(null);
      setAdminSelectedChapterId(null);
    }
  };

  const handleAddNewChapter = (classId: string, subjectId: string) => {
    if (!newChapterTitle.trim()) return;
    const newId = `chapter-${Date.now()}`;
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: cl.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: [...s.chapters, {
                  id: newId,
                  title: newChapterTitle.trim(),
                  titleNepali: newChapterTitleNepali.trim() || undefined,
                  topics: []
                }]
              };
            }
            return s;
          })
        };
      }
      return cl;
    });
    setCurriculum(updated);
    setNewChapterTitle('');
    setNewChapterTitleNepali('');
    setAdminSelectedChapterId(newId);
  };

  const handleDeleteChapter = (classId: string, subjectId: string, chapterId: string) => {
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: cl.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.filter(ch => ch.id !== chapterId)
              };
            }
            return s;
          })
        };
      }
      return cl;
    });
    setCurriculum(updated);
    if (adminSelectedChapterId === chapterId) {
      setAdminSelectedChapterId(null);
    }
  };

  const handleAddNewTopic = (classId: string, subjectId: string, chapterId: string) => {
    if (!newTopicTitle.trim()) return;
    const newId = `topic-${Date.now()}`;
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: cl.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    return {
                      ...ch,
                      topics: [...ch.topics, {
                        id: newId,
                        title: newTopicTitle.trim(),
                        titleNepali: newTopicTitleNepali.trim() || undefined,
                        defaultContent: newTopicContent.trim() || 'No reference materials written yet.'
                      }]
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return cl;
    });
    setCurriculum(updated);
    setNewTopicTitle('');
    setNewTopicTitleNepali('');
    setNewTopicContent('');
    setAdminSelectedTopicId(newId);
  };

  const handleDeleteTopic = (classId: string, subjectId: string, chapterId: string, topicId: string) => {
    const updated = curriculum.map(cl => {
      if (cl.id === classId) {
        return {
          ...cl,
          subjects: cl.subjects.map(s => {
            if (s.id === subjectId) {
              return {
                ...s,
                chapters: s.chapters.map(ch => {
                  if (ch.id === chapterId) {
                    return {
                      ...ch,
                      topics: ch.topics.filter(tp => tp.id !== topicId)
                    };
                  }
                  return ch;
                })
              };
            }
            return s;
          })
        };
      }
      return cl;
    });
    setCurriculum(updated);
    if (adminSelectedTopicId === topicId) {
      setAdminSelectedTopicId(null);
    }
  };

  const handleAddNewVideo = (chapterId: string) => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    const newVideo = {
      id: `video-${Date.now()}`,
      title: newVideoTitle.trim(),
      url: newVideoUrl.trim()
    };
    setChapterVideos(prev => ({
      ...prev,
      [chapterId]: [...(prev[chapterId] || []), newVideo]
    }));
    setNewVideoTitle('');
    setNewVideoUrl('');
  };

  const handleDeleteVideo = (chapterId: string, videoId: string) => {
    setChapterVideos(prev => ({
      ...prev,
      [chapterId]: (prev[chapterId] || []).filter(v => v.id !== videoId)
    }));
  };

  const handleFirebaseLogin = async () => {
    try {
      setSyncMessage(null);
      const user = await signInWithGooglePopup();
      setFirebaseUser(user);
      setSyncMessage({ text: `Successfully logged in to Firebase as ${user.displayName || user.email}!`, isError: false });
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ text: `Google Sign-In failed: ${err.message || err}`, isError: true });
    }
  };

  const handleFirebaseLogout = async () => {
    try {
      setSyncMessage(null);
      await handleSignOut();
      setFirebaseUser(null);
      setSyncMessage({ text: 'Logged out of Google Firebase successfully!', isError: false });
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ text: `Logout failed: ${err.message || err}`, isError: true });
    }
  };

  const handlePushToFirebase = async () => {
    if (!firebaseUser) {
      setSyncMessage({ text: 'You must Sign In with Google before pushing to live Cloud Firestore, for authenticated secure database matching.', isError: true });
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const success = await syncToFirebase(curriculum, chapterVideos);
      if (success) {
        setSyncMessage({ text: 'Successfully registered and synced your complete local School Roll structure and Linked Videos to live Google Cloud Firestore!', isError: false });
        await loadLatestFromFirebase();
      }
    } catch (err: any) {
      console.error(err);
      const msg = err.message || String(err);
      let extractedError = msg;
      try {
        const parsed = JSON.parse(msg);
        extractedError = parsed.error || msg;
      } catch (e) {}
      setSyncMessage({ text: `Insertion / Sync failed. Cloud Firestore security validation rejected payload. Details: ${extractedError}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetchFromFirebase();
      if (res) {
        if (res.permissionError) {
          setIsFirebaseConnected(false);
          setSyncMessage({
            text: `Pull failed: ${res.errorMessage}`,
            isError: true,
          });
          return;
        }
        setCurriculum(res.curriculum);
        setChapterVideos(res.videos);
        setSyncMessage({ text: 'Successfully pulled latest school roll structural curriculum guidelines and Linked Classroom Videos from live Cloud Firestore!', isError: false });
      } else {
        setSyncMessage({ text: 'Connected to Firestore but found no active collections. Initialize and push some content to seed your database!', isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setSyncMessage({ text: `Could not load from Firestore: ${err.message || err}`, isError: true });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          // LOGIN VIEW - High fidelity matching first screenshot
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-4 md:p-8 bg-cover bg-center"
            style={{
              backgroundImage: `radial-gradient(circle at 10% 20%, rgba(241, 245, 249, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)`
            }}
          >
            <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 grid md:grid-cols-2">
              
              {/* LEFT HALF COLOR PANEL */}
              <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-indigo-500 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                      <Layers className="h-6 w-6 text-white" />
                    </span>
                    <span className="font-display font-medium text-lg tracking-wide uppercase">AI Workspace</span>
                  </div>
                </div>

                <div className="my-auto py-8 relative z-10 text-center md:text-left">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Educator Avatar Graphic Concept */}
                    <div className="mb-6 flex justify-center md:justify-start">
                      <div className="w-36 h-36 bg-white/10 rounded-full border-4 border-white/20 p-2 overflow-hidden flex items-center justify-center backdrop-blur-md">
                        <img 
                           src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80" 
                          alt="Educator Representation" 
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-3">
                      Welcome to SmatoroAI
                    </h1>
                    <p className="text-white/80 font-light leading-relaxed max-w-sm">
                      Empowering education through innovative AI solutions. Smart classroom content, instantly prepared.
                    </p>
                  </motion.div>
                </div>

                <div className="text-xs text-white/50 relative z-10">
                  © 2026 SmatoroAI. Smart Board Portal.
                </div>
              </div>

              {/* RIGHT HALF LOGIN FORM */}
              <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                {/* Logo alignment */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="p-1 px-2.5 bg-indigo-600 rounded-lg text-white font-medium text-lg">S</div>
                    <span className="text-xl font-bold font-display text-slate-900 tracking-wide">
                      Smatoro <span className="text-indigo-600 font-light">ai</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-600 uppercase tracking-widest font-mono">Smart Learning Assistant</p>
                </div>

                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold font-display text-slate-900 mb-1">Welcome Back</h2>
                  <p className="text-sm text-slate-500">Login to your account to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* User Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-705">User Type</label>
                    <div className="relative">
                      <UserCheck className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <select
                        value={userType}
                        onChange={(e) => setUserType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 transition-all appearance-none"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Student">Student</option>
                        <option value="Admin">Administrator</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Username/Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-705">User Name</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-705">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Login Buttons */}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                  <span className="hover:text-indigo-600 cursor-pointer">Forgot Password?</span>
                  <span className="hover:text-indigo-600 cursor-pointer">Register School Hub</span>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          
          // MAIN APP SMART BOARD SYSTEM
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            
            {/* HEADER - Sleek White High-Quality Bar matching Picture 2 */}
            <header className="bg-white text-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                {/* Left hand hamburger toggle in bright indigo styling */}
                <button 
                  onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  title="Toggle resources sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                {/* Logo and Name */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-150">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-slate-900 font-display flex items-center gap-1">
                      Mysmart School
                    </h1>
                    <p className="text-[11px] text-slate-500 font-medium">AI Learning Portal</p>
                  </div>
                </div>
              </div>

              {/* Actions Right Side */}
              <div className="flex items-center gap-2">
                {/* Database Admin Button */}
                <button
                  onClick={() => setIsAdminConsoleOpen(!isAdminConsoleOpen)}
                  className={`border text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
                    isAdminConsoleOpen 
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                      : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  {isAdminConsoleOpen ? 'Student Area' : 'Database Admin'}
                </button>

                {/* "Raise Ticket" styled perfectly like screenshot but light sleeker style */}
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <HelpCircle className="h-4 w-4" />
                  Raise Ticket
                </button>

                <div className="h-8 w-[1px] bg-slate-200"></div>

                {/* Notifications & Settings icons matching screenshot */}
                <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-55 rounded-lg transition-colors relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-indigo-600 rounded-full"></span>
                </button>

                <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-55 rounded-lg transition-colors">
                  <Settings className="h-5 w-5" />
                </button>

                <div className="h-8 w-[1px] bg-slate-200"></div>

                {/* User Avatar Card matching Anil Bk in the screenshot */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-100 rounded-full overflow-hidden shadow-inner flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" 
                      alt="User Profiler" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <p className="font-bold text-slate-800">{userName}</p>
                    <p className="text-[10px] text-indigo-600 font-mono capitalize font-semibold">{userType}</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-1 px-2 border border-slate-200 rounded text-xs hover:bg-slate-100 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-3 w-3 text-slate-600" />
                  </button>
                </div>
              </div>
            </header>

            {/* THREE PANEL GRID LAYOUT */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* LEFT SIDEBAR: RESOURCES (Curriculum Class-folders) */}
              <AnimatePresence initial={false}>
                {leftSidebarOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 text-slate-800 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
                          <BookOpen className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-semibold text-xs tracking-wide text-slate-800 uppercase font-display">Classes & Subjects</span>
                      </div>
                      <button onClick={() => setLeftSidebarOpen(false)} className="hover:text-slate-800 p-1">
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </button>
                    </div>
                    <TextbookSidebar
                      expandedClass={textbookExpandedClass}
                      onToggleClass={setTextbookExpandedClass}
                      selectedSubject={textbookSelectedSubject}
                      onSelectSubject={handleSelectSubject}
                      selectedChapter={textbookSelectedChapter}
                      onSelectChapter={handleTextbookChapterSelect}
                    />
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* CENTER CONSOLE: DOCUMENT CANVAS */}
              <main className="flex-1 bg-slate-50 flex flex-col overflow-y-auto p-6 relative text-slate-900">
                
                {isAdminConsoleOpen ? (
                  <div className="w-full max-w-5xl mx-auto space-y-6">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-2.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider rounded-md border border-indigo-400/25 uppercase">Database Control Hub</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase font-mono">Live Firestore Active</span>
                          </div>
                          <h2 className="text-2xl font-black tracking-tight font-display mt-1.5 bg-gradient-to-r from-white via-indigo-100 to-slate-200 bg-clip-text text-transparent">
                            School Roll Database Admin Console
                          </h2>
                          <p className="text-xs text-slate-400 mt-1 max-w-xl">
                            Curate class subjects, structure syllabus nodes, upload curriculum content, and link digital classroom reference teaching videos.
                          </p>
                        </div>
                        {/* Tab Selectors */}
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 select-none self-start md:self-center">
                          <button
                            onClick={() => setAdminActiveTab('editor')}
                            className={`p-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              adminActiveTab === 'editor'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-705 hover:bg-slate-700'
                            }`}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Structure Editor
                          </button>
                          <button
                            onClick={() => setAdminActiveTab('firebase_settings')}
                            className={`p-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              adminActiveTab === 'firebase_settings'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:text-white hover:bg-slate-705 hover:bg-slate-700'
                            }`}
                          >
                            <Database className="h-3.5 w-3.5" />
                            Firebase Live Sync
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Active tab contents */}
                    {adminActiveTab === 'editor' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Col 1: Classes & Subjects */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="p-1 px-2 border border-indigo-100 bg-indigo-50 text-indigo-600 rounded-md font-bold text-xs">A</span>
                            <h3 className="font-bold text-slate-850 text-sm">Classes & Subjects</h3>
                          </div>

                          {/* Class Manager */}
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">School Classes</label>
                            
                            {/* Class Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                placeholder="e.g. Class 8"
                                className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                              />
                              <button
                                onClick={handleAddNewClass}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 px-3 cursor-pointer"
                              >
                                <Plus className="h-4.5 w-4.5" /> Add
                              </button>
                            </div>

                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {curriculum.map((cls) => {
                                const selected = adminSelectedClassId === cls.id;
                                return (
                                  <div
                                    key={cls.id}
                                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all border ${
                                      selected
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                        : 'bg-slate-50 border-slate-200 text-slate-705 hover:bg-slate-100 text-slate-700'
                                    }`}
                                    onClick={() => {
                                      setAdminSelectedClassId(cls.id);
                                      setAdminSelectedSubjectId(null);
                                      setAdminSelectedChapterId(null);
                                      setAdminSelectedTopicId(null);
                                    }}
                                  >
                                    <span className="truncate">{cls.name}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Do you really want to delete ${cls.name} and all its subjects?`)) {
                                          handleDeleteClass(cls.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-650 p-1"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Subject Manager */}
                          {adminSelectedClassId && (
                            <div className="space-y-2 pt-3 border-t border-slate-100">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                                Subjects of Select Class
                              </label>

                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={newSubjectTitle}
                                  onChange={(e) => setNewSubjectTitle(e.target.value)}
                                  placeholder="Subject (e.g., Computer Science)"
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newSubjectTitleNepali}
                                    onChange={(e) => setNewSubjectTitleNepali(e.target.value)}
                                    placeholder="Nepali (e.g., कम्प्युटर विज्ञान)"
                                    className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                                  />
                                  <button
                                    onClick={() => handleAddNewSubject(adminSelectedClassId)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl text-xs font-semibold px-4 shrink-0 cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {(curriculum.find(c => c.id === adminSelectedClassId)?.subjects || []).map((sub) => {
                                  const selected = adminSelectedSubjectId === sub.id;
                                  return (
                                    <div
                                      key={sub.id}
                                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all border {
                                        selected
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                          : 'bg-slate-50 border-slate-200 text-slate-705 hover:bg-slate-105 hover:bg-slate-100 text-slate-700'
                                      }`}
                                      onClick={() => {
                                        setAdminSelectedSubjectId(sub.id);
                                        setAdminSelectedChapterId(null);
                                        setAdminSelectedTopicId(null);
                                      }}
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Book className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{sub.titleNepali || sub.title}</span>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm(`Do you really want to delete subject ${sub.title}?`)) {
                                            handleDeleteSubject(adminSelectedClassId, sub.id);
                                          }
                                        }}
                                        className="text-slate-400 hover:text-rose-650 p-1"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 animated" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Col 2: Chapters & Topics */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col space-y-4 lg:col-span-2">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="p-1 px-2 border border-indigo-100 bg-indigo-50 text-indigo-600 rounded-md font-bold text-xs">B</span>
                            <h3 className="font-bold text-slate-850 text-sm">Chapter Syllabus & Curriculum Contents</h3>
                          </div>

                          {!adminSelectedSubjectId ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 min-h-[300px]">
                              <BookOpen className="h-10 w-10 text-slate-300 mb-2" />
                              <p className="text-xs font-medium">Please select a Class & Subject in Column A to load active chapters and curriculum modules.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                              {/* Chapters List and Creator */}
                              <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Subject Chapters</label>
                                
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder="Chapter Name (e.g., Chapter 1)"
                                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={newChapterTitleNepali}
                                      onChange={(e) => setNewChapterTitleNepali(e.target.value)}
                                      placeholder="Nepali translation (e.g. हाम्रो समाज)"
                                      className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
                                    />
                                    <button
                                      onClick={() => handleAddNewChapter(adminSelectedClassId!, adminSelectedSubjectId!)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl text-xs font-semibold px-4 cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                  {(() => {
                                    const cls = curriculum.find(c => c.id === adminSelectedClassId);
                                    const sub = cls?.subjects.find(s => s.id === adminSelectedSubjectId);
                                    return (sub?.chapters || []).map((ch) => {
                                      const selected = adminSelectedChapterId === ch.id;
                                      return (
                                        <div
                                          key={ch.id}
                                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                                            selected
                                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                          }`}
                                          onClick={() => {
                                            setAdminSelectedChapterId(ch.id);
                                            setAdminSelectedTopicId(null);
                                          }}
                                        >
                                          <span className="truncate">{ch.titleNepali || ch.title}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm(`Do you really want to delete ${ch.title}?`)) {
                                                handleDeleteChapter(adminSelectedClassId!, adminSelectedSubjectId!, ch.id);
                                              }
                                            }}
                                            className="text-slate-400 hover:text-rose-600 p-1"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>

                              {/* Topics List and Creator */}
                              <div className="space-y-3">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Chapter Contents & Media Guides</label>

                                {!adminSelectedChapterId ? (
                                  <div className="h-44 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-4 text-slate-400 text-xs text-slate-500 font-medium">
                                    Select a Chapter to add educational Topics or link Classroom Reference Videos.
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {/* Link Video Sub-Form */}
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1">
                                        <Video className="h-3.5 w-3.5 text-indigo-600" />
                                        <span>Link Classroom Reference Video</span>
                                      </div>
                                      <input
                                        type="text"
                                        value={newVideoTitle}
                                        onChange={(e) => setNewVideoTitle(e.target.value)}
                                        placeholder="Video Title (e.g. Graphic Explanation)"
                                        className="w-full bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600"
                                      />
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={newVideoUrl}
                                          onChange={(e) => setNewVideoUrl(e.target.value)}
                                          placeholder="https://www.youtube.com/watch?v=..."
                                          className="flex-1 bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600"
                                        />
                                        <button
                                          onClick={() => handleAddNewVideo(adminSelectedChapterId)}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer shrink-0"
                                        >
                                          Link Video
                                        </button>
                                      </div>

                                      {/* List of linked videos */}
                                      {(() => {
                                        const vids = chapterVideos[adminSelectedChapterId] || [];
                                        if (vids.length === 0) return null;
                                        return (
                                          <div className="pt-2 border-t border-slate-200 space-y-1 max-h-24 overflow-y-auto">
                                            {vids.map((v) => (
                                              <div key={v.id} className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-1.5 text-[10px]">
                                                <span className="truncate font-semibold text-slate-750 text-slate-700">{v.title}</span>
                                                <button
                                                  onClick={() => handleDeleteVideo(adminSelectedChapterId, v.id)}
                                                  className="text-rose-600 font-bold px-1"
                                                >
                                                  &times;
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>

                                    {/* Add Topic Sub-Form */}
                                    <div className="space-y-1.5">
                                      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                        Add Curriculum Topic Content
                                      </div>
                                      <input
                                        type="text"
                                        value={newTopicTitle}
                                        onChange={(e) => setNewTopicTitle(e.target.value)}
                                        placeholder="Topic Title (e.g., Nepal's Physical Geography)"
                                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
                                      />
                                      <input
                                        type="text"
                                        value={newTopicTitleNepali}
                                        onChange={(e) => setNewTopicTitleNepali(e.target.value)}
                                        placeholder="Nepali Translate Name (e.g. नेपालको भूगोल)"
                                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
                                      />
                                      <textarea
                                        rows={3}
                                        value={newTopicContent}
                                        onChange={(e) => setNewTopicContent(e.target.value)}
                                        placeholder="Enter complete educational reference text or course syllabus contents here..."
                                        className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600 resize-none"
                                      />
                                      <button
                                        onClick={() => handleAddNewTopic(adminSelectedClassId!, adminSelectedSubjectId!, adminSelectedChapterId)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2 text-xs font-semibold rounded-xl cursor-pointer"
                                      >
                                        + Add Topic Content Node
                                      </button>
                                    </div>

                                    {/* Topics List under Selected Chapter */}
                                    {(() => {
                                      const cls = curriculum.find(c => c.id === adminSelectedClassId);
                                      const sub = cls?.subjects.find(s => s.id === adminSelectedSubjectId);
                                      const ch = sub?.chapters.find(c => c.id === adminSelectedChapterId);
                                      if (!ch || (ch.topics || []).length === 0) return null;
                                      return (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-40 overflow-y-auto">
                                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Topics ({ch.topics.length})</div>
                                          {ch.topics.map((tp) => (
                                            <div key={tp.id} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg text-xs">
                                              <span className="truncate">{tp.titleNepali || tp.title}</span>
                                              <button
                                                onClick={() => handleDeleteTopic(adminSelectedClassId!, adminSelectedSubjectId!, adminSelectedChapterId, tp.id)}
                                                className="text-rose-500 hover:text-rose-700 p-1"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Cloud Backup Reminder footer */}
                          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 bg-slate-55 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-amber-50 text-amber-705 border border-amber-100 rounded-lg shrink-0">
                                <Database className="h-4 w-4" />
                              </span>
                              <div>
                                <span className="font-semibold block text-slate-800">Unsynchronized Local Cache States</span>
                                <span className="text-[10px] text-slate-500">Local modifications persist in this browser, but require a live Firebase Cloud sync.</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setAdminActiveTab('firebase_settings')}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 px-4 shadow-sm font-semibold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5 select-none"
                            >
                              <UploadCloud className="h-4 w-4 pointer-events-none" />
                              Go Sync Live Firebase Cloud
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-indigo-100/50 bg-gradient-to-br from-indigo-50/60 to-white">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                              <Database className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">Google Firebase Cloud Firestore Integration</h3>
                              <p className="text-xs text-slate-500 mt-0.5">Persist structured school syllabus networks on a secure, cloud-hosted enterprise database.</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-6 text-slate-850">
                          {/* Sync message if present */}
                          {syncMessage && (
                            <div className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                              syncMessage.isError 
                                ? 'bg-rose-50 border-rose-100 text-rose-800' 
                                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            }`}>
                              {syncMessage.isError ? <X className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                              <span>{syncMessage.text}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Firebase status card */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest pl-0.5">Integration Environment</span>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center border-b border-slate-200 py-1">
                                  <span className="text-slate-500">Provider:</span>
                                  <span className="text-slate-800 font-bold">Google Firebase</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 py-1">
                                  <span className="text-slate-500">Project ID:</span>
                                  <span className="text-slate-800 font-mono font-semibold">{firebaseConfig?.projectId || 'Not Configured'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200 py-1">
                                  <span className="text-slate-500">Firestore DB Engine:</span>
                                  <span className="text-slate-800 font-mono text-[10px] truncate max-w-[150px] font-semibold" title={firebaseConfig?.firestoreDatabaseId || '(default)'}>
                                    {firebaseConfig?.firestoreDatabaseId || '(default)'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                  <span className="text-slate-500">Authentication Router:</span>
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Google Login Popups
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Google Auth Status Card */}
                            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Google Administrator Auth</span>
                                
                                {firebaseUser ? (
                                  <div className="flex items-center gap-3 mt-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                      {firebaseUser.displayName?.charAt(0) || firebaseUser.email?.charAt(0) || 'A'}
                                    </div>
                                    <div className="text-xs">
                                      <p className="font-bold text-slate-800">{firebaseUser.displayName || 'Authorized Administrator'}</p>
                                      <p className="text-slate-550 focus:text-slate-705 text-slate-500">{firebaseUser.email}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl">
                                    <p className="text-xs text-slate-500 leading-normal">
                                      Login with Google to securely push, serialize, and validate structures against live Cloud Security Rules.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {firebaseUser ? (
                                <button
                                  onClick={handleFirebaseLogout}
                                  className="w-full text-xs font-semibold py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-rose-600 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <LogOut className="h-4 w-4" />
                                  <span>Sign Out Google Session</span>
                                </button>
                              ) : (
                                <button
                                  onClick={handleFirebaseLogin}
                                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center justify-center gap-2 border border-indigo-500 cursor-pointer"
                                >
                                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                                    <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.74-.08-1.302-.178-1.86H12.24z"/>
                                  </svg>
                                  <span>Sign in with Google</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Cloud Actions Dashboard */}
                          <div className="space-y-3 pt-4 border-t border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Database Actions Grid</span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Sync local to Firestore */}
                              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between space-y-3 hover:shadow-xs transition-shadow">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <UploadCloud className="text-indigo-600 h-4 w-4" />
                                    Push Local Nodes to Cloud
                                  </h4>
                                  <p className="text-[11px] text-slate-400 leading-normal">
                                    Serializes and uploads your entire in-memory curriculum dataset AND Custom Linked YouTube Video guides straight onto Google Firestore.
                                  </p>
                                </div>
                                <button
                                  onClick={handlePushToFirebase}
                                  disabled={isSyncing || !firebaseUser}
                                  className="w-full text-xs font-semibold py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  {isSyncing ? 'Synchronizing Web Nodes...' : 'Atomic Sync Local to Firestore'}
                                </button>
                              </div>

                              {/* Fetch Cloud to Local */}
                              <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col justify-between space-y-3 hover:shadow-xs transition-shadow">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <RefreshCw className="text-indigo-600 h-4 w-4 rotate-180" />
                                    Load / Pull Latest from Cloud
                                  </h4>
                                  <p className="text-[11px] text-slate-400 leading-normal">
                                    Wipes local client storage caches and pulls the latest verified hierarchy, topics content, and video links cached in your Cloud Firestore.
                                  </p>
                                </div>
                                <button
                                  onClick={handlePullFromFirebase}
                                  disabled={isSyncing}
                                  className="w-full text-xs font-semibold py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 transition-colors cursor-pointer"
                                >
                                  {isSyncing ? 'Pulling guidelines...' : 'Pull and Load Cloud Firestore'}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Firebase Security Rules Quick Setup Guide */}
                          <div className="pt-5 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Database Security & Permissions</span>
                              <a 
                                href={`https://console.firebase.google.com/project/${firebaseConfig?.projectId || 'smartboard-7af2d'}/firestore/rules`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                Firebase Rules Console ↗
                              </a>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-4 text-slate-200 border border-slate-800 space-y-3">
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <span>Configure firestore.rules to authorize public-reads & admin writes</span>
                                </h4>
                                <p className="text-[11px] text-slate-400 leading-normal">
                                  Your custom Firebase project prevents public read queries by default. To unlock, copy this configuration and paste it into the Rules editor tab in your Firestore Console:
                                </p>
                              </div>
                              <div className="relative">
                                <textarea
                                  readOnly
                                  value={`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /classes/{classId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /subjects/{subjectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /chapters/{chapterId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /topics/{topicId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}
                                  className="w-full text-[10px] font-mono p-3 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 h-28 focus:outline-none focus:ring-1 focus:ring-indigo-500 overflow-y-auto cursor-text selection:bg-indigo-900 selection:text-white"
                                />
                                <button
                                  onClick={(e) => {
                                    navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /classes/{classId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /subjects/{subjectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /chapters/{chapterId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /topics/{topicId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /videos/{videoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`);
                                    const btn = e.currentTarget;
                                    const origText = btn.innerText;
                                    btn.innerText = 'Copied!';
                                    btn.style.color = '#34d399';
                                    setTimeout(() => {
                                      btn.innerText = origText;
                                      btn.style.color = '';
                                    }, 2000);
                                  }}
                                  className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold transition-all border border-slate-700 cursor-pointer"
                                >
                                  Copy rules
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : textbookSelectedSubject ? (
                  
                  
                  <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold font-display text-slate-900">Nepal Government Textbooks</h2>
                        <p className="text-xs text-slate-500">Curriculum Development Centre</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <TextbookView selectedSubject={textbookSelectedSubject} selectedChapter={textbookSelectedChapter} />
                    </div>
                  </div>
                  ) : null}
                  
                  {/* GENERATED CONTENT DISPLAY */}
                  {generatedContent && generatedTool && (
                    <div className="w-full max-w-5xl mx-auto mt-6">
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-indigo-600" />
                            <h3 className="font-bold text-sm text-slate-900">Generated {generatedTool}</h3>
                          </div>
                          <button
                            onClick={() => { setGeneratedContent(null); setGeneratedTool(null); }}
                            className="text-xs text-slate-500 hover:text-red-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="p-6 max-h-[600px] overflow-y-auto">
                          {isAiLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                              <span className="ml-3 text-sm text-slate-500">Generating {generatedTool}...</span>
                            </div>
                          ) : generatedTool === 'Slides' && generatedContent.slides ? (
                            <div className="space-y-4">
                              {generatedContent.slides.map((slide: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-xl border transition-all ${idx === activeSlideIndex ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-slate-200 bg-white'}`}
                                  onClick={() => setActiveSlideIndex(idx)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-sm text-slate-900">Slide {idx + 1}: {slide.title}</h4>
                                    {idx === activeSlideIndex && <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100 px-2 py-0.5 rounded-full">Active</span>}
                                  </div>
                                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700">
                                    {slide.bullets?.map((b: string, bi: number) => <li key={bi}>{b}</li>)}
                                  </ul>
                                  {slide.visualCue && (
                                    <p className="mt-2 text-[11px] text-indigo-600 italic bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                      <span className="font-semibold">Visual Cue:</span> {slide.visualCue}
                                    </p>
                                  )}
                                </div>
                              ))}
                              {generatedContent.slides.length > 1 && (
                                <div className="flex items-center justify-between pt-2">
                                  <button
                                    onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
                                    disabled={activeSlideIndex === 0}
                                    className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                                  >
                                    Previous
                                  </button>
                                  <span className="text-xs text-slate-500">{activeSlideIndex + 1} / {generatedContent.slides.length}</span>
                                  <button
                                    onClick={() => setActiveSlideIndex(Math.min(generatedContent.slides.length - 1, activeSlideIndex + 1))}
                                    disabled={activeSlideIndex === generatedContent.slides.length - 1}
                                    className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-30"
                                  >
                                    Next
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : generatedTool === 'MCQ' && generatedContent.questions ? (
                            <div className="space-y-6">
                              <div className="text-xs text-slate-500 flex items-center gap-2">
                                <span className="font-semibold text-slate-700">Score: {quizScore} / {generatedContent.questions.length}</span>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => { setQuizAnswers({}); setQuizScore(0); }}
                                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                  Reset
                                </button>
                              </div>
                              {generatedContent.questions.map((q: any, qi: number) => (
                                <div key={qi} className="border border-slate-200 rounded-xl p-4">
                                  <p className="text-sm font-semibold text-slate-900 mb-3">
                                    <span className="text-indigo-600 mr-2">Q{qi + 1}.</span>{q.question}
                                  </p>
                                  <div className="space-y-2">
                                    {q.options.map((opt: string, oi: number) => {
                                      const answered = quizAnswers[qi] !== undefined;
                                      const isCorrect = oi === q.answerIndex;
                                      const isSelected = quizAnswers[qi] === oi;
                                      let btnClass = 'w-full text-left p-3 rounded-xl text-xs border transition-all ';
                                      if (!answered) {
                                        btnClass += 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-slate-700';
                                      } else if (isCorrect) {
                                        btnClass += 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold';
                                      } else if (isSelected && !isCorrect) {
                                        btnClass += 'border-red-400 bg-red-50 text-red-800';
                                      } else {
                                        btnClass += 'border-slate-200 bg-slate-50 text-slate-500';
                                      }
                                      return (
                                        <button
                                          key={oi}
                                          disabled={answered}
                                          onClick={() => handleAnswerSelect(qi, oi, q.answerIndex)}
                                          className={btnClass}
                                        >
                                          <span className="font-mono mr-2 text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                                          {opt}
                                          {answered && isCorrect && <Check className="h-3.5 w-3.5 inline ml-2 text-emerald-600" />}
                                          {answered && isSelected && !isCorrect && <X className="h-3.5 w-3.5 inline ml-2 text-red-600" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {quizAnswers[qi] !== undefined && (
                                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                      <p className="text-[11px] text-indigo-700 font-semibold mb-1">Explanation:</p>
                                      <p className="text-[11px] text-indigo-600 leading-relaxed">{q.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : generatedTool === 'Vocabulary' && generatedContent.vocabulary ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {generatedContent.vocabulary.map((v: any, vi: number) => (
                                <div key={vi} className="border border-slate-200 rounded-xl p-4 bg-white hover:border-indigo-200 transition-colors">
                                  <h4 className="font-bold text-sm text-indigo-700 mb-1">{v.word}</h4>
                                  <p className="text-xs text-slate-600 mb-2">{v.meaning}</p>
                                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    "{v.example}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : generatedTool === 'Flashcard' && generatedContent.cards ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {generatedContent.cards.map((card: any, ci: number) => {
                                const isFlipped = flippedCards[ci] || false;
                                return (
                                  <div
                                    key={ci}
                                    onClick={() => toggleCardFlip(ci)}
                                    className="cursor-pointer perspective-1000"
                                    style={{ perspective: '1000px' }}
                                  >
                                    <div
                                      className={`relative min-h-[160px] transition-all duration-500 rounded-xl border ${
                                        isFlipped ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'
                                      }`}
                                    >
                                      <div className="p-4">
                                        {isFlipped ? (
                                          <div>
                                            <div className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider mb-2">Answer</div>
                                            <p className="text-xs text-slate-700 leading-relaxed">{card.back}</p>
                                          </div>
                                        ) : (
                                          <div>
                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Question</div>
                                            <p className="text-sm font-semibold text-slate-900">{card.front}</p>
                                          </div>
                                        )}
                                      </div>
                                      <div className="absolute bottom-2 right-2 text-[10px] text-slate-400">
                                        {isFlipped ? 'Click to flip back' : 'Click to reveal'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : generatedTool === 'Videos' && generatedContent.scenes ? (
                            <div>
                              <div className="mb-6">
                                <h4 className="text-lg font-bold text-slate-900 mb-2">{generatedContent.title}</h4>
                                {generatedContent.learningObjectives && (
                                  <div className="mb-4">
                                    <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Learning Objectives</p>
                                    <ul className="space-y-1">
                                      {generatedContent.learningObjectives.map((obj: string, oi: number) => (
                                        <li key={oi} className="flex items-start gap-2 text-xs text-slate-700">
                                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                                          {obj}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-4 mb-6">
                                {generatedContent.scenes.map((scene: any, si: number) => (
                                  <div key={si} className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-indigo-50 px-4 py-2.5 border-b border-indigo-100 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                          Scene {scene.sceneNumber || si + 1}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-700">{scene.sectionTitle || generatedContent.title}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {scene.duration && (
                                          <span className="text-[10px] text-indigo-600 font-mono bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                                            {scene.duration}
                                          </span>
                                        )}
                                        {scene.pageRef && (
                                          <span className="text-[10px] text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            {scene.pageRef}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                      {scene.visualDescription && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Visual</p>
                                          <p className="text-xs text-slate-700">{scene.visualDescription}</p>
                                        </div>
                                      )}
                                      {scene.narration && (
                                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                                          <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">Narration</p>
                                          <p className="text-xs text-slate-700 leading-relaxed">{scene.narration}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-slate-200 pt-4 space-y-4">
                                {generatedContent.totalDuration && (
                                  <p className="text-xs text-slate-500">
                                    <span className="font-semibold text-slate-700">Total Duration:</span> {generatedContent.totalDuration}
                                  </p>
                                )}
                                {generatedContent.materialsNeeded && generatedContent.materialsNeeded.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Materials Needed</p>
                                    <div className="flex flex-wrap gap-2">
                                      {generatedContent.materialsNeeded.map((m: string, mi: number) => (
                                        <span key={mi} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200">
                                          {m}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {generatedContent.assessmentQuestions && generatedContent.assessmentQuestions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-600 mb-2">Check-for-Understanding Questions</p>
                                    <ul className="space-y-2">
                                      {generatedContent.assessmentQuestions.map((q: string, qi: number) => (
                                        <li key={qi} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                          <span className="font-bold text-amber-700 shrink-0">Q{qi + 1}.</span>
                                          {q}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : generatedTool === 'Mind Map' && generatedContent.root ? (
                            <div className="p-4">
                              <div className="text-center mb-6">
                                <h4 className="text-lg font-bold text-indigo-700">{generatedContent.root.name}</h4>
                              </div>
                              <div className="grid gap-4 sm:grid-cols-2">
                                {generatedContent.root.children?.map((child: any, ci: number) => (
                                  <div key={ci} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                    <h5 className="font-bold text-sm text-slate-900 mb-1">{child.name}</h5>
                                    {child.description && <p className="text-xs text-slate-500 mb-2">{child.description}</p>}
                                    {child.children && (
                                      <ul className="list-disc list-inside space-y-1">
                                        {child.children.map((leaf: any, li: number) => (
                                          <li key={li} className="text-xs text-slate-700">{leaf.name}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {generatedContent.title && (
                                <h4 className="text-base font-bold text-slate-900 mb-4">{generatedContent.title}</h4>
                              )}
                              {generatedContent.items && (
                                <ul className="space-y-3 mb-4">
                                  {generatedContent.items.map((item: string, ii: number) => (
                                    <li key={ii} className="flex items-start gap-3 text-xs text-slate-700">
                                      <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-400 shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {generatedContent.notesForTeachers && (
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                  <p className="text-[11px] font-semibold text-amber-800 mb-1">Notes for Teachers:</p>
                                  <p className="text-xs text-amber-700">{generatedContent.notesForTeachers}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!textbookSelectedSubject && !generatedContent && (
                   
                   // WELCOME DESK
                   <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="max-w-md bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-center"
                    >
                      <div className="w-20 h-20 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center mb-6">
                        <BookOpen className="h-10 w-10 text-indigo-600" />
                      </div>
                      
                      <h3 className="text-xl font-bold font-display text-slate-900 mb-2">Nepal Government Textbooks</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        Browse Classes 1 to 10 textbooks from the sidebar. Expand a class and select a subject to start reading.
                      </p>
                    </motion.div>
                  </div>
                )}
                
              </main>

              {/* RIGHT SIDEBAR: CONTENTS INTERACTIVE AI OPTIONS (Slides, MCQ, etc.) - matching picture 2 */}
              <AnimatePresence initial={false}>
                {rightSidebarOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-slate-200 bg-slate-50 overflow-y-auto flex flex-col shrink-0 text-slate-800"
                  >
                    {/* Panel Title */}
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between text-slate-650 bg-white">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span className="font-semibold text-sm tracking-wide text-slate-800 uppercase font-display">Contents</span>
                      </div>
                      <button onClick={() => setRightSidebarOpen(false)} className="hover:text-slate-800 p-1">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* AI interactive contents tools list */}
                    <div className="p-3 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 font-sans">AI GENERATION TOOLKIT</div>
                      
                      {([
                        'Slides', 'MCQ', 'Vocabulary', 'Flashcard', 'Questions', 'Videos',
                        'Key Points', 'Key Terms', 'Real-Life Examples', 'Fun Facts',
                        'Group Activity', 'Summary', 'Project Work', 'Mind Map', 'Points to Remember'
                      ] as ContentTool[]).map((tool) => {
                        const isChosen = generatedTool === tool;
                        return (
                          <button
                            key={tool}
                            disabled={!selectedTopic}
                            onClick={() => handleConfigureTool(tool)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                              !selectedTopic 
                                ? 'opacity-40 cursor-not-allowed text-slate-400' 
                                : isChosen
                                  ? 'bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-750'
                                  : 'text-slate-600 hover:bg-white hover:text-indigo-600 font-medium'
                            }`}
                          >
                            <span className="truncate">{tool}</span>
                            <ChevronRight className={`h-3 w-3 ${isChosen ? 'text-white' : 'text-slate-450'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

            </div>

            {/* CHATBOT ROBOT BUTTON - Matching bottom-right floating badge */}
            <div className="fixed bottom-6 right-6 z-40">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all outline-none border-4 border-slate-50"
                title="Ask Smatoro AI Classroom helper"
              >
                <Sparkles className="h-6 w-6" />
              </button>
            </div>

            {/* CHATBOT POPUP DRAWER */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white border border-slate-205 rounded-2xl flex flex-col shadow-2xl z-50 overflow-hidden"
                >
                  {/* Chat header */}
                  <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 bg-white text-indigo-600 rounded font-bold text-sm">S</div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider font-display">Chat Assistant</h4>
                        <p className="text-[10px] text-indigo-150">Interactive study query helper</p>
                      </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-indigo-100">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Chat message logs */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-indigo-600 text-white self-end rounded-br-none'
                            : 'bg-slate-100 text-slate-800 self-start rounded-bl-none border border-slate-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="bg-slate-50 text-slate-500 self-start border border-slate-150 rounded-xl rounded-bl-none p-3 text-xs flex items-center gap-2 shadow-inner">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        <span>Smatoro is preparing reply...</span>
                      </div>
                    )}
                  </div>

                  {/* Chat form field */}
                  <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50">
                    <input
                      type="text"
                      value={userInputMessage}
                      onChange={(e) => setUserInputMessage(e.target.value)}
                      placeholder="Ask query or write extra prompt..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-450 focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={isChatLoading}
                      className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GENERATE CONTENT DIALOG / CONFIGURATION MODAL (Matches screenshots 6, 7, 8) */}
            <AnimatePresence>
              {isGenerateModalOpen && activeGenerationTool && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-6 text-slate-850"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold font-display text-slate-900">Generate Content</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure settings for <span className="text-indigo-600 font-bold">{activeGenerationTool}</span>
                        </p>
                      </div>
                      <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Form Controls */}
                    <div className="py-6 space-y-6">
                      
                      {/* Quantity Slider matching style in screenshots 6, 8 */}
                      {['MCQ', 'Vocabulary', 'Flashcard'].includes(activeGenerationTool) && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-700">
                            <span className="font-semibold block font-sans">Quantity</span>
                            <span className="bg-indigo-50 text-indigo-700 font-bold h-6 w-6 rounded-full flex items-center justify-center text-xs border border-indigo-150">
                              {modalSettings.quantity}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-400 font-mono">1</span>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={modalSettings.quantity}
                              onChange={(e) => setModalSettings(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                              className="flex-1 accent-indigo-650 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                            />
                            <span className="text-xs text-slate-400 font-mono">20</span>
                          </div>
                        </div>
                      )}

                      {/* Question Type Filter buttons matching style in screenshot 6 */}
                      {activeGenerationTool === 'MCQ' && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-slate-755 block font-sans">Question Type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Knowledge based', 'Understanding', 'Application', 'Higher Ability'] as const).map((tp) => {
                              const active = modalSettings.questionType === tp;
                              return (
                                <button
                                  key={tp}
                                  onClick={() => setModalSettings(prev => ({ ...prev, questionType: tp }))}
                                  className={`p-3 rounded-xl text-xs font-medium text-center transition-all ${
                                    active 
                                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' 
                                      : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {tp}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Difficulty Level selector buttons matching screenshot 6, 7, 8 */}
                      <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-755 block font-sans">Difficulty Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['Easy', 'Medium', 'Hard'] as const).map((dl) => {
                            const active = modalSettings.difficulty === dl;
                            return (
                              <button
                                key={dl}
                                onClick={() => setModalSettings(prev => ({ ...prev, difficulty: dl }))}
                                className={`p-3 rounded-xl text-xs font-medium text-center border transition-all ${
                                  active 
                                    ? 'border-indigo-600 text-indigo-750 bg-indigo-50 font-semibold shadow-sm' 
                                    : 'border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100'
                                }`}
                              >
                                {dl}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Actions Form Footer */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setIsGenerateModalOpen(false)}
                        className="p-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={triggerGeneration}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl text-xs shadow-sm transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Generate</span>
                      </button>
                    </div>

                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* TICKETS HELP DIALOG */}
            <AnimatePresence>
              {isTicketModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 shadow-xl text-left text-slate-800"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-display">
                        <HelpCircle className="text-indigo-600 h-5 w-5" />
                        Raise Classroom Support Ticket
                      </h3>
                      <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {ticketStatus === 'success' ? (
                      <div className="py-6 text-center space-y-3">
                        <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-250">
                          <Check className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h4 className="font-semibold text-slate-900">Ticket Submitted Successfully!</h4>
                        <p className="text-xs text-slate-500 font-medium">Your school technical helpdesk has been notified. Support ID: #SM-${Math.floor(1000 + Math.random() * 9000)}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleRaiseTicket} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Issue Subject</label>
                          <input
                            type="text"
                            required
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            placeholder="e.g., Cannot load Class 7 Nepali booklet"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700">Detailed Description</label>
                          <textarea
                            rows={3}
                            value={ticketDesc}
                            onChange={(e) => setTicketDesc(e.target.value)}
                            placeholder="Provide any additional logs or constraints..."
                            className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-650 resize-none border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={ticketStatus === 'submitting'}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs hover:scale-[1.01] transition-transform flex items-center justify-center gap-1 shadow-sm"
                        >
                          {ticketStatus === 'submitting' ? 'Submitting...' : 'Submit Support Request'}
                        </button>
                      </form>
                    )}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Textbook Viewer Modal */}
            {(() => {
              // Find current subject: first from expanded selection, then by searching curriculum
              let clsId = expandedClassId || '';
              let subTitle = '';
              let subTitleNep = '';
              if (selectedTopic) {
                for (const c of curriculum) {
                  for (const s of c.subjects) {
                    for (const ch of s.chapters) {
                      if (ch.topics.some(t => t.id === selectedTopic.id)) {
                        clsId = c.id;
                        subTitle = s.title;
                        subTitleNep = s.titleNepali || '';
                      }
                    }
                  }
                }
              }
              return (
                <TextbookViewer
                  classId={clsId}
                  subjectTitle={subTitle}
                  subjectTitleNepali={subTitleNep}
                  isOpen={isTextbookOpen}
                  onClose={() => setIsTextbookOpen(false)}
                />
              );
            })()}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
