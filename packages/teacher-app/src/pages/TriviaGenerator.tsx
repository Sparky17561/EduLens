import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// TriviaGenerator has been merged into Quiz Studio (QuizManager)
export default function TriviaGenerator() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/quiz', { replace: true }) }, [])
  return null
}
