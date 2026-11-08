import {useMemo, useState} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Selector} from '@astryxdesign/core/Selector';
import {Token} from '@astryxdesign/core/Token';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {TabList, Tab} from '@astryxdesign/core/TabList';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import type {Homework, HomeworkStatus} from '../data';
import {useStore} from '../store';

function avgProgress(hw: Homework): number {
  if (hw.students.length === 0) return 0;
  const sum = hw.students.reduce(
    (acc, s) => acc + (s.batchTotal === 0 ? 0 : s.batchDone / s.batchTotal),
    0,
  );
  return Math.round((sum / hw.students.length) * 100);
}

function doneCount(hw: Homework): number {
  return hw.students.filter((s) => s.state === 'done').length;
}

function StatusBadge({status}: {status: HomeworkStatus}) {
  if (status === 'ongoing') {
    return <StatusDot variant="accent" label="进行中" />;
  }
  if (status === 'done') {
    return <StatusDot variant="success" label="已完成" />;
  }
  return <StatusDot variant="neutral" label="草稿" />;
}

export function HomeworkListView() {
  const {homework, openHomework, setTeacherView} = useStore();
  const [tab, setTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');

  const filtered = useMemo(
    () =>
      homework.filter((hw) => {
        if (tab === 'ongoing' && hw.status !== 'ongoing') return false;
        if (tab === 'done' && hw.status !== 'done') return false;
        if (tab === 'draft' && hw.status !== 'draft') return false;
        if (statusFilter !== '全部' && statusLabel(hw.status) !== statusFilter) return false;
        if (keyword && !hw.title.includes(keyword)) return false;
        return true;
      }),
    [homework, tab, statusFilter, keyword],
  );

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack direction="horizontal" justify="between" vAlign="center">
            <Heading level={1}>作业管理</Heading>
            <Button
              label="布置作业"
              variant="primary"
              onClick={() => setTeacherView('assign')}
            />
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0}>
          <Stack gap={0} align="start" height="100%">
            <Stack paddingInline={4} width="100%">
              <TabList value={tab} onChange={setTab} hasDivider>
                <Tab value="all" label="全部作业" />
                <Tab value="ongoing" label="进行中" />
                <Tab value="done" label="已完成" />
                <Tab value="draft" label="草稿" />
              </TabList>
            </Stack>

            <Stack padding={4} gap={3} align="start" width="100%">
              <div className="filter-bar" style={{width: '100%'}}>
                <TextInput
                  label="搜索作业名称"
                  value={keyword}
                  onChange={setKeyword}
                  placeholder="输入作业名称"
                  width={220}
                  isLabelHidden
                />
                <Selector
                  label="完成状态"
                  width={140}
                  options={['全部', '进行中', '已完成', '草稿'].map((s) => ({
                    value: s,
                    label: s,
                  }))}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
                <Token label="单词作业" color="blue" />
                <Text type="supporting">共 {filtered.length} 条</Text>
              </div>

              <Table
                density="balanced"
                isStriped
                hasHover
              >
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>作业标题</TableHeaderCell>
                    <TableHeaderCell>班级编号</TableHeaderCell>
                    <TableHeaderCell>作业属性</TableHeaderCell>
                    <TableHeaderCell>布置人</TableHeaderCell>
                    <TableHeaderCell>完成</TableHeaderCell>
                    <TableHeaderCell>学生</TableHeaderCell>
                    <TableHeaderCell>平均进度</TableHeaderCell>
                    <TableHeaderCell>状态</TableHeaderCell>
                    <TableHeaderCell>操作</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((hw) => (
                    <TableRow key={hw.id}>
                      <TableCell>
                        <Stack direction="horizontal" gap={2} vAlign="center">
                          <Text>{hw.title}</Text>
                        </Stack>
                      </TableCell>
                      <TableCell>{hw.className}</TableCell>
                      <TableCell>
                        <Token label="单词作业" color="blue" />
                      </TableCell>
                      <TableCell>{hw.assignee}</TableCell>
                      <TableCell>
                        {doneCount(hw)}/{hw.students.length || '-'}
                      </TableCell>
                      <TableCell>{hw.students.length || '-'}</TableCell>
                      <TableCell>
                          <Stack width={140}>
                          <ProgressBar
                            label={`${hw.title} 平均进度`}
                            value={avgProgress(hw)}
                            hasValueLabel
                            isLabelHidden
                            variant={hw.status === 'done' ? 'success' : 'accent'}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={hw.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          label="详情"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            openHomework(hw.id);
                            setTeacherView('homework');
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          </Stack>
        </LayoutContent>
      }
    />
  );
}

function statusLabel(s: HomeworkStatus): string {
  return s === 'ongoing' ? '进行中' : s === 'done' ? '已完成' : '草稿';
}
