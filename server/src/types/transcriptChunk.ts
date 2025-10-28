export interface TranscriptChunk {
  id: string; // UUID
  meetingId: string; // references meetings.id
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  createdAt: Date;
}
