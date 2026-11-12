import type { FishboneDiagnostic } from './diagnosticTypes';

export function FishboneDiagnosticCard({ diagnostic }: { diagnostic: FishboneDiagnostic }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">{diagnostic.title}</h3>
          <p className="mt-1 text-sm leading-7 text-slate-500">{diagnostic.caution}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">أسباب محتملة لا أحكام قطعية</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {diagnostic.categories.map((category) => (
          <div key={category.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <h4 className="font-black text-slate-900">{category.title}</h4>
            {category.evidence ? <p className="mt-1 text-xs font-bold leading-6 text-slate-500">{category.evidence}</p> : null}
            <ul className="mt-2 space-y-1 text-sm leading-7 text-slate-700">
              {category.prompts.map((prompt) => <li key={prompt}>• {prompt}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
