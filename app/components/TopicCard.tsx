import { Topic } from '../types'

interface TopicCardProps {
  topic: Topic
  onClick: () => void
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-green-500'
      case 'A2': return 'bg-blue-500'
      case 'B1': return 'bg-yellow-500'
      case 'B2': return 'bg-orange-500'
      case 'C1': return 'bg-red-500'
      case 'C2': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div
      onClick={onClick}
      className="topic-card p-6 h-48 flex flex-col justify-between relative overflow-hidden"
    >
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getLevelColor(topic.level)}`}>
          {topic.level}
        </span>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2">{topic.name}</h3>
        <p className="text-blue-100 opacity-90">{topic.description}</p>
      </div>
      
      <div className="text-right">
        <span className="text-blue-200 text-sm">Click to start learning →</span>
      </div>
    </div>
  )
}
