import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Profile, School } from "./types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  school: School | null;          // active school
  allSchools: School[];           // all schools this user is a member of
  loading: boolean;
  switchSchool: (schoolId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, school: null, allSchools: [],
  loading: true,
  switchSchool: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,       setUser]       = useState<User | null>(null);
  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [school,     setSchool]     = useState<School | null>(null);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setSchool(null); setAllSchools([]); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const { data: p } = await supabase
      .from("profiles").select("*").eq("id", userId).single();
    setProfile(p ?? null);

    if (p?.school_id) {
      // Active school
      const { data: s } = await supabase
        .from("schools").select("*").eq("id", p.school_id).single();
      setSchool(s ?? null);

      // All schools this user is a member of — use RPC to bypass RLS scoping
      const { data: schoolsData } = await supabase.rpc("get_my_schools");
      setAllSchools((schoolsData as School[]) ?? []);
    }

    setLoading(false);
  }

  async function switchSchool(schoolId: string) {
    // Call the DB function that validates membership and updates active school
    await supabase.rpc("switch_active_school", { p_school_id: schoolId });
    // Reload profile so school_id is updated
    if (user) await fetchProfile(user.id);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, profile, school, allSchools, loading, switchSchool, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
