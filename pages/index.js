import { withPageAuthRequired, getSession } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";
import { useState } from "react";

const Index = ({ user, todos = [] }) => {
  const [content, setContent] = useState("");
  const [allTodos, setAllTodos] = useState(todos || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const supabase = await getSupabase(user.accessToken);

    const { data } = await supabase
      .from("todos")
      .insert({ content, user_id: user.sub })
      .select();

    setAllTodos([...allTodos, data[0]]);
    setContent("");
  };

  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center text-white">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <p className="text-lg flex items-center justify-between">
          <span>Welcome {user.name}!</span>
          <Link 
            href="/api/auth/logout" 
            className="text-blue-400 hover:text-blue-300 underline ml-2"
          >
            Logout
          </Link>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            onChange={(e) => setContent(e.target.value)}
            value={content}
            placeholder="Add a new todo..."
            className="flex-1 p-2 border rounded-lg bg-gray-800 text-white border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add
          </button>
        </form>

        {/* Todos List */}
        <div className="space-y-4">
          {allTodos?.length > 0 ? (
            allTodos.map((todo) => (
              <div 
                key={todo.id} 
                className="p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700 text-white"
              >
                {todo.content}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">
              You have completed all todos!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps({ req, res }) {
    const {
      user: { accessToken },
    } = await getSession(req, res);

    const supabase = await getSupabase(accessToken, req, res);

    const { data: todos = [], error } = await supabase
      .from("todos")
      .select("id, content, created_at, is_complete")
      .eq("is_complete", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
    }
    console.log("Fetched todos:", todos);

    return {
      props: { todos },
    };
  },
});

export default Index;
