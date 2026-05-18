export type QuestionType = 'mcq' | 'short_answer' | 'true_false' | 'match' | 'fill_blank'

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function scoreAnswer(
  questionType: string,
  studentAnswer: string,
  correctAnswer: string,
  extra?: { matchPairs?: { left: string; right: string }[] }
): boolean {
  const sa = normalize(studentAnswer)
  const ca = normalize(correctAnswer)
  if (!sa) return false

  switch (questionType) {
    case 'true_false':
    case 'mcq':
      return sa === ca
    case 'short_answer': {
      if (sa === ca) return true
      return ca.includes(sa) || sa.includes(ca)
    }
    case 'fill_blank': {
      const studentParts = sa.split('|').map(normalize)
      const correctParts = ca.split('|').map(normalize)
      if (studentParts.length !== correctParts.length) return false
      return studentParts.every((p, i) => p === correctParts[i])
    }
    case 'match': {
      const parsePairs = (s: string) =>
        s.split(';').map(p => p.trim()).filter(Boolean).sort().join(';')
      return parsePairs(studentAnswer) === parsePairs(correctAnswer)
    }
    default:
      return sa === ca
  }
}

export function parseQuestionRow(q: any) {
  const extra = JSON.parse(q.extra_json || '{}')
  let options: string[] = []
  try {
    const parsed = JSON.parse(q.options_json || '[]')
    options = Array.isArray(parsed) ? parsed : parsed.options || []
  } catch {
    options = []
  }
  return {
    ...q,
    questionType: (q.question_type || 'mcq') as QuestionType,
    options,
    extra
  }
}
