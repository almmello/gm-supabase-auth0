// pages/index.js

import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { getSupabase } from "../utils/supabase";
import Link from "next/link";

const Index = ({ user, todos }) => {
  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <p className="text-lg flex items-center justify-between">
          <span>Welcome {user.name}!</span>
          <Link 
            href="/api/auth/logout" 
            className="text-blue-600 hover:text-blue-800 underline ml-2"
          >
            Logout
          </Link>
        </p>

        <div className="space-y-4">
          {todos?.length > 0 ? (
            todos.map((todo) => (
              <div 
                key={todo.id} 
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-900" // Adicionado text-gray-900
              >
                {todo.content}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">
              You have completed all todos!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps() {
    const supabase = getSupabase();

    const { data: todos } = await supabase.from("todos").select();

    return {
      props: { todos },
    };
  },
});

export default Index;