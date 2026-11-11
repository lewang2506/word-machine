import {useMemo, useState} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {NumberInput} from '@astryxdesign/core/NumberInput';
import {DateInput} from '@astryxdesign/core/DateInput';
import {Selector} from '@astryxdesign/core/Selector';
import {CheckboxInput} from '@astryxdesign/core/CheckboxInput';
import {Popover} from '@astryxdesign/core/Popover';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {Pagination} from '@astryxdesign/core/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import {useToast} from '@astryxdesign/core/Toast';
import {Badge} from '@astryxdesign/core/Badge';
import {
  CURRENT_TEACHER,
  mockWordAt,
  nextId,
  type Homework,
  type HomeworkStudent,
  type WordEntry,
} from '../data';
import {
  ResultPreviewView,
  WordsPreviewView,
  type PreviewBatch,
  type PreviewWord,
} from './ReportViews';
import {useStore} from '../store';

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

/** 布置类型 Tab：一期只开放「单词作业」，其余为厂商后台占位 */
const ASSIGN_TABS = ['题型训练', '题库作业', '整套模考', '自定义作业', '单词作业'] as const;

/** 布置类型（对齐校校词汇练习：单次/多次/抽查；本项目一期以多次为主） */
const ASSIGN_TYPES = ['多次', '单次', '抽查'] as const;
type AssignType = (typeof ASSIGN_TYPES)[number];

const CATEGORY_OPTIONS = ['听力', '阅读', '口语', '写作'] as const;
const BAND_OPTIONS = ['5', '6', '7', '8'] as const;
const PAGE_SIZE = 10;

/**
 * 作业方式（多选）：每类技能一种作答形式。
 * 多选时每个单词每次随机一种；单词不支持所选方式时降级为「口语-中译英（语音）」。
 */
const METHOD_OPTIONS = [
  {group: '听力', value: 'listening-en2zh-audio-choice', label: '英译中（听音选择）'},
  {group: '口语', value: 'speaking-zh2en-voice', label: '中译英（语音）'},
  {group: '阅读', value: 'reading-en2zh-choice', label: '英译中（选择）'},
  {group: '写作', value: 'writing-zh2en-blank', label: '中译英（填空）'},
] as const;

interface Pool {
  id: string;
  name: string;
  words: number;
  /** 自定义词库所属科目类目（用于科目筛选）；系统叉乘池为 undefined */
  categories?: string[];
  /** 分校词库行：我的/共享 标记、创建人、所属分校、真实词条 */
  badge?: '我的' | '共享';
  owner?: string;
  school?: string;
  entries?: WordEntry[];
}

/**
 * 系统词库可选池：科目类目 × 档位词汇 叉乘展开（如「雅思听力 - 5分词汇」）。
 * 档位总词数为厂商 2026-10-15 生产快照（Band5:1,518 / Band6:2,519 / Band7:1,691 / Band8:341），
 * 按类目权重（听力 28% / 阅读 26% / 口语 22% / 写作 24%）拆分到各组合。
 */
const CATEGORY_WEIGHT: Record<string, number> = {听力: 0.28, 阅读: 0.26, 口语: 0.22, 写作: 0.24};
const BAND_TOTALS: Record<string, number> = {'5': 1518, '6': 2519, '7': 1691, '8': 341};
const TOEFL_COUNTS: Record<string, number> = {听力: 620, 阅读: 580, 口语: 480, 写作: 470};

function buildPools(subject: string): Pool[] {
  if (subject === '托福') {
    return CATEGORY_OPTIONS.map((c) => ({
      id: `toefl-${c}`,
      name: `托福${c}（${TOEFL_COUNTS[c].toLocaleString()}词）`,
      words: TOEFL_COUNTS[c],
    }));
  }
  return CATEGORY_OPTIONS.flatMap((c) =>
    BAND_OPTIONS.map((b) => {
      const words = Math.round(BAND_TOTALS[b] * CATEGORY_WEIGHT[c]);
      return {
        id: `ielts-${c}-band${b}`,
        name: `雅思${c} - ${b}分词汇（${words.toLocaleString()}词）`,
        words,
      };
    }),
  );
}

export function AssignView() {
  const showToast = useToast();
  const {classes, libraries, addHomework, setTeacherView, openHomework} = useStore();

  const [tab, setTab] = useState<string>('单词作业');
  // 左侧：作业信息
  const [title, setTitle] = useState('');
  const [attr, setAttr] = useState('日常作业');
  const [classId, setClassId] = useState(classes[0]?.id ?? '');
  const [studentIds, setStudentIds] = useState<string[]>(
    classes[0]?.students.map((s) => s.id) ?? [],
  );
  const [course, setCourse] = useState('雅思强化班·核心词汇');
  const [startDate, setStartDate] = useState<ISODate>('2026-11-05');
  const [endDate, setEndDate] = useState<ISODate>('2026-11-25');
  // 实时作业：仅抽查可选；勾选后日期置灰、立即发出；倒计时=整个作业分钟数（默认 10，上限 60）
  const [isRealtime, setIsRealtime] = useState(false);
  const [countdownMin, setCountdownMin] = useState(10);
  // 作业信息：布置类型（单选：单次/多次/抽查）
  const [assignType, setAssignType] = useState<AssignType>('多次');
  // 作业信息：作业方式（多选，默认全选；多选时每词每次随机一种，不支持则降级口语-中译英语音）
  const [methods, setMethods] = useState<string[]>(METHOD_OPTIONS.map((m) => m.value));
  // 页面顶部：科目分类主选择（驱动右侧词池）
  const [subjectFilter, setSubjectFilter] = useState('雅思');
  // 右侧：词库列表（系统词库 / 分校词库 双 Tab）
  const [poolTab, setPoolTab] = useState('系统词库');
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [poolIds, setPoolIds] = useState<string[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [page, setPage] = useState(1);
  // 多次/单次：每个词池的起始词序与数量；抽查：每个词池的抽查个数
  const [poolCfg, setPoolCfg] = useState<Record<string, {from: string; count: string}>>({});
  // 预览视图：form=编辑 / words=单词列表预览 / result=结果页预览
  const [view, setView] = useState<'form' | 'words' | 'result'>('form');

  const selectedClass = classes.find((c) => c.id === classId);
  const allSelected =
    selectedClass != null && studentIds.length === selectedClass.students.length;

  /** 右侧行：系统词库 → 按「科目类目 × 档位」叉乘展开；分校词库 → 我的+共享自定义库每库一行 */
  const pools = useMemo<Pool[]>(() => {
    if (poolTab === '分校词库') {
      return libraries
        .filter(
          (l) =>
            l.isCustom &&
            l.subject === subjectFilter &&
            (l.owner === CURRENT_TEACHER || (l.shareScope != null && l.shareScope !== 'none')),
        )
        .map((l) => ({
          id: l.id,
          name: l.name,
          words: l.wordCount,
          // 科目筛选按词条「科目」字段派生（词库本身不再持有科目）
          categories: [...new Set(l.entries.map((e) => e.category).filter(Boolean))] as string[],
          badge: l.owner === CURRENT_TEACHER ? ('我的' as const) : ('共享' as const),
          owner: l.owner,
          school: l.school ?? '—',
          entries: l.entries,
        }));
    }
    return buildPools(subjectFilter);
  }, [poolTab, subjectFilter, libraries]);

  const filteredPools = pools.filter(
    (p) => appliedKeyword === '' || p.name.includes(appliedKeyword),
  );
  const displayPools = showSelectedOnly
    ? pools.filter((p) => poolIds.includes(p.id))
    : filteredPools;
  const pagePools = displayPools.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedPools = pools.filter((p) => poolIds.includes(p.id));
  const poolWords = selectedPools.reduce((sum, p) => sum + p.words, 0);
  const allPoolsChecked =
    filteredPools.length > 0 && filteredPools.every((p) => poolIds.includes(p.id));

  const cfgOf = (id: string) => poolCfg[id] ?? {from: '1', count: ''};
  const setCfg = (id: string, patch: Partial<{from: string; count: string}>) =>
    setPoolCfg((prev) => ({...prev, [id]: {...cfgOf(id), ...patch}}));

  const daysNum = useMemo(() => {
    const diff =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
    return Math.max(1, Math.round(diff));
  }, [startDate, endDate]);

  /** 池内剩余词数（从起始词序起） */
  const remainingOf = (p: Pool) => {
    const from = Math.max(1, parseInt(cfgOf(p.id).from, 10) || 1);
    return Math.max(0, p.words - from + 1);
  };

  /**
   * 多次布置每日词量（系统自动计算，不可修改）：
   * 每日量 = ⌈池内剩余词数 ÷ 作业天数⌉（向上取整）；
   * 除不尽时最后一天自动只排剩余词（封顶池内余量）；多词库按勾选顺序各自独立排期、同一天合并为一个批次。
   */
  const dailyOf = (p: Pool) => Math.ceil(remainingOf(p) / daysNum);

  /** 预计布置总词数：多次=Σmin(每日量×天数, 池内余量)；单次=Σ本次布置量；抽查=Σ每池抽查个数 */
  const plannedWords = useMemo(() => {
    return selectedPools.reduce((sum, p) => {
      const cfg = cfgOf(p.id);
      const count = Math.max(0, parseInt(cfg.count, 10) || 0);
      const remaining = remainingOf(p);
      if (assignType === '抽查') return sum + Math.min(count, p.words);
      if (assignType === '多次') return sum + Math.min(dailyOf(p) * daysNum, remaining);
      return sum + Math.min(count, remaining);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignType, selectedPools, poolCfg, daysNum]);

  const defaultTitle =
    assignType === '抽查'
      ? '单词抽查'
      : selectedPools.length > 0
        ? `${selectedPools[0].name.replace(/（.*?）/, '')}·背诵计划`
        : '单词背诵计划';

  const toggleStudent = (id: string) =>
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const togglePool = (id: string) =>
    setPoolIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const switchTab = (v: string) => {
    setTab(v);
    if (v !== '单词作业') {
      showToast({
        body: '演示环境仅开放「单词作业」布置',
        type: 'info',
        uniqueID: 'assign-tab-wip',
      });
      setTab('单词作业');
    }
  };

  const validate = (): {name: string; students: HomeworkStudent[]} | null => {
    if (!selectedClass) return null;
    if (studentIds.length === 0) {
      showToast({body: '请至少选择一名学生', type: 'error', uniqueID: 'assign-no-student'});
      return null;
    }
    if (methods.length === 0) {
      showToast({body: '请至少选择一种作业方式', type: 'error', uniqueID: 'assign-no-method'});
      return null;
    }
    if (!isRealtime && new Date(endDate) <= new Date(startDate)) {
      showToast({body: '截止日期需晚于开始日期', type: 'error', uniqueID: 'assign-bad-date'});
      return null;
    }
    if (poolIds.length === 0) {
      showToast({body: '请至少勾选一个词库', type: 'error', uniqueID: 'assign-no-lib'});
      return null;
    }
    const missing =
      assignType !== '多次' &&
      selectedPools.some((p) => !(parseInt(cfgOf(p.id).count, 10) > 0));
    if (missing) {
      showToast({
        body:
          assignType === '单次'
            ? '请为每个勾选词库填写本次布置数量'
            : '请为每个勾选词库填写抽查个数',
        type: 'error',
        uniqueID: 'assign-no-count',
      });
      return null;
    }
    const students: HomeworkStudent[] = selectedClass.students
      .filter((s) => studentIds.includes(s.id))
      .map((s) => ({
        studentId: s.id,
        name: s.name,
        code: s.code,
        state: 'not-started' as const,
        batchDone: 0,
        batchTotal: assignType === '多次' && !isRealtime ? daysNum : 1,
        wordsLearned: 0,
        accuracy: 0,
      }));
    return {name: title.trim() || defaultTitle, students};
  };

  const buildHomework = (
    status: Homework['status'],
    students: HomeworkStudent[],
    name: string,
  ): Homework => ({
    id: nextId('hw'),
    title: name,
    status,
    className: selectedClass?.name ?? '',
    assignee: '王乐',
    libraryNames: selectedPools.map((p) => p.name.replace(/（.*?）/, '')),
    totalWords: plannedWords,
    days: assignType === '多次' && !isRealtime ? daysNum : 1,
    startDate,
    createdAt: new Date().toLocaleString('zh-CN', {hour12: false}),
    students,
  });

  const publish = () => {
    const v = validate();
    if (!v) return;
    const hw = buildHomework('ongoing', v.students, v.name);
    addHomework(hw);
    const hint = isRealtime
      ? `实时作业已发出 · 限时 ${countdownMin} 分钟`
      : assignType === '多次'
        ? `已按 ${daysNum} 天自动分配每日词量`
        : assignType === '单次'
          ? `单次布置 ${plannedWords} 词`
          : `抽查 ${plannedWords} 词`;
    showToast({
      body: `作业「${hw.title}」已发布，${hint}`,
      type: 'info',
      uniqueID: 'assign-success',
    });
    setTitle('');
    setPoolIds([]);
    setPoolCfg({});
    openHomework(hw.id);
    setTeacherView('homework');
  };

  const saveDraft = () => {
    const v = validate();
    if (!v) return;
    const hw = buildHomework('draft', [], v.name);
    addHomework(hw);
    showToast({
      body: `草稿「${hw.title}」已保存`,
      type: 'info',
      uniqueID: 'assign-draft',
    });
    setTitle('');
    setPoolIds([]);
    setPoolCfg({});
    setTeacherView('homework');
  };

  const clearPools = () => {
    setPoolIds([]);
    setPoolCfg({});
    setPage(1);
  };

  /** 系统词池 id（ielts-听力-band5 / toefl-听力）→ 科目类目 */
  const systemPoolCategory = (id: string): string | undefined =>
    id.startsWith('ielts-') || id.startsWith('toefl-') ? id.split('-')[1] : undefined;

  /** 取词池第 i 个词（0 起）：自定义库取真实词条，系统池确定性模拟 */
  const wordAt = (p: Pool, i: number): PreviewWord => {
    if (p.entries && p.entries.length > 0) {
      const e = p.entries[i % p.entries.length];
      const round = Math.floor(i / p.entries.length);
      return {
        word: round === 0 ? e.word : `${e.word}·${round + 1}`,
        meaning: e.meaning,
        category: e.category ?? p.categories?.[0] ?? '—',
        audioUrl: e.audioUrl,
      };
    }
    return mockWordAt(subjectFilter, systemPoolCategory(p.id), p.id, i);
  };

  /** 预览/结果预览共用：按当前勾选与配置切分批次（多次=每批一段，每日量自动计算；单次/抽查/实时=单批） */
  const buildBatches = (): PreviewBatch[] => {
    const name = title.trim() || defaultTitle;
    const countOf = (p: Pool) =>
      assignType === '多次' ? dailyOf(p) : Math.max(1, parseInt(cfgOf(p.id).count, 10) || 30);
    const slice = (p: Pool, offset: number, len: number): PreviewWord[] => {
      const from = Math.max(1, parseInt(cfgOf(p.id).from, 10) || 1) - 1;
      const start = from + offset;
      const n = Math.max(0, Math.min(len, p.words - start));
      return Array.from({length: n}, (_, j) => wordAt(p, start + j));
    };
    if (assignType === '多次' && !isRealtime) {
      return Array.from({length: daysNum}, (_, i) => ({
        name: `${name}_${String(i + 1).padStart(2, '0')}`,
        words: selectedPools.flatMap((p) => slice(p, i * countOf(p), countOf(p))),
      }));
    }
    return [{name, words: selectedPools.flatMap((p) => slice(p, 0, countOf(p)))}];
  };

  const openPreview = (kind: 'words' | 'result') => {
    if (poolIds.length === 0) {
      showToast({body: '请先勾选词库再预览', type: 'error', uniqueID: 'assign-preview-none'});
      return;
    }
    setView(kind);
  };

  if (view !== 'form') {
    const batches = buildBatches();
    const name = title.trim() || defaultTitle;
    return view === 'words' ? (
      <WordsPreviewView title={name} batches={batches} onBack={() => setView('form')} />
    ) : (
      <ResultPreviewView title={name} batches={batches} onBack={() => setView('form')} />
    );
  }

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack gap={2} align="start" width="100%">
            <Heading level={1}>布置作业</Heading>
            <Selector
              label="科目分类"
              width={240}
              options={['雅思', '托福'].map((s) => ({value: s, label: s}))}
              value={subjectFilter}
              onChange={(v) => {
                setSubjectFilter(v);
                clearPools();
              }}
            />
            <TabList value={tab} onChange={switchTab} hasDivider isFullBleed>
              {ASSIGN_TABS.map((t) => (
                <Tab key={t} value={t} label={t} />
              ))}
            </TabList>
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={4} align="start" width="100%">
            <Grid columns={5} gap={4} width="100%">
              {/* ===== 左：作业信息 + 筛选条件 ===== */}
              <GridSpan columns={2}>
                <Card padding={4} width="100%">
                  <Stack gap={3} align="start" width="100%">
                    <Heading level={2}>作业信息</Heading>
                    <TextInput
                      label="作业名称"
                      value={title}
                      onChange={setTitle}
                      placeholder={defaultTitle}
                      width="100%"
                    />
                    <Selector
                      label="作业属性"
                      width="100%"
                      options={['日常作业', '假期作业', '考前冲刺'].map((a) => ({
                        value: a,
                        label: a,
                      }))}
                      value={attr}
                      onChange={setAttr}
                    />
                    <Selector
                      label="班级"
                      width="100%"
                      options={classes.map((c) => ({value: c.id, label: c.name}))}
                      value={classId}
                      onChange={(v) => {
                        setClassId(v);
                        const cls = classes.find((c) => c.id === v);
                        setStudentIds(cls?.students.map((s) => s.id) ?? []);
                      }}
                    />
                    {selectedClass && (
                      <Stack gap={2} align="start" width="100%">
                        <CheckboxInput
                          label={`学生：全选（${studentIds.length}/${selectedClass.students.length}）`}
                          value={allSelected}
                          onChange={(checked) =>
                            setStudentIds(
                              checked ? selectedClass.students.map((s) => s.id) : [],
                            )
                          }
                        />
                        <Grid columns={2} gap={1} width="100%">
                          {selectedClass.students.map((s) => (
                            <CheckboxInput
                              key={s.id}
                              label={`${s.name}（${s.code}）`}
                              value={studentIds.includes(s.id)}
                              onChange={() => toggleStudent(s.id)}
                            />
                          ))}
                        </Grid>
                      </Stack>
                    )}
                    <Selector
                      label="选择课程"
                      width="100%"
                      options={[
                        '雅思强化班·核心词汇',
                        '雅思基础班·起步词汇',
                        '托福全程班·校园学术词',
                      ].map((c) => ({value: c, label: c}))}
                      value={course}
                      onChange={setCourse}
                    />
                    <Selector
                      label="布置类型"
                      width="100%"
                      options={ASSIGN_TYPES.map((t) => ({value: t, label: t}))}
                      value={assignType}
                      onChange={(v) => {
                        const next = v as AssignType;
                        setAssignType(next);
                        if (next !== '抽查') setIsRealtime(false);
                        clearPools();
                      }}
                    />
                    <Stack direction="horizontal" gap={3} width="100%">
                      <DateInput
                        label="开始日期"
                        value={startDate}
                        onChange={(v) => v && setStartDate(v)}
                        isDisabled={isRealtime}
                        disabledMessage="实时作业立即发出，无需设置日期"
                      />
                      <DateInput
                        label="截止日期"
                        value={endDate}
                        min={startDate}
                        onChange={(v) => v && setEndDate(v)}
                        isDisabled={isRealtime}
                        disabledMessage="实时作业立即发出，无需设置日期"
                      />
                    </Stack>
                    {assignType === '抽查' && (
                      <Stack direction="horizontal" gap={2} width="100%" vAlign="center">
                        <CheckboxInput
                          label="实时作业"
                          value={isRealtime}
                          onChange={setIsRealtime}
                        />
                        <Popover
                          placement="below"
                          content={
                            <Stack gap={1} padding={3} width={260}>
                              <Text>
                                实时作业会马上发出作业，可用于课堂检测；学生端限时{' '}
                                {countdownMin} 分钟内完成。
                              </Text>
                            </Stack>
                          }
                        >
                          <IconButton
                            label="实时作业说明"
                            icon={<Icon icon="info" />}
                            variant="ghost"
                            size="sm"
                            tooltip="实时作业说明"
                          />
                        </Popover>
                        {isRealtime && (
                          <NumberInput
                            label="倒计时"
                            value={countdownMin}
                            onChange={(v) =>
                              setCountdownMin(Math.min(60, Math.max(1, Math.round(v ?? 1))))
                            }
                            min={1}
                            max={60}
                            step={1}
                            isIntegerOnly
                            hasNumberSteppers
                            units="分钟"
                            width={160}
                          />
                        )}
                      </Stack>
                    )}
                    <Stack gap={2} align="start" width="100%">
                      <Stack direction="horizontal" gap={1} vAlign="center">
                        <Text>作业方式（可多选）</Text>
                        <Popover
                          placement="below"
                          content={
                            <Stack gap={1} padding={3} width={280}>
                              <Text>
                                多选时每个单词每次随机一种方式；优先使用所选方式，若单词不支持该形式，则降级为中译英（语音）。
                              </Text>
                            </Stack>
                          }
                        >
                          <IconButton
                            label="作业方式说明"
                            icon={<Icon icon="info" />}
                            variant="ghost"
                            size="sm"
                            tooltip="作业方式说明"
                          />
                        </Popover>
                      </Stack>
                      <Card variant="muted" padding={3} width="100%">
                        <Stack gap={2} align="start" width="100%">
                          {METHOD_OPTIONS.map((m) => (
                            <Stack
                              key={m.value}
                              direction="horizontal"
                              gap={3}
                              vAlign="center"
                              width="100%"
                            >
                              <Stack width={40}>
                                <Text>{m.group}</Text>
                              </Stack>
                              <CheckboxInput
                                label={m.label}
                                value={methods.includes(m.value)}
                                onChange={(checked) =>
                                  setMethods((prev) =>
                                    checked
                                      ? [...prev, m.value]
                                      : prev.filter((x) => x !== m.value),
                                  )
                                }
                              />
                            </Stack>
                          ))}
                        </Stack>
                      </Card>
                    </Stack>
                    <Text type="supporting">
                      {isRealtime
                        ? '实时作业 · 发布后学生端立即开始作答'
                        : assignType === '多次'
                          ? `共 ${daysNum} 天 · 按起始词序自动均分每日词量（池内余量 ÷ 天数，向上取整）`
                          : assignType === '单次'
                            ? '单次布置 · 学生一次完成所选词量'
                            : '抽查测试 · 从所选词库随机抽题'}
                    </Text>
                  </Stack>
                </Card>
              </GridSpan>

              {/* ===== 右：词库列表 ===== */}
              <GridSpan columns={3}>
                <Card padding={4} width="100%">
                  <Stack gap={3} align="start" width="100%">
                    <Heading level={2}>词库</Heading>
                    <TabList
                      value={poolTab}
                      onChange={(v) => {
                        setPoolTab(v);
                        clearPools();
                        setShowSelectedOnly(false);
                      }}
                      hasDivider
                      isFullBleed
                    >
                      <Tab value="系统词库" label="系统词库" />
                      <Tab value="分校词库" label="分校词库" />
                    </TabList>
                    <Stack direction="horizontal" gap={2} width="100%" vAlign="end">
                      <TextInput
                        label="搜索词库"
                        value={keyword}
                        onChange={setKeyword}
                        placeholder="输入名称关键词"
                        width="100%"
                      />
                      <Button
                        label="搜索"
                        onClick={() => {
                          setAppliedKeyword(keyword.trim());
                          setPage(1);
                        }}
                      />
                    </Stack>
                    <Stack direction="horizontal" gap={3} width="100%" vAlign="center">
                      <CheckboxInput
                        label="全选"
                        value={allPoolsChecked}
                        onChange={(checked) =>
                          setPoolIds(checked ? filteredPools.map((p) => p.id) : [])
                        }
                      />
                      <Button
                        label={
                          showSelectedOnly ? '返回全部' : `查看已选（${poolIds.length}）`
                        }
                        variant="ghost"
                        onClick={() => {
                          setShowSelectedOnly((v) => !v);
                          setPage(1);
                        }}
                      />
                    </Stack>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHeaderCell>选择</TableHeaderCell>
                          <TableHeaderCell>名称</TableHeaderCell>
                          {poolTab === '分校词库' && (
                            <>
                              <TableHeaderCell>词汇数</TableHeaderCell>
                              <TableHeaderCell>所属分校</TableHeaderCell>
                              <TableHeaderCell>创建人</TableHeaderCell>
                            </>
                          )}
                          {assignType === '抽查' ? (
                            <TableHeaderCell>抽查个数</TableHeaderCell>
                          ) : (
                            <>
                              <TableHeaderCell>起始词序</TableHeaderCell>
                              <TableHeaderCell>
                                {assignType === '多次' ? '每日布置（自动）' : '本次布置'}
                              </TableHeaderCell>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagePools.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <CheckboxInput
                                label={p.name}
                                value={poolIds.includes(p.id)}
                                onChange={() => togglePool(p.id)}
                                isLabelHidden
                              />
                            </TableCell>
                            <TableCell>
                              {p.badge ? (
                                <Stack gap={1} align="start">
                                  <Badge
                                    variant={p.badge === '我的' ? 'blue' : 'teal'}
                                    label={p.badge}
                                  />
                                  <Text>{p.name}</Text>
                                </Stack>
                              ) : (
                                p.name
                              )}
                            </TableCell>
                            {poolTab === '分校词库' && (
                              <>
                                <TableCell>{p.words.toLocaleString()}</TableCell>
                                <TableCell>{p.school ?? '—'}</TableCell>
                                <TableCell>{p.owner ?? '—'}</TableCell>
                              </>
                            )}
                            {assignType === '抽查' ? (
                              <TableCell>
                                <TextInput
                                  label="抽查个数"
                                  value={cfgOf(p.id).count}
                                  onChange={(v) => setCfg(p.id, {count: v})}
                                  placeholder="30"
                                  width={72}
                                  isLabelHidden
                                />
                              </TableCell>
                            ) : (
                              <>
                                <TableCell>
                                  <TextInput
                                    label="起始词序"
                                    value={cfgOf(p.id).from}
                                    onChange={(v) => setCfg(p.id, {from: v})}
                                    placeholder="1"
                                    width={72}
                                    isLabelHidden
                                  />
                                </TableCell>
                                <TableCell>
                                  {assignType === '多次' ? (
                                    <Text>{dailyOf(p).toLocaleString()} 词/天</Text>
                                  ) : (
                                    <TextInput
                                      label="本次布置"
                                      value={cfgOf(p.id).count}
                                      onChange={(v) => setCfg(p.id, {count: v})}
                                      placeholder="如 50"
                                      width={72}
                                      isLabelHidden
                                    />
                                  )}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                        {pagePools.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={
                                (assignType === '抽查' ? 3 : 4) + (poolTab === '分校词库' ? 3 : 0)
                              }
                            >
                              <Text type="supporting">
                                {showSelectedOnly
                                  ? '尚未勾选词库'
                                  : poolTab === '分校词库'
                                    ? '当前科目分类下暂无我的/共享词库'
                                    : '没有匹配的词库'}
                              </Text>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <Stack
                      direction="horizontal"
                      justify="end"
                      width="100%"
                      vAlign="center"
                    >
                      <Text type="supporting">
                        已选 {selectedPools.length} 组 · 池内 {poolWords.toLocaleString()} 词
                        {assignType === '抽查'
                          ? ` · 抽查 ${plannedWords} 词`
                          : plannedWords > 0
                            ? ` · 预计布置 ${plannedWords.toLocaleString()} 词`
                            : ''}
                      </Text>
                      <Pagination
                        page={page}
                        onChange={setPage}
                        totalItems={displayPools.length}
                        pageSize={PAGE_SIZE}
                        variant="compact"
                      />
                    </Stack>
                  </Stack>
                </Card>
              </GridSpan>
            </Grid>

            {/* ===== 底部操作条 ===== */}
            <Stack direction="horizontal" gap={2} justify="end" width="100%">
              <Button label="取消" onClick={() => setTeacherView('homework')} />
              <Button label="预览" onClick={() => openPreview('words')} />
              <Button label="结果预览" onClick={() => openPreview('result')} />
              <Button label="保存草稿" onClick={saveDraft} />
              <Button label="发布作业" variant="primary" onClick={publish} />
            </Stack>
          </Stack>
        </LayoutContent>
      }
    />
  );
}
