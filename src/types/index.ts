export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type LogEntry = {
  time: string;
  level: LogLevel;
  message: string;
};

export type Level = {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  solution: string;
  hint: string;
};
