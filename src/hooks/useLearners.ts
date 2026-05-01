import { useQuery } from '@tanstack/react-query'
import { learnersApi } from '../api/learners'

export function useLearners() {
  return useQuery({
    queryKey: ['learners'],
    queryFn: learnersApi.list,
  })
}
