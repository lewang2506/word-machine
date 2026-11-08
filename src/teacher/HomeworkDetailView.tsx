import {useEffect, useMemo, useRef, useState} from 'react';
import * as echarts from 'echarts';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Badge} from '@astryxdesign/core/Badge';
import {Token} from '@astryxdesign/core/Token';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import {useToast} from '@astryxdesign/core/Toast';
import type {Homework, HomeworkStudent} from '../data';
import {StudentReportView} from './ReportViews';
import {useStore} from '../store';

const DAY = 86400000;
const TODAY = new Date('2026-11-03T12:00:00');

function elapsedDays(hw: Homework): number {
  const start = new Date(`${hw.startDate}T00:00:00`).getTime();
  return Math.max(1, Math.min(hw.days, Math.round((TODAY.getTime() - start) / DAY)));
}

function studentProgress(s: HomeworkStudent): number {
  return s.batchTotal === 0 ? 0 : Math.round((s.batchDone / s.batchTotal) * 100);
}

function StudentStateDot({s}: {s: HomeworkStudent}) {
  if (s.state === 'done') return <StatusDot variant="success" label="已完成" />;
  if (s.state === 'ongoing') return <StatusDot variant="accent" label="进行中" />;
  return <StatusDot variant="neutral" label="未开始" />;
}

export function HomeworkDetailView({homeworkId}: {homeworkId: string}) {
  const showToast = useToast();
  const {homework, openHomework, setTeacherView} = useStore();
  const hw = homework.find((h) => h.id === homeworkId);
  const chartRef = useRef<HTMLDivElement>(null);
  // 查看作业详情报告：选中学员 id
  const [reportStudentId, setReportStudentId] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!hw) return null;
    const list = hw.students;
    const n = list.length || 1;
    const done = list.filter((s) => s.state === 'done').length;
    const avgProgress = Math.round(list.reduce((a, s) => a + studentProgress(s), 0) / n);
    const studied = list.filter((s) => s.state !== 'not-started');
    const avgAccuracy = studied.length
      ? Math.round(studied.reduce((a, s) => a + s.accuracy, 0) / studied.length)
      : 0;
    const days = elapsedDays(hw);
    const avgDaily = studied.length
      ? Math.round(list.reduce((a, s) => a + s.wordsLearned, 0) / studied.length / days)
      : 0;
    const planDaily = Math.round(hw.totalWords / hw.days);
    const buckets = [0, 0, 0, 0];
    list.forEach((s) => {
      const p = studentProgress(s);
      if (p < 20) buckets[0]++;
      else if (p < 50) buckets[1]++;
      else if (p < 80) buckets[2]++;
      else buckets[3]++;
    });
    return {done, avgProgress, avgAccuracy, avgDaily, planDaily, buckets, n: list.length};
  }, [hw]);

  useEffect(() => {
    if (!chartRef.current || !stats) return;
    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
      '#3a7afe';
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      grid: {left: 8, right: 8, top: 24, bottom: 4, containLabel: true},
      tooltip: {trigger: 'axis'},
      xAxis: {
        type: 'category',
        data: ['<20%', '20–50%', '50–80%', '≥80%'],
        axisLine: {lineStyle: {color: '#88888855'}},
      },
      yAxis: {type: 'value', minInterval: 1, splitLine: {lineStyle: {color: '#88888822'}}},
      series: [{type: 'bar', data: stats.buckets, barWidth: '55%', itemStyle: {color: accent, borderRadius: [4, 4, 0, 0]}}],
      textStyle: {fontFamily: 'inherit'},
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [stats]);

  if (!hw || !stats) {
    return (
      <Layout
        height="fill"
        content={
          <LayoutContent padding={4}>
            <Text>作业不存在或已被删除</Text>
            <Button
              label="返回全部作业"
              variant="secondary"
              onClick={() => openHomework(null)}
            />
          </LayoutContent>
        }
      />
    );
  }

  if (reportStudentId) {
    return (
      <StudentReportView
        hw={hw}
        studentId={reportStudentId}
        onSelectStudent={setReportStudentId}
        onBack={() => setReportStudentId(null)}
      />
    );
  }

  const end = new Date(`${hw.startDate}T00:00:00`).getTime() + hw.days * DAY;
  const countdown = Math.max(0, Math.round((end - TODAY.getTime()) / DAY));
  const notStarted = hw.students.filter((s) => s.state === 'not-started').length;
  const ongoing = hw.students.filter((s) => s.state === 'ongoing').length;

  const infoItems: Array<[string, string]> = [
    ['时间', hw.createdAt],
    ['作业类型', '多次布置'],
    ['作业属性', '单词作业'],
    ['科目', '雅思'],
    ['倒计时', hw.status === 'done' ? '已结束' : `${countdown} 天`],
    ['参与人数', `${hw.students.length} 人`],
    ['词数', hw.totalWords.toLocaleString()],
    ['布置人', hw.assignee],
    ['词库', hw.libraryNames.join('、')],
  ];

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack direction="horizontal" justify="between" vAlign="center">
            <Breadcrumbs label="作业详情路径">
              <BreadcrumbItem>作业管理</BreadcrumbItem>
              <BreadcrumbItem
                onClick={() => {
                  openHomework(null);
                  setTeacherView('homework');
                }}
              >
                全部作业
              </BreadcrumbItem>
              <BreadcrumbItem isCurrent>作业详情</BreadcrumbItem>
            </Breadcrumbs>
            <Stack direction="horizontal" gap={2}>
              <Button
                label="催办"
                variant="secondary"
                onClick={() => showToast({body: '已向未开始学生发送催办提醒', type: 'info', uniqueID: 'urge'})}
              />
              <Button
                label="分享"
                variant="secondary"
                onClick={() => showToast({body: '分享链接已复制（演示）', type: 'info', uniqueID: 'share'})}
              />
            </Stack>
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={4} align="start">
            <Stack direction="horizontal" gap={3} vAlign="center">
              <Heading level={1}>{hw.title}</Heading>
              {hw.status === 'ongoing' && <Badge variant="info" label="进行中" />}
              {hw.status === 'done' && <Badge variant="success" label="已完成" />}
              {hw.status === 'draft' && <Badge variant="neutral" label="草稿" />}
            </Stack>

            <Card padding={3} width="100%">
              <Grid columns={{minWidth: 160, max: 5}} gap={3}>
                {infoItems.map(([label, value]) => (
                  <Stack key={label} gap={0.5} align="start">
                    <Text type="supporting">{label}</Text>
                    <Text>{value}</Text>
                  </Stack>
                ))}
              </Grid>
            </Card>

            {/* ===== 数据统计（表格上方） ===== */}
            <Heading level={2}>数据统计</Heading>
            <Grid columns={{minWidth: 170}} gap={3} width="100%">
              <Card padding={3}>
                <Stack gap={1} align="start">
                  <Text type="supporting">完成率</Text>
                  <Text>
                    <span className="stat-card-value">{stats.done}</span>
                    <span className="stat-card-sub"> / {stats.n} 人</span>
                  </Text>
                </Stack>
              </Card>
              <Card padding={3}>
                <Stack gap={1} align="start">
                  <Text type="supporting">平均进度</Text>
                  <Text>
                    <span className="stat-card-value">{stats.avgProgress}%</span>
                  </Text>
                </Stack>
              </Card>
              <Card padding={3}>
                <Stack gap={1} align="start">
                  <Text type="supporting">平均正确率</Text>
                  <Text>
                    <span className="stat-card-value">{stats.avgAccuracy}%</span>
                  </Text>
                </Stack>
              </Card>
              <Card padding={3}>
                <Stack gap={1} align="start">
                  <Text type="supporting">人均每日背诵</Text>
                  <Text>
                    <span className="stat-card-value">{stats.avgDaily}</span>
                    <span className="stat-card-sub"> 词 · AI 计划 {stats.planDaily} 词/天</span>
                  </Text>
                </Stack>
              </Card>
              <Card padding={3}>
                <Stack gap={2} align="start" width="100%">
                  <Text type="supporting">三态人数</Text>
                  <div
                    className="tri-bar"
                    role="img"
                    aria-label={`未开始 ${notStarted} 人，进行中 ${ongoing} 人，已完成 ${stats.done} 人`}
                    style={{width: '100%'}}
                  >
                    <div
                      className="tri-bar-segment"
                      style={{
                        width: `${stats.n ? (notStarted / stats.n) * 100 : 0}%`,
                        background: 'var(--color-background-accent-soft)',
                      }}
                    />
                    <div
                      className="tri-bar-segment"
                      style={{
                        width: `${stats.n ? (ongoing / stats.n) * 100 : 0}%`,
                        background: 'var(--color-accent)',
                      }}
                    />
                    <div
                      className="tri-bar-segment"
                      style={{
                        width: `${stats.n ? (stats.done / stats.n) * 100 : 0}%`,
                        background: 'var(--color-background-success, #52c41a)',
                      }}
                    />
                  </div>
                  <Stack direction="horizontal" gap={3}>
                    <Text type="supporting">未开始 {notStarted}</Text>
                    <Text type="supporting">进行中 {ongoing}</Text>
                    <Text type="supporting">已完成 {stats.done}</Text>
                  </Stack>
                </Stack>
              </Card>
              <Card padding={3}>
                <Stack gap={1} align="start" width="100%">
                  <Text type="supporting">进度分布</Text>
                  <div ref={chartRef} style={{width: '100%', height: 140}} />
                </Stack>
              </Card>
            </Grid>

            {/* ===== 参与学生 ===== */}
            <Heading level={2}>参与学生</Heading>
            <Table density="balanced" isStriped hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>学生</TableHeaderCell>
                  <TableHeaderCell>学员号</TableHeaderCell>
                  <TableHeaderCell>完成状态</TableHeaderCell>
                  <TableHeaderCell>进度</TableHeaderCell>
                  <TableHeaderCell>已背单词</TableHeaderCell>
                  <TableHeaderCell>正确率</TableHeaderCell>
                  <TableHeaderCell>最近背诵</TableHeaderCell>
                  <TableHeaderCell>操作</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hw.students.map((s) => (
                  <TableRow key={s.studentId}>
                    <TableCell>
                      <Stack direction="horizontal" gap={2} vAlign="center">
                        <Avatar name={s.name} size="sm" />
                        <Text>{s.name}</Text>
                      </Stack>
                    </TableCell>
                    <TableCell>{s.code}</TableCell>
                    <TableCell>
                      <StudentStateDot s={s} />
                    </TableCell>
                    <TableCell>
                      <Stack gap={0.5} align="start">
                        <Stack width={140}>
                          <ProgressBar
                            label={`${s.name} 进度`}
                            value={studentProgress(s)}
                            hasValueLabel
                            isLabelHidden
                            variant={
                              s.state === 'done'
                                ? 'success'
                                : studentProgress(s) < 20
                                  ? 'warning'
                                  : 'accent'
                            }
                          />
                        </Stack>
                        <Text type="supporting">
                          第 {s.batchDone}/{s.batchTotal} 批
                        </Text>
                      </Stack>
                    </TableCell>
                    <TableCell>{s.wordsLearned || '-'}</TableCell>
                    <TableCell>{s.accuracy ? `${s.accuracy}%` : '-'}</TableCell>
                    <TableCell>{s.lastStudyAt ?? '-'}</TableCell>
                    <TableCell>
                      <Button
                        label="查看作业详情报告"
                        variant="ghost"
                        size="sm"
                        onClick={() => setReportStudentId(s.studentId)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Token label="数据为演示种子数据" color="gray" />
          </Stack>
        </LayoutContent>
      }
    />
  );
}
