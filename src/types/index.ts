export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export type LogEntry = {
  time: string;
  level: LogLevel;
  message: string;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export type VulnerabilityType =
  | 'xss'
  | 'sqli'
  | 'command-injection'
  | 'dom-xss'
  | 'csrf'
  | string;

export type Level = {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  solution: string;
  hint: string;
  /** 漏洞类型，用于沙箱选择攻击向量和 UI 标签 */
  vulnerabilityType: VulnerabilityType;
  /** 难度等级 */
  difficulty: Difficulty;
};
