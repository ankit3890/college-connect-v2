"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  // Unwrap params using React.use()
  const { username } = use(params);
  
  const [profile, setProfile] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState("");
  const [editHobbies, setEditHobbies] = useState("");
  const [editFile, setEditFile] = useState<File|null>(null);

  useEffect(() => {
    fetch("/api/user/me").then(r => r.json()).then(d => setMe(d.user));
    loadProfile();
  }, [username]);

  const loadProfile = () => {
      fetch("/api/user/profile", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ username })
      })
      .then(r => r.json())
      .then(data => {
          if(data.success) {
              setProfile(data.data);
              setEditAbout(data.data.about || "");
              setEditHobbies(data.data.hobbies || "");
          }
          setLoading(false);
      });
  };

  const saveProfile = async () => {
      const fd = new FormData();
      fd.append("username", me.username);
      fd.append("about", editAbout);
      fd.append("hobbies", editHobbies);
      if(editFile) fd.append("avatar", editFile);

      await fetch("/api/user/update", { method: "POST", body: fd });
      setIsEditing(false);
      loadProfile();
      // Reload page to reflect avatar in header potentially
      // location.reload(); 
  };
  
  const startChat = () => {
      alert("Chat feature connecting... Use Admin > Chat for now or go to Global Chat.");
      // Ideally router.push to a chat page with query param
  };

  if(loading) return <div className="p-10 text-center">Loading profile...</div>;
  if(!profile) return <div className="p-10 text-center">User not found</div>;

  const isMe = me?.username === profile.username;

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-6 mb-8">
            <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-purple-500 to-blue-500">
                <img 
                    src={profile.avatar || "https://via.placeholder.com/150"} 
                    className="w-full h-full rounded-full object-cover border-4 border-white dark:border-zinc-800"
                />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{profile.username}</h1>
                <p className="text-zinc-500 mt-2">Member of College Connect</p>
                
                {isMe && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-sm font-semibold transition-colors">
                        Edit Profile
                    </button>
                )}
                
                {!isMe && (
                     <button onClick={startChat} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                        Message
                     </button>
                )}
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">About</label>
                {isEditing ? (
                    <textarea 
                        className="w-full p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700" 
                        rows={4}
                        value={editAbout}
                        onChange={e => setEditAbout(e.target.value)}
                    />
                ) : (
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                        {profile.about || "No bio yet."}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Hobbies / Interests</label>
                 {isEditing ? (
                    <input 
                        className="w-full p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700" 
                        value={editHobbies}
                        onChange={e => setEditHobbies(e.target.value)}
                    />
                ) : (
                    <p className="text-zinc-700 dark:text-zinc-300">
                        {profile.hobbies || "None listed."}
                    </p>
                )}
            </div>
            
            {isEditing && (
                <div>
                     <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">Change Profile Picture</label>
                     <input type="file" onChange={e => setEditFile(e.target.files?.[0] || null)} />
                </div>
            )}
        </div>

        {isEditing && (
            <div className="mt-8 flex gap-3">
                <button onClick={saveProfile} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md">
                    Save Changes
                </button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold rounded-lg">
                    Cancel
                </button>
            </div>
        )}
    </div>
  );
}
