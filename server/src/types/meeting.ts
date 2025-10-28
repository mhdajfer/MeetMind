export interface Meeting {
  id: string;
  userId: string;
  title: string;
  startedAt: Date;
  endedAt: Date | null;
  createdAt: Date;
}
