export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'LEARNER';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  primary_color: string;
  logo_url?: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  instructor_name: string;
  module_count: number;
  learner_count: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'SCORM';
  duration?: string;
  completed?: boolean;
}
