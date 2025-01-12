// pages/index.js

import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import Link from "next/link";

const Index = ({ user }) => {
  return (
    <div className="container mx-auto p-8 min-h-screen flex flex-col items-center justify-center">
      <p className="text-lg">
        Welcome {user.name}!{" "}
        <Link 
          href="/api/auth/logout" 
          className="text-blue-600 hover:text-blue-800 underline ml-2"
        >
          Logout
        </Link>
      </p>
    </div>
  );
};

export const getServerSideProps = withPageAuthRequired();

export default Index;