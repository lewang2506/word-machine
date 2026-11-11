/**
 * 单词机 1 期 demo —— 数据模型与演示种子数据
 * 词条字段对齐厂商后台「单词列表」：单词/英式音标/中文释义/词性/CEFR/科目/话题/雅思档位
 * + 音频/视频/例句/例句翻译；词库仅系统维护，无自定义词库
 */

export type Subject = '雅思' | '托福' | 'SAT' | '留学预备';
export type Category = '听力' | '阅读' | '口语' | '写作' | '词汇' | '语法' | '读写' | '数学';

/** 科目分类 → 可选科目（词条「科目」必填下拉选项，按词库科目分类联动） */
export const SUBJECT_CATEGORY_MAP: Record<Subject, Category[]> = {
  留学预备: ['听力', '口语', '词汇', '语法', '阅读', '写作'],
  雅思: ['听力', '阅读', '写作', '口语'],
  托福: ['阅读', '听力', '写作', '口语'],
  SAT: ['读写', '数学'],
};
export const SUBJECT_OPTIONS = Object.keys(SUBJECT_CATEGORY_MAP) as Subject[];

/** 自定义词库共享范围：不共享 / 全机构 / 全分校 */
export type ShareScope = 'none' | 'org' | 'branch';

export interface WordEntry {
  id: string;
  word: string; // 必填
  meaning: string; // 中文释义
  phonetic: string; // 英式音标
  audioUrl?: string; // 英式发音音频
  videoUrl?: string; // 视频
  pos?: string; // 词性
  example?: string; // 例句
  exampleCn?: string; // 例句翻译
  cefr?: string; // CEFR 等级 A1/A2/B1/B2/C1/C2
  category?: Category; // 科目（听力/阅读/口语/写作）
  topic?: string; // 话题
  band?: number; // 雅思档位 5.0–8.0
}

export interface WordLibrary {
  id: string;
  name: string;
  subject: Subject;
  categories: Category[];
  wordCount: number; // 对外展示词数（系统库=全量计数，自定义库=实收词条数）
  isCustom?: boolean; // 自定义词库（老师自建单词表）
  owner?: string; // 创建人（自定义词库）
  school?: string; // 所属分校（自定义词库）
  shareScope?: ShareScope; // 共享范围（自定义词库，默认 none=不共享）
  createdAt: string; // 创建时间 YYYY-MM-DD HH:mm
  lastImportAt?: string;
  entries: WordEntry[]; // demo 只收录摘录词条；自定义库为全量
}

export interface Student {
  id: string;
  name: string;
  code: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  students: Student[];
}

export type HomeworkStatus = 'ongoing' | 'done' | 'draft';
export type StudentState = 'not-started' | 'ongoing' | 'done';

export interface HomeworkStudent {
  studentId: string;
  name: string;
  code: string;
  state: StudentState;
  batchDone: number;
  batchTotal: number;
  wordsLearned: number;
  accuracy: number; // 0–100
  lastStudyAt?: string;
}

export interface Homework {
  id: string;
  title: string;
  status: HomeworkStatus;
  className: string;
  assignee: string;
  libraryNames: string[];
  totalWords: number;
  days: number;
  startDate: string; // YYYY-MM-DD
  createdAt: string;
  students: HomeworkStudent[];
}

/* ========== AI 模拟器 ========== */

/** 当前登录教师（demo 固定） */
export const CURRENT_TEACHER = '王乐';

let idSeq = 0;
export const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`;

/* ========== 演示种子数据 ========== */

/** [单词, 中文释义, 词性, CEFR, 话题, 雅思档位] */
type EntryTuple = [string, string, string, string, string, number];

/** 话题 → 科目（厂商后台「单词列表」科目列，demo 按话题粗归） */
const TOPIC_CATEGORY: Record<string, Category> = {
  日常生活: '听力',
  城市生活: '听力',
  家居: '听力',
  校园生活: '听力',
  社交: '口语',
  旅行: '口语',
  描述: '口语',
  运动: '口语',
  媒体: '阅读',
  自然环境: '阅读',
  文化: '阅读',
  教育: '阅读',
  科学: '阅读',
  科技: '阅读',
  工作: '写作',
  财务: '写作',
  学术: '写作',
};

/** 英式发音音频 URL（演示用词典公共发音接口，type=1 英式）；存量词条=已生成完成可直接播放 */
export const wordAudioUrl = (word: string) =>
  `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`;

function makeEntry([word, meaning, pos, cefr, topic, band]: EntryTuple): WordEntry {
  return {
    id: `seed-${word}`,
    word,
    meaning,
    phonetic: `/${word.toLowerCase().replace(/[^a-z]/g, '')}/`,
    audioUrl: wordAudioUrl(word),
    pos,
    cefr,
    category: TOPIC_CATEGORY[topic] ?? '听力',
    topic,
    band,
    example: `The word "${word}" often appears in IELTS ${topic} contexts.`,
    exampleCn: `「${word}」常出现在雅思${topic}语境中。`,
  };
}

const IELTS_TUPLES: EntryTuple[] = [
  ['game', '游戏；比赛', 'n.', 'A1', '日常生活', 5],
  ['bill', '账单；钞票', 'n.', 'A2', '日常生活', 5],
  ['sleep', '睡眠', 'v./n.', 'A1', '日常生活', 5],
  ['centre', '中心', 'n.', 'A2', '城市生活', 6],
  ['farm', '农场；耕作', 'n./v.', 'A2', '自然环境', 5],
  ['bowl', '碗', 'n.', 'A1', '日常生活', 5],
  ['bright', '明亮的', 'adj.', 'A2', '描述', 6],
  ['meal', '一餐；饭', 'n.', 'A1', '日常生活', 5],
  ['knife', '刀', 'n.', 'A1', '日常生活', 5],
  ['evening', '傍晚；晚上', 'n.', 'A1', '日常生活', 6],
  ['cable TV', '有线电视', 'n.', 'B1', '媒体', 6],
  ['kitchen', '厨房', 'n.', 'A1', '家居', 5],
  ['apartment', '公寓', 'n.', 'A2', '家居', 6],
  ['bathroom', '浴室', 'n.', 'A1', '家居', 6],
  ['crowded', '拥挤的', 'adj.', 'B1', '城市生活', 6],
  ['basement', '地下室', 'n.', 'B1', '家居', 6],
  ['comfortable', '舒适的', 'adj.', 'B1', '描述', 6],
  ['birthday party', '生日聚会', 'n.', 'A2', '社交', 6],
  ['hostel', '旅舍', 'n.', 'B1', '旅行', 6],
  ['dining room', '餐厅', 'n.', 'A2', '家居', 6],
  ['cooker', '炉灶', 'n.', 'A2', '家居', 5],
  ['bunch', '一束；一群', 'n.', 'B1', '描述', 6],
  ['elevator', '电梯', 'n.', 'A2', '城市生活', 6],
  ['craft', '工艺；手艺', 'n.', 'B2', '文化', 7],
  ['studio', '工作室', 'n.', 'B2', '工作', 7],
  ['bookshelf', '书架', 'n.', 'B1', '家居', 6],
  ['comic', '漫画', 'n.', 'B1', '媒体', 7],
  ['blanket', '毯子', 'n.', 'A2', '家居', 6],
  ['garage', '车库', 'n.', 'A2', '家居', 6],
  ['expenses', '开支；费用', 'n.', 'B2', '财务', 7],
];

const TOEFL_TUPLES: EntryTuple[] = [
  ['campus', '校园', 'n.', 'B1', '教育', 6],
  ['lecture', '讲座；讲课', 'n.', 'B2', '教育', 7],
  ['dormitory', '宿舍', 'n.', 'B1', '校园生活', 6],
  ['scholarship', '奖学金', 'n.', 'B2', '教育', 7],
  ['deadline', '截止日期', 'n.', 'B2', '学术', 7],
  ['freshman', '大一新生', 'n.', 'B1', '校园生活', 6],
  ['syllabus', '教学大纲', 'n.', 'C1', '学术', 7],
  ['tuition', '学费', 'n.', 'B2', '财务', 7],
  ['cafeteria', '自助餐厅', 'n.', 'B1', '校园生活', 6],
  ['laboratory', '实验室', 'n.', 'B2', '学术', 7],
  ['assignment', '作业；任务', 'n.', 'B1', '学术', 6],
  ['semester', '学期', 'n.', 'B1', '学术', 6],
  ['professor', '教授', 'n.', 'B1', '学术', 6],
  ['textbook', '教科书', 'n.', 'B1', '教育', 6],
  ['enrollment', '入学注册', 'n.', 'C1', '学术', 7],
];

const CUSTOM_WRITE_TUPLES: EntryTuple[] = [
  ['paragraph', '段落', 'n.', 'B1', '学术', 6],
  ['thesis', '论点；论文', 'n.', 'C1', '学术', 7],
  ['argument', '论证；论点', 'n.', 'B2', '学术', 7],
  ['conclusion', '结论', 'n.', 'B1', '学术', 6],
  ['evidence', '证据', 'n.', 'B2', '学术', 7],
  ['coherence', '连贯性', 'n.', 'C1', '学术', 7],
  ['cohesion', '衔接；凝聚', 'n.', 'C1', '学术', 7],
  ['paraphrase', '改写；释义', 'v./n.', 'C1', '学术', 7],
];

const CUSTOM_WINTER_TUPLES: EntryTuple[] = [
  ['avalanche', '雪崩', 'n.', 'B2', '自然环境', 7],
  ['blizzard', '暴风雪', 'n.', 'B2', '自然环境', 6],
  ['insulation', '隔热材料', 'n.', 'C1', '科技', 7],
  ['fireplace', '壁炉', 'n.', 'B1', '家居', 5],
  ['sledging', '乘雪橇', 'n.', 'B2', '运动', 6],
  ['thermometer', '温度计', 'n.', 'B1', '科学', 6],
];

/** [单词, 中文释义, 英式音标, 词性, 例句, 例句翻译] —— 自定义词库 6 字段 */
type CustomTuple = [string, string, string, string, string, string];

function makeCustomEntry(
  [word, meaning, phonetic, pos, example, exampleCn]: CustomTuple,
  category: Category,
): WordEntry {
  return {
    id: `seed-c-${word}`,
    word,
    meaning,
    phonetic,
    audioUrl: wordAudioUrl(word),
    pos,
    example,
    exampleCn,
    category,
  };
}

const CUSTOM_SELF_TUPLES: CustomTuple[] = [
  ['ambiguous', '含糊的；有歧义的', '/æmˈbɪɡjuəs/', 'adj.', 'The instructions were ambiguous.', '这些说明含糊不清。'],
  ['diligent', '勤奋的', '/ˈdɪlɪdʒənt/', 'adj.', 'She is a diligent student.', '她是个勤奋的学生。'],
  ['frugal', '节俭的', '/ˈfruːɡl/', 'adj.', 'He leads a frugal life.', '他过着节俭的生活。'],
  ['resilient', '有韧性的；能复原的', '/rɪˈzɪliənt/', 'adj.', 'Children are often remarkably resilient.', '孩子往往有惊人的恢复力。'],
];

const SHARED_SPEAKING_TUPLES: CustomTuple[] = [
  ['hometown', '家乡', '/ˈhəʊmtaʊn/', 'n.', 'My hometown is a small coastal city.', '我的家乡是一个海滨小城。'],
  ['leisure', '闲暇；休闲', '/ˈleʒə/', 'n.', 'What do you do in your leisure time?', '你闲暇时做什么？'],
  ['neighbourhood', '街区；社区', '/ˈneɪbəhʊd/', 'n.', 'It is a quiet neighbourhood.', '那是个安静的社区。'],
];

const SHARED_WRITING_TUPLES: CustomTuple[] = [
  ['furthermore', '此外；而且', '/ˌfɜːðəˈmɔː/', 'adv.', 'Furthermore, the data supports this view.', '此外，数据支持这一观点。'],
  ['nevertheless', '然而；不过', '/ˌnevəðəˈles/', 'adv.', 'Nevertheless, the problem remains.', '然而，问题依然存在。'],
  ['in contrast', '相比之下', '/ɪn ˈkɒntrɑːst/', 'conj.', 'In contrast, rural areas are quieter.', '相比之下，乡村更安静。'],
];

/**
 * 单元格行 → 词条（列序对齐上传模板，V1.3 起模板无科目列）：
 * 系统 = 单词,音标,解释,词性,CEFR类型,档位,例句,例句翻译
 * 自定义 = 单词,音标,解释,词性,例句,例句翻译
 * 仅英文单词必填，其余留空由系统占位（模拟自动匹配）；首格为「单词」视为表头跳过
 */
function cellsToEntry(cells: unknown[], kind: 'system' | 'custom'): WordEntry | null {
  const c = cells.map((x) => String(x ?? '').trim());
  const [word = '', phonetic = '', meaning = '', pos = ''] = c;
  if (!word || word === '单词') return null;
  const [cefr, band, example, exampleCn] =
    kind === 'system' ? [c[4] ?? '', c[5] ?? '', c[6] ?? '', c[7] ?? ''] : ['', '', c[4] ?? '', c[5] ?? ''];
  const bandNum = band === '' ? undefined : Number(band);
  return {
    id: nextId('w'),
    word,
    meaning: meaning || '（待补充释义）',
    phonetic: phonetic || `/${word.toLowerCase().replace(/[^a-z]/g, '')}/`,
    pos: pos || undefined,
    cefr: cefr || undefined,
    band: bandNum !== undefined && !Number.isNaN(bandNum) ? bandNum : undefined,
    example: example || undefined,
    exampleCn: exampleCn || undefined,
  };
}

/** 解析 CSV/TXT 文本（一行一词，Tab 或逗号分隔） */
export function parseImportLines(text: string, kind: 'system' | 'custom'): WordEntry[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => cellsToEntry(line.split(line.includes('\t') ? '\t' : ','), kind))
    .filter((e): e is WordEntry => e !== null);
}

/** 解析 Excel 工作表行（xlsx sheet_to_json header:1 输出），跳过表头 */
export function parseSheetRows(rows: unknown[][], kind: 'system' | 'custom'): WordEntry[] {
  return rows.map((r) => cellsToEntry(r ?? [], kind)).filter((e): e is WordEntry => e !== null);
}

export function seedLibraries(): WordLibrary[] {
  return [
    {
      id: 'lib-ielts',
      name: 'IELTS 官方词库',
      subject: '雅思',
      categories: ['听力', '阅读', '口语', '写作'],
      wordCount: 4285,
      createdAt: '2026-09-01 10:00',
      entries: IELTS_TUPLES.map((t) => makeEntry(t)),
    },
    {
      id: 'lib-toefl',
      name: '托福官方词库',
      subject: '托福',
      categories: ['听力', '阅读', '口语', '写作'],
      wordCount: 2150,
      createdAt: '2026-09-01 10:00',
      entries: TOEFL_TUPLES.map((t) => makeEntry(t)),
    },
    {
      id: 'lib-write900',
      name: '雅思写作核心 900 词',
      subject: '雅思',
      categories: ['写作'],
      wordCount: 900,
      createdAt: '2026-09-12 09:30',
      lastImportAt: '2026-10-28 14:32',
      entries: CUSTOM_WRITE_TUPLES.map((t) => makeEntry(t)),
    },
    {
      id: 'lib-winter',
      name: '寒假冲刺补充词',
      subject: '雅思',
      categories: ['听力', '阅读'],
      wordCount: 120,
      createdAt: '2026-10-15 11:20',
      lastImportAt: '2026-11-01 10:05',
      entries: CUSTOM_WINTER_TUPLES.map((t) => makeEntry(t)),
    },
    {
      id: 'lib-custom-1',
      name: '我的雅思高频错词',
      subject: '雅思',
      categories: ['写作'],
      wordCount: CUSTOM_SELF_TUPLES.length,
      isCustom: true,
      owner: '王乐',
      school: '武汉学校',
      shareScope: 'none',
      createdAt: '2026-10-20 15:30',
      entries: CUSTOM_SELF_TUPLES.map((t) => makeCustomEntry(t, '写作')),
    },
    {
      id: 'lib-custom-2',
      name: '分校共享·雅思口语话题词',
      subject: '雅思',
      categories: ['口语'],
      wordCount: SHARED_SPEAKING_TUPLES.length,
      isCustom: true,
      owner: '韩东旭',
      school: '武汉学校',
      shareScope: 'branch',
      createdAt: '2026-10-25 11:12',
      entries: SHARED_SPEAKING_TUPLES.map((t) => makeCustomEntry(t, '口语')),
    },
    {
      id: 'lib-custom-3',
      name: '机构共享·托福写作衔接词',
      subject: '托福',
      categories: ['写作'],
      wordCount: SHARED_WRITING_TUPLES.length,
      isCustom: true,
      owner: '李教研',
      school: '总部',
      shareScope: 'org',
      createdAt: '2026-10-28 09:45',
      entries: SHARED_WRITING_TUPLES.map((t) => makeCustomEntry(t, '写作')),
    },
  ];
}

export function seedClasses(): SchoolClass[] {
  const students: Student[] = [
    {id: 'stu-2301', name: '张思远', code: 'XHD2301'},
    {id: 'stu-2302', name: '李雨桐', code: 'XHD2302'},
    {id: 'stu-2303', name: '王子墨', code: 'XHD2303'},
    {id: 'stu-2304', name: '陈曦', code: 'XHD2304'},
    {id: 'stu-2305', name: '刘一诺', code: 'XHD2305'},
    {id: 'stu-2306', name: '赵嘉怡', code: 'XHD2306'},
  ];
  return [{id: 'class-1', name: '雅思强化 1 班', students}];
}

function hs(
  student: Student,
  state: StudentState,
  batchDone: number,
  batchTotal: number,
  totalWords: number,
  accuracy: number,
  lastStudyAt?: string,
): HomeworkStudent {
  return {
    studentId: student.id,
    name: student.name,
    code: student.code,
    state,
    batchDone,
    batchTotal,
    wordsLearned: state === 'not-started' ? 0 : Math.round((totalWords * batchDone) / batchTotal),
    accuracy: state === 'not-started' ? 0 : accuracy,
    lastStudyAt,
  };
}

export function seedHomework(classes: SchoolClass[]): Homework[] {
  const [s1, s2, s3, s4, s5, s6] = classes[0].students;
  return [
    {
      id: 'hw-3',
      title: '雅思听力核心词·第 3 周',
      status: 'ongoing',
      className: '雅思强化 1 班',
      assignee: '王乐',
      libraryNames: ['IELTS 官方词库'],
      totalWords: 150,
      days: 5,
      startDate: '2026-10-30',
      createdAt: '2026-10-30 09:12',
      students: [
        hs(s1, 'ongoing', 3, 5, 150, 86, '2026-11-03 21:40'),
        hs(s2, 'done', 5, 5, 150, 92, '2026-11-02 22:10'),
        hs(s3, 'ongoing', 1, 5, 150, 71, '2026-11-01 20:15'),
        hs(s4, 'not-started', 0, 5, 150, 0),
        hs(s5, 'ongoing', 4, 5, 150, 89, '2026-11-03 22:05'),
        hs(s6, 'ongoing', 2, 5, 150, 78, '2026-11-02 21:30'),
      ],
    },
    {
      id: 'hw-2',
      title: '雅思全库综合背诵计划',
      status: 'ongoing',
      className: '雅思强化 1 班',
      assignee: '王乐',
      libraryNames: ['IELTS 官方词库', '雅思写作核心 900 词'],
      totalWords: 600,
      days: 20,
      startDate: '2026-10-24',
      createdAt: '2026-10-24 09:00',
      students: [
        hs(s1, 'ongoing', 12, 20, 600, 84, '2026-11-03 21:40'),
        hs(s2, 'ongoing', 16, 20, 600, 91, '2026-11-03 22:00'),
        hs(s3, 'ongoing', 5, 20, 600, 68, '2026-11-02 20:40'),
        hs(s4, 'ongoing', 2, 20, 600, 75, '2026-10-30 19:20'),
        hs(s5, 'ongoing', 18, 20, 600, 93, '2026-11-03 22:05'),
        hs(s6, 'ongoing', 9, 20, 600, 80, '2026-11-03 20:10'),
      ],
    },
    {
      id: 'hw-1',
      title: '托福基础词·第 1 期',
      status: 'done',
      className: '雅思强化 1 班',
      assignee: '王乐',
      libraryNames: ['托福官方词库'],
      totalWords: 300,
      days: 10,
      startDate: '2026-09-20',
      createdAt: '2026-09-20 10:00',
      students: [
        hs(s1, 'done', 10, 10, 300, 88, '2026-09-30 21:00'),
        hs(s2, 'done', 10, 10, 300, 94, '2026-09-29 21:30'),
        hs(s3, 'done', 10, 10, 300, 79, '2026-09-30 22:00'),
        hs(s4, 'done', 10, 10, 300, 82, '2026-09-30 20:00'),
        hs(s5, 'done', 10, 10, 300, 95, '2026-09-28 21:00'),
        hs(s6, 'done', 10, 10, 300, 85, '2026-09-30 21:40'),
      ],
    },
    {
      id: 'hw-4',
      title: '寒假冲刺补充词·寒假作业',
      status: 'draft',
      className: '雅思强化 1 班',
      assignee: '王乐',
      libraryNames: ['寒假冲刺补充词'],
      totalWords: 120,
      days: 15,
      startDate: '2027-01-15',
      createdAt: '2026-11-02 16:20',
      students: [],
    },
  ];
}

/* ========== 演示用确定性模拟词条（系统词池无真实词条，按规则生成） ========== */

export interface VocabItem {
  word: string;
  meaning: string;
  category: string;
  audioUrl?: string; // 英式音频（存量系统词=已生成可播放）
}

/** 简单确定性哈希（同一字符串永远得到同一数值） */
export function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** 基础词汇表：按科目分类（+可选科目）取种子词条 */
export function baseVocab(subject: string, category?: string): VocabItem[] {
  const tuples = subject === '托福' ? TOEFL_TUPLES : IELTS_TUPLES;
  const items = tuples.map((t) => ({
    word: t[0],
    meaning: t[1],
    category: TOPIC_CATEGORY[t[4]] ?? ('听力' as Category),
    audioUrl: wordAudioUrl(t[0]),
  }));
  const filtered = category ? items.filter((i) => i.category === category) : items;
  return filtered.length > 0 ? filtered : items;
}

/** 确定性取词：同一 seedKey+index 永远返回同一词；超出基础词表循环并加轮次后缀 */
export function mockWordAt(
  subject: string,
  category: string | undefined,
  seedKey: string,
  index: number,
): VocabItem {
  const base = baseVocab(subject, category);
  const pos = (stableHash(seedKey) % base.length) + index;
  const item = base[pos % base.length];
  const round = Math.floor(pos / base.length);
  return round === 0 ? item : {...item, word: `${item.word}·${round + 1}`};
}
