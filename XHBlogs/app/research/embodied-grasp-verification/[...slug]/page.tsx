import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import { BackgroundPlaybackButton } from '../../../../components/BackgroundPlayback';
import categories from '../../../../data/grasp-verification-papers.json';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from '../../../../lib/renderMarkdown.mjs';

const topic = '/research/embodied-grasp-verification';
const overview = '/posts/embodied-grasp-verification/';
const linkStyle = 'text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:decoration-current dark:text-indigo-300';

type Props = { params: Promise<{ slug: string[] }> };
type Paper = (typeof categories)[number]['papers'][number];

export const dynamicParams = false;

export function generateStaticParams() {
  return categories.flatMap(category => [
    { slug: [category.id] },
    ...category.papers.map(paper => ({ slug: [category.id, paper.id] })),
  ]);
}

async function getEntry({ params }: Props) {
  const [categoryId, paperId, ...rest] = (await params).slug;
  const category = categories.find(item => item.id === categoryId);
  if (!category || rest.length) notFound();
  const paper = category.papers.find(item => item.id === paperId);
  if (paperId && !paper) notFound();
  return { category, paper };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { category, paper } = await getEntry(props);
  return { title: `${paper?.title ?? category.name}｜具身幻觉与主动补证` };
}

function PaperList({ title, papers, categoryUrl }: { title: string; papers: Paper[]; categoryUrl: string }) {
  if (!papers.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-2 divide-y divide-slate-300/60 dark:divide-slate-700">
        {papers.map(paper => (
          <li key={paper.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 py-4">
            <div className="min-w-0 break-words">
              <a className={linkStyle} href={paper.url}>{paper.title}</a>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {[paper.year, paper.venue, paper.scope].filter(Boolean).join(' · ')}
              </p>
            </div>
            <Link className={`whitespace-nowrap text-sm ${linkStyle}`} href={`${categoryUrl}${paper.id}/`} aria-label={`${paper.title} 的笔记入口`}>
              笔记入口
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ResearchPage(props: Props) {
  const { category, paper } = await getEntry(props);
  const categoryUrl = `${topic}/${category.id}/`;
  const failBench = categories.find(item => item.id === 'benchmarks')?.papers.find(item => item.title.startsWith('FailBench:'));
  let noteHtml = '';
  if (paper) {
    try {
      const markdown = await readFile(path.join(process.cwd(), 'research-notes', `${paper.id}.md`), 'utf8');
      noteHtml = await renderMarkdown(markdown.replace(
        '[已有 RE10K 记录](stress_round/低覆盖重建实验记录.md)',
        '已有 RE10K 记录（本地文档《低覆盖重建实验记录》）',
      ));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="rounded-3xl border border-white/50 bg-white/75 p-5 text-slate-900 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 sm:p-8">
          <nav aria-label="专题导航" className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <Link className={linkStyle} href={overview}>具身幻觉与主动补证</Link>
            {paper && <Link className={linkStyle} href={categoryUrl}>{category.name}</Link>}
          </nav>
          <h1 className="break-words text-2xl font-bold leading-snug md:text-4xl">{paper?.title ?? category.name}</h1>
          {paper ? (
            <>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                {[paper.year, paper.venue, paper.scope].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <a className={linkStyle} href={paper.url}>阅读原文</a>
                <BackgroundPlaybackButton />
              </div>
              {noteHtml ? (
                <>
                  <style>{`
                    .research-note { overflow-wrap: anywhere; }
                    .research-note table { display: block; max-width: 100%; overflow-x: auto; }
                    .research-note th, .research-note td { min-width: 7rem; padding: 0.6rem; vertical-align: top; }
                    .research-note .katex-display { max-width: 100%; overflow-x: auto; overflow-y: hidden; padding-block: 0.4rem; }
                    .research-note pre { overflow-x: auto; }
                  `}</style>
                  <article className="research-note prose prose-slate dark:prose-invert mt-8 max-w-none border-t border-slate-300/60 pt-5 dark:border-slate-700" dangerouslySetInnerHTML={{ __html: noteHtml }} />
                </>
              ) : (
                <p className="mt-8 border-t border-slate-300/60 pt-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">笔记待补充。</p>
              )}
            </>
          ) : (
            <>
              <dl className="mt-5 space-y-4">
                <div><dt className="font-semibold">主要贡献</dt><dd className="mt-1">{category.contribution}</dd></div>
                <div><dt className="font-semibold">通常需要证明什么</dt><dd className="mt-1">{category.evidence}</dd></div>
              </dl>
              {category.note && <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">{category.note}</p>}
              {category.id === 'reproduction' && failBench && (
                <p className="mt-3">
                  <a className={linkStyle} href={failBench.url}>{failBench.title}</a>
                  {' · '}
                  <Link className={linkStyle} href={`${topic}/benchmarks/${failBench.id}/`}>笔记入口</Link>
                </p>
              )}
              <PaperList title="代表论文" papers={category.papers.filter(item => !item.supplemental)} categoryUrl={categoryUrl} />
              <PaperList title="预印本与研讨会" papers={category.papers.filter(item => item.supplemental)} categoryUrl={categoryUrl} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
