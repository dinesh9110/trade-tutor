import { useState, useEffect } from "react";
import { Briefcase, MapPin, IndianRupee, Bookmark, Send, CheckCircle, Search, RefreshCw, BookmarkCheck } from "lucide-react";
import { InternshipListing } from "../types";

export default function Internships() {
  const [jobs, setJobs] = useState<InternshipListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/internships");
      const data = await res.json();
      if (data.status === "success") {
        setJobs(data.internships);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleApply = async (id: string) => {
    try {
      const res = await fetch(`/api/internships/${id}/apply`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        alert("Your application request has been dispatched to Company HR! Track its active state under the Pipeline Overview.");
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`/api/internships/${id}/save`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.company.toLowerCase().includes(search.toLowerCase()) ||
                          j.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "All" || j.type === filterType;
    return matchesSearch && matchesType;
  });

  // Track counts
  const savedJobs = jobs.filter(j => j.saved);
  const appliedJobs = jobs.filter(j => j.applied);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Vetted College Internship Pipelines
          </h2>
          <p className="text-xs text-slate-400">Secure entry-level, remote, or hybrid engineering and PM opportunities from verified university partners.</p>
        </div>

        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-indigo-400 font-bold font-sans text-sm">{appliedJobs.length}</div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Applied</span>
          </div>
          <div className="text-center px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="text-amber-400 font-bold font-sans text-sm">{savedJobs.length}</div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved jobs</span>
          </div>
        </div>
      </div>

      {/* Grid Overview application tracking pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["Saved", "Applied", "Interviewing", "Offered"].map(step => {
          const stepJobs = jobs.filter(j => j.status === step || (step === "Applied" && j.applied && j.status !== "Interviewing" && j.status !== "Offered"));
          return (
            <div key={step} className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-805">
                <span className="text-xs font-semibold text-white">{step}</span>
                <span className="text-[10px] bg-slate-950 text-slate-500 px-2 py-0.5 rounded-full font-bold">{stepJobs.length}</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {stepJobs.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic py-3 text-center">Empty pipeline step</div>
                ) : (
                  stepJobs.map(j => (
                    <div key={j.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1">
                      <div className="font-semibold text-white truncate">{j.title}</div>
                      <div className="text-indigo-400 font-medium">{j.company}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search job titles, skills, stacks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 focus:outline-none transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {["All", "Remote", "Hybrid", "Full-time", "Part-time"].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filterType === type 
                  ? "bg-indigo-600 text-white" 
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {type}
            </button>
          ))}

          <button onClick={fetchJobs} className="p-1.5 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-lg transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Internship Cards List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">No opportunities found matching these criteria.</div>
        ) : (
          filteredJobs.map(j => (
            <div key={j.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-750 transition">
              <div className="space-y-2.5 max-w-xl">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white text-base">{j.title}</h3>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[10px] font-mono rounded font-bold">
                    {j.type}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span className="font-semibold text-indigo-300">{j.company}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {j.location}</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">{j.stipend}</span>
                </div>

                <p className="text-xs text-slate-350 leading-relaxed">{j.description}</p>

                {/* Requirements bullets */}
                <div className="flex flex-wrap gap-1.5">
                  {j.requirements.map(req => (
                    <span key={req} className="px-2.5 py-1 bg-slate-950 text-slate-450 border border-slate-800/80 rounded text-[9.5px] font-mono hover:text-indigo-300">
                      • {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex md:flex-col gap-2 w-full md:w-auto flex-shrink-0">
                <button
                  onClick={() => handleSave(j.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                    j.saved 
                      ? "bg-amber-600/10 border-amber-500/20 text-amber-400" 
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {j.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => handleApply(j.id)}
                  disabled={j.applied}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    j.applied 
                      ? "bg-slate-850 hover:bg-slate-800 text-emerald-400 border border-emerald-500/15" 
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                  }`}
                >
                  {j.applied ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {j.applied ? "Applied" : "Apply Instantly"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
