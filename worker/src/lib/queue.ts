export const QUEUE_NAME = "research-pipeline";

export interface ResearchJobData {
  projectId: string;
  userId: string;
  topic: string;
  yearFrom: number;
  yearTo: number;
  maxPapers: number;
}
