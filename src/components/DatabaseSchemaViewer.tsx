import React, { useState } from "react";
import { DATABASE_SCHEMA_BLUEPRINT, SHAZAM_CHORDS_METRIC } from "../data";
import { Database, Search, Terminal, Server, Code, Layers } from "lucide-react";

export function DatabaseSchemaViewer() {
  const [selectedTableIdx, setSelectedTableIdx] = useState<number>(0);
  const [isQueryPending, setIsQueryPending] = useState<boolean>(false);
  const [queryOutput, setQueryOutput] = useState<string | null>(null);

  const selectedTable = DATABASE_SCHEMA_BLUEPRINT[selectedTableIdx];

  const handleRunQuery = () => {
    setIsQueryPending(true);
    setQueryOutput(null);
    setTimeout(() => {
      setIsQueryPending(false);
      setQueryOutput(selectedTable.sampleResult);
    }, 800);
  };

  return (
    <div className="bg-[#161B22] rounded-xl border border-gray-800 p-6 shadow-xl" id="database-schema-explorer">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="text-cyan-400" size={18} />
            <h3 className="text-lg font-sans font-medium text-white">Production Database Schema &amp; API Explorer</h3>
          </div>
          <p className="text-xs text-gray-400 max-w-xl">
            Inspect our hybrid database architecture designed for rapid lookups. Select tables to run test queries and preview structural JSON outputs.
          </p>
        </div>
        
        {/* Total index weight footnote */}
        <div className="bg-cyan-950/20 text-cyan-400 border border-cyan-500/15 rounded-lg px-3 py-1.5 max-w-xs text-[10px] font-mono leading-relaxed">
          {SHAZAM_CHORDS_METRIC}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Selector Column (L: 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <span className="text-xxs font-mono text-gray-500 uppercase tracking-widest pl-1 mb-1 font-bold">
            Data Relations
          </span>
          {DATABASE_SCHEMA_BLUEPRINT.map((table, i) => (
            <button
              key={table.name}
              onClick={() => {
                setSelectedTableIdx(i);
                setQueryOutput(null);
              }}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedTableIdx === i
                  ? "bg-cyan-950/20 border-cyan-500/30 text-white"
                  : "bg-[#0B0C10] border-gray-800 text-gray-300 hover:bg-gray-800/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${selectedTableIdx === i ? "bg-cyan-400 animate-pulse" : "bg-gray-700"}`} />
                <h4 className="text-xs font-mono font-semibold truncate leading-none capitalize">
                  {table.name}
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                {table.description}
              </p>
            </button>
          ))}
        </div>

        {/* Details & Query Runner Column (R: 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5">
            {/* Table Spec Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3 mb-4">
              <h4 className="text-xs font-mono font-bold text-gray-200">
                Table Structure: <span className="text-cyan-400">{selectedTable.name}</span>
              </h4>
              <span className="text-[10px] font-mono text-gray-400 bg-slate-950 border border-gray-800 px-2 py-0.5 rounded uppercase">
                {selectedTable.name.includes("NoSQL") ? "NoSQL BSON/JSON" : "Relational PostgreSQL"}
              </span>
            </div>

            {/* Column Field Spec List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 bg-[#0B0C10]">
                    <th className="py-2.5 px-3">FIELD / COLUMN</th>
                    <th className="py-2.5 px-3">DATA TYPE</th>
                    <th className="py-2.5 px-3">CONSTRAINTS</th>
                    <th className="py-2.5 px-3">FIELD DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-300">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-white/[2%]">
                      <td className="py-2 px-3 font-semibold text-emerald-400">{col.name}</td>
                      <td className="py-2 px-3 text-cyan-400">{col.type}</td>
                      <td className="py-2 px-3 text-purple-300 select-all">{col.constraints || "-"}</td>
                      <td className="py-2 px-3 text-gray-400 font-sans leading-relaxed">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Code Sandbox Query Execution Block */}
          <div className="bg-[#0B0C10] rounded-xl border border-gray-800 p-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <h4 className="text-xs font-sans font-medium text-gray-300 flex items-center gap-1.5">
                <Terminal size={14} className="text-cyan-400" />
                Query Execution Simulator
              </h4>
              <button
                id="run-db-query-sim"
                onClick={handleRunQuery}
                disabled={isQueryPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs px-3.5 py-1 rounded font-medium transition-all shadow shadow-emerald-900/15"
              >
                {isQueryPending ? "Executing..." : "Run Query Simulation"}
              </button>
            </div>

            {/* SQL Block display */}
            <pre className="bg-[#050608] text-gray-300 p-4 rounded-lg font-mono text-[11px] leading-relaxed border border-gray-800 select-all overflow-x-auto mb-4">
              {selectedTable.sampleQuery}
            </pre>

            {/* Query result output console */}
            {(queryOutput || isQueryPending) && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <div className="bg-black/40 rounded-lg p-4 border border-emerald-950/30">
                  <span className="text-[10px] font-mono text-emerald-400 block mb-2">
                    CONSOLE RESULT: SUCCESS (2 rows returned in {Math.floor(Math.random() * 20) + 5}ms)
                  </span>
                  
                  {isQueryPending ? (
                    <div className="h-20 flex items-center justify-center">
                      <span className="text-gray-500 animate-pulse font-mono text-xs">Awaiting Cloud Storage response...</span>
                    </div>
                  ) : (
                    <pre className="text-cyan-400 font-mono text-[11px] leading-relaxed select-all overflow-x-auto">
                      {queryOutput}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
export default DatabaseSchemaViewer;
