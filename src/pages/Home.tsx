import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {Grid} from '@astryxdesign/core/Grid';

const FEATURES = {
  teacher: [
    '布置作业：选对象 → 选词库（词库粒度）→ AI 排期只读预览',
    '作业管理：全部作业列表 + 作业详情（数据统计卡片）',
    '词库管理：系统/自定义词库，自定义导入（AI 自动补全字段）',
  ],
  student: [
    '单词机桌面：原生应用占位 + 4R APP 图标',
    '个人中心：4R 账号登录（免密码）',
    '系统区分：在读显示 4R APP，课程过期自动收回',
  ],
};

export function Home() {
  return (
    <Stack className="page-body" padding={6} gap={4} align="center">
      <Stack gap={1} align="center" paddingBlock={4}>
        <Heading level={1}>单词机 1 期 Demo</Heading>
        <Text type="supporting">
          新航道 4R 系统 · 单词机适配一期功能演示（Astryx 组件库）
        </Text>
      </Stack>
      <Grid columns={{minWidth: 320, max: 2}} gap={4} width="100%" maxWidth={860}>
        <Card padding={4}>
          <Stack gap={3} align="start">
            <Stack direction="horizontal" gap={2} vAlign="center">
              <Heading level={2}>教师端</Heading>
              <Badge variant="blue" label="深色 4R 主题" />
            </Stack>
            <Stack gap={1} align="start">
              {FEATURES.teacher.map((f) => (
                <Text key={f} type="supporting">
                  · {f}
                </Text>
              ))}
            </Stack>
            <Button
              label="进入教师端"
              variant="primary"
              href="#/teacher"
              onClick={() => (window.location.hash = '#/teacher')}
            />
          </Stack>
        </Card>
        <Card padding={4}>
          <Stack gap={3} align="start">
            <Stack direction="horizontal" gap={2} vAlign="center">
              <Heading level={2}>学生端</Heading>
              <Badge variant="purple" label="单词机桌面" />
            </Stack>
            <Stack gap={1} align="start">
              {FEATURES.student.map((f) => (
                <Text key={f} type="supporting">
                  · {f}
                </Text>
              ))}
            </Stack>
            <Button
              label="进入学生端"
              variant="primary"
              href="#/student"
              onClick={() => (window.location.hash = '#/student')}
            />
          </Stack>
        </Card>
      </Grid>
      <Text type="supporting">
        演示数据保存在浏览器 localStorage，可在教师端左下角重置
      </Text>
    </Stack>
  );
}
