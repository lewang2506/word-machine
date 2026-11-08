import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {useStore} from '../store';
import {AssignView} from './AssignView';
import {HomeworkListView} from './HomeworkListView';
import {HomeworkDetailView} from './HomeworkDetailView';
import {LibrariesView} from './LibrariesView';

const NAV = [
  {key: 'assign', label: '布置作业', icon: 'calendar'},
  {key: 'homework', label: '作业管理', icon: 'checkDouble'},
  {key: 'libraries', label: '单词列表', icon: 'copy'},
] as const;

export function TeacherApp() {
  const {teacherView, setTeacherView, activeHomeworkId, openHomework} = useStore();

  const viewKey = activeHomeworkId ? 'homework-detail' : teacherView;

  return (
    <AppShell
      variant="section"
      contentPadding={0}
      sideNav={
        <SideNav
          header={<SideNavHeading heading="单词机" superheading="4R 系统 · 教师端" />}
          footerIcons={
            <IconButton
              label="返回演示首页"
              icon={<Icon icon="chevronLeft" />}
              variant="ghost"
              onClick={() => (window.location.hash = '#/')}
            />
          }
        >
          <SideNavSection title="单词机 1 期">
            {NAV.map((item) => (
              <SideNavItem
                key={item.key}
                label={item.label}
                icon={item.icon}
                isSelected={teacherView === item.key && viewKey === item.key}
                onClick={() => {
                  openHomework(null);
                  setTeacherView(item.key);
                }}
              />
            ))}
          </SideNavSection>
        </SideNav>
      }
    >
      {viewKey === 'assign' && <AssignView />}
      {viewKey === 'homework' && <HomeworkListView />}
      {viewKey === 'homework-detail' && <HomeworkDetailView homeworkId={activeHomeworkId!} />}
      {viewKey === 'libraries' && <LibrariesView />}
    </AppShell>
  );
}
