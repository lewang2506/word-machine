/**
 * 预览页 / 结果页预览 / 学生作业详情报告 —— 共享视图组件
 * - 预览（WordsPreviewView）：展示将布置的单词列表（单词/中文释义/科目）
 * - 结果预览（ResultPreviewView）：只有表头与字段占位，无结果数据
 * - 作业报告（StudentReportView）：作业详情页「查看作业详情报告」，展示真实（种子派生）结果
 * 多次布置均提供左侧批次菜单快速切换。
 */
import {useState, type ReactNode} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Grid, GridSpan} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Avatar} from '@astryxdesign/core/Avatar';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import {useToast} from '@astryxdesign/core/Toast';
import {mockWordAt, stableHash, type Homework, type HomeworkStudent} from '../data';

export interface PreviewWord {
  word: string;
  meaning: string;
  category: string;
  audioUrl?: string; // 英式音频（AI 生成完成后才有）
}

export interface PreviewBatch {
  name: string;
  words: PreviewWord[];
}

/** 结果页 7 个核心字段 */
export const CORE_FIELD_LABELS = [
  '背诵完成状态',
  '检测完成状态',
  '背诵完成进度',
  '检测完成进度',
  '检测正确率',
  '检测单词数',
  '检测平均用时',
] as const;

export function CoreFieldsGrid({values}: {values: string[]}) {
  return (
    <Card padding={3} width="100%">
      <Grid columns={{minWidth: 130, max: 7}} gap={3}>
        {CORE_FIELD_LABELS.map((label, i) => (
          <Stack key={label} gap={0.5} align="start">
            <Text type="supporting">{label}</Text>
            <Text>{values[i] ?? '—'}</Text>
          </Stack>
        ))}
      </Grid>
    </Card>
  );
}

/** 预览单词表：单词 / 中文释义 / 科目 / 英式音频 */
export function WordListTable({words}: {words: PreviewWord[]}) {
  return (
    <Table density="balanced" isStriped hasHover>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>单词</TableHeaderCell>
          <TableHeaderCell>中文释义</TableHeaderCell>
          <TableHeaderCell>科目</TableHeaderCell>
          <TableHeaderCell>英式音频</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {words.map((w, i) => (
          <TableRow key={`${w.word}-${i}`}>
            <TableCell>{w.word}</TableCell>
            <TableCell>{w.meaning}</TableCell>
            <TableCell>{w.category}</TableCell>
            <TableCell>
              {w.audioUrl ? (
                <Button
                  label="播放"
                  variant="ghost"
                  size="sm"
                  onClick={() => void new Audio(w.audioUrl).play().catch(() => {})}
                />
              ) : (
                <Text type="supporting">AI 生成中</Text>
              )}
            </TableCell>
          </TableRow>
        ))}
        {words.length === 0 && (
          <TableRow>
            <TableCell colSpan={4}>
              <Text type="supporting">该批次无单词</Text>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export interface WordResult {
  correct: boolean;
  seconds: number;
}

/** 结果单词表：results 为 undefined 时（预览）只有表头 */
export function WordResultTable({
  words,
  results,
}: {
  words: PreviewWord[];
  results?: WordResult[];
}) {
  return (
    <Table density="balanced" isStriped hasHover>
      <TableHeader>
        <TableRow>
          <TableHeaderCell>单词</TableHeaderCell>
          <TableHeaderCell>中文释义</TableHeaderCell>
          <TableHeaderCell>科目</TableHeaderCell>
          <TableHeaderCell>检测是否正确</TableHeaderCell>
          <TableHeaderCell>检测用时</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results == null ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Text type="supporting">预览状态 · 暂无结果数据</Text>
            </TableCell>
          </TableRow>
        ) : results.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Text type="supporting">该批次暂无作答记录</Text>
            </TableCell>
          </TableRow>
        ) : (
          words.map((w, i) => (
            <TableRow key={`${w.word}-${i}`}>
              <TableCell>{w.word}</TableCell>
              <TableCell>{w.meaning}</TableCell>
              <TableCell>{w.category}</TableCell>
              <TableCell>
                {results[i].correct ? (
                  <Badge variant="success" label="正确" />
                ) : (
                  <Badge variant="error" label="错误" />
                )}
              </TableCell>
              <TableCell>{results[i].seconds.toFixed(1)} 秒</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

/** 左侧菜单（批次/学员列表通用）：按钮式列表 */
export function SideMenu({
  title,
  items,
  active,
  onChange,
}: {
  title: string;
  items: string[];
  active: number;
  onChange: (i: number) => void;
}) {
  return (
    <Stack gap={1} align="start" width="100%">
      <Text type="supporting">{title}</Text>
      {items.map((name, i) => (
        <Button
          key={name}
          label={name}
          variant={i === active ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onChange(i)}
        />
      ))}
    </Stack>
  );
}

function previewScaffold(
  crumbs: [string, string],
  onBack: () => void,
  children: ReactNode,
) {
  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack direction="horizontal" justify="between" vAlign="center">
            <Breadcrumbs label="页面路径">
              <BreadcrumbItem>{crumbs[0]}</BreadcrumbItem>
              <BreadcrumbItem onClick={onBack}>返回编辑</BreadcrumbItem>
              <BreadcrumbItem isCurrent>{crumbs[1]}</BreadcrumbItem>
            </Breadcrumbs>
            <Button label="返回继续编辑" variant="secondary" onClick={onBack} />
          </Stack>
        </LayoutHeader>
      }
      content={<LayoutContent padding={4}>{children}</LayoutContent>}
    />
  );
}

/** 多次批次短标签（左侧菜单用，避免长作业名溢出） */
export const batchShortLabel = (i: number) => `第 ${String(i + 1).padStart(2, '0')} 批`;

/** 预览页：展示用户选择的单词列表；多次按 作业名称_01… 分批，左侧菜单切换 */
export function WordsPreviewView({
  title,
  batches,
  onBack,
}: {
  title: string;
  batches: PreviewBatch[];
  onBack: () => void;
}) {
  const [active, setActive] = useState(0);
  const batch = batches[Math.min(active, batches.length - 1)];
  return previewScaffold(
    ['布置作业', '单词列表预览'],
    onBack,
    <Stack gap={4} align="start" width="100%">
      <Stack gap={1} align="start" width="100%">
        <Stack direction="horizontal" gap={3} vAlign="center">
          <Heading level={1}>{title}</Heading>
          <Badge variant="info" label="预览" />
        </Stack>
        <Text type="supporting">
          英式音频通过AI生成中，生成完成后可在单词列表中查看并更新。
        </Text>
      </Stack>
      {batches.length > 1 ? (
        <Grid columns={5} gap={4} width="100%">
          <GridSpan columns={1}>
            <Card padding={3} width="100%">
              <SideMenu
                title={`批次（共 ${batches.length} 批）`}
                items={batches.map((_, i) => batchShortLabel(i))}
                active={active}
                onChange={setActive}
              />
            </Card>
          </GridSpan>
          <GridSpan columns={4}>
            <Stack gap={3} align="start" width="100%">
              <Stack direction="horizontal" gap={2} vAlign="center">
                <Heading level={2}>{batch.name}</Heading>
                <Text type="supporting">{batch.words.length} 词</Text>
              </Stack>
              <WordListTable words={batch.words} />
            </Stack>
          </GridSpan>
        </Grid>
      ) : (
        <Stack gap={3} align="start" width="100%">
          <Text type="supporting">共 {batch.words.length} 词</Text>
          <WordListTable words={batch.words} />
        </Stack>
      )}
    </Stack>,
  );
}

/** 结果页预览：只有表头与字段占位，无任何结果数据 */
export function ResultPreviewView({
  title,
  batches,
  onBack,
}: {
  title: string;
  batches: PreviewBatch[];
  onBack: () => void;
}) {
  const [active, setActive] = useState(0);
  const isMulti = batches.length > 1;
  const batch = batches[Math.min(active, batches.length - 1)];
  const emptyFields = CORE_FIELD_LABELS.map(() => '—');
  const reportBody = (
    <Stack gap={3} align="start" width="100%">
      {isMulti && <Heading level={2}>{batch.name}</Heading>}
      <CoreFieldsGrid values={emptyFields} />
      <WordResultTable words={[]} results={undefined} />
    </Stack>
  );
  return previewScaffold(
    ['布置作业', '结果页预览'],
    onBack,
    <Stack gap={4} align="start" width="100%">
      <Stack direction="horizontal" gap={3} vAlign="center">
        <Heading level={1}>{title}</Heading>
        <Badge variant="info" label="结果预览" />
      </Stack>
      {isMulti && (
        <Card padding={3} width="100%">
          <Grid columns={{minWidth: 180, max: 4}} gap={3}>
            <Stack gap={0.5} align="start">
              <Text type="supporting">总体背诵进度（按次）</Text>
              <Text>— / {batches.length} 次</Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">总体检测进度（按次）</Text>
              <Text>— / {batches.length} 次</Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">检测总体正确率</Text>
              <Text>—</Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">检测每个单词平均用时</Text>
              <Text>—</Text>
            </Stack>
          </Grid>
        </Card>
      )}
      {isMulti ? (
        <Grid columns={5} gap={4} width="100%">
          <GridSpan columns={1}>
            <Card padding={3} width="100%">
              <SideMenu
                title={`批次（共 ${batches.length} 批）`}
                items={batches.map((_, i) => batchShortLabel(i))}
                active={active}
                onChange={setActive}
              />
            </Card>
          </GridSpan>
          <GridSpan columns={4}>{reportBody}</GridSpan>
        </Grid>
      ) : (
        reportBody
      )}
    </Stack>,
  );
}

/* ========== 学生作业详情报告（真实结果，演示数据由种子派生） ========== */

type BatchState = 'done' | 'ongoing' | 'not-started';

function batchState(s: HomeworkStudent, batch: number): BatchState {
  if (batch <= s.batchDone) return 'done';
  if (batch === s.batchDone + 1 && s.state === 'ongoing') return 'ongoing';
  return 'not-started';
}

function ReportBody({hw, student}: {hw: Homework; student: HomeworkStudent}) {
  const days = Math.max(1, hw.days);
  const isMulti = days > 1;
  const perBatch = Math.max(1, Math.ceil(hw.totalWords / days));
  const subject =
    hw.title.includes('托福') || hw.libraryNames.join('、').includes('托福') ? '托福' : '雅思';
  const [activeBatch, setActiveBatch] = useState(Math.max(1, Math.min(student.batchDone, days)));

  const words: PreviewWord[] = (() => {
    const start = (activeBatch - 1) * perBatch;
    const n = Math.max(0, Math.min(perBatch, hw.totalWords - start));
    return Array.from({length: n}, (_, j) => mockWordAt(subject, undefined, hw.id, start + j));
  })();

  const state = batchState(student, activeBatch);
  const jitter = (stableHash(`${student.studentId}-b${activeBatch}`) % 11) - 5; // -5..+5
  const acc = Math.max(0, Math.min(100, student.accuracy + jitter));
  const avgSec = 2 + (stableHash(`${student.studentId}-t${activeBatch}`) % 30) / 10; // 2.0–5.0

  let fields: string[];
  let results: WordResult[] | undefined;
  if (state === 'done') {
    fields = ['已完成', '已完成', '100%', '100%', `${acc}%`, `${words.length} 词`, `${avgSec.toFixed(1)} 秒`];
  } else if (state === 'ongoing') {
    const prog = 30 + (stableHash(`${student.studentId}-p${activeBatch}`) % 51); // 30–80
    const learned = Math.round((words.length * prog) / 100);
    fields = ['进行中', '进行中', `${prog}%`, `${prog}%`, `${acc}%`, `${learned} 词`, `${avgSec.toFixed(1)} 秒`];
  } else {
    fields = ['未开始', '未开始', '0%', '0%', '—', '—', '—'];
  }
  if (state !== 'not-started') {
    const answered = state === 'done' ? words.length : Math.round((words.length * parseInt(fields[2], 10)) / 100);
    results = words.slice(0, Math.max(0, answered)).map((_, j) => {
      const gi = (activeBatch - 1) * perBatch + j;
      const h = stableHash(`${student.studentId}-${hw.id}-${gi}`);
      return {correct: h % 100 < acc, seconds: 1 + (h % 45) / 10};
    });
  }

  const overallRecite = Math.round((student.batchDone / Math.max(1, student.batchTotal)) * 100);

  return (
    <Stack gap={3} align="start" width="100%">
      <TabList value="report" onChange={() => {}} hasDivider isFullBleed>
        <Tab value="report" label="作业报告" />
      </TabList>
      {isMulti && (
        <Card padding={3} width="100%">
          <Grid columns={{minWidth: 180, max: 4}} gap={3}>
            <Stack gap={0.5} align="start">
              <Text type="supporting">总体背诵进度（按次）</Text>
              <Text>
                {student.batchDone} / {student.batchTotal} 次（{overallRecite}%）
              </Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">总体检测进度（按次）</Text>
              <Text>
                {student.batchDone} / {student.batchTotal} 次（{overallRecite}%）
              </Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">检测总体正确率</Text>
              <Text>{student.accuracy ? `${student.accuracy}%` : '—'}</Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">检测每个单词平均用时</Text>
              <Text>
                {student.state === 'not-started'
                  ? '—'
                  : `${(2 + (stableHash(`${student.studentId}-avg-t`) % 30) / 10).toFixed(1)} 秒`}
              </Text>
            </Stack>
          </Grid>
        </Card>
      )}
      {isMulti && (
        <Stack gap={2} align="start" width="100%">
          <Text type="supporting">选择批次</Text>
          <Stack direction="horizontal" gap={1} width="100%" wrap="wrap">
            {Array.from({length: days}, (_, i) => i + 1).map((b) => (
              <Button
                key={b}
                label={batchShortLabel(b - 1)}
                variant={b === activeBatch ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveBatch(b)}
              />
            ))}
          </Stack>
        </Stack>
      )}
      {isMulti && <Heading level={2}>{`${hw.title}_${String(activeBatch).padStart(2, '0')}`}</Heading>}
      <CoreFieldsGrid values={fields} />
      <WordResultTable words={words} results={results} />
    </Stack>
  );
}

/** 作业详情 → 查看作业详情报告：左侧学员列表，右侧仅「作业报告」 */
export function StudentReportView({
  hw,
  studentId,
  onSelectStudent,
  onBack,
}: {
  hw: Homework;
  studentId: string;
  onSelectStudent: (id: string) => void;
  onBack: () => void;
}) {
  const showToast = useToast();
  const student = hw.students.find((s) => s.studentId === studentId) ?? hw.students[0];
  // 已批改学员（演示态，本地 state 记录）
  const [gradedIds, setGradedIds] = useState<string[]>([]);
  const confirmGrading = () => {
    if (!gradedIds.includes(student.studentId)) {
      setGradedIds((prev) => [...prev, student.studentId]);
    }
    showToast({
      body: `已完成「${student.name}」的作业批改`,
      type: 'info',
      uniqueID: `grade-${student.studentId}`,
    });
  };
  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack direction="horizontal" justify="between" vAlign="center">
            <Breadcrumbs label="报告路径">
              <BreadcrumbItem>作业管理</BreadcrumbItem>
              <BreadcrumbItem onClick={onBack}>作业详情</BreadcrumbItem>
              <BreadcrumbItem isCurrent>作业详情报告</BreadcrumbItem>
            </Breadcrumbs>
            <Button label="返回作业详情" variant="secondary" onClick={onBack} />
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={4} align="start" width="100%">
            <Heading level={1}>{hw.title}</Heading>
            <Grid columns={5} gap={4} width="100%">
              <GridSpan columns={1}>
                <Card padding={3} width="100%">
                  <Stack gap={1} align="start" width="100%">
                    <Text type="supporting">学员（{hw.students.length}）</Text>
                    {hw.students.map((s) => (
                      <Stack key={s.studentId} direction="horizontal" gap={1} vAlign="center">
                        <Button
                          label={s.name}
                          variant={s.studentId === student.studentId ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => onSelectStudent(s.studentId)}
                        />
                        {s.state === 'done' && <StatusDot variant="success" label="已完成" />}
                        {s.state === 'ongoing' && <StatusDot variant="accent" label="进行中" />}
                        {s.state === 'not-started' && <StatusDot variant="neutral" label="未开始" />}
                        {gradedIds.includes(s.studentId) && (
                          <Badge variant="success" label="已批改" />
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Card>
              </GridSpan>
              <GridSpan columns={4}>
                <Stack gap={3} align="start" width="100%">
                  <Stack direction="horizontal" gap={2} vAlign="center">
                    <Avatar name={student.name} size="sm" />
                    <Heading level={2}>{student.name}</Heading>
                    <Text type="supporting">{student.code}</Text>
                    {gradedIds.includes(student.studentId) && (
                      <Badge variant="success" label="已批改" />
                    )}
                  </Stack>
                  <ReportBody key={student.studentId} hw={hw} student={student} />
                  <Stack direction="horizontal" gap={2} justify="end" width="100%">
                    <Button label="返回作业详情" onClick={onBack} />
                    <Button
                      label={
                        gradedIds.includes(student.studentId) ? '已批改' : '确认批改'
                      }
                      variant="primary"
                      isDisabled={gradedIds.includes(student.studentId)}
                      onClick={confirmGrading}
                    />
                  </Stack>
                </Stack>
              </GridSpan>
            </Grid>
          </Stack>
        </LayoutContent>
      }
    />
  );
}
