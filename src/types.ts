export interface Topic {
  id: string;
  title: string;
  titleNepali?: string;
  defaultContent: string;
}

export interface Chapter {
  id: string;
  title: string;
  titleNepali?: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  title: string;
  titleNepali?: string;
  chapters: Chapter[];
  iconName: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface User {
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
}

export type ContentTool =
  | 'Slides'
  | 'MCQ'
  | 'Vocabulary'
  | 'Flashcard'
  | 'Questions'
  | 'Videos'
  | 'Key Points'
  | 'Key Terms'
  | 'Real-Life Examples'
  | 'Fun Facts'
  | 'Group Activity'
  | 'Summary'
  | 'Project Work'
  | 'Mind Map'
  | 'Points to Remember';

export interface GenerationSettings {
  quantity: number;
  questionType: 'Knowledge based' | 'Understanding' | 'Application' | 'Higher Ability';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}
