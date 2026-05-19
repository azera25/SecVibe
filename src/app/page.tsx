'use client';

import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import Preview from '@/components/Preview';
import Terminal from '@/components/Terminal';

export default function HomePage() {
  return (
    <div className="flex h-full">
      <Sidebar />

      <main className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex flex-1 flex-col overflow-hidden border-b border-hacker-border p-2 lg:border-b-0 lg:border-r lg:p-3">
          <Editor />
        </section>

        <section className="flex flex-1 flex-col overflow-hidden lg:max-w-[40%]">
          <div className="flex flex-1 flex-col gap-0">
            <div className="flex-1 overflow-hidden p-2 pb-1 lg:p-3 lg:pb-1.5">
              <Preview />
            </div>
            <div className="flex-1 overflow-hidden p-2 pt-1 lg:p-3 lg:pt-1.5">
              <Terminal />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
