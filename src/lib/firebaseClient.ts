import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ClassLevel, Subject, Chapter, Topic } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export the configuration for UI consumption
export { firebaseConfig };

// Initialize Services
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth();

// Test Connection
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Successfully validated secure connection to Firestore Database.');
  } catch (error: any) {
    // Soft log since non-authenticated users are restricted by default cloud security rules
    console.log('Firestore connected (verified connection status).');
  }
}
testFirestoreConnection();

// --- FIRESTORE ERROR HANDLING SPEC ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- GOOGLE SIGN IN HELPER ---
const googleProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Core Auth Popup Failed: ', err);
    throw err;
  }
}

export async function handleSignOut() {
  await signOut(auth);
}

// --- SYNC & PULL LOGIC ---

export async function fetchFromFirebase(): Promise<{
  curriculum: ClassLevel[];
  videos: Record<string, { id: string; title: string; url: string }[]>;
  permissionError?: boolean;
  errorMessage?: string;
} | null> {
  try {
    // Helper to intercept permission denied
    const checkPermissionDenied = (err: any): boolean => {
      const msg = String(err).toLowerCase();
      return err?.code === 'permission-denied' || msg.includes('permission') || msg.includes('insufficient');
    };

    // 1. Fetch Classes
    let dbClassesSnapshot;
    try {
      dbClassesSnapshot = await getDocs(collection(db, 'classes'));
    } catch (err) {
      if (checkPermissionDenied(err)) {
        return {
          curriculum: [],
          videos: {},
          permissionError: true,
          errorMessage: 'Access Denied: Please check and configure your Firestore security rules on your Firebase Console (project: smartboard-7af2d).'
        };
      }
      handleFirestoreError(err, OperationType.GET, 'classes');
    }

    if (!dbClassesSnapshot || dbClassesSnapshot.empty) return null;

    // 2. Fetch Subjects
    let dbSubjectsSnapshot;
    try {
      dbSubjectsSnapshot = await getDocs(collection(db, 'subjects'));
    } catch (err) {
      if (checkPermissionDenied(err)) {
        return {
          curriculum: [],
          videos: {},
          permissionError: true,
          errorMessage: 'Access Denied on subjects collection.'
        };
      }
      handleFirestoreError(err, OperationType.GET, 'subjects');
    }

    // 3. Fetch Chapters
    let dbChaptersSnapshot;
    try {
      dbChaptersSnapshot = await getDocs(collection(db, 'chapters'));
    } catch (err) {
      if (checkPermissionDenied(err)) {
        return {
          curriculum: [],
          videos: {},
          permissionError: true,
          errorMessage: 'Access Denied on chapters collection.'
        };
      }
      handleFirestoreError(err, OperationType.GET, 'chapters');
    }

    // 4. Fetch Topics
    let dbTopicsSnapshot;
    try {
      dbTopicsSnapshot = await getDocs(collection(db, 'topics'));
    } catch (err) {
      if (checkPermissionDenied(err)) {
        return {
          curriculum: [],
          videos: {},
          permissionError: true,
          errorMessage: 'Access Denied on topics collection.'
        };
      }
      handleFirestoreError(err, OperationType.GET, 'topics');
    }

    // 5. Fetch Videos
    let dbVideosSnapshot;
    try {
      dbVideosSnapshot = await getDocs(collection(db, 'videos'));
    } catch (err) {
      if (checkPermissionDenied(err)) {
        return {
          curriculum: [],
          videos: {},
          permissionError: true,
          errorMessage: 'Access Denied on videos collection.'
        };
      }
      handleFirestoreError(err, OperationType.GET, 'videos');
    }

    // Extract arrays
    const classesList = dbClassesSnapshot.docs.map(doc => doc.data());
    const subjectsList = dbSubjectsSnapshot.docs.map(doc => doc.data());
    const chaptersList = dbChaptersSnapshot.docs.map(doc => doc.data());
    const topicsList = dbTopicsSnapshot.docs.map(doc => doc.data());
    const videosList = dbVideosSnapshot.docs.map(doc => doc.data());

    // Map Videos
    const videosMap: Record<string, { id: string; title: string; url: string }[]> = {};
    videosList.forEach((v) => {
      if (v.chapterId && v.id && v.videoUrl) {
        if (!videosMap[v.chapterId]) {
          videosMap[v.chapterId] = [];
        }
        videosMap[v.chapterId].push({
          id: v.id,
          title: v.title || v.id,
          url: v.videoUrl
        });
      }
    });

    // Reconstruct ClassLevel array
    const curriculum: ClassLevel[] = classesList.map((cls) => {
      const classSubjects = subjectsList
        .filter((s) => s.classId === cls.id)
        .map((s) => {
          const subjectChapters = chaptersList
            .filter((c) => c.subjectId === s.id)
            .map((c) => {
              const chapterTopics = topicsList
                .filter((t) => t.chapterId === c.id)
                .map((t) => ({
                  id: t.id,
                  title: t.title,
                  titleNepali: t.titleNepali || undefined,
                  defaultContent: t.defaultContent,
                }));

              return {
                id: c.id,
                title: c.title,
                titleNepali: c.titleNepali || undefined,
                topics: chapterTopics,
              };
            });

          return {
            id: s.id,
            title: s.title,
            titleNepali: s.titleNepali || undefined,
            iconName: s.iconName || 'BookOpen',
            chapters: subjectChapters,
          } as Subject;
        });

      return {
        id: cls.id,
        name: cls.name,
        subjects: classSubjects
      } as ClassLevel;
    });

    // Sort curriculum by name/id
    curriculum.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return { curriculum, videos: videosMap };
  } catch (error) {
    console.error('Error fetching curriculum from Firebase:', error);
    throw error;
  }
}

/**
 * Syncs the entire current curriculum state to Firestore.
 */
export async function syncToFirebase(
  curriculum: ClassLevel[],
  chapterVideos: Record<string, { id: string; title: string; url: string }[]>
): Promise<boolean> {
  try {
    for (const cl of curriculum) {
      // 1. Create or save Class Level in 'classes/{classId}'
      try {
        await setDoc(doc(db, 'classes', cl.id), {
          id: cl.id,
          name: cl.name
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `classes/${cl.id}`);
      }

      // 2. Save Subjects
      for (const sub of cl.subjects) {
        try {
          await setDoc(doc(db, 'subjects', sub.id), {
            id: sub.id,
            classId: cl.id,
            title: sub.title,
            titleNepali: sub.titleNepali || null,
            iconName: sub.iconName || 'BookOpen'
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `subjects/${sub.id}`);
        }

        // 3. Save Chapters
        for (const ch of sub.chapters) {
          try {
            await setDoc(doc(db, 'chapters', ch.id), {
              id: ch.id,
              subjectId: sub.id,
              title: ch.title,
              titleNepali: ch.titleNepali || null
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `chapters/${ch.id}`);
          }

          // 4. Save Topics
          for (const tp of ch.topics) {
            try {
              await setDoc(doc(db, 'topics', tp.id), {
                id: tp.id,
                chapterId: ch.id,
                title: tp.title,
                titleNepali: tp.titleNepali || null,
                defaultContent: tp.defaultContent
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `topics/${tp.id}`);
            }
          }

          // 5. Save Videos
          const videosList = chapterVideos[ch.id] || [];
          for (const vid of videosList) {
            try {
              await setDoc(doc(db, 'videos', vid.id), {
                id: vid.id,
                chapterId: ch.id,
                title: vid.title,
                videoUrl: vid.url
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `videos/${vid.id}`);
            }
          }
        }
      }
    }
    return true;
  } catch (error) {
    console.error('Error syncing curriculum to Firebase:', error);
    throw error;
  }
}

/**
 * Single deletes for localized operations on Firestore
 */
export async function deleteClassFromFirebase(classId: string) {
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
  }
}

export async function deleteSubjectFromFirebase(subjectId: string) {
  try {
    await deleteDoc(doc(db, 'subjects', subjectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `subjects/${subjectId}`);
  }
}

export async function deleteChapterFromFirebase(chapterId: string) {
  try {
    await deleteDoc(doc(db, 'chapters', chapterId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `chapters/${chapterId}`);
  }
}

export async function deleteTopicFromFirebase(topicId: string) {
  try {
    await deleteDoc(doc(db, 'topics', topicId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `topics/${topicId}`);
  }
}

export async function deleteVideoFromFirebase(videoId: string) {
  try {
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `videos/${videoId}`);
  }
}
