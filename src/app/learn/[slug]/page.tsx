import { notFound, redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getCourse, lessonRefs, nextLessonFor } from '@/lib/queries';

export default function LearnEntry({ params }: { params: { slug: string } }) {
  const course = getCourse(params.slug);
  if (!course) notFound();
  const refs = lessonRefs(course.slug);
  if (!refs.length) redirect(`/courses/${course.slug}`);
  const user = currentUser();
  const target = user ? nextLessonFor(user.id, course.slug) : refs[0].slug;
  redirect(`/learn/${course.slug}/${target}`);
}
