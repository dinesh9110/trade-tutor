import React, { useState, useEffect } from "react";
import { Users, Code, Plus, RefreshCw, Send, CheckCircle, Github, Award } from "lucide-react";
import { TeamMemberRequest, UserProfile } from "../types";
import { subscribeCollabs, addCollabToDb, joinCollabInDb } from "../firebaseService";

interface ProjectsProps {
  userRef: UserProfile;
}

export default function Projects({ userRef }: ProjectsProps) {
  const [collabs, setCollabs] = useState<TeamMemberRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [skills, setSkills] = useState("");
  const [limit, setLimit] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollabs((updated) => {
      setCollabs(updated);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handlePostCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setErrorMsg("Title is required.");
      return;
    }

    try {
      const collabData = {
        title,
        projectDescription: desc,
        requiredSkills: skills.split(",").map(s => s.trim()).filter(Boolean),
        membersLimit: Number(limit) || 3,
        creatorId: userRef.id,
        creatorName: userRef.name,
        creatorAvatar: userRef.avatar,
        status: "Open" as const,
        membersCount: 1
      };
      await addCollabToDb(collabData);
      setShowAddModal(false);
      setTitle("");
      setDesc("");
      setSkills("");
      setLimit("");
    } catch (err) {
      setErrorMsg("Failed to connect with database.");
    }
  };

  const mentors = [
    {
      name: "Dr. Dave Kernighan",
      role: "Visiting Research Mentor",
      avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=150",
      rating: 4.9,
      subjects: ["Systems programming", "C/C++ Compiler optimization", "TCP/IP Networks"],
      bio: "Retired principal systems engineer. Happy to supervise capstones or resolve thorny OS kernel bugs with smart students."
    },
    {
      name: "Prof. Priya Srinivasan",
      role: "Associate Professor (AI / Algorithms)",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
      rating: 4.8,
      subjects: ["Recursive Adversarial Search", "Heuristics", "Pruning Algorithms"],
      bio: "Active AI researcher. Mentoring undergraduate capstones building multi-modal models or localized student aid vectors."
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Project Teammates & Mentor Hub
          </h2>
          <p className="text-xs text-slate-400">Assemble elite engineering squads for college capstones, startups, or local hackathons.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Propose Team Assembly
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Teammate finder list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-sm text-slate-300">Active Campus Teammate Boards</h3>
            <button disabled={loading} className="p-1.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-slate-500">Scanning campus boards...</div>
          ) : collabs.length === 0 ? (
            <div className="p-10 bg-slate-900/10 border border-slate-800 text-center text-slate-500 text-xs rounded-xl">
              No teammate requests found. Kickstart your own project!
            </div>
          ) : (
            <div className="space-y-4">
              {collabs.map(col => (
                <div key={col.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 hover:border-slate-750 transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white text-base">{col.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{col.projectDescription}</p>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[10px] rounded-full">
                        {col.membersCount} / {col.membersLimit} Enrolled
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {col.requiredSkills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-950 text-slate-400 hover:text-indigo-300 border border-slate-800/80 rounded text-[9px] font-mono">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <img src={col.creatorAvatar} className="w-5 h-5 rounded-full object-cover border border-slate-700" alt={col.creatorName} />
                      <span className="text-[10px] font-medium text-slate-300">Formed by: {col.creatorName}</span>
                    </div>

                    {col.creatorId === userRef.id ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> You lead this project
                      </span>
                    ) : (
                      <button 
                        onClick={async () => {
                          if (col.membersCount >= col.membersLimit) {
                            alert("This project group has already hit its member limits.");
                            return;
                          }
                          try {
                            await joinCollabInDb(col.id, col.membersCount);
                            alert(`You have enrolled in the group! Coordinate with creator ${col.creatorName}.`);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg transition"
                      >
                        Request to Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mentor Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="font-sans font-semibold text-white flex items-center gap-1.5 text-xs uppercase tracking-wider mb-3">
              <Award className="w-4 h-4 text-emerald-400" />
              Verified Advisor Network
            </h3>

            <div className="space-y-4">
              {mentors.map(m => (
                <div key={m.name} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <img src={m.avatar} className="w-8 h-8 rounded-full object-cover" alt={m.name} />
                    <div>
                      <h4 className="font-semibold text-white text-xs">{m.name}</h4>
                      <p className="text-[10px] text-slate-400">{m.role}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-350 leading-normal italic">"{m.bio}"</p>

                  <div className="flex flex-wrap gap-1">
                    {m.subjects.map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-[8px] font-mono rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  <button 
                    onClick={() => alert("Successfully reserved technical consulting session with " + m.name + ". Details forwarded to your college email address.")}
                    className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold rounded-lg transition"
                  >
                    Schedule Consultation
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Assembly Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Propose Project Team Assembly</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handlePostCollab} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-400 text-xs border border-red-500/20 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Project Title *</label>
                <input
                  type="text"
                  placeholder="e.g. AR Campus Directions Mobile Overlay App"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Target Teammate Size</label>
                  <input
                    type="number"
                    placeholder="e.g. 4"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Framer Stack Tags</label>
                  <label className="text-[8px] text-slate-400">Comma separated skills</label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Required Skills *</label>
                <input
                  type="text"
                  placeholder="e.g. React, Flutter, Python, JAX"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Project Pitch Description</label>
                <textarea
                  placeholder="Describe what you plan to build, scope, technology stack, target competition deadlines, and visual milestones..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium text-xs rounded-xl hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-xl transition cursor-pointer"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
