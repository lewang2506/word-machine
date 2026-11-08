import {useState} from 'react';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {Switch} from '@astryxdesign/core/Switch';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {useToast} from '@astryxdesign/core/Toast';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';

/** 原生应用占位（一期不开发，仅桌面图标） */
const NATIVE_APPS = [
  {key: 'learn', label: '背单词', glyph: 'Aa', cls: 'tile-a'},
  {key: 'smart', label: '智能推荐', glyph: 'AI', cls: 'tile-b'},
  {key: 'review', label: '复习', glyph: '复', cls: 'tile-c'},
  {key: 'wrong', label: '错词本', glyph: '错', cls: 'tile-d'},
  {key: 'settings', label: '设置', glyph: '设', cls: 'tile-e'},
] as const;

export function StudentApp() {
  const showToast = useToast();
  const [account, setAccount] = useState<string | null>(null);
  const [courseValid, setCourseValid] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [splashOpen, setSplashOpen] = useState(false);
  const [accountInput, setAccountInput] = useState('');

  const show4R = account !== null && courseValid;

  const login = () => {
    const acc = accountInput.trim();
    if (!acc) {
      showToast({body: '请输入 4R 账号', type: 'error', uniqueID: 'login-empty'});
      return;
    }
    setAccount(acc);
    setPanelOpen(false);
    setAccountInput('');
    showToast({
      body: courseValid
        ? '已识别为新航道在读学员，已解锁 4R 应用'
        : '已登录，但课程已过期，4R 功能不可用',
      type: courseValid ? 'info' : 'error',
      uniqueID: 'login-done',
    });
  };

  const logout = () => {
    setAccount(null);
    setPanelOpen(false);
    showToast({body: '已退出学校账号', type: 'info', uniqueID: 'logout'});
  };

  return (
    <Stack className="student-desktop" gap={0}>
      {/* 拟物状态栏 */}
      <Stack direction="horizontal" className="student-statusbar">
        <Text>17:15</Text>
        <Stack direction="horizontal" gap={3} vAlign="center">
          <Text>Wi-Fi</Text>
          <Text>100%</Text>
        </Stack>
      </Stack>

      {/* 桌面图标网格 */}
      <Grid columns={{minWidth: 110, max: 6}} gap={4} className="student-grid-area">
        {NATIVE_APPS.map((app) => (
          <button
            key={app.key}
            type="button"
            className="app-icon"
            onClick={() =>
              showToast({
                body: `「${app.label}」为单词机原生应用，演示环境未开发`,
                type: 'info',
                uniqueID: `app-${app.key}`,
              })
            }
          >
            <span className={`app-icon-tile ${app.cls}`}>{app.glyph}</span>
            <span className="app-icon-label">{app.label}</span>
          </button>
        ))}

        {show4R && (
          <button
            type="button"
            className="app-icon app-icon-4r"
            onClick={() => setSplashOpen(true)}
          >
            <span className="app-icon-tile app-icon-tile-4r">4R</span>
            <span className="app-icon-label">4R</span>
          </button>
        )}

        <button type="button" className="app-icon" onClick={() => setPanelOpen(true)}>
          <span className="app-icon-tile tile-me">我</span>
          <span className="app-icon-label">个人中心</span>
        </button>
      </Grid>

      {/* 演示控制悬浮面板 */}
      <Card className="demo-dock" padding={3}>
        <Stack gap={2} align="start">
          <Stack direction="horizontal" gap={2} vAlign="center">
            <Text type="supporting">演示控制</Text>
            <IconButton
              label="返回演示首页"
              icon={<Icon icon="close" />}
              variant="ghost"
              size="sm"
              onClick={() => (window.location.hash = '#/')}
            />
          </Stack>
          <Switch
            label="在读（有有效课程）"
            value={courseValid}
            onChange={(v) => {
              setCourseValid(v);
              showToast({
                body: v ? '已切换为在读：4R APP 显示' : '已切换为课程过期：4R APP 自动收回',
                type: 'info',
                uniqueID: 'course-toggle',
              });
            }}
          />
        </Stack>
      </Card>

      {/* 个人中心 */}
      <Dialog isOpen={panelOpen} onOpenChange={setPanelOpen} purpose="form" width={400}>
        <DialogHeader title="个人中心" subtitle="单词机 · 系统设置" onOpenChange={setPanelOpen} />
        <Stack gap={4} align="start" padding={4}>
          <Stack direction="horizontal" gap={4}>
            <Stack gap={0.5} align="start">
              <Text type="supporting">设备型号</Text>
              <Text>WordMachine W1</Text>
            </Stack>
            <Stack gap={0.5} align="start">
              <Text type="supporting">系统版本</Text>
              <Text>WM-OS 2.3</Text>
            </Stack>
          </Stack>

          {account === null ? (
            <Stack gap={3} align="start" width="100%">
              <TextInput
                label="4R 账号"
                value={accountInput}
                onChange={setAccountInput}
                placeholder="如 stu001（演示免密码）"
                width="100%"
                onEnter={login}
              />
              <Button label="登录学校账号" variant="primary" width="100%" onClick={login} />
              <Text type="supporting">
                使用新航道 4R 账号登录后，系统将识别在读状态并解锁 4R 应用
              </Text>
            </Stack>
          ) : (
            <Stack gap={3} align="start" width="100%">
              <Stack direction="horizontal" gap={2} vAlign="center">
                {courseValid ? (
                  <StatusDot variant="success" label="在读" />
                ) : (
                  <StatusDot variant="error" label="课程过期" />
                )}
                <Text>4R 账号：{account}</Text>
              </Stack>
              {courseValid ? (
                <Text type="supporting">在读课程：雅思强化 1 班 · 有效期至 2027-03-01</Text>
              ) : (
                <Text type="supporting">
                  课程已过期，4R 功能已收回；重新报课后将自动恢复
                </Text>
              )}
              <Button label="退出登录" variant="secondary" onClick={logout} />
            </Stack>
          )}
        </Stack>
      </Dialog>

      {/* 4R APP 占位 splash */}
      <Dialog isOpen={splashOpen} onOpenChange={setSplashOpen} width={360}>
        <DialogHeader title="4R" onOpenChange={setSplashOpen} />
        <Stack gap={3} align="center" padding={4}>
          <span className="app-icon-tile app-icon-tile-4r" style={{width: 72, height: 72}}>
            4R
          </span>
          <Text>4R APP（一期演示仅图标）</Text>
          <Text type="supporting">学生背单词作业等内部功能在一期不开发</Text>
        </Stack>
      </Dialog>
    </Stack>
  );
}
