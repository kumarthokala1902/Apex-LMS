import React from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, MoreVertical, BookOpen, Users, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

const CourseCard = ({ course, isAdmin, onDelete }: any) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ y: -8 }}
    className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-sm group cursor-pointer relative"
  >
    <div className="aspect-video relative overflow-hidden">
      <img 
        src={course.thumbnail_url || `https://picsum.photos/seed/${course.id}/800/450`} 
        alt={course.title}
        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
        referrerPolicy="no-referrer"
      />
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this course?')) {
                onDelete(course.id);
              }
            }}
            className="p-2 bg-red-900/90 backdrop-blur-sm rounded-xl text-red-200 hover:bg-red-800 transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button className="p-2 bg-slate-900/90 backdrop-blur-sm rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      )}
    </div>
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-full uppercase tracking-wider">
          Development
        </span>
        {!course.is_published && (
          <span className="px-3 py-1 bg-amber-900/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Draft
          </span>
        )}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{course.title}</h3>
      <p className="text-slate-400 text-sm line-clamp-2 mb-6">{course.description}</p>
      
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <div className="flex items-center gap-4 text-slate-500 text-sm">
          <span className="flex items-center gap-1.5">
            <BookOpen size={16} />
            12 Lessons
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} />
            1.2k
          </span>
        </div>
        <div className="flex -space-x-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
              <img src={`https://picsum.photos/seed/user${i}/50/50`} alt="Learner" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

export const CourseList = ({ onSelectCourse, onCreateQuiz, onCreateCourse }: any) => {
  const { user } = useAuth();
  const [courses, setCourses] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const isAdmin = user?.role === 'ADMIN';

  const fetchCourses = () => {
    fetch(`/api/courses${isAdmin ? '?role=ADMIN' : ''}`)
      .then(res => res.json())
      .then(setCourses)
      .catch(err => console.error("Failed to fetch courses:", err));
  };

  React.useEffect(() => {
    fetchCourses();
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Courses</h1>
          <p className="text-slate-400 mt-1">
            {isAdmin 
              ? 'Manage and create learning content for your organization.' 
              : 'Explore and learn from our curated curriculum.'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button 
              onClick={onCreateQuiz}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-sm"
            >
              <Plus size={20} />
              Create Quiz
            </button>
            <button 
              onClick={onCreateCourse}
              className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-brand-primary/20 transition-all"
            >
              <Plus size={20} />
              Create Course
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search courses..."
            className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 font-medium hover:bg-slate-800 transition-colors shadow-sm">
          <Filter size={20} />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCourses.map(course => (
          <div key={course.id} onClick={() => onSelectCourse(course)}>
            <CourseCard course={course} isAdmin={isAdmin} onDelete={handleDelete} />
          </div>
        ))}
      </div>
    </div>
  );
};
