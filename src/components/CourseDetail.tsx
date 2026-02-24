import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  PlayCircle, 
  FileText, 
  HelpCircle, 
  CheckCircle2,
  Lock,
  Clock,
  BarChart,
  Award,
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { QuizPlayer } from './QuizPlayer';
import { useAuth } from '../AuthContext';
import { jsPDF } from 'jspdf';

export const CourseDetail = ({ course, onBack }: any) => {
  const { user, tenant, socket } = useAuth();
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [modules, setModules] = useState<any[]>([]);

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };

  React.useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        const res = await fetch(`/api/courses/${course.id}/content`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setModules(data);
          } else {
            // Fallback to hardcoded if no DB content
            setModules(getCourseContentFallback(course.title));
          }
        }
      } catch (err) {
        console.error("Failed to fetch course content:", err);
        setModules(getCourseContentFallback(course.title));
      }
    };
    fetchCourseContent();
  }, [course.id]);

  React.useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('apex_token');
        const res = await fetch(`/api/progress/${course.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompletedLessons(data);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };
    fetchProgress();
  }, [course.id]);

  const saveProgress = async (lessonId: string) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, courseId: course.id, lessonId })
      });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  React.useEffect(() => {
    if (socket && completedLessons.length > 0) {
      const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const progress = Math.round((completedLessons.length / totalLessons) * 100);
      socket.emit('progress_update', {
        userName: user?.name,
        courseTitle: course.title,
        progress,
        lastLesson: activeLesson?.title
      });
    }
  }, [completedLessons.length, socket]);

  const getCourseContentFallback = (courseTitle: string) => {
    const isJS = courseTitle.toLowerCase().includes('javascript') || courseTitle.toLowerCase().includes('react');
    const isFlask = courseTitle.toLowerCase().includes('flask');
    const isDesign = courseTitle.toLowerCase().includes('design') || courseTitle.toLowerCase().includes('ui/ux');

    const jsVideos = [
      'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder for JS Intro
      'https://www.w3schools.com/html/movie.mp4',   // Placeholder for JS Advanced
    ];

    const flaskVideos = [
      'https://www.w3schools.com/html/mov_bbb.mp4', // Placeholder for Flask Intro
      'https://www.w3schools.com/html/movie.mp4',   // Placeholder for Flask Advanced
    ];

    if (isJS) {
      return [
        {
          id: 'm1',
          title: 'JavaScript Fundamentals',
          lessons: [
            { id: 'l1', title: 'Introduction to JavaScript', type: 'VIDEO', videoUrl: jsVideos[0], duration: '8:45', completed: completedLessons.includes('l1') },
            { id: 'l2', title: 'Variables & Data Types', type: 'TEXT', content: 'JavaScript variables can be declared using var, let, or const...', duration: '12m', completed: completedLessons.includes('l2') },
            { id: 'l3', title: 'Functions & Scope', type: 'VIDEO', videoUrl: jsVideos[1], duration: '15:20', completed: completedLessons.includes('l3') },
          ]
        },
        {
          id: 'm2',
          title: 'React & Modern Frontend',
          lessons: [
            { id: 'l4', title: 'React Components', type: 'VIDEO', videoUrl: jsVideos[0], duration: '18:10', completed: completedLessons.includes('l4') },
            { id: 'l5', title: 'State & Props', type: 'TEXT', content: 'State is local to a component, while props are passed from parent to child...', duration: '15m', completed: completedLessons.includes('l5') },
            { id: 'l6', title: 'Final Assessment', type: 'QUIZ', quizId: 'quiz-1', duration: '20 questions', completed: completedLessons.includes('l6') },
          ]
        }
      ];
    }

    if (isFlask) {
      return [
        {
          id: 'm1',
          title: 'Python & Flask Basics',
          lessons: [
            { id: 'l1', title: 'Setting up Flask', type: 'VIDEO', videoUrl: flaskVideos[0], duration: '10:30', completed: completedLessons.includes('l1') },
            { id: 'l2', title: 'Routing in Flask', type: 'TEXT', content: 'Flask uses decorators to define routes for your application...', duration: '15m', completed: completedLessons.includes('l2') },
          ]
        },
        {
          id: 'm2',
          title: 'Database Integration',
          lessons: [
            { id: 'l3', title: 'SQLAlchemy & PostgreSQL', type: 'VIDEO', videoUrl: flaskVideos[1], duration: '22:15', completed: completedLessons.includes('l3') },
            { id: 'l4', title: 'Final Quiz', type: 'QUIZ', quizId: 'quiz-1', duration: '20 questions', completed: completedLessons.includes('l4') },
          ]
        }
      ];
    }

    // Default content
    return [
      {
        id: 'm1',
        title: 'Introduction',
        lessons: [
          { id: 'l1', title: 'Course Overview', type: 'VIDEO', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '5:20', completed: completedLessons.includes('l1') },
          { id: 'l2', title: 'The Basics', type: 'TEXT', content: 'Welcome to the course. Here we cover the fundamental concepts...', duration: '10m', completed: completedLessons.includes('l2') },
        ]
      },
      {
        id: 'm2',
        title: 'Advanced Topics',
        lessons: [
          { id: 'l3', title: 'Deep Dive', type: 'VIDEO', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: '15:45', completed: completedLessons.includes('l3') },
          { id: 'l4', title: 'Final Quiz', type: 'QUIZ', quizId: 'quiz-1', duration: '20 questions', completed: completedLessons.includes('l4') },
        ]
      }
    ];
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  const isCourseCompleted = totalLessons > 0 && progress === 100;

  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [800, 600]
    });

    // Background
    doc.setFillColor(245, 242, 237);
    doc.rect(0, 0, 800, 600, 'F');

    // Border
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(10);
    doc.rect(20, 20, 760, 560);

    // Content
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATE OF COMPLETION', 400, 120, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', 400, 200, { align: 'center' });

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bolditalic');
    doc.setTextColor(79, 70, 229);
    doc.text(user?.name || 'Valued Learner', 400, 260, { align: 'center' });

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed the course', 400, 320, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(course.title, 400, 370, { align: 'center' });

    doc.setFontSize(16);
    doc.text(`Issued by ${tenant?.name || 'Apex Academy'}`, 400, 450, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 400, 480, { align: 'center' });

    // QR Code Mock
    doc.setDrawColor(200, 200, 200);
    doc.rect(700, 500, 50, 50);
    doc.setFontSize(8);
    doc.text('VERIFY', 725, 560, { align: 'center' });

    doc.save(`${user?.name}_${course.title}_Certificate.pdf`);
  };

  const handleLessonClick = (lesson: any) => {
    // Find all lessons in order
    const allLessons = modules.flatMap(m => m.lessons);
    const lessonIndex = allLessons.findIndex(l => l.id === lesson.id);
    
    // A lesson is locked if it's not the first one and the previous one isn't completed
    const isLocked = lessonIndex > 0 && !completedLessons.includes(allLessons[lessonIndex - 1].id);

    if (!isLocked || completedLessons.includes(lesson.id)) {
      setActiveLesson(lesson);
    }
  };

  if (activeLesson) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveLesson(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-100 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Back to Course
          </button>
          <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl">
          {activeLesson.type === 'VIDEO' ? (
            <div className="aspect-video bg-black relative">
              {activeLesson.content && activeLesson.content.includes('youtube.com') || activeLesson.content.includes('youtu.be') ? (
                <div className="w-full h-full">
                  <iframe
                    src={getYouTubeEmbedUrl(activeLesson.content)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      // For YouTube, we can't easily detect end without API, so we mark as complete on load or after some time
                      // But user said "when user click on the vide marks as the complete with green tick"
                      // So let's just mark it as complete when they open it or we can add a button
                    }}
                  />
                  <div className="absolute bottom-4 right-4 z-20">
                    <button 
                      onClick={() => {
                        if (!completedLessons.includes(activeLesson.id)) {
                          const newCompleted = [...completedLessons, activeLesson.id];
                          setCompletedLessons(newCompleted);
                          saveProgress(activeLesson.id);
                        }
                      }}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      Mark as Watched
                    </button>
                  </div>
                </div>
              ) : (
                <video 
                  src={activeLesson.content || activeLesson.videoUrl} 
                  controls 
                  className="w-full h-full"
                  onEnded={() => {
                    if (!completedLessons.includes(activeLesson.id)) {
                      const newCompleted = [...completedLessons, activeLesson.id];
                      setCompletedLessons(newCompleted);
                      saveProgress(activeLesson.id);
                    }
                  }}
                />
              )}
            </div>
          ) : activeLesson.type === 'QUIZ' ? (
            <div className="p-8">
              <QuizPlayer 
                quizId={activeLesson.quizId} 
                userId={user?.id} 
                onComplete={(result: any) => {
                  if (result.passed) {
                    if (!completedLessons.includes(activeLesson.id)) {
                      const newCompleted = [...completedLessons, activeLesson.id];
                      setCompletedLessons(newCompleted);
                      saveProgress(activeLesson.id);
                    }
                    setActiveLesson(null);
                  }
                }} 
              />
            </div>
          ) : (
            <div className="p-12 prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold mb-6 text-white">{activeLesson.title}</h1>
              <p className="text-lg text-slate-400 leading-relaxed">{activeLesson.content}</p>
              <button 
                onClick={() => {
                  if (!completedLessons.includes(activeLesson.id)) {
                    const newCompleted = [...completedLessons, activeLesson.id];
                    setCompletedLessons(newCompleted);
                    saveProgress(activeLesson.id);
                  }
                  setActiveLesson(null);
                }}
                className="mt-8 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold"
              >
                Mark as Completed
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-100 transition-colors font-medium"
      >
        <ArrowLeft size={20} />
        Back to Courses
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm">
            <h1 className="text-3xl font-bold mb-4 text-white">{course.title}</h1>
            <p className="text-slate-400 leading-relaxed mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BarChart size={18} className="text-brand-primary" />
                Intermediate Level
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock size={18} className="text-brand-primary" />
                4.5 Hours Total
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold px-2 text-white">Course Content</h2>
            {modules.map((module, idx) => (
              <div key={module.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Module {idx + 1}</span>
                  <h3 className="font-bold text-slate-100 flex-1 ml-4">{module.title}</h3>
                </div>
                <div className="divide-y divide-slate-800">
                    {module.lessons.map((lesson) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      const allLessons = modules.flatMap(m => m.lessons);
                      const lessonIndex = allLessons.findIndex(l => l.id === lesson.id);
                      const isLocked = lessonIndex > 0 && !completedLessons.includes(allLessons[lessonIndex - 1].id);
                      
                      return (
                        <div 
                          key={lesson.id} 
                          onClick={() => (!isLocked || isCompleted) && handleLessonClick(lesson)}
                          className={`p-4 flex items-center gap-4 hover:bg-slate-800 transition-colors cursor-pointer group ${isLocked && !isCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                          {isCompleted ? <CheckCircle2 size={20} /> : (
                            lesson.type === 'VIDEO' ? <PlayCircle size={20} /> :
                            lesson.type === 'TEXT' ? <FileText size={20} /> :
                            lesson.type === 'QUIZ' ? <HelpCircle size={20} /> :
                            <HelpCircle size={20} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{lesson.title}</p>
                          <p className="text-xs text-slate-500">{lesson.duration}</p>
                        </div>
                        {isLocked && <Lock size={16} className="text-slate-600" />}
                        {!isLocked && !isCompleted && <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-primary transition-colors" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm sticky top-8">
            <div className="aspect-video rounded-2xl bg-slate-950 mb-6 flex items-center justify-center relative group cursor-pointer overflow-hidden">
              <img 
                src={course.thumbnail_url || `https://picsum.photos/seed/${course.id}/800/450`} 
                alt="Preview" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <PlayCircle size={48} className="text-white relative z-10 group-hover:scale-125 transition-transform" />
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Progress</span>
                <span className="font-bold text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-brand-primary rounded-full" 
                />
              </div>
            </div>

            {isCourseCompleted ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-900/20 border border-emerald-900/50 rounded-2xl text-center">
                  <p className="text-emerald-400 font-bold text-sm">🎉 Course Completed!</p>
                  <p className="text-emerald-500 text-xs mt-1">You've successfully finished all modules.</p>
                </div>
                <button 
                  onClick={generateCertificate}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-emerald-600/20 transition-all mb-4 flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Certificate
                </button>
              </div>
            ) : (
              <button className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all mb-4">
                Continue Learning
              </button>
            )}
            <p className="text-center text-xs text-slate-500">
              {isCourseCompleted ? 'You have mastered this course!' : 'Next: Understanding State Management'}
            </p>
          </div>

          <div className="bg-emerald-900/20 p-6 rounded-3xl border border-emerald-900/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-900/30 text-emerald-400 rounded-xl">
                <Award size={20} />
              </div>
              <h3 className="font-bold text-emerald-400">Certification</h3>
            </div>
            <p className="text-sm text-emerald-500 mb-4">
              {isCourseCompleted 
                ? 'Your certificate is ready for download. Congratulations on your achievement!' 
                : 'Complete all modules and pass the final assessment to earn your certificate.'}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isCourseCompleted ? (
                <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Unlocked</span>
              ) : (
                <span className="flex items-center gap-1"><Lock size={14} /> Locked</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
