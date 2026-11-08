import {useMemo, useRef, useState} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Stack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {TextInput} from '@astryxdesign/core/TextInput';
import {TextArea} from '@astryxdesign/core/TextArea';
import {Selector} from '@astryxdesign/core/Selector';
import {Dialog, DialogHeader} from '@astryxdesign/core/Dialog';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Pagination} from '@astryxdesign/core/Pagination';
import {Spinner} from '@astryxdesign/core/Spinner';
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
import * as XLSX from 'xlsx';
import {
  CURRENT_TEACHER,
  nextId,
  parseImportLines,
  parseSheetRows,
  type Category,
  type ShareScope,
  type WordEntry,
  type WordLibrary,
} from '../data';
import {useStore} from '../store';

const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CATEGORY_OPTIONS: Category[] = ['听力', '阅读', '口语', '写作'];
const PAGE_SIZE = 10;
const now = () => new Date().toLocaleString('zh-CN', {hour12: false});

/** 共享范围 → 展示文案 */
const SHARE_LABEL: Record<string, string> = {none: '不共享', org: '全机构', branch: '全分校'};

/** 单词列表：系统词库 / 自定义词库 双 Tab，词库粒度列表 + 词条详情 */
export function LibrariesView() {
  const showToast = useToast();
  const {libraries, addLibrary, deleteLibrary, importEntries, updateLibrary} = useStore();
  const [tab, setTab] = useState('系统词库');
  // 自定义词库二级分类：全部 / 我的词库 / 共享词库
  const [subTab, setSubTab] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [uploadLibId, setUploadLibId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{libraryId: string; entries: WordEntry[]} | null>(null);
  const [deletingLib, setDeletingLib] = useState<WordLibrary | null>(null);
  const [sharingLib, setSharingLib] = useState<WordLibrary | null>(null);

  const detailLibrary = libraries.find((l) => l.id === detailId) ?? null;
  const uploadLibrary = libraries.find((l) => l.id === uploadLibId) ?? null;
  const confirmLibrary = confirm ? libraries.find((l) => l.id === confirm.libraryId) : null;

  const tabLibraries = useMemo(
    () =>
      libraries
        .filter((l) => (tab === '自定义词库' ? l.isCustom : !l.isCustom))
        .filter((l) => {
          if (tab !== '自定义词库') return true;
          if (subTab === '我的词库') return l.owner === CURRENT_TEACHER;
          if (subTab === '共享词库') return l.shareScope != null && l.shareScope !== 'none';
          return true;
        })
        .filter((l) => keyword.trim() === '' || l.name.includes(keyword.trim())),
    [libraries, tab, subTab, keyword],
  );
  const pageLibraries = tabLibraries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ===== 确认导入页 ===== */
  if (confirm && confirmLibrary) {
    return (
      <ImportConfirmView
        library={confirmLibrary}
        initialEntries={confirm.entries}
        onCancel={() => setConfirm(null)}
        onConfirm={(entries) => {
          importEntries(confirmLibrary.id, entries, entries.length);
          showToast({
            body: `单词表「${confirmLibrary.name}」已生成，共 ${entries.length} 词`,
            type: 'info',
            uniqueID: 'import-confirmed',
          });
          setConfirm(null);
          setDetailId(confirmLibrary.id);
        }}
      />
    );
  }

  /* ===== 词条详情页 ===== */
  if (detailLibrary) {
    return <LibraryDetail library={detailLibrary} onBack={() => setDetailId(null)} />;
  }

  /* ===== 词库列表 ===== */
  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack gap={2} align="start" width="100%">
            <Heading level={1}>单词列表</Heading>
            <TabList
              value={tab}
              onChange={(v) => {
                setTab(v);
                setSubTab('全部');
                setPage(1);
              }}
              hasDivider
              isFullBleed
            >
              <Tab value="系统词库" label="系统词库" />
              <Tab value="自定义词库" label="自定义词库" />
            </TabList>
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={3} align="start" width="100%">
            {tab === '自定义词库' && (
              <TabList
                value={subTab}
                onChange={(v) => {
                  setSubTab(v);
                  setPage(1);
                }}
              >
                <Tab value="全部" label="全部" />
                <Tab value="我的词库" label="我的词库" />
                <Tab value="共享词库" label="共享词库" />
              </TabList>
            )}
            <Stack direction="horizontal" gap={2} width="100%" vAlign="center">
              <TextInput
                label="单词表名称"
                value={keyword}
                onChange={(v) => {
                  setKeyword(v);
                  setPage(1);
                }}
                placeholder="请输入单词表名称"
                width={260}
                isLabelHidden
              />
              {tab === '自定义词库' && (
                <Button label="新建单词表" variant="primary" onClick={() => setNewOpen(true)} />
              )}
            </Stack>

            <Table density="balanced" isStriped hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>名称</TableHeaderCell>
                  {tab === '自定义词库' && <TableHeaderCell>创建人</TableHeaderCell>}
                  {tab === '自定义词库' && <TableHeaderCell>共享</TableHeaderCell>}
                  <TableHeaderCell>创建时间</TableHeaderCell>
                  <TableHeaderCell>{tab === '自定义词库' ? '词汇数' : '词汇总数'}</TableHeaderCell>
                  <TableHeaderCell>操作</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageLibraries.map((lib) => {
                  const isMine = lib.owner === CURRENT_TEACHER;
                  return (
                    <TableRow key={lib.id}>
                      <TableCell>{lib.name}</TableCell>
                      {tab === '自定义词库' && <TableCell>{lib.owner ?? '—'}</TableCell>}
                      {tab === '自定义词库' && (
                        <TableCell>{SHARE_LABEL[lib.shareScope ?? 'none']}</TableCell>
                      )}
                      <TableCell>{lib.createdAt}</TableCell>
                      <TableCell>{lib.wordCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Stack direction="horizontal" gap={1}>
                          <Button
                            label="详情"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailId(lib.id)}
                          />
                          {lib.isCustom && isMine && (
                            <>
                              <Button
                                label="批量上传"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadLibId(lib.id)}
                              />
                              <Button
                                label="共享"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSharingLib(lib)}
                              />
                              <Button
                                label="删除"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingLib(lib)}
                              />
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pageLibraries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tab === '自定义词库' ? 6 : 4}>
                      <Text type="supporting">
                        {keyword ? '没有匹配的单词表' : '暂无单词表'}
                      </Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Stack direction="horizontal" justify="end" width="100%" vAlign="center">
              <Pagination
                page={page}
                onChange={setPage}
                totalItems={tabLibraries.length}
                pageSize={PAGE_SIZE}
                variant="compact"
              />
            </Stack>
          </Stack>

          <NewLibraryDialog isOpen={newOpen} onOpenChange={setNewOpen} onCreate={addLibrary} />
          {uploadLibrary && (
            <UploadDialog
              library={uploadLibrary}
              isOpen
              onOpenChange={(open) => !open && setUploadLibId(null)}
              onParsed={(entries) => {
                setUploadLibId(null);
                setConfirm({libraryId: uploadLibrary.id, entries});
              }}
            />
          )}
          <AlertDialog
            isOpen={deletingLib !== null}
            onOpenChange={(open) => !open && setDeletingLib(null)}
            title="删除单词表"
            description={`确定删除「${deletingLib?.name ?? ''}」吗？表内词条将一并删除，不可恢复。`}
            actionLabel="删除"
            cancelLabel="取消"
            onAction={() => {
              if (deletingLib) {
                deleteLibrary(deletingLib.id);
                showToast({
                  body: `「${deletingLib.name}」已删除`,
                  type: 'info',
                  uniqueID: 'lib-deleted',
                });
                setDeletingLib(null);
              }
            }}
          />
          <ShareDialog
            library={sharingLib}
            onClose={() => setSharingLib(null)}
            onSave={(scope) => {
              if (sharingLib) {
                updateLibrary(sharingLib.id, {shareScope: scope});
                showToast({
                  body:
                    scope === 'none'
                      ? `「${sharingLib.name}」已取消共享`
                      : `「${sharingLib.name}」已共享至${SHARE_LABEL[scope]}，可在共享词库中查看`,
                  type: 'info',
                  uniqueID: 'lib-shared',
                });
                setSharingLib(null);
              }
            }}
          />
        </LayoutContent>
      }
    />
  );
}

/* ================= 共享设置 ================= */

function ShareDialog({
  library,
  onClose,
  onSave,
}: {
  library: WordLibrary | null;
  onClose: () => void;
  onSave: (scope: ShareScope) => void;
}) {
  const [scope, setScope] = useState<ShareScope>(library?.shareScope ?? 'none');
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  if (library && initializedFor !== library.id) {
    setInitializedFor(library.id);
    setScope(library.shareScope ?? 'none');
  }
  if (!library && initializedFor !== null) {
    setInitializedFor(null);
  }

  return (
    <Dialog isOpen={library != null} onOpenChange={(open) => !open && onClose()} purpose="form" width={420}>
      <DialogHeader title={`共享设置 · ${library?.name ?? ''}`} onOpenChange={(open) => !open && onClose()} />
      <Stack gap={3} align="start" padding={4} width="100%">
        <Selector
          label="共享范围"
          width="100%"
          options={(['none', 'org', 'branch'] as ShareScope[]).map((s) => ({
            value: s,
            label: SHARE_LABEL[s],
          }))}
          value={scope}
          onChange={(v) => setScope(v as ShareScope)}
        />
        <Text type="supporting">
          选择「全机构」或「全分校」后，该单词表将出现在共享词库中，其他老师可查看使用。
        </Text>
        <Stack direction="horizontal" gap={2}>
          <Button label="取消" variant="secondary" onClick={onClose} />
          <Button label="确定" variant="primary" onClick={() => onSave(scope)} />
        </Stack>
      </Stack>
    </Dialog>
  );
}

/* ================= 新建单词表 ================= */

function NewLibraryDialog({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (lib: WordLibrary) => void;
}) {
  const showToast = useToast();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [initialized, setInitialized] = useState(false);
  if (isOpen && !initialized) {
    setInitialized(true);
    setName('');
    setSubject('');
    setCategory('');
  }
  if (!isOpen && initialized) {
    setInitialized(false);
  }

  const submit = () => {
    if (!name.trim()) {
      showToast({body: '请填写单词表名称', type: 'error', uniqueID: 'lib-name-required'});
      return;
    }
    if (!subject) {
      showToast({body: '请选择科目分类', type: 'error', uniqueID: 'lib-subject-required'});
      return;
    }
    if (!category) {
      showToast({body: '请选择科目', type: 'error', uniqueID: 'lib-category-required'});
      return;
    }
    onCreate({
      id: nextId('lib'),
      name: name.trim(),
      subject: subject as WordLibrary['subject'],
      categories: [category as WordLibrary['categories'][number]],
      wordCount: 0,
      isCustom: true,
      owner: CURRENT_TEACHER,
      school: '武汉学校',
      shareScope: 'none',
      createdAt: now(),
      entries: [],
    });
    showToast({
      body: `单词表「${name.trim()}」已创建，可通过批量上传导入词条`,
      type: 'info',
      uniqueID: 'lib-created',
    });
    onOpenChange(false);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={420}>
      <DialogHeader title="新建单词表" onOpenChange={onOpenChange} />
      <Stack gap={3} align="start" padding={4} width="100%">
        <TextInput
          label="单词表名称"
          value={name}
          onChange={setName}
          placeholder="如：雅思阅读高频词·3 月"
          width="100%"
          isRequired
        />
        <Selector
          label="科目分类"
          width="100%"
          options={['雅思', '托福'].map((s) => ({value: s, label: s}))}
          value={subject}
          onChange={setSubject}
          placeholder="请选择"
          isRequired
        />
        <Selector
          label="科目"
          width="100%"
          options={['听力', '阅读', '口语', '写作'].map((c) => ({value: c, label: c}))}
          value={category}
          onChange={setCategory}
          placeholder="请选择"
          isRequired
        />
        <Stack direction="horizontal" gap={2}>
          <Button label="取消" variant="secondary" onClick={() => onOpenChange(false)} />
          <Button label="确定" variant="primary" onClick={submit} />
        </Stack>
      </Stack>
    </Dialog>
  );
}

/* ================= 批量上传（第一步下载模板 / 第二步上传） ================= */

const TEMPLATE_ROWS: unknown[][] = [
  ['单词', '中文释义', '英式音标', '词性', '例句', '例句翻译'],
  ['abandon', '放弃；抛弃', '/əˈbændən/', 'v.', 'He abandoned his plan.', '他放弃了他的计划。'],
  ['benefit', '益处；受益', '/ˈbenɪfɪt/', 'n.', 'Exercise brings many benefits.', '运动带来很多益处。'],
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '单元1');
  XLSX.writeFile(wb, '单词表模板.xlsx');
}

function UploadDialog({
  library,
  isOpen,
  onOpenChange,
  onParsed,
}: {
  library: WordLibrary;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onParsed: (entries: WordEntry[]) => void;
}) {
  const showToast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<WordEntry[]>([]);
  const [parsing, setParsing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  if (isOpen && !initialized) {
    setInitialized(true);
    setFileName('');
    setParsed([]);
    setParsing(false);
  }
  if (!isOpen && initialized) {
    setInitialized(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  const readFile = (f: File | undefined) => {
    if (!f) return;
    const isText = /\.(csv|txt|tsv)$/i.test(f.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const entries = isText
          ? parseImportLines(String(reader.result ?? ''))
          : (() => {
              const wb = XLSX.read(reader.result, {type: 'array'});
              return wb.SheetNames.flatMap((name) =>
                parseSheetRows(
                  XLSX.utils.sheet_to_json(wb.Sheets[name], {header: 1, defval: ''}) as unknown[][],
                ),
              );
            })();
        setFileName(f.name);
        if (entries.length === 0) {
          showToast({
            body: '未解析到有效词条：请使用下载的模板填写（首列英文单词必填）',
            type: 'error',
            uniqueID: 'upload-empty',
          });
          return;
        }
        if (entries.length > 300) {
          showToast({
            body: `每个单词表最多 300 词，当前解析出 ${entries.length} 词`,
            type: 'error',
            uniqueID: 'upload-overflow',
          });
          return;
        }
        setParsed(entries);
        // 解析成功 → loading 模拟系统匹配 → 自动进入确认预览页
        setParsing(true);
        timerRef.current = setTimeout(() => onParsed(entries), 1200);
      } catch {
        setParsed([]);
        setFileName(f.name);
        showToast({
          body: '文件解析失败，请使用模板格式（.xlsx/.csv）',
          type: 'error',
          uniqueID: 'upload-parse-fail',
        });
      }
    };
    if (isText) reader.readAsText(f);
    else reader.readAsArrayBuffer(f);
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={640}>
      <DialogHeader title={`批量上传 · ${library.name}`} onOpenChange={onOpenChange} />
      {parsing ? (
        <Stack gap={3} padding={6} width="100%" align="center">
          <Spinner size="lg" label="正在解析词条并自动匹配缺失字段…" />
          <Text type="supporting">
            {fileName} · 解析出 {parsed.length} 词，即将进入确认页
          </Text>
        </Stack>
      ) : (
        <Stack gap={3} align="start" padding={4} width="100%">
          <Grid columns={2} gap={3} width="100%">
            <Card padding={3} variant="muted" width="100%">
              <Stack gap={2} align="start" width="100%">
                <Heading level={3}>第一步：下载 Excel 模板</Heading>
                <Text type="supporting">请按照模板格式填写词条后再上传</Text>
                <Button label="下载模板" variant="secondary" size="sm" onClick={downloadTemplate} />
              </Stack>
            </Card>
            <Card padding={3} variant="muted" width="100%">
              <Stack gap={2} align="start" width="100%">
                <Heading level={3}>第二步：上传 Excel 文档</Heading>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.tsv"
                  hidden
                  onChange={(e) => readFile(e.target.files?.[0])}
                />
                <Button
                  label="选择文件"
                  variant="primary"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                />
                <Text type="supporting">
                  {fileName
                    ? `${fileName} · 解析出 ${parsed.length} 词`
                    : '未选择文件（支持 .xlsx/.csv，上传后自动解析预览）'}
                </Text>
              </Stack>
            </Card>
          </Grid>
          <Card padding={3} variant="muted" width="100%">
            <Stack gap={1} align="start" width="100%">
              <Text type="supporting">格式说明：</Text>
              <Text type="supporting">· 每个 sheet 即为一个单元，每个单元最多 300 个单词；</Text>
              <Text type="supporting">· 一个单词一行，一行包含：单词、音标、解释、例句、例句翻译；</Text>
              <Text type="supporting">· 如需添加多个例句，请以空格行隔开；</Text>
              <Text type="supporting">
                · 音标、中文释义、例句、例句翻译如未填写，系统将自动匹配；匹配失败的单词可在下一步手动编辑修改。
              </Text>
            </Stack>
          </Card>
          <Button label="取消" variant="secondary" onClick={() => onOpenChange(false)} />
        </Stack>
      )}
    </Dialog>
  );
}

/* ================= 上传后确认生成（可编辑） ================= */

function ImportConfirmView({
  library,
  initialEntries,
  onCancel,
  onConfirm,
}: {
  library: WordLibrary;
  initialEntries: WordEntry[];
  onCancel: () => void;
  onConfirm: (entries: WordEntry[]) => void;
}) {
  const [entries, setEntries] = useState<WordEntry[]>(initialEntries);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack gap={2} align="start" width="100%">
            <Heading level={1}>确认导入 · {library.name}</Heading>
            <Text type="supporting">
              共解析 {entries.length} 条，确认前可编辑或删除；确认后单词表生成完成。
            </Text>
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={3} align="start" width="100%">
            <Table density="balanced" isStriped hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>单词</TableHeaderCell>
                  <TableHeaderCell>中文释义</TableHeaderCell>
                  <TableHeaderCell>英式音标</TableHeaderCell>
                  <TableHeaderCell>词性</TableHeaderCell>
                  <TableHeaderCell>例句</TableHeaderCell>
                  <TableHeaderCell>例句翻译</TableHeaderCell>
                  <TableHeaderCell>操作</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e, i) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.word}</TableCell>
                    <TableCell>{e.meaning}</TableCell>
                    <TableCell>{e.phonetic}</TableCell>
                    <TableCell>{e.pos ?? '-'}</TableCell>
                    <TableCell>{e.example ?? '-'}</TableCell>
                    <TableCell>{e.exampleCn ?? '-'}</TableCell>
                    <TableCell>
                      <Stack direction="horizontal" gap={1}>
                        <Button
                          label="编辑"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(i)}
                        />
                        <Button
                          label="删除"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Stack direction="horizontal" gap={2}>
              <Button label="取消" variant="secondary" onClick={onCancel} />
              <Button
                label={`确认生成（${entries.length} 词）`}
                variant="primary"
                onClick={() => onConfirm(entries)}
              />
            </Stack>
          </Stack>

          {editingIndex !== null && entries[editingIndex] && (
            <ConfirmEntryDialog
              entry={entries[editingIndex]}
              isOpen
              onOpenChange={(open) => !open && setEditingIndex(null)}
              onSave={(updated) => {
                setEntries((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                setEditingIndex(null);
              }}
            />
          )}
        </LayoutContent>
      }
    />
  );
}

/** 确认页行编辑：6 字段 */
function ConfirmEntryDialog({
  entry,
  isOpen,
  onOpenChange,
  onSave,
}: {
  entry: WordEntry;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: WordEntry) => void;
}) {
  const showToast = useToast();
  const [form, setForm] = useState(entry);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  if (isOpen && initializedFor !== entry.id) {
    setInitializedFor(entry.id);
    setForm(entry);
  }
  if (!isOpen && initializedFor !== null) {
    setInitializedFor(null);
  }
  const set = (patch: Partial<WordEntry>) => setForm((f) => ({...f, ...patch}));

  const submit = () => {
    if (!form.word.trim()) {
      showToast({body: '请填写单词', type: 'error', uniqueID: 'confirm-word-required'});
      return;
    }
    onSave({...form, word: form.word.trim()});
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader title={`编辑词条 · ${entry.word}`} onOpenChange={onOpenChange} />
      <Stack gap={3} align="start" padding={4} width="100%">
        <TextInput
          label="英文单词"
          value={form.word}
          onChange={(v) => set({word: v})}
          width="100%"
          isRequired
        />
        <TextInput
          label="中文释义"
          value={form.meaning}
          onChange={(v) => set({meaning: v})}
          width="100%"
        />
        <TextInput
          label="英式音标"
          value={form.phonetic}
          onChange={(v) => set({phonetic: v})}
          width="100%"
        />
        <TextInput
          label="词性"
          value={form.pos ?? ''}
          onChange={(v) => set({pos: v})}
          width="100%"
        />
        <TextArea
          label="例句"
          value={form.example ?? ''}
          onChange={(v) => set({example: v})}
          rows={2}
          width="100%"
        />
        <TextArea
          label="例句翻译"
          value={form.exampleCn ?? ''}
          onChange={(v) => set({exampleCn: v})}
          rows={2}
          width="100%"
        />
        <Stack direction="horizontal" gap={2}>
          <Button label="取消" variant="secondary" onClick={() => onOpenChange(false)} />
          <Button label="确定" variant="primary" onClick={submit} />
        </Stack>
      </Stack>
    </Dialog>
  );
}

/* ================= 词条详情 ================= */

function LibraryDetail({library, onBack}: {library: WordLibrary; onBack: () => void}) {
  const showToast = useToast();
  const {deleteEntry} = useStore();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WordEntry | null>(null);
  const [deleting, setDeleting] = useState<WordEntry | null>(null);

  const kw = keyword.trim().toLowerCase();
  const filtered = library.entries.filter(
    (e) =>
      kw === '' ||
      e.word.toLowerCase().includes(kw) ||
      e.meaning.includes(keyword.trim()),
  );
  const pageEntries = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isCustom = Boolean(library.isCustom);

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack gap={2} align="start" width="100%">
            <Stack direction="horizontal" gap={2} vAlign="center">
              <IconButton
                label="返回单词列表"
                icon={<Icon icon="chevronLeft" />}
                variant="ghost"
                onClick={onBack}
              />
              <Heading level={1}>{library.name}</Heading>
            </Stack>
            <Text type="supporting">
              {isCustom ? '自定义词库' : '系统词库'} · 创建于 {library.createdAt} · 共{' '}
              {library.wordCount.toLocaleString()} 词
            </Text>
          </Stack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={4}>
          <Stack gap={3} align="start" width="100%">
            <Stack direction="horizontal" gap={2} width="100%" vAlign="center">
              <TextInput
                label="搜索词条"
                value={keyword}
                onChange={(v) => {
                  setKeyword(v);
                  setPage(1);
                }}
                placeholder="请输入单词或释义"
                width={260}
                isLabelHidden
              />
              {isCustom && (
                <Button
                  label="新建单词"
                  variant="primary"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                />
              )}
            </Stack>
            <Table density="balanced" isStriped hasHover>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>单词</TableHeaderCell>
                  <TableHeaderCell>英式音标</TableHeaderCell>
                  <TableHeaderCell>中文释义</TableHeaderCell>
                  <TableHeaderCell>词性</TableHeaderCell>
                  {isCustom ? (
                    <>
                      <TableHeaderCell>例句</TableHeaderCell>
                      <TableHeaderCell>例句翻译</TableHeaderCell>
                    </>
                  ) : (
                    <>
                      <TableHeaderCell>CEFR</TableHeaderCell>
                      <TableHeaderCell>科目</TableHeaderCell>
                      <TableHeaderCell>话题</TableHeaderCell>
                      <TableHeaderCell>雅思档位</TableHeaderCell>
                    </>
                  )}
                  <TableHeaderCell>操作</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.word}</TableCell>
                    <TableCell>{entry.phonetic}</TableCell>
                    <TableCell>{entry.meaning}</TableCell>
                    <TableCell>{entry.pos ?? '-'}</TableCell>
                    {isCustom ? (
                      <>
                        <TableCell>{entry.example ?? '-'}</TableCell>
                        <TableCell>{entry.exampleCn ?? '-'}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{entry.cefr ?? '-'}</TableCell>
                        <TableCell>{entry.category ?? '-'}</TableCell>
                        <TableCell>{entry.topic ?? '-'}</TableCell>
                        <TableCell>{entry.band ?? '-'}</TableCell>
                      </>
                    )}
                    <TableCell>
                      <Stack direction="horizontal" gap={1}>
                        <Button
                          label="编辑"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(entry);
                            setFormOpen(true);
                          }}
                        />
                        <Button
                          label="删除"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(entry)}
                        />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {pageEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={isCustom ? 7 : 9}>
                      <Text type="supporting">
                        {keyword
                          ? '没有匹配的词条'
                          : isCustom
                            ? '暂无词条，可通过批量上传导入'
                            : '暂无词条'}
                      </Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Stack direction="horizontal" justify="end" width="100%" vAlign="center">
              <Pagination
                page={page}
                onChange={setPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                variant="compact"
              />
            </Stack>
          </Stack>

          <WordFormDialog
            editing={editing}
            library={library}
            isOpen={formOpen}
            onOpenChange={setFormOpen}
          />
          <AlertDialog
            isOpen={deleting !== null}
            onOpenChange={(open) => !open && setDeleting(null)}
            title="删除单词"
            description={`确定删除「${deleting?.word ?? ''}」吗？删除后不可恢复。`}
            actionLabel="删除"
            cancelLabel="取消"
            onAction={() => {
              if (deleting) {
                deleteEntry(library.id, deleting.id);
                showToast({
                  body: `「${deleting.word}」已删除`,
                  type: 'info',
                  uniqueID: 'entry-deleted',
                });
                setDeleting(null);
              }
            }}
          />
        </LayoutContent>
      }
    />
  );
}

/* ================= 新建/编辑单词（系统 12 字段 / 自定义 6 字段） ================= */

interface WordForm {
  word: string;
  meaning: string;
  phonetic: string;
  audioUrl: string;
  videoUrl: string;
  pos: string;
  example: string;
  exampleCn: string;
  cefr: string;
  category: string;
  topic: string;
  band: string;
}

const EMPTY_FORM: WordForm = {
  word: '',
  meaning: '',
  phonetic: '',
  audioUrl: '',
  videoUrl: '',
  pos: '',
  example: '',
  exampleCn: '',
  cefr: '',
  category: '',
  topic: '',
  band: '',
};

function WordFormDialog({
  editing,
  library,
  isOpen,
  onOpenChange,
}: {
  editing: WordEntry | null;
  library: WordLibrary;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const showToast = useToast();
  const {importEntries, updateEntry} = useStore();
  const [form, setForm] = useState<WordForm>(EMPTY_FORM);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const isCustom = Boolean(library.isCustom);

  // 打开时按新建/编辑初始化（仅一次）
  if (isOpen && initializedFor !== (editing?.id ?? 'new')) {
    setInitializedFor(editing?.id ?? 'new');
    setForm(
      editing
        ? {
            word: editing.word,
            meaning: editing.meaning,
            phonetic: editing.phonetic,
            audioUrl: editing.audioUrl ?? '',
            videoUrl: editing.videoUrl ?? '',
            pos: editing.pos ?? '',
            example: editing.example ?? '',
            exampleCn: editing.exampleCn ?? '',
            cefr: editing.cefr ?? '',
            category: editing.category ?? '',
            topic: editing.topic ?? '',
            band: editing.band != null ? String(editing.band) : '',
          }
        : EMPTY_FORM,
    );
  }
  if (!isOpen && initializedFor !== null) {
    setInitializedFor(null);
  }

  const set = (patch: Partial<WordForm>) => setForm((f) => ({...f, ...patch}));

  const submit = () => {
    if (!form.word.trim()) {
      showToast({body: '请填写单词', type: 'error', uniqueID: 'form-word-required'});
      return;
    }
    const bandNum = form.band.trim() === '' ? undefined : Number(form.band);
    if (!isCustom && bandNum !== undefined && (Number.isNaN(bandNum) || bandNum < 4 || bandNum > 9)) {
      showToast({body: '雅思档位应为 5.0–8.0 之间的数字', type: 'error', uniqueID: 'form-band'});
      return;
    }
    const entry: WordEntry = {
      id: editing?.id ?? nextId('w'),
      word: form.word.trim(),
      meaning: form.meaning.trim() || '（待补充释义）',
      phonetic: form.phonetic.trim() || `/${form.word.trim().toLowerCase()}/`,
      audioUrl: isCustom ? undefined : form.audioUrl.trim() || undefined,
      videoUrl: isCustom ? undefined : form.videoUrl.trim() || undefined,
      pos: form.pos.trim() || undefined,
      example: form.example.trim() || undefined,
      exampleCn: form.exampleCn.trim() || undefined,
      cefr: isCustom ? undefined : form.cefr || undefined,
      category: isCustom ? undefined : (form.category as Category) || undefined,
      topic: isCustom ? undefined : form.topic.trim() || undefined,
      band: isCustom ? undefined : bandNum,
    };
    if (editing) {
      updateEntry(library.id, entry);
      showToast({body: `「${entry.word}」已更新`, type: 'info', uniqueID: 'form-updated'});
    } else {
      importEntries(library.id, [entry], 1);
      showToast({
        body: `「${entry.word}」已创建，收入「${library.name}」`,
        type: 'info',
        uniqueID: 'form-created',
      });
    }
    onOpenChange(false);
  };

  const uploadToast = (label: string) =>
    showToast({
      body: `演示环境不支持文件上传，请直接粘贴${label} URL`,
      type: 'info',
      uniqueID: `upload-${label}`,
    });

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="form" width={480}>
      <DialogHeader
        title={editing ? `编辑单词 · ${editing.word}` : '新建单词'}
        onOpenChange={onOpenChange}
      />
      <Stack gap={3} align="start" padding={4} width="100%">
        <TextInput
          label="英文单词"
          value={form.word}
          onChange={(v) => set({word: v})}
          placeholder="请输入单词"
          width="100%"
          isRequired
        />
        <TextInput
          label="中文释义"
          value={form.meaning}
          onChange={(v) => set({meaning: v})}
          placeholder="请输入中文释义"
          width="100%"
        />
        <TextInput
          label="英式音标"
          value={form.phonetic}
          onChange={(v) => set({phonetic: v})}
          placeholder="请输入英式音标"
          width="100%"
        />
        <TextInput
          label="词性"
          value={form.pos}
          onChange={(v) => set({pos: v})}
          placeholder="请输入词性"
          width="100%"
        />
        <TextArea
          label="例句"
          value={form.example}
          onChange={(v) => set({example: v})}
          placeholder="请输入例句"
          rows={2}
          width="100%"
        />
        <TextArea
          label="例句翻译"
          value={form.exampleCn}
          onChange={(v) => set({exampleCn: v})}
          placeholder="请输入例句翻译"
          rows={2}
          width="100%"
        />
        {!isCustom && (
          <>
            <Stack direction="horizontal" gap={2} vAlign="end" width="100%">
              <TextInput
                label="英式发音音频"
                value={form.audioUrl}
                onChange={(v) => set({audioUrl: v})}
                placeholder="请输入或上传英式发音音频 URL"
                width="100%"
              />
              <Button label="上传" variant="secondary" size="sm" onClick={() => uploadToast('音频')} />
            </Stack>
            <Stack direction="horizontal" gap={2} vAlign="end" width="100%">
              <TextInput
                label="视频"
                value={form.videoUrl}
                onChange={(v) => set({videoUrl: v})}
                placeholder="请输入或上传视频 URL"
                width="100%"
              />
              <Button label="上传" variant="secondary" size="sm" onClick={() => uploadToast('视频')} />
            </Stack>
            <Selector
              label="CEFR 等级"
              width="100%"
              options={CEFR_OPTIONS.map((c) => ({value: c, label: c}))}
              value={form.cefr}
              onChange={(v) => set({cefr: v})}
              placeholder="请选择 CEFR 等级"
            />
            <Selector
              label="科目"
              width="100%"
              options={CATEGORY_OPTIONS.map((c) => ({value: c, label: c}))}
              value={form.category}
              onChange={(v) => set({category: v})}
              placeholder="请选择科目"
            />
            <TextInput
              label="话题"
              value={form.topic}
              onChange={(v) => set({topic: v})}
              placeholder="请输入话题"
              width="100%"
            />
            <TextInput
              label="雅思档位"
              value={form.band}
              onChange={(v) => set({band: v})}
              placeholder="如：5.0 / 6.0"
              width="100%"
            />
          </>
        )}
        <Stack direction="horizontal" gap={2}>
          <Button label="取消" variant="secondary" onClick={() => onOpenChange(false)} />
          <Button label="确定" variant="primary" onClick={submit} />
        </Stack>
      </Stack>
    </Dialog>
  );
}
